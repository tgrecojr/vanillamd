import type { Node as ProseNode } from '@milkdown/kit/prose/model';
import type { Transaction } from '@milkdown/kit/prose/state';
import { sanitizeUrl } from './urlSafety';

/**
 * Rewrite every unsafe link `href` and image `src` in `doc` to the allowlist's
 * fallback, returning `true` when anything changed.
 *
 * This sanitizes the **document model**, not the rendered attributes,
 * deliberately. Milkdown's commonmark preset builds its DOM as
 * `['a', { ...ctx.get(linkAttr.key)(mark), ...mark.attrs }]` — the raw
 * `mark.attrs` are spread *after* the custom attribute getter, so anything a
 * `linkAttr`/`imageAttr` override returns is immediately overwritten by the
 * original untrusted URL. Fixing the attrs is therefore inert; the URL has to
 * be safe in the model itself so the spread propagates the safe value.
 */
export function sanitizeDocUrls(doc: ProseNode, tr: Transaction): boolean {
  let changed = false;

  doc.descendants((node, pos) => {
    if (node.type.name === 'image') {
      const raw = node.attrs.src as string;
      const safe = sanitizeUrl(raw, { kind: 'image' });
      if (safe !== raw) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: safe });
        changed = true;
      }
    }

    for (const mark of node.marks) {
      if (mark.type.name !== 'link') continue;
      const raw = mark.attrs.href as string;
      const safe = sanitizeUrl(raw);
      if (safe === raw) continue;

      const from = pos;
      const to = pos + node.nodeSize;
      tr.removeMark(from, to, mark.type);
      tr.addMark(from, to, mark.type.create({ ...mark.attrs, href: safe }));
      changed = true;
    }
  });

  return changed;
}
