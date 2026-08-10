import type { SaveState, TreeNode } from "../types";
import type { ThemePreference } from "../useTheme";
import { TreeItem } from "./TreeItem";

interface Props {
	tree: TreeNode[];
	selectedPath: string | null;
	activeFolder: string;
	expanded: Set<string>;
	saveState: SaveState;
	themePreference: ThemePreference;
	onToggleFolder: (path: string) => void;
	onSelectNote: (path: string) => void;
	onRename: (node: TreeNode) => void;
	onDelete: (node: TreeNode) => void;
	onNewNote: () => void;
	onNewFolder: () => void;
	onCycleTheme: () => void;
}

const SAVE_LABEL: Record<SaveState, string> = {
	idle: "",
	saving: "Saving…",
	saved: "Saved",
	error: "Save failed",
};

const THEME_ICON: Record<ThemePreference, string> = {
	system: "🖥",
	light: "☀",
	dark: "🌙",
};

export function Sidebar(props: Props): React.JSX.Element {
	const { tree, saveState, themePreference } = props;
	const folderHint = props.activeFolder === "" ? "root" : props.activeFolder;

	return (
		<aside className="sidebar">
			<header className="sidebar-header">
				<span className="app-title">vanillamd</span>
				<button
					type="button"
					className="theme-toggle"
					title={`Theme: ${themePreference} (click to change)`}
					onClick={props.onCycleTheme}
				>
					{THEME_ICON[themePreference]}
				</button>
			</header>

			<div className="toolbar">
				<button type="button" onClick={props.onNewNote}>
					+ Note
				</button>
				<button type="button" onClick={props.onNewFolder}>
					+ Folder
				</button>
			</div>
			<div className="toolbar-hint" title="New items are created here">
				in: {folderHint}
			</div>

			<nav className="tree" aria-label="Notes">
				{tree.length === 0 ? (
					<p className="empty">No notes yet. Create one above.</p>
				) : (
					<div className="tree-root" role="tree" aria-label="Notes">
						{tree.map((node) => (
							<TreeItem
								key={node.path}
								node={node}
								depth={0}
								selectedPath={props.selectedPath}
								activeFolder={props.activeFolder}
								expanded={props.expanded}
								onToggleFolder={props.onToggleFolder}
								onSelectNote={props.onSelectNote}
								onRename={props.onRename}
								onDelete={props.onDelete}
							/>
						))}
					</div>
				)}
			</nav>

			<footer className="sidebar-footer">
				<span className={`save-state save-${saveState}`}>
					{SAVE_LABEL[saveState]}
				</span>
			</footer>
		</aside>
	);
}
