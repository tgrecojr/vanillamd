import Fastify, {
  type FastifyInstance,
  type FastifyError,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './config.js';
import { NoteService } from './notes.js';
import { registerRoutes } from './routes.js';

/** Build a fully-wired Fastify instance (no listen). */
export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    bodyLimit: config.maxNoteBytes + 64 * 1024,
    // trustProxy honours X-Forwarded-* so logs show the real client IP. This is
    // only safe because the container port is never exposed directly: it sits
    // behind the Cloudflare tunnel/Zero Trust proxy. If the port is ever made
    // publicly reachable, forwarded headers become spoofable — keep it private.
    trustProxy: true,
  });

  await app.register(sensible);

  // Security headers. We relax style-src because ProseMirror/Milkdown inject
  // inline styles; scripts and everything else stay locked to same-origin.
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  const notes = new NoteService(config.dataDir, config.maxNoteBytes);
  await notes.init();
  registerRoutes(app, notes);

  // Centralized error mapping: anything carrying a numeric statusCode is a
  // client error we surface; everything else is a 500 with no internals leaked.
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const status = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (status >= 500) {
      request.log.error({ err: error }, 'request failed');
      reply.code(500).send({ error: 'Internal Server Error' });
      return;
    }
    reply.code(status).send({ error: error.message });
  });

  await registerClient(app, config);
  return app;
}

/** Serve the built SPA and fall back to index.html for client-side routes. */
async function registerClient(app: FastifyInstance, config: Config): Promise<void> {
  const indexPath = join(config.clientDir, 'index.html');
  if (!existsSync(indexPath)) {
    app.log.warn(
      { clientDir: config.clientDir },
      'client build not found; only the API will be served',
    );
    return;
  }

  await app.register(fastifyStatic, {
    root: config.clientDir,
    index: ['index.html'],
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' || request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }
    reply.sendFile('index.html');
  });
}
