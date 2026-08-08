import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import { $prose } from '@milkdown/kit/utils';
import { editorViewCtx } from '@milkdown/kit/core';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { buildToolbar } from './editorToolbar';
import { sanitizeDocUrls } from '../urlSanitizerPlugin';

interface Props {
  /** Initial markdown for this note. Read once on mount; remount via `key`. */
  initialValue: string;
  onChange: (markdown: string) => void;
}

/**
 * Milkdown Crepe WYSIWYG editor. Uncontrolled after mount: the parent gives it
 * the loaded markdown once (and remounts it with a `key` when switching notes),
 * then receives every edit through `onChange`.
 */
export function Editor({ initialValue, onChange }: Props): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const initialRef = useRef(initialValue);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const crepe = new Crepe({
      root: host,
      defaultValue: initialRef.current,
      featureConfigs: {
        [Crepe.Feature.Toolbar]: { buildToolbar },
      },
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
            key: new PluginKey('vanillamd-url-sanitizer'),
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
      })
      .catch((err) => {
        console.error('Editor failed to initialize', err);
      });

    return () => {
      crepe.destroy().catch(() => {
        /* editor already torn down */
      });
    };
  }, []);

  return <div className="editor-host" ref={hostRef} />;
}
