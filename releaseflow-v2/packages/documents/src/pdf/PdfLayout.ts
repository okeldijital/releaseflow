/** Page geometry helpers for A4 / Letter in millimetres. */

export type PageSizeName = 'a4' | 'letter';

export interface PageSizeMm {
  width: number;
  height: number;
}

export function pageSizeMm(size: PageSizeName, orientation: 'portrait' | 'landscape'): PageSizeMm {
  const base: PageSizeMm =
    size === 'letter' ? { width: 215.9, height: 279.4 } : { width: 210, height: 297 };
  if (orientation === 'landscape') {
    return { width: base.height, height: base.width };
  }
  return base;
}

export function contentWidthMm(
  page: PageSizeMm,
  margins: { left: number; right: number },
): number {
  return page.width - margins.left - margins.right;
}
