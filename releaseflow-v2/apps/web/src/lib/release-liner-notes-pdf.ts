/**
 * BUILD-013 / BUILD-013A — Liner Notes PDF export entry point.
 * Uses packages/documents PdfRenderer (no browser print).
 */

import {
  PdfRenderer,
  createRenderContext,
  downloadRenderedDocument,
  RELEASEFLOW_PDF_THEME,
} from '@releaseflow/documents';
import type { RichTextDocument } from '@/lib/rich-text';
import { isRichTextEmpty } from '@/lib/rich-text';
import {
  buildLinerNotesFilename,
  createReleaseLinerNotesDocument,
} from '@/lib/documents/release-document-factory';

export interface LinerNotesPdfInput {
  releaseTitle: string;
  primaryArtist: string;
  releaseType: string;
  releaseDate?: string | null;
  copyrightYear?: string | null;
  artworkUrl?: string | null;
  linerNotes: RichTextDocument | null;
}

export { buildLinerNotesFilename };

export function canExportLinerNotesPdf(doc: RichTextDocument | null | undefined): boolean {
  return !isRichTextEmpty(doc ?? null);
}

/**
 * Generate a deterministic PDF and trigger a direct file download.
 * Does not use window.print() or browser print dialogs.
 */
export async function downloadLinerNotesPdf(input: LinerNotesPdfInput): Promise<void> {
  if (!canExportLinerNotesPdf(input.linerNotes)) {
    throw new Error('Add liner notes before exporting a PDF.');
  }

  const document = createReleaseLinerNotesDocument(input);
  const renderer = new PdfRenderer();
  const context = createRenderContext({ theme: RELEASEFLOW_PDF_THEME });
  const rendered = await renderer.render(document, context);
  downloadRenderedDocument(rendered);
}
