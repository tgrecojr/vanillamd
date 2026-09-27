import { useCallback, useEffect, useRef, useState } from "react";
import { useCrepe } from "../useCrepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { CopyMarkdownButton } from "./CopyMarkdownButton";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorAction } from "./editorCommands";
import { FullscreenIcon, XMarkIcon } from "./icons/ui";

interface Props {
	/** Display name of the open note (file name without `.md`). */
	title: string;
	/** Initial markdown for this note. Read once on mount; remount via `key`. */
	initialValue: string;
	onChange: (markdown: string) => void;
	onClose: () => void;
	onToggleFocus: () => void;
}

/**
 * Note pane: title bar, formatting toolbar, and the editing surface — either
 * the Milkdown Crepe WYSIWYG editor or, in raw mode, a plain textarea over the
 * same markdown. Switching modes hands the latest text across, so edits made
 * in either survive the swap.
 */
export function Editor(props: Props): React.JSX.Element {
	const { onChange } = props;
	const [rawMode, setRawMode] = useState(false);
	// Remount key for the WYSIWYG editor; bumped when leaving raw mode so
	// Crepe reloads whatever the textarea now holds.
	const [generation, setGeneration] = useState(0);
	const latest = useRef(props.initialValue);

	const handleChange = useCallback(
		(markdown: string): void => {
			latest.current = markdown;
			onChange(markdown);
		},
		[onChange],
	);

	const toggleRaw = (): void => {
		if (rawMode) setGeneration((g) => g + 1);
		setRawMode((v) => !v);
	};

	const getMarkdown = useCallback((): string => latest.current, []);

	const surfaceRef = useRef<{ run: (a: EditorAction) => void } | null>(null);
	const run = useCallback((action: EditorAction): void => {
		surfaceRef.current?.run(action);
	}, []);

	return (
		<div className="note-pane">
			<header className="note-header">
				<h1 className="note-title" title={props.title}>
					{props.title}
				</h1>
				<div className="note-header-actions">
					<CopyMarkdownButton getMarkdown={getMarkdown} />
					<button
						type="button"
						className="icon-button"
						title="Toggle sidebar"
						aria-label="Toggle sidebar"
						onClick={props.onToggleFocus}
					>
						<FullscreenIcon />
					</button>
					<button
						type="button"
						className="icon-button"
						title="Close note"
						aria-label="Close note"
						onClick={props.onClose}
					>
						<XMarkIcon />
					</button>
				</div>
			</header>

			<EditorToolbar run={run} rawMode={rawMode} onToggleRaw={toggleRaw} />

			{rawMode ? (
				<textarea
					className="raw-editor"
					aria-label="Markdown source"
					defaultValue={latest.current}
					spellCheck={false}
					onChange={(e) => handleChange(e.target.value)}
				/>
			) : (
				<Wysiwyg
					key={generation}
					initialValue={latest.current}
					onChange={handleChange}
					surfaceRef={surfaceRef}
				/>
			)}
		</div>
	);
}

interface WysiwygProps {
	initialValue: string;
	onChange: (markdown: string) => void;
	surfaceRef: React.RefObject<{ run: (a: EditorAction) => void } | null>;
}

function Wysiwyg({
	initialValue,
	onChange,
	surfaceRef,
}: WysiwygProps): React.JSX.Element {
	const { hostRef, run } = useCrepe(initialValue, onChange);
	useEffect(() => {
		surfaceRef.current = { run };
		return () => {
			surfaceRef.current = null;
		};
	}, [surfaceRef, run]);
	return <div className="editor-host" ref={hostRef} />;
}
