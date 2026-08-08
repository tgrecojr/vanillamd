import Fastify, {
  type FastifyInstance,
  type FastifyError,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
    // Scope proxy trust to the known fronting proxy via TRUST_PROXY. Trusting
    // every peer would make request.ip — the only client identifier in the
    // logs — attacker-chosen, so this fails closed when unconfigured.
    trustProxy: config.trustProxy,
    // Fastify defaults requestTimeout to 0, which overrides Node's own 300 s
    // ceiling and lets a client hold a socket (and its buffers) forever.
    requestTimeout: config.requestTimeoutMs,
  });

  // Bound how many such sockets can be held at once.
  app.server.maxConnections = config.maxConnections;

  await app.register(sensible);

  // Bound request volume per client, so the connection budget cannot be
  // consumed by a flood of individually well-formed requests.
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

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

  const notes = new NoteService(
    config.dataDir,
    config.maxNoteBytes,
    config.maxTotalBytes,
    config.maxEntries,
  );
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

/** True if the request targets a source map, ignoring any query string. */
function isSourceMapRequest(url: string): boolean {
  const queryStart = url.indexOf('?');
  const path = queryStart === -1 ? url : url.slice(0, queryStart);
  return path.toLowerCase().endsWith('.map');
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

  // Defense in depth against VULN-005: the build no longer emits source maps,
  // but refuse to serve them regardless, so a map that reaches the image by
  // some other route still isn't retrievable over HTTP.
  app.addHook('onRequest', async (request, reply) => {
    if (isSourceMapRequest(request.url)) {
      await reply.code(404).send({ error: 'Not Found' });
    }
  });

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
