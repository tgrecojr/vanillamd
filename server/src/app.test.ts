import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import type { Config } from './config.js';

let app: FastifyInstance;
let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'vanillamd-app-'));
  const config: Config = {
    dataDir,
    clientDir: join(dataDir, '__no_client__'),
    port: 0,
    host: '127.0.0.1',
    maxNoteBytes: 1024 * 1024,
    logLevel: 'silent',
  };
  app = await buildApp(config);
});

afterEach(async () => {
  await app.close();
  await rm(dataDir, { recursive: true, force: true });
});

describe('HTTP API', () => {
  it('reports health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('creates, writes, reads, and lists notes', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/note',
      payload: { path: 'work/todo.md' },
    });
    expect(create.statusCode).toBe(201);

    const write = await app.inject({
      method: 'PUT',
      url: '/api/note',
      payload: { path: 'work/todo.md', content: '# Hello' },
    });
    expect(write.statusCode).toBe(200);

    const read = await app.inject({ method: 'GET', url: '/api/note?path=work%2Ftodo.md' });
    expect(read.json()).toEqual({ content: '# Hello' });

    const tree = await app.inject({ method: 'GET', url: '/api/tree' });
    const body = tree.json() as { tree: Array<{ name: string; type: string }> };
    expect(body.tree[0]).toMatchObject({ name: 'work', type: 'folder' });
  });

  it('rejects a traversal attempt with 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/note?path=..%2F..%2Fetc%2Fpasswd',
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a missing path with 400', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/note', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a missing note', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/note?path=nope.md' });
    expect(res.statusCode).toBe(404);
  });

  it('sets a content-security-policy header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: expect.any(String) });
  });
});
