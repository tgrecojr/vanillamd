import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NoteService, NotFoundError, ConflictError, PayloadTooLargeError } from './notes.js';
import { PathError } from './paths.js';

let root: string;
let outside: string;
let notes: NoteService;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'vanillamd-'));
  outside = await mkdtemp(join(tmpdir(), 'vanillamd-out-'));
  notes = new NoteService(root);
  await notes.init();
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

describe('NoteService write/read', () => {
  it('creates folders implicitly and round-trips content', async () => {
    await notes.writeNote('work/todo.md', '# Hello');
    expect(await notes.readNote('work/todo.md')).toBe('# Hello');
  });

  it('overwrites existing notes atomically', async () => {
    await notes.writeNote('a.md', 'one');
    await notes.writeNote('a.md', 'two');
    expect(await notes.readNote('a.md')).toBe('two');
  });

  it('rejects non-markdown note paths', async () => {
    await expect(notes.writeNote('a.txt', 'x')).rejects.toThrow(PathError);
  });

  it('reads a missing note as NotFound', async () => {
    await expect(notes.readNote('nope.md')).rejects.toThrow(NotFoundError);
  });
});

describe('NoteService create/move/delete', () => {
  it('creates an empty note and refuses duplicates', async () => {
    await notes.createNote('n.md');
    await expect(notes.createNote('n.md')).rejects.toThrow(ConflictError);
  });

  it('renames a note', async () => {
    await notes.writeNote('old.md', 'data');
    await notes.move('old.md', 'sub/new.md');
    expect(await notes.readNote('sub/new.md')).toBe('data');
    await expect(notes.readNote('old.md')).rejects.toThrow(NotFoundError);
  });

  it('refuses to move onto an existing path', async () => {
    await notes.writeNote('a.md', '1');
    await notes.writeNote('b.md', '2');
    await expect(notes.move('a.md', 'b.md')).rejects.toThrow(ConflictError);
  });

  it('refuses to move a folder into itself or its own subtree', async () => {
    await notes.writeNote('proj/notes.md', 'x');
    await expect(notes.move('proj', 'proj')).rejects.toThrow(PathError);
    await expect(notes.move('proj', 'proj/inner')).rejects.toThrow(PathError);
  });

  it('deletes notes and folders', async () => {
    await notes.writeNote('f/x.md', 'x');
    await notes.deleteNote('f/x.md');
    await notes.deleteFolder('f');
    await expect(notes.deleteFolder('f')).rejects.toThrow(NotFoundError);
  });

  it('creates notes with owner-only (0600) permissions', async () => {
    await notes.createNote('perm.md');
    const info = await stat(join(root, 'perm.md'));
    expect(info.mode & 0o777).toBe(0o600);
  });
});

describe('NoteService size limit', () => {
  it('rejects content exceeding maxNoteBytes', async () => {
    const bounded = new NoteService(root, 8);
    await expect(bounded.writeNote('big.md', '123456789')).rejects.toThrow(PayloadTooLargeError);
  });

  it('accepts content at exactly the limit', async () => {
    const bounded = new NoteService(root, 8);
    await bounded.writeNote('ok.md', '12345678');
    expect(await bounded.readNote('ok.md')).toBe('12345678');
  });

  it('measures the limit in UTF-8 bytes, not characters', async () => {
    // 'é' is 2 bytes in UTF-8, so four of them exceed a 7-byte limit.
    const bounded = new NoteService(root, 7);
    await expect(bounded.writeNote('uni.md', 'éééé')).rejects.toThrow(PayloadTooLargeError);
  });
});

describe('NoteService tree', () => {
  it('lists folders first, then notes, alphabetically, hiding dotfiles', async () => {
    await notes.writeNote('zeta.md', '');
    await notes.writeNote('alpha.md', '');
    await notes.createFolder('beta');
    await writeFile(join(root, '.hidden.md'), 'secret');
    const tree = await notes.tree();
    expect(tree.map((n) => `${n.type}:${n.name}`)).toEqual([
      'folder:beta',
      'note:alpha.md',
      'note:zeta.md',
    ]);
  });

  it('only includes .md files, not other extensions', async () => {
    await writeFile(join(root, 'image.png'), 'x');
    await notes.writeNote('note.md', '');
    const tree = await notes.tree();
    expect(tree.map((n) => n.name)).toEqual(['note.md']);
  });
});

describe('NoteService security', () => {
  it('blocks path traversal on read and write', async () => {
    await expect(notes.readNote('../escape.md')).rejects.toThrow(PathError);
    await expect(notes.writeNote('../escape.md', 'x')).rejects.toThrow(PathError);
  });

  it('does not follow a symlink that escapes the root', async () => {
    await mkdir(join(outside, 'secrets'), { recursive: true });
    await writeFile(join(outside, 'secrets', 'passwd.md'), 'TOPSECRET');
    // Plant a symlink inside the data dir pointing outside.
    await symlink(outside, join(root, 'link'));
    await expect(notes.readNote('link/secrets/passwd.md')).rejects.toThrow(PathError);
  });

  it('omits symlinks from the tree', async () => {
    await symlink(outside, join(root, 'link'));
    await notes.writeNote('real.md', '');
    const tree = await notes.tree();
    expect(tree.map((n) => n.name)).toEqual(['real.md']);
  });

  it('blocks a write through an escaping symlink in an intermediate segment', async () => {
    // The target file does not exist yet, so the symlink-escape check must climb
    // from the (missing) target up to the symlinked ancestor and reject there.
    await symlink(outside, join(root, 'link'));
    await expect(notes.writeNote('link/sub/new.md', 'x')).rejects.toThrow(PathError);
    // Nothing should have been written outside the root.
    await expect(stat(join(outside, 'sub', 'new.md'))).rejects.toThrow();
  });
});
