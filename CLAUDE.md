# vanillamd

## Overview

Simple single-user WYSIWYG note-taking app. Notes are plain Markdown files on
disk organized in folders; edits autosave. No database, no inter-note linking,
no calendars — deliberately minimal. Delivered as one container with a mapped
volume for storage, intended to run behind Cloudflare Zero Trust (the app does
no auth of its own).

## Tech Stack

- Language: TypeScript (strict)
- Backend: Fastify (serves the API and the built SPA from one process)
- Frontend: React + Milkdown (Crepe) WYSIWYG editor, built with Vite
- Storage: the filesystem (`DATA_DIR`), no database
- Tooling: ESLint + Prettier, Vitest, npm workspaces

## Commands

- `npm run dev` — server on :8080 + Vite dev server on :5173 (proxies `/api`)
- `npm run build` — build client then server
- `npm start` — run the built server (`server/dist/index.js`)
- `npm test` — server unit + HTTP integration tests (Vitest)
- `npm run lint` — ESLint across the repo
- `npm run typecheck` — typecheck both workspaces
- `npm run format` / `npm run format:check` — Prettier

Run the full gate before pushing: `npm run lint && npm run typecheck && npm test && npm run build`.

## Architecture

- `server/src/paths.ts` — untrusted-path validation + containment check. The
  single source of truth for what paths are allowed. Touches no filesystem.
- `server/src/notes.ts` — `NoteService`: all file I/O, scoped to `DATA_DIR`,
  with symlink-escape defense and atomic writes.
- `server/src/routes.ts` — thin `/api` handlers; validation lives in NoteService.
- `server/src/app.ts` — Fastify wiring: helmet, error mapping, static SPA + fallback.
- `client/src/App.tsx` — orchestrates tree state, selection, autosave.
- `client/src/components/Editor.tsx` — Milkdown Crepe wrapper (uncontrolled;
  remounted per note via React `key`).
- `client/src/useAutosave.ts` — debounced save; flushes on note switch / tab hide.

## Security rules (do not regress)

- Never trust a client path. Everything goes through `normalizeLogicalPath` +
  `resolveWithin` before any `fs` call. Note paths must end in `.md`.
- Do not follow symlinks out of `DATA_DIR`; keep them out of the tree.
- The app must not add its own auth/SSO — Cloudflare Zero Trust fronts it.
- Keep writes atomic (temp + rename).

## Environment Variables

`DATA_DIR`, `PORT`, `HOST`, `MAX_NOTE_BYTES`, `LOG_LEVEL`. See `env.example`.
Copy it to `.env` for local dev (`.env` is gitignored; never commit it).
