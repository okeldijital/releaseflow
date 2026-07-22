import type { DocumentTheme } from '../domain/DocumentTheme';
import { DEFAULT_DOCUMENT_THEME } from '../domain/DocumentTheme';

/** ReleaseFlow editorial PDF theme (can be swapped per product). */
export const RELEASEFLOW_PDF_THEME: DocumentTheme = {
  ...DEFAULT_DOCUMENT_THEME,
  pageSize: 'a4',
  orientation: 'portrait',
  marginsMm: { top: 25, bottom: 25, left: 20, right: 20 },
  fonts: {
    title: { family: 'helvetica', sizePt: 24, style: 'bold' },
    subtitle: { family: 'helvetica', sizePt: 16, style: 'normal' },
    heading1: { family: 'helvetica', sizePt: 16, style: 'bold' },
    heading2: { family: 'helvetica', sizePt: 14, style: 'bold' },
    heading3: { family: 'helvetica', sizePt: 12, style: 'bold' },
    body: { family: 'helvetica', sizePt: 11, style: 'normal' },
    footer: { family: 'helvetica', sizePt: 9, style: 'normal' },
    meta: { family: 'helvetica', sizePt: 11, style: 'normal' },
  },
};
