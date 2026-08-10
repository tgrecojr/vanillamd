import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DOMSerializer, Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { describe, expect, it } from "vitest";
import { SAFE_FALLBACK_URL } from "./urlSafety.js";
import { sanitizeDocUrls } from "./urlSanitizerPlugin.js";

/**
 * Mirrors how @milkdown/preset-commonmark builds its DOM: the raw `mark.attrs`
 * are spread AFTER the attribute getter, so a sanitizer that only overrides
 * the getter is overwritten by the untrusted URL. Reproducing that ordering
 * here is the whole point — it is what makes this test discriminating.
 */
const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0] },
		text: { group: "inline" },
		image: {
			group: "inline",
			inline: true,
			attrs: { src: {} },
			toDOM: (node) => ["img", { src: "about:blank", ...node.attrs }],
		},
	},
	marks: {
		link: {
			attrs: { href: {} },
			toDOM: (mark) => ["a", { href: "about:blank", ...mark.attrs }],
		},
	},
});

function docWith(href: string, src: string) {
	return schema.node("doc", null, [
		schema.node("paragraph", null, [
			schema.text("click", [schema.mark("link", { href })]),
			schema.node("image", { src }),
		]),
	]);
}

/** Serialize to a plain attribute map without needing a browser DOM. */
function renderedAttrs(doc: ReturnType<typeof docWith>) {
	const out: Record<string, string> = {};
	doc.descendants((node) => {
		if (node.type.name === "image") out.src = node.attrs.src as string;
		for (const mark of node.marks) {
			if (mark.type.name === "link") out.href = mark.attrs.href as string;
		}
	});
	return out;
}

describe("image vector (still unsanitized upstream)", () => {
	it("neutralises a javascript: image src that the preset would pass through", () => {
		// @milkdown/preset-commonmark 7.22.0 added its own sanitizeLinkHref for
		// link marks, but its image toDOM is still
		//   ['img', { ...ctx.get(imageAttr.key)(node), ...node.attrs }]
		// with no src check — the raw attrs win. Sanitizing the model is what
		// closes the image vector.
		const imageOnly = new Schema({
			nodes: {
				doc: { content: "block+" },
				paragraph: {
					group: "block",
					content: "inline*",
					toDOM: () => ["p", 0],
				},
				text: { group: "inline" },
				image: {
					group: "inline",
					inline: true,
					attrs: { src: {} },
					// Mirrors the preset's image toDOM exactly: raw attrs spread last.
					toDOM: (node) => ["img", { src: "ATTR_GETTER_VALUE", ...node.attrs }],
				},
			},
			marks: {},
		});
		const doc = imageOnly.node("doc", null, [
			imageOnly.node("paragraph", null, [
				imageOnly.node("image", { src: "javascript:alert(1)" }),
			]),
		]);
		const state = EditorState.create({ doc, schema: imageOnly });
		const tr = state.tr;
		expect(sanitizeDocUrls(state.doc, tr)).toBe(true);
		const next = state.apply(tr);

		let rendered = "";
		next.doc.descendants((n) => {
			if (n.type.name === "image") {
				const toDOM = imageOnly.nodes.image.spec.toDOM;
				if (!toDOM) throw new Error("image node spec is missing toDOM");
				const spec = toDOM(n) as [string, { src: string }];
				rendered = spec[1].src;
			}
		});
		expect(rendered).toBe(SAFE_FALLBACK_URL);
		expect(rendered).not.toContain("javascript:");
	});
});

describe("initial document load", () => {
	it("is sanitized by the plugin once a transaction is dispatched", () => {
		// Milkdown mounts the view straight from EditorState.create, and
		// appendTransaction only runs inside applyTransaction — so a doc parsed
		// from `defaultValue` reaches first paint untouched. Editor.tsx dispatches
		// one empty transaction after create() to close that window; this pins the
		// behaviour that makes the flush work.
		const plugin = new Plugin({
			appendTransaction: (_trs, _old, newState) => {
				const tr = newState.tr;
				return sanitizeDocUrls(newState.doc, tr) ? tr : null;
			},
		});
		const state = EditorState.create({
			doc: docWith("javascript:alert(1)", "javascript:alert(2)"),
			schema,
			plugins: [plugin],
		});

		// Before any dispatch the raw URL is still present — this is the window.
		expect(renderedAttrs(state.doc).href).toBe("javascript:alert(1)");

		// The empty transaction Editor.tsx dispatches after create().
		const flushed = state.apply(state.tr);
		const attrs = renderedAttrs(flushed.doc);
		expect(attrs.href).toBe(SAFE_FALLBACK_URL);
		expect(attrs.src).toBe(SAFE_FALLBACK_URL);
	});

	it("is wired to flush on create in Editor.tsx", async () => {
		const editor = await readFile(
			resolve(import.meta.dirname, "components/Editor.tsx"),
			"utf8",
		);
		expect(editor).toContain("view.dispatch(view.state.tr)");
	});
});

describe("document-level URL sanitization", () => {
	it("rewrites a javascript: link and image in the document model", () => {
		const state = EditorState.create({
			doc: docWith("javascript:alert(1)", "javascript:alert(2)"),
			schema,
		});
		const tr = state.tr;
		const changed = sanitizeDocUrls(state.doc, tr);
		expect(changed).toBe(true);

		const next = state.apply(tr);
		const attrs = renderedAttrs(next.doc);
		expect(attrs.href).toBe(SAFE_FALLBACK_URL);
		expect(attrs.src).toBe(SAFE_FALLBACK_URL);
	});

	it("survives the toDOM attribute spread that defeats attr-only overrides", () => {
		// The exact failure mode a linkAttr/imageAttr override hits: the raw attrs
		// win. Sanitizing the model means the spread carries the safe value.
		const state = EditorState.create({
			doc: docWith("javascript:alert(1)", "x.png"),
			schema,
		});
		const tr = state.tr;
		sanitizeDocUrls(state.doc, tr);
		const next = state.apply(tr);

		const serializer = DOMSerializer.fromSchema(schema);
		const linkMark = next.doc.firstChild?.firstChild?.marks[0];
		if (!linkMark)
			throw new Error("expected a link mark on the first text node");
		const markToDOM = serializer.marks[linkMark.type.name];
		if (!markToDOM) throw new Error("serializer is missing the link mark");
		const spec = markToDOM(linkMark, true) as [string, { href: string }];
		expect(spec[1].href).toBe(SAFE_FALLBACK_URL);
		expect(spec[1].href).not.toContain("javascript:");
	});

	it("leaves safe URLs untouched", () => {
		const state = EditorState.create({
			doc: docWith("https://example.com/page", "https://example.com/a.png"),
			schema,
		});
		const tr = state.tr;
		expect(sanitizeDocUrls(state.doc, tr)).toBe(false);
		const attrs = renderedAttrs(state.doc);
		expect(attrs.href).toBe("https://example.com/page");
		expect(attrs.src).toBe("https://example.com/a.png");
	});
});
