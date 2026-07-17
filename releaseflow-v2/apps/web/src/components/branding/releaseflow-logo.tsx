/**
 * BRAND-001 — Canonical ReleaseFlow logo.
 *
 * Single asset: /public/icons/ReleaseFlow-Logo.svg
 * Do not recolour, crop, recreate in code, or embed copies.
 */

import type { CSSProperties, ImgHTMLAttributes } from 'react';

/** Public path of the official logo (source of truth). */
export const RELEASEFLOW_LOGO_SRC = '/icons/ReleaseFlow-Logo.svg';

export interface ReleaseFlowLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
  /**
   * Display width in CSS pixels. Height follows aspect ratio (square asset).
   * Defaults: understated product mark (~96). Home mobile: 80–100.
   */
  width?: number;
  /** Optional explicit height; defaults to `width` (1:1 viewBox). */
  height?: number;
  /** Accessible name — keep product name. */
  alt?: string;
  /** Hint high-priority fetch (auth splash, LCP). */
  priority?: boolean;
  className?: string;
}

/**
 * Official ReleaseFlow logo. Prefer this over ad-hoc <img> or stylised marks.
 */
export function ReleaseFlowLogo({
  width = 96,
  height,
  alt = 'ReleaseFlow',
  priority = false,
  className,
  style,
  ...rest
}: ReleaseFlowLogoProps) {
  const h = height ?? width;
  const mergedStyle: CSSProperties = {
    width,
    height: 'auto',
    maxWidth: width,
    aspectRatio: '1 / 1',
    display: 'block',
    objectFit: 'contain',
    ...style,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element -- official SVG brand asset; no optimisation/crop
    <img
      src={RELEASEFLOW_LOGO_SRC}
      alt={alt}
      width={width}
      height={h}
      className={className}
      style={mergedStyle}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      {...rest}
    />
  );
}
