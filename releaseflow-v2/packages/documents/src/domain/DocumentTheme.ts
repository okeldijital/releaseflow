/**
 * Theme tokens for document rendering (PDF/HTML).
 * Owned by the documents package; consumers select or override.
 */

export interface DocumentTheme {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  marginsMm: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fonts: {
    title: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    subtitle: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    heading1: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    heading2: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    heading3: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    body: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    footer: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
    meta: { family: string; sizePt: number; style: 'normal' | 'bold' | 'italic' };
  };
  colors: {
    text: string;
    muted: string;
    accent: string;
  };
  lineHeight: number;
}

export const DEFAULT_DOCUMENT_THEME: DocumentTheme = {
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
  colors: {
    text: '#1a1a1a',
    muted: '#555555',
    accent: '#cc5500',
  },
  lineHeight: 1.45,
};
