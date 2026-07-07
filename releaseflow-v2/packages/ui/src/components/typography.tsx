import { type ReactNode } from 'react';

type TypographyVariant =
  | 'displayXl'
  | 'displayLg'
  | 'displayMd'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'overline';

const LEGACY_ALIASES: Record<string, TypographyVariant> = {
  h1: 'heading1',
  h2: 'heading2',
  h3: 'heading3',
  h4: 'heading4',
  display: 'displayLg',
  displayLg: 'displayLg',
};

interface TypographyProps {
  variant?: TypographyVariant | string;
  as?: keyof HTMLElementTagNameMap;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<TypographyVariant, string> = {
  displayXl:  'text-display-xl leading-[3.5rem] font-bold text-content-primary',
  displayLg:  'text-display-lg leading-[2.75rem] font-bold text-content-primary',
  displayMd:  'text-display-md leading-[2.375rem] font-bold text-content-primary',
  heading1:   'text-2xl leading-8 font-semibold text-content-primary',
  heading2:   'text-xl leading-7 font-semibold text-content-primary',
  heading3:   'text-lg leading-[1.625rem] font-semibold text-content-primary',
  heading4:   'text-base leading-6 font-semibold text-content-primary',
  bodyLarge:  'text-base leading-6 text-content-secondary',
  body:       'text-sm leading-5 text-content-secondary',
  bodySmall:  'text-xs leading-[1.125rem] text-content-label',
  caption:    'text-caption leading-4 text-content-label',
  label:      'text-xs leading-4 font-medium uppercase tracking-wider text-content-label',
  overline:   'text-overline leading-[0.875rem] font-semibold uppercase tracking-widest text-content-label',
};

const defaultTag: Record<TypographyVariant, keyof HTMLElementTagNameMap> = {
  displayXl: 'h1',
  displayLg: 'h1',
  displayMd: 'h1',
  heading1:  'h1',
  heading2:  'h2',
  heading3:  'h3',
  heading4:  'h4',
  bodyLarge: 'p',
  body:      'p',
  bodySmall: 'p',
  caption:   'span',
  label:     'span',
  overline:  'span',
};

function resolveVariant(variant: string | undefined): TypographyVariant {
  if (!variant) return 'body';
  if (variant in variantClasses) return variant as TypographyVariant;
  if (variant in LEGACY_ALIASES) return LEGACY_ALIASES[variant]!;
  return 'body';
}

export function Typography({
  variant,
  as,
  children,
  className = '',
}: TypographyProps) {
  const resolved = resolveVariant(variant);
  const Tag = (as ?? defaultTag[resolved]) as keyof HTMLElementTagNameMap;
  return (
    <Tag className={`${variantClasses[resolved]} ${className}`}>
      {children}
    </Tag>
  );
}