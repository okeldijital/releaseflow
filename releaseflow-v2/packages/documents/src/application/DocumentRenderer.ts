import type { Document } from '../domain/Document';
import type { RenderContext } from './RenderContext';

export interface RenderedDocument {
  /** MIME type of the payload */
  mimeType: string;
  /** Suggested filename */
  filename: string;
  /** Binary or text payload */
  data: Uint8Array | string;
  /** Optional blob for browser download helpers */
  blob?: Blob;
}

/**
 * Strategy interface for document output formats.
 */
export interface DocumentRenderer {
  render(document: Document, context?: RenderContext): Promise<RenderedDocument>;
}
