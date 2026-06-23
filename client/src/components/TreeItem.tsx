import type { TreeNode } from '../types';

interface Props {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  activeFolder: string;
  expanded: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectNote: (path: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

const stripMd = (name: string): string => name.replace(/\.md$/i, '');

export function TreeItem(props: Props): React.JSX.Element {
  const { node, depth, selectedPath, activeFolder, expanded } = props;
  const isFolder = node.type === 'folder';
  const isOpen = expanded.has(node.path);
  const isSelected = isFolder ? activeFolder === node.path : selectedPath === node.path;

  const handleActivate = (): void => {
    if (isFolder) props.onToggleFolder(node.path);
    else props.onSelectNote(node.path);
  };

  return (
    <li className="tree-item">
      <div
        className={`tree-row${isSelected ? ' is-selected' : ''}`}
        style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
        onClick={handleActivate}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isFolder ? isOpen : undefined}
      >
        <span className="tree-icon" aria-hidden="true">
          {isFolder ? (isOpen ? '▾' : '▸') : '·'}
        </span>
        <span className="tree-label">{isFolder ? node.name : stripMd(node.name)}</span>
        <span className="tree-actions">
          <button
            type="button"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              props.onRename(node);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              props.onDelete(node);
            }}
          >
            ✕
          </button>
        </span>
      </div>

      {isFolder && isOpen && node.children && node.children.length > 0 && (
        <ul className="tree-children" role="group">
          {node.children.map((child) => (
            <TreeItem key={child.path} {...props} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
