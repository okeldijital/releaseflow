/**
 * Generic document section content (no product domain types).
 */

export type DocumentMark = 'bold' | 'italic' | 'underline';

export type DocumentInline =
  | { type: 'text'; text: string; marks?: DocumentMark[] }
  | { type: 'break' }
  | { type: 'link'; href: string; text: string; marks?: DocumentMark[] };

export type DocumentBlock =
  | { type: 'paragraph'; inlines: DocumentInline[] }
  | { type: 'heading'; level: 1 | 2 | 3; inlines: DocumentInline[] }
  | { type: 'bulletList'; items: DocumentInline[][] }
  | { type: 'orderedList'; items: DocumentInline[][] }
  | { type: 'blockquote'; inlines: DocumentInline[] };

export type DocumentSectionStyle = 'default' | 'cover' | 'body' | 'meta';

export interface DocumentSection {
  id: string;
  heading?: string;
  style?: DocumentSectionStyle;
  /** Structured body blocks */
  blocks: DocumentBlock[];
  /** Optional key/value rows for metadata sections */
  metadataRows?: { label: string; value: string }[];
}
