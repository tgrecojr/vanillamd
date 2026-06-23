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
  };
}
