import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

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

    const crepe = new Crepe({ root: host, defaultValue: initialRef.current });
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
