import { imageBlockSchema } from "@milkdown/kit/component/image-block";
import { toggleLinkCommand } from "@milkdown/kit/component/link-tooltip";
import { type CmdKey, commandsCtx, editorViewCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { redoCommand, undoCommand } from "@milkdown/kit/plugin/history";
import {
	addBlockTypeCommand,
	blockquoteSchema,
	bulletListSchema,
	codeBlockSchema,
	headingSchema,
	hrSchema,
	liftListItemCommand,
	listItemSchema,
	orderedListSchema,
	paragraphSchema,
	selectTextNearPosCommand,
	setBlockTypeCommand,
	sinkListItemCommand,
	toggleEmphasisCommand,
	toggleInlineCodeCommand,
	toggleStrongCommand,
	wrapInBlockTypeCommand,
} from "@milkdown/kit/preset/commonmark";
import {
	addColAfterCommand,
	addColBeforeCommand,
	addRowAfterCommand,
	addRowBeforeCommand,
	createTable,
	setAlignCommand,
	toggleStrikethroughCommand,
} from "@milkdown/kit/preset/gfm";
import { lift } from "@milkdown/kit/prose/commands";
import type { NodeType } from "@milkdown/kit/prose/model";
import type { Command } from "@milkdown/kit/prose/state";
import {
	deleteColumn,
	deleteRow,
	deleteTable,
} from "@milkdown/kit/prose/tables";

/**
 * Editor actions behind the toolbar. Each takes the Milkdown `Ctx` and is run
 * through `crepe.editor.action`, keeping the React toolbar free of ProseMirror
 * details. Block actions toggle: applying a format the block already has
 * reverts it to a paragraph, matching many-notes' Tiptap behavior.
 */
export type EditorAction = (ctx: Ctx) => void;

function call<T>(ctx: Ctx, key: CmdKey<T>, payload?: T): void {
	ctx.get(commandsCtx).call(key, payload);
}

function focus(ctx: Ctx): void {
	ctx.get(editorViewCtx).focus();
}

/** Run a raw ProseMirror command against the live view. */
function pm(ctx: Ctx, command: Command): void {
	const view = ctx.get(editorViewCtx);
	command(view.state, view.dispatch, view);
}

/** Depth of the nearest ancestor of `type` around the cursor, or -1. */
function ancestorDepth(ctx: Ctx, type: NodeType): number {
	const { $from } = ctx.get(editorViewCtx).state.selection;
	for (let depth = $from.depth; depth > 0; depth -= 1) {
		if ($from.node(depth).type === type) return depth;
	}
	return -1;
}

function currentHeadingLevel(ctx: Ctx): number | null {
	const { $from } = ctx.get(editorViewCtx).state.selection;
	const node = $from.parent;
	return node.type === headingSchema.type(ctx)
		? (node.attrs.level as number)
		: null;
}

function setParagraph(ctx: Ctx): void {
	call(ctx, setBlockTypeCommand.key, { nodeType: paragraphSchema.type(ctx) });
}

/** Toggle wrapping in a block node: unwrap when already inside it. */
function toggleWrap(ctx: Ctx, type: NodeType): void {
	if (ancestorDepth(ctx, type) !== -1) {
		const view = ctx.get(editorViewCtx);
		lift(view.state, view.dispatch);
	} else {
		call(ctx, wrapInBlockTypeCommand.key, { nodeType: type });
	}
}

function toggleList(ctx: Ctx, type: NodeType, attrs?: object): void {
	if (ancestorDepth(ctx, type) !== -1 && !attrs) {
		call(ctx, liftListItemCommand.key);
	} else {
		call(ctx, wrapInBlockTypeCommand.key, { nodeType: type, attrs });
	}
}

export const actions = {
	undo: (ctx: Ctx) => call(ctx, undoCommand.key),
	redo: (ctx: Ctx) => call(ctx, redoCommand.key),

	heading: (level: number): EditorAction => {
		return (ctx) => {
			if (currentHeadingLevel(ctx) === level) setParagraph(ctx);
			else
				call(ctx, setBlockTypeCommand.key, {
					nodeType: headingSchema.type(ctx),
					attrs: { level },
				});
		};
	},
	paragraph: setParagraph,
	blockquote: (ctx: Ctx) => toggleWrap(ctx, blockquoteSchema.type(ctx)),
	codeBlock: (ctx: Ctx) => {
		const codeBlock = codeBlockSchema.type(ctx);
		const { $from } = ctx.get(editorViewCtx).state.selection;
		if ($from.parent.type === codeBlock) setParagraph(ctx);
		else call(ctx, setBlockTypeCommand.key, { nodeType: codeBlock });
	},

	bold: (ctx: Ctx) => call(ctx, toggleStrongCommand.key),
	italic: (ctx: Ctx) => call(ctx, toggleEmphasisCommand.key),
	strike: (ctx: Ctx) => call(ctx, toggleStrikethroughCommand.key),
	inlineCode: (ctx: Ctx) => call(ctx, toggleInlineCodeCommand.key),

	bulletList: (ctx: Ctx) => toggleList(ctx, bulletListSchema.type(ctx)),
	orderedList: (ctx: Ctx) => toggleList(ctx, orderedListSchema.type(ctx)),
	taskList: (ctx: Ctx) =>
		toggleList(ctx, listItemSchema.type(ctx), { checked: false }),
	indent: (ctx: Ctx) => call(ctx, sinkListItemCommand.key),
	outdent: (ctx: Ctx) => call(ctx, liftListItemCommand.key),

	link: (ctx: Ctx) => call(ctx, toggleLinkCommand.key),
	image: (ctx: Ctx) =>
		call(ctx, addBlockTypeCommand.key, {
			nodeType: imageBlockSchema.type(ctx),
		}),
	horizontalRule: (ctx: Ctx) =>
		call(ctx, addBlockTypeCommand.key, { nodeType: hrSchema.type(ctx) }),

	insertTable: (ctx: Ctx) => {
		const { from } = ctx.get(editorViewCtx).state.selection;
		call(ctx, addBlockTypeCommand.key, { nodeType: createTable(ctx, 3, 3) });
		call(ctx, selectTextNearPosCommand.key, { pos: from });
	},
	deleteTable: (ctx: Ctx) => pm(ctx, deleteTable),
	addColumnBefore: (ctx: Ctx) => call(ctx, addColBeforeCommand.key),
	addColumnAfter: (ctx: Ctx) => call(ctx, addColAfterCommand.key),
	deleteColumn: (ctx: Ctx) => pm(ctx, deleteColumn),
	addRowBefore: (ctx: Ctx) => call(ctx, addRowBeforeCommand.key),
	addRowAfter: (ctx: Ctx) => call(ctx, addRowAfterCommand.key),
	deleteRow: (ctx: Ctx) => pm(ctx, deleteRow),
	align: (direction: "left" | "center" | "right"): EditorAction => {
		return (ctx) => call(ctx, setAlignCommand.key, direction);
	},
} as const;

/** Wrap an action so the editor regains focus after the toolbar click. */
export const focused = (action: EditorAction): EditorAction => {
	return (ctx) => {
		focus(ctx);
		action(ctx);
	};
};
