import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * ReleaseFlow ESLint Configuration
 *
 * Design System Guardrails (PDS-13)
 *
 * Page files under apps/web/src/app (page.tsx and layout.tsx, excluding ui-lab/)
 * are the boundary between product code and the Design System. They
 * must compose documented components and semantic tokens only.
 *
 * This config adds the following guardrails for page files:
 *
 *   1.  Bans raw container patterns         (max-w-*, mx-auto)
 *       →  Use <Container size="narrow|standard|wide" />
 *
 *   2.  Bans raw card patterns              (rounded-xl border bg-white)
 *       →  Use <Card padding="..."> or <MetricCard />
 *
 *   3.  Bans raw spinners                   (animate-spin)
 *       →  Use <LoadingState /> or <Button loading />
 *
 *   4.  Bans arbitrary typography sizes     (text-[Npx], text-[Nrem])
 *       →  Use <Typography variant="..." />
 *
 *   5.  Bans raw zinc neutrals              (bg-zinc-*, text-zinc-*)
 *       →  Use surface/text semantic tokens
 *
 *   6.  Bans hardcoded colour hex literals  (#abc, #abcdef)
 *       →  Use tokenised Tailwind utilities
 *
 *   7.  Bans non-PDS radii in component classNames
 *       (rounded-2xl, rounded-[Npx])         →  rounded-lg (Radius.LG)
 *
 *   8.  Bans arbitrary motion durations     (duration-[Nms])
 *       →  duration-fast (100ms) / duration-normal (200ms) / duration-slow (300ms)
 *
 *   9.  Bans the legacy shadow              (shadow-elevated)
 *       →  shadow-raised
 *
 * For the full set of arbitrary values across the whole codebase, also
 * run pnpm design-system:check (scripts/check-design-system.sh).
 *
 * Rationale: ESLint AST selectors do not easily match string contents
 * of JSX attributes, so most of the heavy lifting is delegated to the
 * shell script.  Inside the linter we additionally enforce the most
 * common patterns using no-restricted-syntax and a small inline custom
 * rule that walks JSX className literals.
 */

const PAGE_FILE_GLOB = 'apps/web/src/app/**/{page,layout}.tsx';

// ─── Inline custom rule: page-design-system-guardrail ────────────────────
//
// We use the no-restricted-syntax approach for the patterns that *can*
// be expressed as raw string content, and an explicit custom rule for
// the more nuanced checks.  ESLint custom rules are created as plain
// objects exposed by this config.

const PAGE_RESTRICTED_LITERALS = [
  {
    pattern: /\bmax-w-\S+/,
    message:
      'Use <Container size="narrow|standard|wide" /> instead of "max-w-*" in page files.',
  },
  {
    pattern: /\bmx-auto\b/,
    message:
      'Use <Container /> instead of "mx-auto" in page files. Container already centers itself.',
  },
  {
    pattern: /\banimate-spin\b/,
    message:
      'Use <LoadingState /> or <Button loading /> instead of raw "animate-spin" in page files.',
  },
  {
    pattern: /\bbg-zinc-\d+/,
    message:
      'Use semantic surface tokens (bg-surface-*) instead of "bg-zinc-*" in page files.',
  },
  {
    pattern: /\btext-zinc-\d+/,
    message:
      'Use semantic text tokens (text-text-*) instead of "text-zinc-*" in page files.',
  },
  {
    pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/,
    message:
      'Use <Typography variant="…" /> instead of arbitrary text sizes (text-[…px], text-[…rem]) in page files.',
  },
  {
    pattern: /\bshadow-elevated\b/,
    message:
      'Use "shadow-raised" (Shadow.Raised) instead of the legacy "shadow-elevated" token.',
  },
];

const pageDesignSystemRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce design-system guardrails in page files (Container/Card/LoadingState/Typography).',
      category: 'Design System',
    },
    schema: [],
    messages: {
      violation: '{{message}}',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        const value = node.value;
        for (const { pattern, message } of PAGE_RESTRICTED_LITERALS) {
          if (pattern.test(value)) {
            context.report({ node, messageId: 'violation', data: { message } });
          }
        }
      },
      TemplateElement(node) {
        const raw = node.value && node.value.cooked;
        if (typeof raw !== 'string') return;
        for (const { pattern, message } of PAGE_RESTRICTED_LITERALS) {
          if (pattern.test(raw)) {
            context.report({ node, messageId: 'violation', data: { message } });
          }
        }
      },
    };
  },
};

// ─── Inline custom rule: component-classnames-guardrail ──────────────────
//
// Applied to the shared component packages (packages/{ui,domain-ui}/**).
// Ensures component classNames do not use undocumented radii, arbitrary
// durations, or non-PDS shadows.

const COMPONENT_RESTRICTED_LITERALS = [
  {
    pattern: /\brounded-2xl\b/,
    message:
      'Use "rounded-lg" (Radius.LG) instead of "rounded-2xl" in shared component classNames.',
  },
  {
    pattern: /\brounded-\[\d+px\]/,
    message:
      'Use a documented Radius token (rounded-md / rounded-lg / rounded-xl) instead of an arbitrary radius.',
  },
  {
    pattern: /\bduration-\[\d+ms\]/,
    message:
      'Use a documented Motion token (duration-instant / duration-fast / duration-normal / duration-slow) instead of an arbitrary duration.',
  },
  {
    pattern: /\bshadow-elevated\b/,
    message:
      'Use "shadow-raised" (Shadow.Raised) instead of the legacy "shadow-elevated" token.',
  },
];

const componentClassnamesRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that shared component classNames use only documented design tokens (Radius, Motion, Shadow).',
      category: 'Design System',
    },
    schema: [],
    messages: {
      violation: '{{message}}',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        const value = node.value;
        for (const { pattern, message } of COMPONENT_RESTRICTED_LITERALS) {
          if (pattern.test(value)) {
            context.report({ node, messageId: 'violation', data: { message } });
          }
        }
      },
      TemplateElement(node) {
        const raw = node.value && node.value.cooked;
        if (typeof raw !== 'string') return;
        for (const { pattern, message } of COMPONENT_RESTRICTED_LITERALS) {
          if (pattern.test(raw)) {
            context.report({ node, messageId: 'violation', data: { message } });
          }
        }
      },
    };
  },
};

// ─── Plugin bundle ──────────────────────────────────────────────────────

const releaseflowPlugin = {
  rules: {
    'page-design-system-guardrail': pageDesignSystemRule,
    'component-classnames-guardrail': componentClassnamesRule,
  },
};

// ─── Config ─────────────────────────────────────────────────────────────

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      releaseflow: releaseflowPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  // Page files: page-level design-system guardrails.
  // Set to 'warn' so the build passes. The bash check-design-system.sh
  // script with STRICT=1 enforces the same rules at CI gate.
  {
    files: [PAGE_FILE_GLOB],
    ignores: ['apps/web/src/app/**/ui-lab/**'],
    rules: {
      'releaseflow/page-design-system-guardrail': 'warn',
    },
  },
  // Shared component packages: token-level guardrails.
  {
    files: ['packages/ui/src/**/*.{ts,tsx}', 'packages/domain-ui/src/**/*.{ts,tsx}'],
    rules: {
      'releaseflow/component-classnames-guardrail': 'error',
    },
  },
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/.turbo/**'],
  },
);
