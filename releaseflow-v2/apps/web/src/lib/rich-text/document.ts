import type {
  InlineNode,
  RichTextBlock,
  RichTextDocument,
  RichTextMark,
} from './types';

export function emptyRichTextDocument(): RichTextDocument {
  return {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [] }],
  };
}

function inlinePlainText(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text;
      if (n.type === 'hardBreak') return '\n';
      if (n.type === 'link') return inlinePlainText(n.content);
      return '';
    })
    .join('');
}

export function isRichTextEmpty(doc: RichTextDocument | null | undefined): boolean {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) return true;
  for (const block of doc.content) {
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      for (const item of block.items) {
        if (inlinePlainText(item).trim()) return false;
      }
      continue;
    }
    if (inlinePlainText(block.content).trim()) return false;
  }
  return true;
}

export function normalizeRichText(value: unknown): RichTextDocument | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.type !== 'doc' || !Array.isArray(v.content)) return null;
  const doc: RichTextDocument = {
    type: 'doc',
    version: 1,
    content: v.content as RichTextBlock[],
  };
  return isRichTextEmpty(doc) ? null : doc;
}

/** Convert document → simple HTML for contenteditable / PDF body. */
export function richTextToHtml(doc: RichTextDocument): string {
  return doc.content.map(blockToHtml).join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapMarks(text: string, marks?: RichTextMark[]): string {
  let html = escapeHtml(text);
  if (!marks?.length) return html;
  if (marks.includes('bold')) html = `<strong>${html}</strong>`;
  if (marks.includes('italic')) html = `<em>${html}</em>`;
  if (marks.includes('underline')) html = `<u>${html}</u>`;
  return html;
}

function inlinesToHtml(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return wrapMarks(n.text, n.marks);
      if (n.type === 'hardBreak') return '<br>';
      if (n.type === 'link') {
        const href = escapeHtml(n.href);
        return `<a href="${href}" rel="noopener noreferrer">${inlinesToHtml(n.content)}</a>`;
      }
      return '';
    })
    .join('');
}

function blockToHtml(block: RichTextBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${inlinesToHtml(block.content) || '<br>'}</p>`;
    case 'heading': {
      const tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
      return `<${tag}>${inlinesToHtml(block.content)}</${tag}>`;
    }
    case 'bulletList':
      return `<ul>${block.items.map((item) => `<li>${inlinesToHtml(item)}</li>`).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${block.items.map((item) => `<li>${inlinesToHtml(item)}</li>`).join('')}</ol>`;
    case 'blockquote':
      return `<blockquote>${inlinesToHtml(block.content)}</blockquote>`;
    default:
      return '';
  }
}

/** Parse contenteditable / HTML fragment → document model. */
export function htmlToRichText(html: string): RichTextDocument {
  if (typeof DOMParser === 'undefined') {
    return emptyRichTextDocument();
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return emptyRichTextDocument();

  const content: RichTextBlock[] = [];
  walkBlocks(root, content);

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] });
  }
  return { type: 'doc', version: 1, content };
}

function walkBlocks(parent: Element, out: RichTextBlock[]) {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text.trim()) {
        out.push({ type: 'paragraph', content: [{ type: 'text', text }] });
      }
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'p' || tag === 'div') {
      out.push({ type: 'paragraph', content: parseInlines(el) });
    } else if (tag === 'h1') {
      out.push({ type: 'heading', level: 1, content: parseInlines(el) });
    } else if (tag === 'h2') {
      out.push({ type: 'heading', level: 2, content: parseInlines(el) });
    } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      out.push({ type: 'heading', level: 3, content: parseInlines(el) });
    } else if (tag === 'ul') {
      const items = Array.from(el.querySelectorAll(':scope > li')).map((li) =>
        parseInlines(li as HTMLElement),
      );
      out.push({ type: 'bulletList', items: items.length ? items : [[]] });
    } else if (tag === 'ol') {
      const items = Array.from(el.querySelectorAll(':scope > li')).map((li) =>
        parseInlines(li as HTMLElement),
      );
      out.push({ type: 'orderedList', items: items.length ? items : [[]] });
    } else if (tag === 'blockquote') {
      out.push({ type: 'blockquote', content: parseInlines(el) });
    } else if (tag === 'br') {
      out.push({ type: 'paragraph', content: [{ type: 'hardBreak' }] });
    } else {
      walkBlocks(el, out);
    }
  }
}

function parseInlines(el: HTMLElement): InlineNode[] {
  const nodes: InlineNode[] = [];
  walkInlines(el, nodes, []);
  return nodes;
}

function walkInlines(parent: Node, out: InlineNode[], marks: RichTextMark[]) {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (text) out.push({ type: 'text', text, marks: marks.length ? [...marks] : undefined });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') {
      out.push({ type: 'hardBreak' });
      continue;
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      const inner: InlineNode[] = [];
      walkInlines(el, inner, marks);
      out.push({ type: 'link', href, content: inner.length ? inner : [{ type: 'text', text: href }] });
      continue;
    }
    const nextMarks = [...marks];
    if (tag === 'strong' || tag === 'b') nextMarks.push('bold');
    if (tag === 'em' || tag === 'i') nextMarks.push('italic');
    if (tag === 'u') nextMarks.push('underline');
    walkInlines(el, out, Array.from(new Set(nextMarks)));
  }
}
