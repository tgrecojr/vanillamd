import { resolve } from 'node:path';

/** Runtime configuration, read once from the environment at startup. */
export interface Config {
  /** Absolute path to the directory that holds all notes. */
  dataDir: string;
  port: number;
  host: string;
  /** Maximum size (bytes) accepted for a single note write. */
  maxNoteBytes: number;
  logLevel: string;
  /** Absolute path to the built client assets, served as static files. */
  clientDir: string;
  /**
   * Milliseconds a single request may take before the socket is reclaimed.
   * Fastify defaults this to 0, which disables Node's own 300 s ceiling.
   */
  requestTimeoutMs: number;
  /** Maximum concurrent sockets the server will hold open. */
  maxConnections: number;
  /** Requests allowed per client per `rateLimitWindowMs`. */
  rateLimitMax: number;
  /** Width of the rate-limit window, in milliseconds. */
  rateLimitWindowMs: number;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid value for ${name}: ${raw}`);
  }
  return value;
}

export function loadConfig(): Config {
  const dataDir = resolve(process.env.DATA_DIR ?? '/data');
  // Default points at the bundled client build (server/dist -> ../../client/dist).
  const clientDir = resolve(
    process.env.CLIENT_DIR ?? resolve(import.meta.dirname, '../../client/dist'),
  );

  return {
    dataDir,
    clientDir,
    port: intFromEnv('PORT', 8080),
    host: process.env.HOST ?? '0.0.0.0',
    maxNoteBytes: intFromEnv('MAX_NOTE_BYTES', 5 * 1024 * 1024),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    // Restores the ceiling Node applies by default and Fastify removes.
    requestTimeoutMs: intFromEnv('REQUEST_TIMEOUT_MS', 300_000),
    maxConnections: intFromEnv('MAX_CONNECTIONS', 512),
    // Generous for a single-user app whose editor autosaves on a debounce.
    rateLimitMax: intFromEnv('RATE_LIMIT_MAX', 300),
    rateLimitWindowMs: intFromEnv('RATE_LIMIT_WINDOW_MS', 60_000),
  };
}
