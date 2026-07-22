import type { DocumentTheme } from '../domain/DocumentTheme';
import { DEFAULT_DOCUMENT_THEME } from '../domain/DocumentTheme';

export interface RenderContext {
  theme: DocumentTheme;
  generatedAt: Date;
  locale?: string;
}

export function createRenderContext(
  overrides?: Partial<RenderContext> & { theme?: Partial<DocumentTheme> },
): RenderContext {
  return {
    theme: {
      ...DEFAULT_DOCUMENT_THEME,
      ...overrides?.theme,
      marginsMm: {
        ...DEFAULT_DOCUMENT_THEME.marginsMm,
        ...overrides?.theme?.marginsMm,
      },
      fonts: {
        ...DEFAULT_DOCUMENT_THEME.fonts,
        ...overrides?.theme?.fonts,
      },
      colors: {
        ...DEFAULT_DOCUMENT_THEME.colors,
        ...overrides?.theme?.colors,
      },
    },
    generatedAt: overrides?.generatedAt ?? new Date(),
    locale: overrides?.locale,
  };
}
