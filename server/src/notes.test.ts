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

describe('NoteService aggregate quota', () => {
  /** maxNoteBytes 1 KiB, aggregate 4 KiB, at most 6 entries. */
  const bounded = async (): Promise<NoteService> => {
    const svc = new NoteService(root, 1024, 4096, 6);
    await svc.init();
    return svc;
  };

  it('rejects writes that individually pass but collectively exceed the ceiling', async () => {
    const svc = await bounded();
    const kib = 'x'.repeat(1024);
    for (let i = 0; i < 4; i++) {
      await svc.writeNote(`n${i}.md`, kib);
    }
    await expect(svc.writeNote('n4.md', kib)).rejects.toThrow(PayloadTooLargeError);
  });

  it('rejects creation past the entry ceiling', async () => {
    const svc = await bounded();
    for (let i = 0; i < 6; i++) {
      await svc.createNote(`e${i}.md`);
    }
    await expect(svc.createNote('e6.md')).rejects.toThrow(PayloadTooLargeError);
    await expect(svc.createFolder('extra')).rejects.toThrow(PayloadTooLargeError);
  });

  it('frees budget when notes are deleted', async () => {
    const svc = await bounded();
    const kib = 'x'.repeat(1024);
    for (let i = 0; i < 4; i++) {
      await svc.writeNote(`n${i}.md`, kib);
    }
    await expect(svc.writeNote('n4.md', kib)).rejects.toThrow(PayloadTooLargeError);
    await svc.deleteNote('n0.md');
    await svc.writeNote('n4.md', kib);
    expect(await svc.readNote('n4.md')).toBe(kib);
  });

  it('charges the folders a nested write implicitly creates', async () => {
    // mkdir(recursive) can create several real entries for one write. Charging
    // only the leaf would make deep nesting a free entry-quota bypass.
    const svc = new NoteService(root, 1024, 1024 * 1024, 6);
    await svc.init();
    // 'a/b/c/n.md' costs 4 entries: a, b, c and the note itself.
    await svc.writeNote('a/b/c/n.md', 'x');
    // Only 2 of the 6-entry budget remain, so a second deep path must not fit.
    await expect(svc.writeNote('d/e/f/n.md', 'x')).rejects.toThrow(PayloadTooLargeError);
  });

  it('charges the folders a nested createFolder implicitly creates', async () => {
    const svc = new NoteService(root, 1024, 1024 * 1024, 4);
    await svc.init();
    await svc.createFolder('p/q/r'); // 3 entries
    await svc.createNote('s.md'); // 4th
    await expect(svc.createNote('t.md')).rejects.toThrow(PayloadTooLargeError);
  });

  it('charges an overwrite as a delta, not a fresh allocation', async () => {
    const svc = await bounded();
    await svc.writeNote('a.md', 'x'.repeat(1024));
    for (let i = 0; i < 10; i++) {
      await svc.writeNote('a.md', 'y'.repeat(1024));
    }
    expect(await svc.readNote('a.md')).toBe('y'.repeat(1024));
  });

  it('is unbounded by default so existing deployments keep working', async () => {
    for (let i = 0; i < 30; i++) {
      await notes.writeNote(`free/n${i}.md`, 'x'.repeat(2048));
    }
    expect(await notes.readNote('free/n29.md')).toBe('x'.repeat(2048));
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
