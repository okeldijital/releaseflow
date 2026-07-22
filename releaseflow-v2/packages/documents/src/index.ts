export type { Document, DocumentCover, DocumentFooter, DocumentHeader, DocumentMetadata } from './domain/Document';
export type {
  DocumentSection,
  DocumentSectionStyle,
  DocumentBlock,
  DocumentInline,
  DocumentMark,
} from './domain/DocumentSection';
export type { DocumentTheme } from './domain/DocumentTheme';
export { DEFAULT_DOCUMENT_THEME } from './domain/DocumentTheme';

export type { DocumentRenderer, RenderedDocument } from './application/DocumentRenderer';
export type { RenderContext } from './application/RenderContext';
export { createRenderContext } from './application/RenderContext';

export { PdfRenderer } from './pdf/PdfRenderer';
export { RELEASEFLOW_PDF_THEME } from './pdf/PdfTheme';
export { HtmlRenderer } from './html/HtmlRenderer';

export {
  richTextToDocumentBlocks,
  documentBlocksToPlainText,
  type SourceRichText,
  type SourceBlock,
  type SourceInline,
} from './shared/RichTextConverter';

/** Trigger a browser file download from a RenderedDocument. */
export function downloadRenderedDocument(rendered: {
  filename: string;
  blob?: Blob;
  data: Uint8Array | string;
  mimeType: string;
}): void {
  const blob =
    rendered.blob ??
    new Blob([rendered.data as BlobPart], { type: rendered.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = rendered.filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
