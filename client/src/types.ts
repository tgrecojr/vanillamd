export interface TreeNode {
  name: string;
  /** Logical path relative to the data root, using forward slashes. */
  path: string;
  type: 'folder' | 'note';
  children?: TreeNode[];
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
