import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import { linkAttr, imageAttr } from '@milkdown/kit/preset/commonmark';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { buildToolbar } from './editorToolbar';
import { sanitizeUrl } from '../urlSafety';

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
    // untrusted input to the DOM. Hold them to a scheme allowlist here — once,
    // at the render sink — so the CSP is a second layer rather than the only
    // thing preventing a javascript: URL from executing.
    crepe.editor.config((ctx) => {
      ctx.set(linkAttr.key, (node) => ({ href: sanitizeUrl(node.attrs.href as string) }));
      ctx.set(imageAttr.key, (node) => ({
        src: sanitizeUrl(node.attrs.src as string, { kind: 'image' }),
      }));
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChangeRef.current(markdown);
      });
    });
    crepe.create().catch((err) => {
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
