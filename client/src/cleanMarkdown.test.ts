import { describe, expect, it } from "vitest";
import { cleanMarkdown } from "./cleanMarkdown.js";

const lines = (...parts: string[]): string => parts.join("\n");

describe("cleanMarkdown", () => {
	it.each(["<br />", "<br>", "<br >", "<br/>", "<BR />"])(
		"drops the empty-paragraph placeholder %s",
		(placeholder) => {
			const input = lines("First", "", placeholder, "", "Second", "");
			expect(cleanMarkdown(input)).toBe(lines("First", "", "Second"));
		},
	);

	it("folds a run of placeholders into one blank line", () => {
		const input = lines("First", "", "<br />", "", "<br />", "", "Second");
		expect(cleanMarkdown(input)).toBe(lines("First", "", "Second"));
	});

	it("drops placeholders at the start and end of the note", () => {
		const input = lines("<br />", "", "Only", "", "<br />", "");
		expect(cleanMarkdown(input)).toBe("Only");
	});

	it("drops placeholders inside a blockquote", () => {
		const input = lines("> Quoted", ">", "> <br />", ">", "> More");
		expect(cleanMarkdown(input)).toBe(lines("> Quoted", ">", "> More"));
	});

	it("drops empty list items and placeholders nested in a list", () => {
		const input = lines(
			"* One",
			"* <br />",
			"* [ ] <br />",
			"1. <br />",
			"* Two",
			"",
			"  <br />",
			"",
			"  Continued",
		);
		expect(cleanMarkdown(input)).toBe(
			lines("* One", "* Two", "", "  Continued"),
		);
	});

	it("keeps a <br> that shares its line with other text", () => {
		const input = lines("| a<br />b | c |", "", "Line one<br>line two");
		expect(cleanMarkdown(input)).toBe(input);
	});

	it.each(["```", "~~~"])("leaves a %s fenced block untouched", (fence) => {
		const input = lines(
			"Before",
			"",
			`${fence}html`,
			"<br />",
			"",
			"",
			"<br>",
			fence,
			"",
			"<br />",
			"",
			"After",
		);
		expect(cleanMarkdown(input)).toBe(
			lines(
				"Before",
				"",
				`${fence}html`,
				"<br />",
				"",
				"",
				"<br>",
				fence,
				"",
				"After",
			),
		);
	});

	it("does not end a fence on a shorter or different marker", () => {
		const input = lines("````", "```", "<br />", "~~~~", "<br />", "````");
		expect(cleanMarkdown(input)).toBe(input);
	});

	it("keeps a fenced block that sits inside a blockquote or list", () => {
		const input = lines(
			"> ```",
			"> <br />",
			"> ```",
			"",
			"* ```",
			"  <br />",
			"  ```",
		);
		expect(cleanMarkdown(input)).toBe(input);
	});

	it("does not mistake inline code for an opening fence", () => {
		const input = lines("```not a fence``` text", "", "<br />", "", "After");
		expect(cleanMarkdown(input)).toBe(
			lines("```not a fence``` text", "", "After"),
		);
	});

	it("normalises CRLF line endings", () => {
		expect(cleanMarkdown("First\r\n\r\n<br />\r\n\r\nSecond\r\n")).toBe(
			lines("First", "", "Second"),
		);
	});

	it("returns an empty string for an empty or placeholder-only note", () => {
		expect(cleanMarkdown("")).toBe("");
		expect(cleanMarkdown(lines("<br />", "", "<br />", ""))).toBe("");
	});

	it("leaves markdown without placeholders alone", () => {
		const input = lines("# Title", "", "Text with **bold**.", "", "* item");
		expect(cleanMarkdown(input)).toBe(input);
	});
});
