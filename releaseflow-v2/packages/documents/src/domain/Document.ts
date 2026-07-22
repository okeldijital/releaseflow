import type { DocumentSection } from './DocumentSection';

export interface DocumentMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
}

export interface DocumentCover {
  imageUrl?: string | null;
  title: string;
  subtitle?: string;
  lines?: string[];
  generatedBy?: string;
}

export interface DocumentFooter {
  left: string;
  rightTemplate?: string;
}

export interface DocumentHeader {
  left: string;
  right?: string;
}

/**
 * Canonical document model used by all renderers.
 * Product adapters convert domain entities into this shape.
 */
export interface Document {
  id?: string;
  title: string;
  subtitle?: string;
  cover?: DocumentCover;
  metadata: DocumentMetadata;
  header?: DocumentHeader;
  footer?: DocumentFooter;
  sections: DocumentSection[];
  /** Suggested download filename (with extension) */
  filename?: string;
}
