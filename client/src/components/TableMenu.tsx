import { actions, type EditorAction, focused } from "./editorCommands";
import {
	AlignCenterIcon,
	AlignLeftIcon,
	AlignRightIcon,
	TableAddColumnIcon,
	TableAddIcon,
	TableAddRowIcon,
	TableDeleteColumnIcon,
	TableDeleteIcon,
	TableDeleteRowIcon,
} from "./icons/table";
import { ToolbarMenu, ToolbarRow, ToolbarSubButton } from "./ToolbarMenu";

interface Props {
	run: (action: EditorAction) => void;
	disabled: boolean;
}

/** The toolbar's table menu: insert/delete, rows, columns, alignment. */
export function TableMenu({ run, disabled }: Props): React.JSX.Element {
	const go = (action: EditorAction) => () => run(focused(action));
	return (
		<ToolbarMenu title="Table" icon={<TableAddIcon />} disabled={disabled}>
			<ToolbarRow>
				<ToolbarSubButton
					title="Insert table"
					icon={<TableAddIcon />}
					onClick={go(actions.insertTable)}
				/>
				<ToolbarSubButton
					title="Delete table"
					icon={<TableDeleteIcon />}
					onClick={go(actions.deleteTable)}
				/>
			</ToolbarRow>
			<ToolbarRow>
				<ToolbarSubButton
					title="Add column before"
					icon={<TableAddColumnIcon style={{ transform: "scaleX(-1)" }} />}
					onClick={go(actions.addColumnBefore)}
				/>
				<ToolbarSubButton
					title="Add column after"
					icon={<TableAddColumnIcon />}
					onClick={go(actions.addColumnAfter)}
				/>
				<ToolbarSubButton
					title="Delete column"
					icon={<TableDeleteColumnIcon />}
					onClick={go(actions.deleteColumn)}
				/>
			</ToolbarRow>
			<ToolbarRow>
				<ToolbarSubButton
					title="Add row before"
					icon={<TableAddRowIcon style={{ transform: "scaleY(-1)" }} />}
					onClick={go(actions.addRowBefore)}
				/>
				<ToolbarSubButton
					title="Add row after"
					icon={<TableAddRowIcon />}
					onClick={go(actions.addRowAfter)}
				/>
				<ToolbarSubButton
					title="Delete row"
					icon={<TableDeleteRowIcon />}
					onClick={go(actions.deleteRow)}
				/>
			</ToolbarRow>
			<ToolbarRow>
				<ToolbarSubButton
					title="Align left"
					icon={<AlignLeftIcon />}
					onClick={go(actions.align("left"))}
				/>
				<ToolbarSubButton
					title="Align center"
					icon={<AlignCenterIcon />}
					onClick={go(actions.align("center"))}
				/>
				<ToolbarSubButton
					title="Align right"
					icon={<AlignRightIcon />}
					onClick={go(actions.align("right"))}
				/>
			</ToolbarRow>
		</ToolbarMenu>
	);
}
