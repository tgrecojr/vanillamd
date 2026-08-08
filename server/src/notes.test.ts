import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, symlink, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NoteService, NotFoundError, ConflictError, PayloadTooLargeError } from './notes.js';
import { MAX_DEPTH, PathError } from './paths.js';

const chain = (prefix: string, n: number): string =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}`).join('/');

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

  it('keeps each note’s content when concurrent writes hit the same folder', async () => {
    // A temp name derived from (pid, ms) is not unique: pid is constant within
    // the process and Date.now() is millisecond-resolution, so these two writes
    // would share one scratch inode and publish each other's bytes.
    const results = await Promise.allSettled([
      notes.writeNote('a.md', 'AAAA'),
      notes.writeNote('b.md', 'BBBB'),
    ]);
    for (const r of results) {
      expect(r.status).toBe('fulfilled');
    }
    expect(await notes.readNote('a.md')).toBe('AAAA');
    expect(await notes.readNote('b.md')).toBe('BBBB');
  });

  it('survives a burst of concurrent writes and leaves no temp files', async () => {
    const count = 25;
    const results = await Promise.allSettled(
      Array.from({ length: count }, (_, i) => notes.writeNote(`burst/n${i}.md`, `content-${i}`)),
    );
    for (const r of results) {
      expect(r.status).toBe('fulfilled');
    }
    for (let i = 0; i < count; i++) {
      expect(await notes.readNote(`burst/n${i}.md`)).toBe(`content-${i}`);
    }
    expect((await readdir(join(root, 'burst'))).filter((e) => e.endsWith('.tmp'))).toEqual([]);
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
    // A rejected move must leave both operands intact.
    expect(await notes.readNote('a.md')).toBe('1');
    expect(await notes.readNote('b.md')).toBe('2');
  });

  it('does not clobber a note created after the destination looked free', async () => {
    // Every await between an existence probe and the publish is a yield point,
    // and rename() replaces silently — so the publish itself must be atomic.
    await notes.writeNote('source.md', 'attacker content');
    const moving = notes.move('source.md', 'dest.md');
    await notes.writeNote('dest.md', 'VICTIM NOTE');
    await expect(moving).rejects.toThrow(ConflictError);
    expect(await notes.readNote('dest.md')).toBe('VICTIM NOTE');
  });

  it('refuses to move a folder onto an existing folder', async () => {
    await notes.createFolder('one');
    await notes.createFolder('two');
    await expect(notes.move('one', 'two')).rejects.toThrow(ConflictError);
  });

  it('refuses to move a folder into itself or its own subtree', async () => {
    await notes.writeNote('proj/notes.md', 'x');
    await expect(notes.move('proj', 'proj')).rejects.toThrow(PathError);
    await expect(notes.move('proj', 'proj/inner')).rejects.toThrow(PathError);
  });

  it('refuses to rename a non-.md file into the note namespace', async () => {
    // DATA_DIR is a bind mount, so a co-tenant can drop non-note artifacts;
    // move() must not be a laundering path for them.
    const secret = 'aws_secret_access_key=AKIAEXAMPLE';
    await writeFile(join(root, 'dropped.conf'), secret);
    await expect(notes.move('dropped.conf', 'pwned.md')).rejects.toThrow(PathError);
    await expect(notes.readNote('pwned.md')).rejects.toThrow(NotFoundError);
  });

  it('refuses to give a folder a .md suffix', async () => {
    await notes.createFolder('realfolder');
    await expect(notes.move('realfolder', 'looksLikeANote.md')).rejects.toThrow(PathError);
  });

  it('refuses to strip .md off a note', async () => {
    await notes.writeNote('keep.md', 'data');
    await expect(notes.move('keep.md', 'stripped')).rejects.toThrow(PathError);
  });

  it('still renames a folder to another non-.md name', async () => {
    await notes.createFolder('proj');
    await notes.writeNote('proj/inner.md', 'x');
    await notes.move('proj', 'renamed');
    expect(await notes.readNote('renamed/inner.md')).toBe('x');
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

describe('NoteService composed depth', () => {
  it('refuses a move that would nest the tree past MAX_DEPTH', async () => {
    // Both operands are individually legal; only the grafted result is not.
    await notes.createFolder(`base/${chain('l', MAX_DEPTH - 1)}`);
    await expect(notes.move('base', `${chain('g', MAX_DEPTH - 1)}/base`)).rejects.toThrow(
      PathError,
    );
    // The listing must survive the rejected move.
    const tree = await notes.tree();
    expect(tree.some((n) => n.name === 'base')).toBe(true);
  });

  it('refuses repeated moves that each look legal but compose unbounded depth', async () => {
    await notes.createFolder(`base/${chain('l', MAX_DEPTH - 1)}`);
    let top = 'base';
    let rejected = false;
    for (let i = 1; i <= 5; i++) {
      try {
        await notes.move(top, `${chain(`g${i}_`, MAX_DEPTH - 1)}/${top}`);
        top = `g${i}_0`;
      } catch (err) {
        expect(err).toBeInstanceOf(PathError);
        rejected = true;
        break;
      }
    }
    expect(rejected).toBe(true);
    await expect(notes.tree()).resolves.toBeDefined();
  });

  it('still allows a deep subtree to move somewhere shallower', async () => {
    await notes.createFolder(`deep/${chain('l', 10)}`);
    await notes.writeNote(`deep/${chain('l', 10)}/leaf.md`, 'data');
    await notes.move('deep', 'moved');
    expect(await notes.readNote(`moved/${chain('l', 10)}/leaf.md`)).toBe('data');
  });

  it('truncates instead of throwing when a tree deeper than MAX_DEPTH exists', async () => {
    // Planted out of band — a co-tenant on the bind mount, or before this fix.
    await mkdir(join(root, chain('d', MAX_DEPTH + 20)), { recursive: true });
    await notes.writeNote('visible.md', 'x');
    const tree = await notes.tree();
    expect(tree.some((n) => n.name === 'visible.md')).toBe(true);
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

  it('does not write note content through a pre-planted temp symlink', async () => {
    // The old temp name was `.${pid}.${Date.now()}.tmp` — both operands are
    // knowable, so a co-tenant on the bind mount could pre-plant it and the
    // default 'w' flag would follow it straight out of DATA_DIR.
    const victim = join(outside, 'victim.txt');
    await writeFile(victim, 'ORIGINAL');
    const payload = 'NOTE PAYLOAD THAT SHOULD NEVER LEAVE DATA_DIR';

    const now = Date.now();
    for (let ms = now; ms < now + 60; ms++) {
      await symlink(victim, join(root, `.${process.pid}.${ms}.tmp`)).catch(() => {
        /* name already taken */
      });
    }

    await notes.writeNote('note.md', payload);
    expect(await readFile(victim, 'utf8')).toBe('ORIGINAL');
    expect(await notes.readNote('note.md')).toBe(payload);
  });

  it('still writes when every predictable temp name is squatted', async () => {
    const now = Date.now();
    for (let ms = now; ms < now + 60; ms++) {
      await writeFile(join(root, `.${process.pid}.${ms}.tmp`), 'squatted').catch(() => {
        /* name already taken */
      });
    }
    await notes.writeNote('ok.md', 'content');
    expect(await notes.readNote('ok.md')).toBe('content');
  });

  it('refuses to create, write, move or delete through a dot-prefixed path', async () => {
    // isHidden() filters the listing only, so without this rule a client could
    // create, fill and recursively delete a subtree invisible in /api/tree.
    const gone = async (...parts: string[]) =>
      stat(join(root, ...parts)).then(
        () => false,
        () => true,
      );

    await expect(notes.createFolder('.ghost')).rejects.toThrow(PathError);
    await expect(notes.createNote('.secret.md')).rejects.toThrow(PathError);
    await expect(notes.writeNote('.ghost/stash.md', 'payload')).rejects.toThrow(PathError);
    await expect(notes.deleteFolder('.ghost')).rejects.toThrow(PathError);
    await expect(notes.deleteNote('.secret.md')).rejects.toThrow(PathError);

    expect(await gone('.ghost')).toBe(true);
    expect(await gone('.secret.md')).toBe(true);

    // A rejected move must leave the source intact.
    await notes.writeNote('visible.md', 'data');
    await expect(notes.move('visible.md', '.hidden.md')).rejects.toThrow(PathError);
    expect(await gone('.hidden.md')).toBe(true);
    expect(await notes.readNote('visible.md')).toBe('data');
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
