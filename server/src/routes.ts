import type { FastifyInstance } from "fastify";
import type { NoteService } from "./notes.js";

interface PathBody {
	path?: unknown;
}
interface WriteBody {
	path?: unknown;
	content?: unknown;
}
interface MoveBody {
	from?: unknown;
	to?: unknown;
}
interface PathQuery {
	path?: unknown;
}

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string" || value.length === 0) {
		const err = new Error(`Missing or invalid "${field}"`) as Error & {
			statusCode: number;
		};
		err.statusCode = 400;
		throw err;
	}
	return value;
}

/**
 * Register all /api routes. Validation of paths happens inside NoteService.
 *
 * No CSRF token is issued: the app has no auth of its own (Cloudflare Zero Trust
 * fronts it), and every mutating route requires `Content-Type: application/json`
 * with no CORS allow-headers set. A cross-site request therefore cannot pass the
 * preflight, so CSRF stays closed. Do not loosen the JSON/CORS posture without
 * adding explicit CSRF protection.
 */
export function registerRoutes(app: FastifyInstance, notes: NoteService): void {
	app.get("/api/health", async () => ({ status: "ok" }));

	app.get("/api/tree", async () => ({ tree: await notes.tree() }));

	app.get("/api/note", async (request) => {
		const { path } = request.query as PathQuery;
		const content = await notes.readNote(requireString(path, "path"));
		return { content };
	});

	app.put("/api/note", async (request) => {
		const { path, content } = request.body as WriteBody;
		if (typeof content !== "string") {
			const err = new Error('Missing or invalid "content"') as Error & {
				statusCode: number;
			};
			err.statusCode = 400;
			throw err;
		}
		await notes.writeNote(requireString(path, "path"), content);
		return { ok: true };
	});

	app.post("/api/note", async (request, reply) => {
		const { path } = request.body as PathBody;
		const created = await notes.createNote(requireString(path, "path"));
		reply.code(201);
		return { path: created };
	});

	app.post("/api/folder", async (request, reply) => {
		const { path } = request.body as PathBody;
		const created = await notes.createFolder(requireString(path, "path"));
		reply.code(201);
		return { path: created };
	});

	app.post("/api/move", async (request) => {
		const { from, to } = request.body as MoveBody;
		const moved = await notes.move(
			requireString(from, "from"),
			requireString(to, "to"),
		);
		return { path: moved };
	});

	app.delete("/api/note", async (request) => {
		const { path } = request.query as PathQuery;
		await notes.deleteNote(requireString(path, "path"));
		return { ok: true };
	});

	app.delete("/api/folder", async (request) => {
		const { path } = request.query as PathQuery;
		await notes.deleteFolder(requireString(path, "path"));
		return { ok: true };
	});
}
