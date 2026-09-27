import { useEffect, useRef, useState } from "react";
import { cleanMarkdown } from "../cleanMarkdown";
import { AlertCircleIcon, CheckIcon, ClipboardIcon } from "./icons/ui";

interface Props {
	/** Reads the note's markdown at click time, so unsaved edits are included. */
	getMarkdown: () => string;
}

type Status = "idle" | "copied" | "failed";

const LABELS: Record<Status, string> = {
	idle: "Copy as Markdown",
	copied: "Copied",
	failed: "Copy failed",
};

const ICONS: Record<Status, React.JSX.Element> = {
	idle: <ClipboardIcon />,
	copied: <CheckIcon />,
	failed: <AlertCircleIcon />,
};

/** How long the copied / failed state shows before the button resets. */
const RESET_MS = 1500;

/**
 * Copies the whole note to the clipboard as plain markdown. Selecting the
 * rendered note and copying it carries Milkdown's `<br />` placeholders along;
 * this goes through {@link cleanMarkdown} instead.
 */
export function CopyMarkdownButton({ getMarkdown }: Props): React.JSX.Element {
	const [status, setStatus] = useState<Status>("idle");
	const resetTimer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(resetTimer.current), []);

	const copy = async (): Promise<void> => {
		let next: Status = "copied";
		try {
			await navigator.clipboard.writeText(cleanMarkdown(getMarkdown()));
		} catch {
			// No clipboard access: an insecure origin, or the browser refused.
			next = "failed";
		}
		setStatus(next);
		window.clearTimeout(resetTimer.current);
		resetTimer.current = window.setTimeout(() => setStatus("idle"), RESET_MS);
	};

	return (
		<button
			type="button"
			className={`icon-button copy-button is-${status}`}
			title={LABELS[status]}
			aria-label={LABELS[status]}
			onClick={() => void copy()}
		>
			{ICONS[status]}
		</button>
	);
}
