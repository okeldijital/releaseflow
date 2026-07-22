/**
 * Converts product RichText JSON into generic DocumentBlocks.
 * No product-specific types — accepts a structural subset.
 */

import type { DocumentBlock, DocumentInline, DocumentMark } from '../domain/DocumentSection';

/** Structural RichText shapes (compatible with apps/web RichTextDocument). */
export type SourceMark = 'bold' | 'italic' | 'underline';

export type SourceInline =
  | { type: 'text'; text: string; marks?: SourceMark[] }
  | { type: 'hardBreak' }
  | { type: 'link'; href: string; content: SourceInline[] };

export type SourceBlock =
  | { type: 'paragraph'; content: SourceInline[] }
  | { type: 'heading'; level: 1 | 2 | 3; content: SourceInline[] }
  | { type: 'bulletList'; items: SourceInline[][] }
  | { type: 'orderedList'; items: SourceInline[][] }
  | { type: 'blockquote'; content: SourceInline[] };

export type SourceRichText = {
  type: 'doc';
  version?: number;
  content: SourceBlock[];
};

function convertMarks(marks?: SourceMark[]): DocumentMark[] | undefined {
  if (!marks?.length) return undefined;
  return marks.filter(
    (m): m is DocumentMark => m === 'bold' || m === 'italic' || m === 'underline',
  );
}

function convertInlines(nodes: SourceInline[]): DocumentInline[] {
  const out: DocumentInline[] = [];
  for (const n of nodes) {
    if (n.type === 'hardBreak') {
      out.push({ type: 'break' });
      continue;
    }
    if (n.type === 'link') {
      const text = flattenInlines(n.content);
      out.push({
        type: 'link',
        href: n.href,
        text: text || n.href,
        marks: undefined,
      });
      continue;
    }
    if (n.type === 'text') {
      out.push({ type: 'text', text: n.text, marks: convertMarks(n.marks) });
    }
  }
  return out;
}

function flattenInlines(nodes: SourceInline[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text;
      if (n.type === 'hardBreak') return '\n';
      if (n.type === 'link') return flattenInlines(n.content);
      return '';
    })
    .join('');
}

/**
 * RichText JSON → Document blocks (no HTML intermediate).
 */
export function richTextToDocumentBlocks(doc: SourceRichText | null | undefined): DocumentBlock[] {
  if (!doc?.content?.length) return [];
  const blocks: DocumentBlock[] = [];
  for (const block of doc.content) {
    switch (block.type) {
      case 'paragraph':
        blocks.push({ type: 'paragraph', inlines: convertInlines(block.content) });
        break;
      case 'heading':
        blocks.push({
          type: 'heading',
          level: block.level,
          inlines: convertInlines(block.content),
        });
        break;
      case 'bulletList':
        blocks.push({
          type: 'bulletList',
          items: block.items.map((item) => convertInlines(item)),
        });
        break;
      case 'orderedList':
        blocks.push({
          type: 'orderedList',
          items: block.items.map((item) => convertInlines(item)),
        });
        break;
      case 'blockquote':
        blocks.push({ type: 'blockquote', inlines: convertInlines(block.content) });
        break;
      default:
        break;
    }
  }
  return blocks;
}

export function documentBlocksToPlainText(blocks: DocumentBlock[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.type === 'bulletList' || b.type === 'orderedList') {
      b.items.forEach((item, i) => {
        const prefix = b.type === 'orderedList' ? `${i + 1}. ` : '• ';
        lines.push(prefix + inlinesToText(item));
      });
      continue;
    }
    lines.push(inlinesToText(b.inlines));
  }
  return lines.join('\n');
}

function inlinesToText(inlines: DocumentInline[]): string {
  return inlines
    .map((n) => {
      if (n.type === 'break') return '\n';
      if (n.type === 'link') return `${n.text} (${n.href})`;
      return n.text;
    })
    .join('');
}
