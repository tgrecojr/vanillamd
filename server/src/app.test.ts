import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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

  it('moves a note via /api/move', async () => {
    await app.inject({ method: 'POST', url: '/api/note', payload: { path: 'a.md' } });
    await app.inject({ method: 'PUT', url: '/api/note', payload: { path: 'a.md', content: 'hi' } });

    const move = await app.inject({
      method: 'POST',
      url: '/api/move',
      payload: { from: 'a.md', to: 'sub/b.md' },
    });
    expect(move.statusCode).toBe(200);
    expect(move.json()).toEqual({ path: 'sub/b.md' });

    const read = await app.inject({ method: 'GET', url: '/api/note?path=sub%2Fb.md' });
    expect(read.json()).toEqual({ content: 'hi' });
    const gone = await app.inject({ method: 'GET', url: '/api/note?path=a.md' });
    expect(gone.statusCode).toBe(404);
  });

  it('recursively deletes a folder and its contents', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/note',
      payload: { path: 'f/g/x.md', content: '' },
    });

    const del = await app.inject({ method: 'DELETE', url: '/api/folder?path=f' });
    expect(del.statusCode).toBe(200);

    const read = await app.inject({ method: 'GET', url: '/api/note?path=f%2Fg%2Fx.md' });
    expect(read.statusCode).toBe(404);
    const reDel = await app.inject({ method: 'DELETE', url: '/api/folder?path=f' });
    expect(reDel.statusCode).toBe(404);
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

  it('never serves a source map, and the build does not emit one', async () => {
    // Maps carry `sourcesContent` — the verbatim TypeScript of the client —
    // and dist/ is served unauthenticated, so both halves must hold.
    const mapDir = await mkdtemp(join(tmpdir(), 'vanillamd-map-'));
    await mkdir(join(mapDir, 'assets'), { recursive: true });
    await writeFile(join(mapDir, 'index.html'), '<!doctype html><html></html>');
    await writeFile(join(mapDir, 'assets', 'app.js'), 'console.log(1)');
    await writeFile(
      join(mapDir, 'assets', 'app.js.map'),
      JSON.stringify({ version: 3, sourcesContent: ['const SECRET = 1;'], mappings: 'AAAA' }),
    );
    const withMaps = await buildApp({
      dataDir: mapDir,
      clientDir: mapDir,
      port: 0,
      host: '127.0.0.1',
      maxNoteBytes: 1024,
      logLevel: 'silent',
    });
    try {
      const map = await withMaps.inject({ method: 'GET', url: '/assets/app.js.map' });
      expect(map.statusCode).toBe(404);
      expect(map.body).not.toContain('sourcesContent');

      // Ordinary assets must keep working.
      const js = await withMaps.inject({ method: 'GET', url: '/assets/app.js' });
      expect(js.statusCode).toBe(200);

      const viteConfig = await readFile(
        resolve(import.meta.dirname, '../../client/vite.config.ts'),
        'utf8',
      );
      expect(viteConfig).not.toMatch(/sourcemap:\s*true/);
    } finally {
      await withMaps.close();
      await rm(mapDir, { recursive: true, force: true });
    }
  });

  it('rejects a note write larger than maxNoteBytes with 413', async () => {
    // Build a dedicated app with a tiny note ceiling. The Fastify body limit is
    // maxNoteBytes + 64 KiB, so a payload above maxNoteBytes but below that still
    // reaches NoteService, exercising the explicit size check (not the body cap).
    const smallDir = await mkdtemp(join(tmpdir(), 'vanillamd-small-'));
    const small = await buildApp({
      dataDir: smallDir,
      clientDir: join(smallDir, '__no_client__'),
      port: 0,
      host: '127.0.0.1',
      maxNoteBytes: 16,
      logLevel: 'silent',
    });
    try {
      const res = await small.inject({
        method: 'PUT',
        url: '/api/note',
        payload: { path: 'big.md', content: 'x'.repeat(64) },
      });
      expect(res.statusCode).toBe(413);
    } finally {
      await small.close();
      await rm(smallDir, { recursive: true, force: true });
    }
  });
});
