# vanillamd

Simple, no-fuss note taking. A WYSIWYG editor that stores everything as plain
Markdown files on disk, with folders for organization and autosave. No database,
no linking, no calendars — just notes.

- **WYSIWYG editing** powered by [Milkdown](https://milkdown.dev) (the editor's
  source of truth _is_ Markdown, so there's no lossy conversion).
- **Files on disk.** Every note is a real `.md` file; every folder is a real
  directory. Point it at any folder and open the notes in any other editor too.
- **Autosave.** Edits are saved automatically a moment after you stop typing.
  There is no save button.
- **Single user, single container, mapped volume** for storage.

## Security model

This app does **no authentication of its own**. It is designed to run behind
**Cloudflare Zero Trust** (or an equivalent authenticating reverse proxy) which
handles identity. Do not expose the container port directly to the internet.

Even as a single-user app, it is hardened against the mistakes that matter for a
file-backed service:

- All client-supplied paths are validated (no `..`, no absolute paths, no null
  bytes / control chars, no path separators inside names) and re-checked for
  containment after resolution.
- Symlinks inside the data directory are never followed out of the root and are
  omitted from the tree.
- Notes are written atomically (temp file + rename) so a crash can't corrupt one.
- Security headers (CSP, etc.) via `@fastify/helmet`; request bodies are size-capped.

## Quick start (Docker)

```bash
cp env.example .env        # optional; defaults are sensible
docker compose up --build
```

The app listens on `127.0.0.1:8080` by default and stores notes in `./data`.
Put Cloudflare Zero Trust (or your proxy) in front of it before exposing it.

The runtime image is a hardened [Chainguard](https://www.chainguard.dev) Node
base (Wolfi, no package manager) and runs as the non-root user **uid 65532**.
On a Linux host with a bind-mounted `./data`, make that directory writable by
that uid once:

```bash
mkdir -p data && sudo chown 65532:65532 data
```

(Docker named volumes inherit the correct ownership automatically, and Docker
Desktop on macOS/Windows handles this for you — the chown is only needed for
bind mounts on Linux.)

## Local development

```bash
npm install
npm run dev      # server on :8080, Vite dev server on :5173 (proxies /api)
```

Open http://localhost:5173. Notes are written to `./data` (set `DATA_DIR` to
change). Run the full gate with:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Environment variables

See [`env.example`](./env.example). All have working defaults.

| Variable         | Default   | Purpose                                         |
| ---------------- | --------- | ----------------------------------------------- |
| `DATA_DIR`       | `/data`   | Directory holding all notes (the mapped volume) |
| `PORT`           | `8080`    | Port the server listens on                      |
| `HOST`           | `0.0.0.0` | Bind address                                    |
| `MAX_NOTE_BYTES` | `5242880` | Max size accepted for a single note write       |
| `LOG_LEVEL`      | `info`    | Pino log level                                  |

## Architecture

- `server/` — Fastify (TypeScript) API + serves the built SPA. File I/O is
  confined to `DATA_DIR`. See `src/paths.ts` (path safety) and `src/notes.ts`.
- `client/` — React + Milkdown SPA. Tree on the left, editor on the right,
  debounced autosave.

One container runs the server, which both serves the API and the static client.
