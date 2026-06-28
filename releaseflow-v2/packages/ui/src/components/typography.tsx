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
  displayXl:  'text-[3rem] leading-[3.5rem] font-bold text-text-900 dark:text-text-50',
  displayLg:  'text-[2.25rem] leading-[2.75rem] font-bold text-text-900 dark:text-text-50',
  displayMd:  'text-[1.875rem] leading-[2.375rem] font-bold text-text-900 dark:text-text-50',
  heading1:   'text-2xl leading-8 font-semibold text-text-900 dark:text-text-50',
  heading2:   'text-xl leading-7 font-semibold text-text-900 dark:text-text-50',
  heading3:   'text-lg leading-[1.625rem] font-semibold text-text-900 dark:text-text-100',
  heading4:   'text-base leading-6 font-semibold text-text-900 dark:text-text-100',
  bodyLarge:  'text-base leading-6 text-text-700 dark:text-text-300',
  body:       'text-sm leading-5 text-text-700 dark:text-text-300',
  bodySmall:  'text-xs leading-[1.125rem] text-text-500 dark:text-text-400',
  caption:    'text-[0.6875rem] leading-4 text-text-400 dark:text-text-500',
  label:      'text-xs leading-4 font-medium uppercase tracking-wider text-text-500 dark:text-text-400',
  overline:   'text-[0.625rem] leading-[0.875rem] font-semibold uppercase tracking-widest text-text-400 dark:text-text-500',
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
