import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api.js";

/** Stub fetch to return `{ok:true}` and capture the request it received. */
function stubFetch(): { calls: Array<{ url: string; init: RequestInit }> } {
	const calls: Array<{ url: string; init: RequestInit }> = [];
	vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
		calls.push({ url, init });
		return Promise.resolve(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
	});
	return { calls };
}

const contentType = (init: RequestInit): string | undefined =>
	new Headers(init.headers).get("content-type") ?? undefined;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("api request headers", () => {
	it("omits Content-Type on bodyless DELETE so Fastify accepts it", async () => {
		const { calls } = stubFetch();
		await api.deleteNote("a/b.md");
		await api.deleteFolder("a");
		expect(calls).toHaveLength(2);
		for (const { init } of calls) {
			expect(init.method).toBe("DELETE");
			expect(init.body).toBeUndefined();
			expect(contentType(init)).toBeUndefined();
		}
		expect(calls[0]?.url).toBe("/api/note?path=a%2Fb.md");
	});

	it("declares a JSON body when one is sent", async () => {
		const { calls } = stubFetch();
		await api.saveNote("a.md", "# hi");
		expect(calls[0]?.init.method).toBe("PUT");
		expect(calls[0]?.init.body).toBe(
			JSON.stringify({ path: "a.md", content: "# hi" }),
		);
		expect(contentType(calls[0]?.init ?? {})).toBe("application/json");
	});
});
