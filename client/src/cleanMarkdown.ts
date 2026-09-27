/**
 * Markdown has no syntax for an empty paragraph, so Milkdown stands in for
 * each one with a literal `<br />` to make the blank line survive a reload.
 * That is right for the file on disk and noise everywhere else: anything that
 * does not render HTML shows the tag as text.
 *
 * `cleanMarkdown` produces the copy-out form of a note — placeholders removed
 * and the blank lines they leave behind folded together. It never changes
 * what is saved.
 */

/** Blockquote markers and indentation in front of a line's content. */
const QUOTE_PREFIX = /^(?:\s*>)*\s*/;
/** Bullet, ordered, and task-list markers in front of a line's content. */
const LIST_MARKERS = /^(?:(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX]\]\s+)?)+/;
/** The forms Milkdown itself accepts as an empty-paragraph placeholder. */
const BR_ONLY = /^<br\s*\/?>\s*$/i;
const FENCE = /^(`{3,}|~{3,})(.*)$/;

interface Fence {
	char: string;
	length: number;
}

function openingFence(content: string): Fence | null {
	const match = FENCE.exec(content);
	if (!match) return null;
	const [, marker = "", info = ""] = match;
	const char = marker.charAt(0);
	// A backtick fence cannot carry backticks in its info string; a line that
	// does is inline code which merely starts with three backticks.
	if (char === "`" && info.includes("`")) return null;
	return { char, length: marker.length };
}

function closesFence(content: string, fence: Fence): boolean {
	const match = FENCE.exec(content);
	if (!match) return false;
	const [, marker = "", rest = ""] = match;
	return (
		marker.charAt(0) === fence.char &&
		marker.length >= fence.length &&
		rest.trim() === ""
	);
}

/**
 * Returns `markdown` without Milkdown's `<br />` empty-paragraph placeholders.
 * Fenced code blocks are passed through verbatim, and a `<br>` that shares its
 * line with other text is content the author wrote, so it stays.
 */
export function cleanMarkdown(markdown: string): string {
	const out: string[] = [];
	let fence: Fence | null = null;
	// Starts true so blank lines at the top of the note are dropped too.
	let previousBlank = true;

	for (const line of markdown.split(/\r?\n/)) {
		const quoted = line.replace(QUOTE_PREFIX, "");
		if (fence) {
			if (closesFence(quoted, fence)) fence = null;
			out.push(line);
			previousBlank = false;
			continue;
		}

		const content = quoted.replace(LIST_MARKERS, "");
		if (BR_ONLY.test(content)) continue;

		const blank = quoted === "";
		if (blank && previousBlank) continue;

		fence = openingFence(content);
		out.push(line);
		previousBlank = blank;
	}

	if (previousBlank) out.pop();
	return out.join("\n");
}
