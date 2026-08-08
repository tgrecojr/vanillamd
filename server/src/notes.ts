import { mkdir, readFile, writeFile, readdir, rename, rm, stat, realpath } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { dirname, join, posix, resolve, sep } from 'node:path';
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

export class PayloadTooLargeError extends Error {
  readonly statusCode = 413;
  constructor(message = 'Payload too large') {
    super(message);
    this.name = 'PayloadTooLargeError';
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
  /**
   * Running totals for the aggregate ceiling. Computed once by walking the
   * root on first use, then adjusted incrementally, so the common path costs
   * no extra stat calls. Advisory: it measures what this service wrote, not
   * what is actually on the volume.
   */
  private usage: { bytes: number; entries: number } | null = null;

  /**
   * @param root           Absolute path to the data directory.
   * @param maxNoteBytes   Maximum UTF-8 byte length accepted for a single
   *                       note's content. Enforced explicitly here so the
   *                       guarantee does not depend on Fastify's body limit.
   * @param maxTotalBytes  Aggregate ceiling on stored bytes under the root.
   * @param maxEntries     Aggregate ceiling on notes plus folders.
   */
  constructor(
    private readonly root: string,
    private readonly maxNoteBytes = Number.POSITIVE_INFINITY,
    private readonly maxTotalBytes = Number.POSITIVE_INFINITY,
    private readonly maxEntries = Number.POSITIVE_INFINITY,
  ) {}

  /** Reject note content that exceeds the configured byte ceiling. */
  private assertWithinSizeLimit(content: string): void {
    if (Buffer.byteLength(content, 'utf8') > this.maxNoteBytes) {
      throw new PayloadTooLargeError('Note exceeds the maximum allowed size');
    }
  }

  /** True when neither aggregate ceiling is configured — skip all accounting. */
  private get quotaDisabled(): boolean {
    return (
      this.maxTotalBytes === Number.POSITIVE_INFINITY &&
      this.maxEntries === Number.POSITIVE_INFINITY
    );
  }

  /** Walk the root once to seed the running totals. */
  private async loadUsage(): Promise<{ bytes: number; entries: number }> {
    if (this.usage) return this.usage;

    let bytes = 0;
    let entries = 0;
    const walk = async (dir: string): Promise<void> => {
      let found;
      try {
        found = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of found) {
        if (entry.isSymbolicLink()) continue;
        entries++;
        const child = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(child);
        } else if (entry.isFile()) {
          const info = await statOrNull(child);
          if (info) bytes += Number(info.size);
        }
      }
    };
    await walk(this.root);

    this.usage = { bytes, entries };
    return this.usage;
  }

  /**
   * Reserve `deltaBytes` and `deltaEntries` against the aggregate ceiling,
   * throwing before the write commits if either would be exceeded.
   */
  private async reserve(deltaBytes: number, deltaEntries: number): Promise<void> {
    if (this.quotaDisabled) return;
    const usage = await this.loadUsage();

    if (usage.bytes + deltaBytes > this.maxTotalBytes) {
      throw new PayloadTooLargeError('Storage quota exceeded');
    }
    if (usage.entries + deltaEntries > this.maxEntries) {
      throw new PayloadTooLargeError('Too many notes and folders');
    }
    usage.bytes += deltaBytes;
    usage.entries += deltaEntries;
  }

  /**
   * How many parent directories `mkdir(..., { recursive: true })` would have
   * to create for `absolute`. Those all become real entries on disk, so they
   * must be charged too — otherwise deep nesting is a free entry-quota bypass.
   */
  private async countMissingAncestors(absolute: string): Promise<number> {
    const stop = resolve(this.root);
    let cursor = dirname(absolute);
    let missing = 0;
    while (cursor !== stop && cursor.startsWith(stop + sep)) {
      if (await exists(cursor)) break;
      missing++;
      cursor = dirname(cursor);
    }
    return missing;
  }

  /** Give budget back after a delete. */
  private release(bytes: number, entries: number): void {
    if (this.quotaDisabled || !this.usage) return;
    this.usage.bytes = Math.max(0, this.usage.bytes - bytes);
    this.usage.entries = Math.max(0, this.usage.entries - entries);
  }

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
        if (real !== realRoot && !real.startsWith(realRoot + sep)) {
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
    this.assertWithinSizeLimit(content);
    const absolute = await this.safeAbsolute(logicalPath);

    // Charge only the delta: rewriting a note at the same size costs nothing.
    const existing = await statOrNull(absolute);
    const deltaBytes = Buffer.byteLength(content, 'utf8') - Number(existing?.size ?? 0);
    const newAncestors = this.quotaDisabled ? 0 : await this.countMissingAncestors(absolute);
    await this.reserve(deltaBytes, (existing ? 0 : 1) + newAncestors);

    await mkdir(dirname(absolute), { recursive: true });
    await this.atomicWrite(absolute, content);
  }

  /**
   * Write to a sibling temp file then rename over the target, so a crash
   * mid-write can never leave a half-written note.
   *
   * The temp path is built after the note path was validated, so it is held to
   * the same containment contract explicitly: it must resolve inside the root
   * and must not sit behind a symlink. The name comes from a CSPRNG and the
   * file is opened with 'wx' (O_CREAT|O_EXCL), so it cannot be pre-planted and
   * an existing path — symlink included — is refused rather than followed.
   */
  private async atomicWrite(absolute: string, content: string): Promise<void> {
    const dir = dirname(absolute);
    let lastError: unknown;

    for (let attempt = 0; attempt < TEMP_NAME_ATTEMPTS; attempt++) {
      const tmp = join(dir, `.${randomBytes(16).toString('hex')}.tmp`);
      // Same two-layer contract the note path gets: a string containment check
      // against the configured root, then a realpath check for symlinks. The
      // first compares unresolved paths (as resolveWithin does) because the
      // root itself may legitimately sit behind a symlink, e.g. /var on macOS.
      if (!resolve(tmp).startsWith(resolve(this.root) + sep)) {
        throw new PathError('Temp file would escape the data directory');
      }
      await this.assertNoSymlinkEscape(tmp);

      try {
        await writeFile(tmp, content, { mode: 0o600, flag: 'wx' });
      } catch (err) {
        if ((err as NodeJS.ErrnoException)?.code === 'EEXIST') {
          lastError = err;
          continue;
        }
        throw err;
      }
      try {
        await rename(tmp, absolute);
      } catch (err) {
        await rm(tmp, { force: true });
        throw err;
      }
      return;
    }

    throw lastError;
  }

  /** Create a new, empty note. Fails if it already exists. */
  async createNote(rawPath: string): Promise<string> {
    const logicalPath = normalizeLogicalPath(rawPath);
    assertMarkdownPath(logicalPath);
    const absolute = await this.safeAbsolute(logicalPath);
    if (await exists(absolute)) {
      throw new ConflictError('A note with that name already exists');
    }
    await this.reserve(
      0,
      1 + (this.quotaDisabled ? 0 : await this.countMissingAncestors(absolute)),
    );
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, '', { flag: 'wx', mode: 0o600 });
    return logicalPath;
  }

  /** Create a new folder. Fails if it already exists. */
  async createFolder(rawPath: string): Promise<string> {
    const logicalPath = normalizeLogicalPath(rawPath);
    const absolute = await this.safeAbsolute(logicalPath);
    if (await exists(absolute)) {
      throw new ConflictError('A folder with that name already exists');
    }
    await this.reserve(
      0,
      1 + (this.quotaDisabled ? 0 : await this.countMissingAncestors(absolute)),
    );
    await mkdir(absolute, { recursive: true });
    return logicalPath;
  }

  /** Rename/move a note or folder. */
  async move(rawFrom: string, rawTo: string): Promise<string> {
    const fromLogical = normalizeLogicalPath(rawFrom);
    const toLogical = normalizeLogicalPath(rawTo);
    // A note path must keep its .md extension; a folder must not gain one.
    if (isMarkdownPath(fromLogical)) assertMarkdownPath(toLogical);
    // Refuse to move a folder into itself or its own subtree; rename() would
    // otherwise throw EINVAL and surface as an opaque 500.
    if (toLogical === fromLogical || toLogical.startsWith(fromLogical + '/')) {
      throw new PathError('Cannot move a path into itself');
    }
    const fromAbs = await this.safeAbsolute(fromLogical);
    const toAbs = await this.safeAbsolute(toLogical);
    const fromInfo = await statOrNull(fromAbs);
    if (!fromInfo) throw new NotFoundError('Source not found');
    // Decide the source's kind from what is on disk, not from the name the
    // client supplied: the note namespace is defined by the .md suffix, so a
    // regular file may only land on a .md path and a folder may never take one.
    if (fromInfo.isDirectory()) {
      if (isMarkdownPath(toLogical)) {
        throw new PathError('A folder may not be named like a note');
      }
    } else {
      assertMarkdownPath(fromLogical);
      assertMarkdownPath(toLogical);
    }
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
    this.release(Number(info.size), 1);
  }

  /** Delete a folder (recursively). */
  async deleteFolder(rawPath: string): Promise<void> {
    const logicalPath = normalizeLogicalPath(rawPath);
    const absolute = await this.safeAbsolute(logicalPath);
    const info = await statOrNull(absolute);
    if (!info || !info.isDirectory()) throw new NotFoundError('Folder not found');
    const freed = this.quotaDisabled ? { bytes: 0, entries: 0 } : await measureSubtree(absolute);
    await rm(absolute, { recursive: true });
    this.release(freed.bytes, freed.entries + 1);
  }
}

function byFolderThenName(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

async function exists(absolute: string): Promise<boolean> {
  return (await statOrNull(absolute)) !== null;
}

/** Total bytes and entry count under `absolute`, ignoring symlinks. */
async function measureSubtree(absolute: string): Promise<{ bytes: number; entries: number }> {
  let bytes = 0;
  let entries = 0;
  const walk = async (dir: string): Promise<void> => {
    let found;
    try {
      found = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of found) {
      if (entry.isSymbolicLink()) continue;
      entries++;
      const child = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else if (entry.isFile()) {
        const info = await statOrNull(child);
        if (info) bytes += Number(info.size);
      }
    }
  };
  await walk(absolute);
  return { bytes, entries };
}

async function statOrNull(absolute: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(absolute);
  } catch {
    return null;
  }
}

/** Attempts before giving up on finding an unused temp name. */
const TEMP_NAME_ATTEMPTS = 5;
