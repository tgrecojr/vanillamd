import type { TreeNode } from "../types";
import { DocumentPlusIcon } from "./icons/lists";
import {
	ChevronDownIcon,
	EllipsisVerticalIcon,
	FileMarkdownIcon,
	FolderPlusIcon,
	PencilSquareIcon,
	TrashIcon,
} from "./icons/ui";
import { Menu, MenuItem } from "./Menu";

export interface TreeActions {
	onToggleFolder: (path: string) => void;
	onSelectNote: (path: string) => void;
	onNewNote: (folder: string) => void;
	onNewFolder: (folder: string) => void;
	onRename: (node: TreeNode) => void;
	onDelete: (node: TreeNode) => void;
}

interface Props extends TreeActions {
	node: TreeNode;
	depth: number;
	selectedPath: string | null;
	expanded: Set<string>;
}

const stripMd = (name: string): string => name.replace(/\.md$/i, "");

/**
 * One row of the note tree (and, for open folders, its children). Folders get
 * a rotating chevron; notes get the markdown glyph. A "⋮" menu on the row
 * carries the node's actions, as in many-notes.
 */
export function TreeItem(props: Props): React.JSX.Element {
	const { node, depth, selectedPath, expanded } = props;
	const isFolder = node.type === "folder";
	const isOpen = expanded.has(node.path);
	const isSelected = !isFolder && selectedPath === node.path;

	const handleActivate = (): void => {
		if (isFolder) props.onToggleFolder(node.path);
		else props.onSelectNote(node.path);
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleActivate();
		}
	};

	return (
		<div className="tree-item">
			<div
				className={`tree-row${isSelected ? " is-selected" : ""}`}
				role="treeitem"
				aria-selected={isSelected}
				aria-expanded={isFolder ? isOpen : undefined}
				aria-level={depth + 1}
				tabIndex={0}
				onClick={handleActivate}
				onKeyDown={handleKeyDown}
			>
				<div className="tree-row-main" title={node.name}>
					<span
						className={`tree-icon${isFolder && !isOpen ? " is-collapsed" : ""}`}
						aria-hidden="true"
					>
						{isFolder ? <ChevronDownIcon /> : <FileMarkdownIcon />}
					</span>
					<span className="tree-label">
						{isFolder ? node.name : stripMd(node.name)}
					</span>
				</div>
				<Menu
					label={`Actions for ${node.name}`}
					icon={<EllipsisVerticalIcon />}
					className="tree-menu"
				>
					{(close) => (
						<>
							{isFolder && (
								<>
									<MenuItem
										icon={<DocumentPlusIcon />}
										label="New note"
										onClick={() => {
											close();
											props.onNewNote(node.path);
										}}
									/>
									<MenuItem
										icon={<FolderPlusIcon />}
										label="New folder"
										onClick={() => {
											close();
											props.onNewFolder(node.path);
										}}
									/>
								</>
							)}
							<MenuItem
								icon={<PencilSquareIcon />}
								label="Rename"
								onClick={() => {
									close();
									props.onRename(node);
								}}
							/>
							<MenuItem
								icon={<TrashIcon />}
								label="Delete"
								danger
								onClick={() => {
									close();
									props.onDelete(node);
								}}
							/>
						</>
					)}
				</Menu>
			</div>

			{isFolder && isOpen && node.children && node.children.length > 0 && (
				<div className="tree-children">
					{node.children.map((child) => (
						<TreeItem
							key={child.path}
							{...props}
							node={child}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}
