import { actions, type EditorAction, focused } from "./editorCommands";
import {
	DocumentPlusIcon,
	HorizontalRuleIcon,
	ImageIcon,
	IndentIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	ListTodoIcon,
	MarkdownIcon,
	OutdentIcon,
} from "./icons/lists";
import {
	BoldIcon,
	CodeIcon,
	CodeInlineIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	Heading6Icon,
	HeadingIcon,
	ItalicIcon,
	PilcrowIcon,
	QuoteIcon,
	RedoIcon,
	StrikeIcon,
	TextIcon,
	UndoIcon,
} from "./icons/toolbar";
import { TableMenu } from "./TableMenu";
import {
	ToolbarButton,
	ToolbarMenu,
	ToolbarRow,
	ToolbarSubButton,
} from "./ToolbarMenu";

interface Props {
	/** Execute an action against the live WYSIWYG editor. */
	run: (action: EditorAction) => void;
	/** True while the raw-markdown textarea is shown; formatting is locked. */
	rawMode: boolean;
	onToggleRaw: () => void;
}

const HEADINGS = [
	[1, Heading1Icon],
	[2, Heading2Icon],
	[3, Heading3Icon],
	[4, Heading4Icon],
	[5, Heading5Icon],
	[6, Heading6Icon],
] as const;

/**
 * Persistent formatting toolbar above the note, laid out like many-notes:
 * undo/redo, then hover menus for headings, block styles, text styles, lists,
 * insert, and table; a raw-markdown toggle sits on the right.
 */
export function EditorToolbar({
	run,
	rawMode,
	onToggleRaw,
}: Props): React.JSX.Element {
	const locked = rawMode;
	const go = (action: EditorAction) => () => run(focused(action));

	return (
		<div className="editor-toolbar">
			<div className="tb-group">
				<ToolbarButton
					title="Undo"
					icon={<UndoIcon />}
					disabled={locked}
					onClick={go(actions.undo)}
				/>
				<ToolbarButton
					title="Redo"
					icon={<RedoIcon />}
					disabled={locked}
					onClick={go(actions.redo)}
				/>

				<ToolbarMenu title="Heading" icon={<HeadingIcon />} disabled={locked}>
					<ToolbarRow>
						{HEADINGS.slice(0, 3).map(([level, Icon]) => (
							<ToolbarSubButton
								key={level}
								title={`Heading ${level}`}
								icon={<Icon />}
								onClick={go(actions.heading(level))}
							/>
						))}
					</ToolbarRow>
					<ToolbarRow>
						{HEADINGS.slice(3).map(([level, Icon]) => (
							<ToolbarSubButton
								key={level}
								title={`Heading ${level}`}
								icon={<Icon />}
								onClick={go(actions.heading(level))}
							/>
						))}
					</ToolbarRow>
				</ToolbarMenu>

				<ToolbarMenu
					title="Block styles"
					icon={<PilcrowIcon />}
					disabled={locked}
				>
					<ToolbarRow>
						<ToolbarSubButton
							title="Paragraph"
							icon={<PilcrowIcon />}
							onClick={go(actions.paragraph)}
						/>
						<ToolbarSubButton
							title="Quote"
							icon={<QuoteIcon />}
							onClick={go(actions.blockquote)}
						/>
						<ToolbarSubButton
							title="Code block"
							icon={<CodeIcon />}
							onClick={go(actions.codeBlock)}
						/>
					</ToolbarRow>
				</ToolbarMenu>

				<ToolbarMenu title="Text styles" icon={<TextIcon />} disabled={locked}>
					<ToolbarRow>
						<ToolbarSubButton
							title="Bold"
							icon={<BoldIcon />}
							onClick={go(actions.bold)}
						/>
						<ToolbarSubButton
							title="Italic"
							icon={<ItalicIcon />}
							onClick={go(actions.italic)}
						/>
						<ToolbarSubButton
							title="Strike"
							icon={<StrikeIcon />}
							onClick={go(actions.strike)}
						/>
						<ToolbarSubButton
							title="Inline code"
							icon={<CodeInlineIcon />}
							onClick={go(actions.inlineCode)}
						/>
					</ToolbarRow>
				</ToolbarMenu>

				<ToolbarMenu title="Lists" icon={<ListIcon />} disabled={locked}>
					<ToolbarRow>
						<ToolbarSubButton
							title="List"
							icon={<ListIcon />}
							onClick={go(actions.bulletList)}
						/>
						<ToolbarSubButton
							title="Ordered list"
							icon={<ListOrderedIcon />}
							onClick={go(actions.orderedList)}
						/>
						<ToolbarSubButton
							title="Task list"
							icon={<ListTodoIcon />}
							onClick={go(actions.taskList)}
						/>
					</ToolbarRow>
					<ToolbarRow>
						<ToolbarSubButton
							title="Indent"
							icon={<IndentIcon />}
							onClick={go(actions.indent)}
						/>
						<ToolbarSubButton
							title="Outdent"
							icon={<OutdentIcon />}
							onClick={go(actions.outdent)}
						/>
					</ToolbarRow>
				</ToolbarMenu>

				<ToolbarMenu
					title="Insert"
					icon={<DocumentPlusIcon />}
					disabled={locked}
				>
					<ToolbarRow>
						<ToolbarSubButton
							title="Link"
							icon={<LinkIcon />}
							onClick={go(actions.link)}
						/>
						<ToolbarSubButton
							title="Image"
							icon={<ImageIcon />}
							onClick={go(actions.image)}
						/>
						<ToolbarSubButton
							title="Horizontal rule"
							icon={<HorizontalRuleIcon />}
							onClick={go(actions.horizontalRule)}
						/>
					</ToolbarRow>
				</ToolbarMenu>

				<TableMenu run={run} disabled={locked} />
			</div>

			<div className="tb-group">
				<button
					type="button"
					className={`tb-button${rawMode ? " is-active" : ""}`}
					title={rawMode ? "Back to visual editor" : "Edit raw markdown"}
					aria-label={rawMode ? "Back to visual editor" : "Edit raw markdown"}
					aria-pressed={rawMode}
					onClick={onToggleRaw}
				>
					<MarkdownIcon />
				</button>
			</div>
		</div>
	);
}
