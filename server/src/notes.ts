import { mkdir, readFile, writeFile, readdir, rename, rm, stat, realpath } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import {
  normalizeLogicalPath,
  resolveWithin,
  assertMarkdownPath,
  isMarkdownPath,
  PathError,
} from './paths.js';

/** A node in the folder/note tree returned to the client. */
export interface TreeNode {
  name: string;
  /** Logical path relative to the data root, using forward slashes. */
  path: string;
  type: 'folder' | 'note';
  children?: TreeNode[];
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message = 'Already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}

/** Directory and file entry names that are never listed or written. */
function isHidden(name: string): boolean {
  return name.startsWith('.');
}

/**
 * All note/folder operations against a single data root. Every public method
 * takes an untrusted logical path, which is validated and resolved before any
 * filesystem access. A symlink-based escape is caught by verifying the real
 * path of the nearest existing ancestor still lives inside the root.
 */
export class NoteService {
  constructor(private readonly root: string) {}

  /** Create the data root if it does not yet exist. */
  async init(): Promise<void> {
    await mkdir(this.root, { recursive: true });
  }

  private async safeAbsolute(logicalPath: string): Promise<string> {
    const target = resolveWithin(this.root, logicalPath);
    await this.assertNoSymlinkEscape(target);
    return target;
  }

  /**
   * Walk from the target up to the root; the first path component that exists
   * must, after resolving symlinks, still be inside the real root. This blocks
   * a symlink planted inside the data dir from redirecting reads/writes out.
   */
  private async assertNoSymlinkEscape(target: string): Promise<void> {
    const realRoot = await realpath(this.root);
    let cursor = target;
    // Climb until we find an existing ancestor (the target itself may be new).
    for (;;) {
      try {
        const real = await realpath(cursor);
        if (real !== realRoot && !real.startsWith(realRoot + '/')) {
          throw new PathError('Resolved path escapes the data directory');
        }
        return;
      } catch (err) {
        if (err instanceof PathError) throw err;
        const parent = dirname(cursor);
        if (parent === cursor) return; // reached filesystem root
        cursor = parent;
      }
    }
  }

  /** Build the full folder/note tree, sorted folders-first then alphabetically. */
  async tree(): Promise<TreeNode[]> {
    return this.readDir('');
  }

  private async readDir(logicalDir: string): Promise<TreeNode[]> {
    const absolute = logicalDir === '' ? this.root : await this.safeAbsolute(logicalDir);
    const entries = await readdir(absolute, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      if (isHidden(entry.name) || entry.isSymbolicLink()) continue;
      const childPath = logicalDir === '' ? entry.name : posix.join(logicalDir, entry.name);

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: childPath,
          type: 'folder',
          children: await this.readDir(childPath),
        });
      } else if (entry.isFile() && isMarkdownPath(entry.name)) {
        nodes.push({ name: entry.name, path: childPath, type: 'note' });
      }
    }

    nodes.sort(byFolderThenName);
    return nodes;
  }

  /** Read a note's markdown content. */
  async readNote(rawPath: string): Promise<string> {
    const logicalPath = normalizeLogicalPath(rawPath);
    assertMarkdownPath(logicalPath);
    const absolute = await this.safeAbsolute(logicalPath);
    try {
      return await readFile(absolute, 'utf8');
    } catch {
      throw new NotFoundError('Note not found');
    }
  }

  /** Write (create or overwrite) a note atomically. Returns nothing. */
  async writeNote(rawPath: string, content: string): Promise<void> {
    const logicalPath = normalizeLogicalPath(rawPath);
    assertMarkdownPath(logicalPath);
    const absolute = await this.safeAbsolute(logicalPath);
    await mkdir(dirname(absolute), { recursive: true });
    await atomicWrite(absolute, content);
  }

  /** Create a new, empty note. Fails if it already exists. */
  async createNote(rawPath: string): Promise<string> {
    const logicalPath = normalizeLogicalPath(rawPath);
    assertMarkdownPath(logicalPath);
    const absolute = await this.safeAbsolute(logicalPath);
    if (await exists(absolute)) {
      throw new ConflictError('A note with that name already exists');
    }
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, '', { flag: 'wx' });
    return logicalPath;
  }

  /** Create a new folder. Fails if it already exists. */
  async createFolder(rawPath: string): Promise<string> {
    const logicalPath = normalizeLogicalPath(rawPath);
    const absolute = await this.safeAbsolute(logicalPath);
    if (await exists(absolute)) {
      throw new ConflictError('A folder with that name already exists');
    }
    await mkdir(absolute, { recursive: true });
    return logicalPath;
  }

  /** Rename/move a note or folder. */
  async move(rawFrom: string, rawTo: string): Promise<string> {
    const fromLogical = normalizeLogicalPath(rawFrom);
    const toLogical = normalizeLogicalPath(rawTo);
    // A note path must keep its .md extension; a folder must not gain one.
    if (isMarkdownPath(fromLogical)) assertMarkdownPath(toLogical);
    const fromAbs = await this.safeAbsolute(fromLogical);
    const toAbs = await this.safeAbsolute(toLogical);
    if (!(await exists(fromAbs))) throw new NotFoundError('Source not found');
    if (await exists(toAbs)) throw new ConflictError('Destination already exists');
    await mkdir(dirname(toAbs), { recursive: true });
    await rename(fromAbs, toAbs);
    return toLogical;
  }

  /** Delete a note. */
  async deleteNote(rawPath: string): Promise<void> {
    const logicalPath = normalizeLogicalPath(rawPath);
    assertMarkdownPath(logicalPath);
    const absolute = await this.safeAbsolute(logicalPath);
    const info = await statOrNull(absolute);
    if (!info || !info.isFile()) throw new NotFoundError('Note not found');
    await rm(absolute);
  }

  /** Delete a folder (recursively). */
  async deleteFolder(rawPath: string): Promise<void> {
    const logicalPath = normalizeLogicalPath(rawPath);
    const absolute = await this.safeAbsolute(logicalPath);
    const info = await statOrNull(absolute);
    if (!info || !info.isDirectory()) throw new NotFoundError('Folder not found');
    await rm(absolute, { recursive: true });
  }
}

function byFolderThenName(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

async function exists(absolute: string): Promise<boolean> {
  return (await statOrNull(absolute)) !== null;
}

async function statOrNull(absolute: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(absolute);
  } catch {
    return null;
  }
}

/**
 * Write to a sibling temp file then rename over the target, so a crash mid-write
 * can never leave a half-written note. The temp name avoids collisions per pid.
 */
async function atomicWrite(absolute: string, content: string): Promise<void> {
  const tmp = join(dirname(absolute), `.${process.pid}.${Date.now()}.tmp`);
  await writeFile(tmp, content, { mode: 0o600 });
  try {
    await rename(tmp, absolute);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}
