/**
 * Canonical structured RichText document model for ReleaseFlow.
 * Liner Notes and future editorial surfaces store this shape — not rendered HTML.
 */

export type RichTextMark = 'bold' | 'italic' | 'underline';

export type InlineNode =
  | { type: 'text'; text: string; marks?: RichTextMark[] }
  | { type: 'hardBreak' }
  | { type: 'link'; href: string; content: InlineNode[] };

export type RichTextBlock =
  | { type: 'paragraph'; content: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3; content: InlineNode[] }
  | { type: 'bulletList'; items: InlineNode[][] }
  | { type: 'orderedList'; items: InlineNode[][] }
  | { type: 'blockquote'; content: InlineNode[] };

export interface RichTextDocument {
  type: 'doc';
  version: 1;
  content: RichTextBlock[];
}

export type RichText = RichTextDocument;
