/**
 * PDF standard fonts (Type 1) — deterministic, embedded in PDF readers by spec.
 * No browser font substitution.
 */

export type PdfFontFamily = 'helvetica' | 'times' | 'courier';
export type PdfFontStyle = 'normal' | 'bold' | 'italic';

export function resolveJsPdfFont(
  family: string,
  style: PdfFontStyle,
): { fontName: string; fontStyle: string } {
  const f = family.toLowerCase();
  const fontName =
    f.includes('times') ? 'times' : f.includes('courier') ? 'courier' : 'helvetica';
  const fontStyle =
    style === 'bold' ? 'bold' : style === 'italic' ? 'italic' : 'normal';
  return { fontName, fontStyle };
}
