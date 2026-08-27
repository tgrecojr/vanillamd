import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { $prose } from "@milkdown/kit/utils";
import { useCallback, useEffect, useRef } from "react";
import type { EditorAction } from "./components/editorCommands";
import { sanitizeDocUrls } from "./urlSanitizerPlugin";

/**
 * Mounts a Milkdown Crepe editor into `hostRef`. Uncontrolled after mount: the
 * caller gives it markdown once (and remounts via `key` to load a different
 * document), then receives every edit through `onChange`.
 *
 * `run` executes an {@link EditorAction} against the live editor — this is
 * how the React toolbar drives it.
 */
export function useCrepe(
	initialValue: string,
	onChange: (markdown: string) => void,
): {
	hostRef: React.RefObject<HTMLDivElement | null>;
	run: (action: EditorAction) => void;
} {
	const hostRef = useRef<HTMLDivElement>(null);
	const crepeRef = useRef<Crepe | null>(null);
	const initialRef = useRef(initialValue);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		const crepe = new Crepe({
			root: host,
			defaultValue: initialRef.current,
			// The persistent toolbar above the editor replaces Crepe's
			// highlight-to-format popup so there is one formatting surface.
			features: { [Crepe.Feature.Toolbar]: false },
		});
		// Note bodies are arbitrary markdown, so their link/image URLs are
		// untrusted input to the DOM. Hold them to a scheme allowlist so the CSP is
		// a second layer rather than the only thing preventing a javascript: URL
		// from executing.
		//
		// This sanitizes the document model rather than the rendered attributes.
		// The commonmark preset spreads a mark's raw attrs into its DOM output
		// AFTER the configured attribute getter, so overriding that getter is
		// silently discarded one property later. Rewriting the model is what makes
		// the spread carry a safe value.
		crepe.editor.use(
			$prose(
				() =>
					new Plugin({
						key: new PluginKey("vanillamd-url-sanitizer"),
						appendTransaction: (_transactions, _oldState, newState) => {
							const tr = newState.tr;
							return sanitizeDocUrls(newState.doc, tr) ? tr : null;
						},
					}),
			),
		);

		crepe.on((listener) => {
			listener.markdownUpdated((_ctx, markdown) => {
				onChangeRef.current(markdown);
			});
		});
		crepe
			.create()
			.then(() => {
				// appendTransaction only runs when a transaction is dispatched, and
				// Milkdown mounts the view straight from EditorState.create — so the
				// document parsed from `defaultValue` reaches first paint unsanitized.
				// Dispatch one empty transaction to force the plugin over the initial
				// content before the user can interact with it.
				crepe.editor.action((ctx) => {
					const view = ctx.get(editorViewCtx);
					view.dispatch(view.state.tr);
				});
				crepeRef.current = crepe;
			})
			.catch((err) => {
				console.error("Editor failed to initialize", err);
			});

		return () => {
			crepeRef.current = null;
			crepe.destroy().catch(() => {
				/* editor already torn down */
			});
		};
	}, []);

	const run = useCallback((action: EditorAction): void => {
		crepeRef.current?.editor.action(action);
	}, []);

	return { hostRef, run };
}
