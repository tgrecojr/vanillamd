import type { SaveState, TreeNode } from "../types";
import type { ThemePreference } from "../useTheme";
import { DocumentPlusIcon } from "./icons/lists";
import { Bars3Icon, FolderPlusIcon, MoonIcon, XMarkIcon } from "./icons/ui";
import { Menu, MenuItem } from "./Menu";
import { type TreeActions, TreeItem } from "./TreeItem";

interface Props extends TreeActions {
	tree: TreeNode[];
	selectedPath: string | null;
	expanded: Set<string>;
	saveState: SaveState;
	themePreference: ThemePreference;
	onCycleTheme: () => void;
	/** When set (phone layout), renders a ✕ that dismisses the drawer. */
	onClose?: () => void;
}

const SAVE_LABEL: Record<SaveState, string> = {
	idle: "",
	saving: "Saving…",
	saved: "Saved",
	error: "Save failed",
};

const THEME_LABEL: Record<ThemePreference, string> = {
	system: "Theme: system",
	light: "Theme: light",
	dark: "Theme: dark",
};

/**
 * Left pane: app title with a ☰ menu for root-level actions, then the
 * folder/note tree. Per-node actions live on each row's ⋮ menu.
 */
export function Sidebar(props: Props): React.JSX.Element {
	const { tree, saveState, themePreference, onClose } = props;

	return (
		<aside className="sidebar">
			<header className="sidebar-header">
				<span className="app-title">vanillamd</span>
				<Menu label="Vault menu" icon={<Bars3Icon />}>
					{(close) => (
						<>
							<MenuItem
								icon={<DocumentPlusIcon />}
								label="New note"
								onClick={() => {
									close();
									props.onNewNote("");
								}}
							/>
							<MenuItem
								icon={<FolderPlusIcon />}
								label="New folder"
								onClick={() => {
									close();
									props.onNewFolder("");
								}}
							/>
							<MenuItem
								icon={<MoonIcon />}
								label={THEME_LABEL[themePreference]}
								onClick={props.onCycleTheme}
							/>
						</>
					)}
				</Menu>
				{onClose && (
					<button
						type="button"
						className="icon-button"
						title="Hide sidebar"
						aria-label="Hide sidebar"
						onClick={onClose}
					>
						<XMarkIcon />
					</button>
				)}
			</header>

			<nav className="tree" aria-label="Notes">
				{tree.length === 0 ? (
					<p className="empty">No notes yet. Use ☰ to create one.</p>
				) : (
					<div className="tree-root" role="tree" aria-label="Notes">
						{tree.map((node) => (
							<TreeItem
								key={node.path}
								node={node}
								depth={0}
								selectedPath={props.selectedPath}
								expanded={props.expanded}
								onToggleFolder={props.onToggleFolder}
								onSelectNote={props.onSelectNote}
								onNewNote={props.onNewNote}
								onNewFolder={props.onNewFolder}
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
