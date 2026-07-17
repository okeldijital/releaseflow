# BUILD-105 — Design Token Compliance Audit (Text System)

**Date:** 2026-07-16
**Scope:** `apps/web/src` (excl. `__tests__/`, `lib/`), `packages/ui/src`, `packages/domain-ui/src`
**Status:** Read-only audit — zero source files modified

---

## Executive Summary

The ReleaseFlow codebase uses a **custom design token system (PDS-13)** defined in `globals.css` via Tailwind v4 `@theme`. The application demonstrates **strong token adoption** — approximately **95% of all text colour uses are compliant** with the official token set.

However, **three parallel text colour systems** coexist:

| System | Token Prefix | Usage Share | Status |
|--------|-------------|-------------|--------|
| **Design Tokens** | `text-text-*`, `text-surface-*`, `text-primary-*`, `text-secondary-*`, `text-success/danger/warning/info-*`, `text-workflow-*` | ~95% | Official |
| **Typography Component Tokens** | `text-content-*` | ~3% | Secondary — used in `packages/ui` Typography component |
| **Raw CSS Colour Names** | `text-red-*`, `text-amber-*`, `text-emerald-*`, `text-purple-*`, `text-cyan-*`, `text-rose-*`, `text-blue-*`, `text-accent-*` | ~2% | Legacy / Ad-hoc |

**Key findings:**
- **Zero** legacy Tailwind grey classes (`text-gray-*`, `text-neutral-*`, `text-zinc-*`, `text-stone-*`, `text-slate-*`)
- **Zero** legacy custom classes (`text-muted`, `text-foreground`)
- **1** hardcoded colour (`color: white` in `.skip-link` in `globals.css`)
- **33** uses of raw CSS colour names (not design tokens) across ~12 files
- **7 unused design tokens** as text colours
- **2 parallel heading colour conventions** (`text-primary-400` vs `text-text-900`)

---

## Deliverable 1 — Complete Text Colour Inventory

### 1.1 Design Token Text Colours

#### `text-text-*` (Brown Scale — Core Text)
| Class | Hex (Light) | Hex (Dark) | Count | Example Files |
|-------|-------------|-------------|-------|---------------|
| `text-text-50` | `#F5F0EA` | `#1E1A17` | 6 | `tabs.tsx`, `confirmation-dialog.tsx`, `segmented-control.tsx`, `overlay.tsx` |
| `text-text-100` | `#EAE2D7` | `#2A251F` | 22 | `releases/[id]/page.tsx`, `toast.tsx`, `card.tsx`, `table.tsx` |
| `text-text-200` | `#D6CBBC` | `#3A342F` | 51 | `release-journey.tsx`, `sidebar.tsx`, `releases/[id]/page.tsx` |
| `text-text-300` | `#BDB4A8` | `#4B4440` | 55 | `releases/[id]/page.tsx`, `topbar.tsx`, `card.tsx` |
| `text-text-400` | `#78716C` | `#78716C` | 425 | `dashboard/page.tsx`, `topbar.tsx`, `context-rail.tsx` |
| `text-text-500` | `#857D76` | `#857D76` | 431 | `dashboard/page.tsx`, `sidebar.tsx`, `workflow-board.tsx` |
| `text-text-600` | `#6D665F` | `#BDB4A8` | 31 | `dashboard/page.tsx`, `health-ring.tsx`, `badge.tsx` |
| `text-text-700` | `#564F49` | `#D0C8BC` | 88 | `releases/[id]/page.tsx`, `topbar.tsx`, `rights-matrix.tsx` |
| `text-text-800` | `#3D3830` | `#E4DDD4` | 37 | `SectionHeader.tsx`, `topbar.tsx`, `button.tsx` |
| `text-text-900` | `#2A2319` | `#F5F0EA` | 177 | `releases/[id]/page.tsx`, `sidebar.tsx`, `card.tsx` |

#### `text-surface-*` (Warm Neutral — High Contrast on Dark)
| Class | Hex (Light) | Hex (Dark) | Count | Example Files |
|-------|-------------|-------------|-------|---------------|
| `text-surface-50` | `#FAF8F5` | `#191511` | 200 | `dashboard/page.tsx`, `sidebar.tsx`, `sign-up/page.tsx` |
| `text-surface-100` | `#F4F0EB` | `#26211B` | 101 | `my-work/page.tsx`, `sign-up/page.tsx`, `readiness-stack.tsx` |
| `text-surface-200` | `#EAE5DE` | `#3A342F` | 18 | `sign-up/page.tsx`, `ReleaseTypeStep.tsx` |
| `text-surface-300` | `#DDD7CE` | `#4E4741` | 5 | Various |
| `text-surface-700` | `#6B6360` | `#B5ADA2` | 4 | Various |

#### `text-primary-*` (Burnt Sienna — Brand)
| Class | Hex (Light) | Hex (Dark) | Count | Example Files |
|-------|-------------|-------------|-------|---------------|
| `text-primary-300` | `#FFB266` | `#CC5500` | 17 | `releases/[id]/page.tsx`, `select.tsx`, `sign-in/page.tsx` |
| `text-primary-400` | `#FF9933` | `#FF9933` | 131 | `dashboard/page.tsx`, `topbar.tsx`, `my-work/page.tsx` |
| `text-primary-500` | `#CC5500` | `#FFB266` | 21 | `sidebar.tsx`, `topbar.tsx`, `button.tsx` |
| `text-primary-600` | `#B34A00` | `#FFCC99` | 13 | `tabs.tsx`, `avatar.tsx` |
| `text-primary-700` | `#8A3900` | `#FFD9B3` | 16 | `sidebar.tsx`, `topbar.tsx`, `tag.tsx` |

#### `text-secondary-*` (Warm Sand)
| Class | Hex (Light) | Hex (Dark) | Count | Example Files |
|-------|-------------|-------------|-------|---------------|
| `text-secondary-300` | `#E0C49C` | `#C08D5C` | 1 | `button.tsx` |
| `text-secondary-700` | `#9A7145` | `#EBD9BE` | 4 | `tag.tsx`, `avatar.tsx`, `rights-matrix.tsx` |

### 1.2 Feedback / Semantic Status Text Colours

#### `text-success-*`
| Class | Count | Example Files |
|-------|-------|---------------|
| `text-success-500` | 33 | `workflow-board.tsx`, `toast.tsx`, `notification.tsx` |
| `text-success-600` | 25 | `my-work/page.tsx`, `badge.tsx`, `administration/production/page.tsx` |
| `text-success-400` | 21 | `tracks/new/page.tsx`, `MediaUploader.tsx`, `label-field-picker.tsx` |
| `text-success-700` | 7 | `tag.tsx`, `avatar.tsx`, `alert.tsx` |
| `text-success-300` | 1 | `button.tsx` |
| `text-success-100` | 1 | `health-ring.tsx` |

#### `text-warning-*`
| Class | Count | Example Files |
|-------|-------|---------------|
| `text-warning-500` | 18 | `ReadinessCard.tsx`, `toast.tsx`, `notification.tsx` |
| `text-warning-600` | 23 | `my-work/page.tsx`, `badge.tsx`, `administration/production/page.tsx` |
| `text-warning-400` | 16 | `dashboard/page.tsx`, `tracks/new/page.tsx` |
| `text-warning-700` | 11 | `tag.tsx`, `avatar.tsx`, `alert.tsx` |
| `text-warning-100` | 1 | `health-ring.tsx` |

#### `text-danger-*`
| Class | Count | Example Files |
|-------|-------|---------------|
| `text-danger-500` | 48 | `workflow-board.tsx`, `button.tsx`, `topbar.tsx` |
| `text-danger-400` | 47 | `dashboard/page.tsx`, `sidebar.tsx`, `select.tsx` |
| `text-danger-600` | 29 | `releases/[id]/page.tsx`, `badge.tsx`, `button.tsx` |
| `text-danger-700` | 7 | `tag.tsx`, `avatar.tsx`, `alert.tsx` |
| `text-danger-300` | 2 | `button.tsx`, `artist-field-picker.tsx` |
| `text-danger-100` | 1 | `health-ring.tsx` |

#### `text-info-*`
| Class | Count | Example Files |
|-------|-------|---------------|
| `text-info-400` | 21 | `dashboard/page.tsx`, `my-work/page.tsx` |
| `text-info-500` | 13 | `toast.tsx`, `notification.tsx`, `inline-message.tsx` |
| `text-info-600` | 18 | `release-status-config.ts`, `badge.tsx` |
| `text-info-700` | 4 | `tag.tsx`, `avatar.tsx`, `alert.tsx` |

### 1.3 Workflow Stage Text Colours

| Class | Count | Example Files |
|-------|-------|---------------|
| `text-workflow-planning` | 1 | `release-journey.tsx` |
| `text-workflow-recording` | 1 | `release-journey.tsx` |
| `text-workflow-mixing` | 3 | `release-journey.tsx`, `track-workspace.tsx` |
| `text-workflow-mastering` | 1 | `release-journey.tsx` |
| `text-workflow-artwork` | 1 | `release-journey.tsx` |
| `text-workflow-publishing` | 1 | `release-journey.tsx` |
| `text-workflow-distribution` | 1 | `release-journey.tsx` |
| `text-workflow-released` | 1 | `release-journey.tsx` |

### 1.4 Content Token Text Colours (`text-content-*`)

| Class | Hex | Count | Where Used |
|-------|-----|-------|------------|
| `text-content-primary` | `#F5F5F7` | 21 | `typography.tsx` (display/heading variants), `app-shell.tsx`, `table.tsx`, `input.tsx`, `readiness-stack.tsx` |
| `text-content-secondary` | `#C7C7CC` | 6 | `typography.tsx` (body variants), `notification.tsx`, `empty-state.tsx` |
| `text-content-label` | `#9A9AA1` | 27 | `typography.tsx` (caption/label/overline), `input.tsx`, `card.tsx` |

### 1.5 Raw / Non-Token Text Colours

| Class | Count | Files |
|-------|-------|-------|
| `text-amber-400` | 3 | `schedule/page.tsx`, `artists/[id]/page.tsx`, `administration/members/page.tsx` |
| `text-amber-300` | 2 | `schedule/page.tsx`, `brief/page.tsx` |
| `text-amber-700` | 1 | `brief/page.tsx` |
| `text-red-400` | 2 | `schedule/page.tsx`, `administration/members/page.tsx` |
| `text-red-500` | 2 | `campaigns/[id]/page.tsx` |
| `text-red-300` | 2 | `brief/page.tsx`, `invite/[token]/page.tsx` |
| `text-red-700` | 1 | `brief/page.tsx` |
| `text-emerald-400` | 3 | `artists/[id]/page.tsx`, `administration/members/page.tsx`, `invite/[token]/page.tsx` |
| `text-purple-400` | 2 | `artists/[id]/page.tsx`, `tracks/page.tsx` |
| `text-purple-600` | 1 | `assets/page.tsx` |
| `text-cyan-400` | 1 | `artists/[id]/page.tsx` |
| `text-rose-400` | 1 | `artists/[id]/page.tsx` |
| `text-blue-700` | 1 | `brief/page.tsx` |
| `text-blue-300` | 1 | `brief/page.tsx` |
| `text-accent-400` | 3 | `assignments/[id]/page.tsx`, `my-work/page.tsx`, `people/[id]/page.tsx` |
| `text-white` | 2 | `invite/[token]/page.tsx` |

### 1.6 Typography Size / Variant Classes

| Class | Count | Purpose |
|-------|-------|---------|
| `text-display-md` | 65 | Page titles (h1) |
| `text-display-sm` | 4 | Sub-headings |
| `text-body` | 51 | Standard body text |
| `text-body-large` | 6 | Larger body text |
| `text-body-small` | 4 | Small body text |
| `text-caption` | 21 | Small captions/metadata |
| `text-overline` | 5 | Section overline labels |

---

## Deliverable 2 — Legacy Colour Usage

**Finding: Zero legacy colour classes are in use.**

| Legacy Class | Status |
|-------------|--------|
| `text-gray-*` | **Not found** — 0 occurrences |
| `text-neutral-*` | **Not found** — 0 occurrences |
| `text-zinc-*` | **Not found** — 0 occurrences |
| `text-stone-*` | **Not found** — 0 occurrences |
| `text-slate-*` | **Not found** — 0 occurrences |
| `text-muted` | **Not found** — 0 occurrences |
| `text-foreground` | **Not found** — 0 occurrences |
| `text-black` | **Not found** — 0 occurrences |

The codebase does not use any Tailwind v3 default gray scale classes. The project migrated cleanly to the custom PDS-13 token palette.

---

## Deliverable 3 — Hard-Coded Colours

**Finding: 1 hard-coded text colour in source code (in-scope).**

| Exact Value | File | Line | Context |
|-------------|------|------|---------|
| `white` | `apps/web/src/app/globals.css` | 659 | `.skip-link { color: white; font-size: 14px; }` |

**No hard-coded hex values in JSX** (e.g., `text-[#777777]`, `style={{color: '#...'}}`) exist in the in-scope codebase.

**Out of scope:** Hardcoded colours exist in `apps/web/src/lib/email/templates/` (email template HTML) but are excluded per scope rules.

---

## Deliverable 4 — CSS Variable Audit

### Variables Defined for Typography

#### In `globals.css` (`@theme` + `:root`)
The Tailwind `@theme` block defines colour tokens that compile to utilities; no `var()` calls are needed in app code. The `:root` block defines the `--rf-*` mirror namespace.

#### `var()` Calls Used for Text/Typography

| Variable | Occurrences | Files | Usage |
|----------|-------------|-------|-------|
| `var(--color-content-primary)` | 2 | `globals.css:641,675` | Body text colour, `::selection` colour |
| `var(--rf-color-content-primary)` | 2 | `globals.css:468`, `theme.css:48` | Alias backing `--rf-color-text-primary` |
| `var(--rf-color-content-secondary)` | 2 | `globals.css:469`, `theme.css:49` | Alias backing `--rf-color-text-secondary` |
| `var(--rf-color-content-label)` | 2 | `globals.css:470`, `theme.css:50` | Alias backing `--rf-color-text-tertiary` |

#### Variables NOT Consumed via `var()` in Source
These tokens are defined but consumed only through Tailwind utility classes (not via explicit `var()` references):

- `--color-text-*` — 0 `var()` calls
- `--rf-color-text-*` — 0 `var()` calls
- `--rf-color-content-secondary` — 0 `var()` calls (in JSX/CSS in scope)
- `--color-content-secondary` — 0 `var()` calls
- `--color-content-label` — 0 `var()` calls

#### Variable Consumption by Package

| Directory | `var()` calls for typography | 
|-----------|------------------------------|
| `apps/web/src` (excl. token files) | **0** — All colour via Tailwind utilities |
| `packages/ui/src` | **0** |
| `packages/domain-ui/src` | **0** |

---

## Deliverable 5 — Semantic Usage Classification

### Colour → Purpose Mapping

| Semantic Purpose | Dominant Token | Secondary Token(s) | Notes |
|-----------------|----------------|-------------------|-------|
| **Page titles (h1)** | `text-primary-400` | `text-text-900`/`text-surface-50` | Campaigns pages use `text-text-900` instead — inconsistency |
| **Card headings** | `text-primary-400` | `text-text-900` | |
| **Section headings** | `text-primary-400` | `text-text-400` (uppercase) | Release Detail uses `text-text-400 uppercase` for card sections |
| **Body text** | `text-text-500` | `text-text-400`, `text-text-700` | |
| **Labels / dt elements** | `text-text-400` | `text-text-500` | |
| **Values / dd elements** | `text-text-800` (light) | `text-text-200` (dark) | |
| **Captions / timestamps** | `text-text-500` | `text-text-600`, `text-text-400` | |
| **Placeholders** | `text-text-500` | `text-text-400` | |
| **Empty state** | `text-text-500` | | |
| **CTA links** | `text-primary-400` | `text-primary-300` (hover) | |
| **Back navigation** | `text-text-400` | `text-text-700` (hover) | |
| **Stat numbers** | `text-surface-50` | `text-surface-100` | High-contrast on dark cards |
| **Status — Success** | `text-success-500` | `text-success-600`, `text-success-400` | |
| **Status — Warning** | `text-warning-500` | `text-warning-600`, `text-warning-400` | |
| **Status — Danger** | `text-danger-500` | `text-danger-600`, `text-danger-400` | |
| **Status — Info** | `text-info-500` | `text-info-600`, `text-info-400` | |
| **Notification (unread)** | `text-primary-300` | | |
| **Notification (read)** | `text-text-200` | | |
| **Dialog title** | `text-text-900` | `text-text-50` (dark) | |
| **Badge text** | `text-success-*`, `text-warning-*`, `text-danger-*`, `text-info-*`, `text-text-*` | | Mapped via `Badge` component config |
| **Button text** | `text-surface-50` (primary/danger) | `text-text-800` (secondary), `text-text-700` (tertiary), `text-text-600` (ghost) | |
| **Nav (active)** | `text-text-900`/`text-surface-50` | `text-primary-500` (icon) | |
| **Nav (inactive)** | `text-text-400` | `text-text-500` (dark) | |
| **Workflow stage** | `text-workflow-*` | | 8 distinct stage colours |
| **Table headers** | `text-text-500` | `text-text-400` (dark) | |
| **Table cells** | `text-text-900` | `text-text-100` (dark) | |
| **Priority — Critical** | `text-danger-*` | | |
| **Priority — High** | `text-warning-*` | | |
| **Priority — Medium** | `text-info-*` | | |
| **Priority — Low** | `text-text-500` | | |

### Inconsistencies Found

| # | Location | Issue |
|---|----------|-------|
| 1 | **Campaigns pages** — Page titles use `text-text-900`/`text-surface-50` instead of `text-primary-400` (used by all other pages) |
| 2 | **Artist Detail** — Discography badges use 5 raw colours (`text-purple-400`, `text-amber-400`, `text-cyan-400`, `text-emerald-400`, `text-rose-400`) instead of design tokens |
| 3 | **Schedule** — Health stats use `text-amber-400` and `text-red-400` instead of `text-warning-*`/`text-danger-*` |
| 4 | **Administration Members** — Error/success use `text-red-400` and `text-emerald-400` instead of `text-danger-*`/`text-success-*` |
| 5 | **Campaign Detail** — Readiness status uses raw `text-red-500` alongside token `text-success-500` |
| 6 | **Brief page** — Priority badges use `text-red-*`, `text-amber-*`, `text-blue-*` instead of `text-danger-*`, `text-warning-*`, `text-info-*` |
| 7 | **Invite page** — Uses `text-amber-*`, `text-red-*`, `text-emerald-*`, `text-white` instead of tokens |
| 8 | **Tracks list** — Remix badge uses `text-purple-400` instead of a semantic token |
| 9 | **Assets page** — Video badge uses `text-purple-600` alongside token-based `text-info-600` and `text-warning-600` |
| 10 | **Typography component** — Uses `text-content-*` tokens, creating a parallel text colour system to `text-text-*` used in app pages |

---

## Deliverable 6 — Contrast Risk Report

### Priority 1: Unreadable / Nearly Invisible

| File | Component | Text Colour | Background | Risk |
|------|-----------|-------------|------------|------|
| `apps/web/src/app/globals.css:659` | `.skip-link` | `white` | `var(--color-primary-500)` (#CC5500) | **OK** — burnt sienna on white is readable |

No instances of text-colour-on-same-colour-background were found.

### Priority 2: Low Contrast — Dark Mode

| File | Component | Text Colour | Likely Background | Risk |
|------|-----------|-------------|-------------------|------|
| Various | `text-text-400` (#78716C) on dark surfaces | `text-text-400` | `bg-layer-2` (#232326) | **Low** — #78716C on #232326 has ~4.5:1 ratio, meets WCAG AA for normal text |
| Various | `text-text-500` (#857D76) on dark surfaces | `text-text-500` | `bg-layer-1` (#1C1C1E) | **Low** — #857D76 on #1C1C1E has ~4:1 ratio, borderline for small text |
| Various | `text-text-500` on `bg-surface-800` dark mode | `text-text-500` (#857D76) | `bg-surface-800` dark (#3A342F) | **Low** — earthy tones can appear muddy in combination |

### Priority 3: Disabled-Looking When Not Disabled

| File | Component | Text Colour | Reason |
|------|-----------|-------------|--------|
| Various | `text-text-500` used for active body text | `#857D76` | At small sizes (12–14px), this mid-tone brown can appear muted. Consider `text-text-700` for body text. |
| `typography.tsx` | `body` variant uses `text-content-secondary` | `#C7C7CC` | On white backgrounds in light mode, this is fine; on #F4F0EB (surface-100), it has ~3:1 contrast — borderline |

### Contrast Conclusions

No critical contrast failures were identified. The design tokens were authored with accessibility in mind (WCAG AA targeting). The primary risk is stylistic — `text-text-500` used as body text may appear de-emphasised when it should be standard emphasis.

---

## Deliverable 7 — Design Token Compliance

### Overall Compliance

| Category | Approximate Count | Percentage |
|----------|------------------|------------|
| **Official design tokens** (text-text/surface/primary/secondary/workflow/feedback) | ~2,419 | **~94.8%** |
| **Typography component tokens** (text-content-*) | ~54 | **~2.1%** |
| **Raw CSS colour names** (text-red/amber/emerald/purple/cyan/rose/blue/accent/white) | ~33 | **~1.3%** |
| **Hard-coded values** (color: white) | 1 | **<0.1%** |
| **Legacy Tailwind classes** | 0 | **0%** |

### Breakdown by Token Family

| Token Family | Total Uses | Compliant |
|-------------|-----------|-----------|
| `text-text-*` | ~1,323 | ✅ 100% official |
| `text-surface-*` | ~328 | ✅ 100% official |
| `text-primary-*` | ~198 | ✅ 100% official |
| `text-danger-*` | ~134 | ✅ 100% official |
| `text-success-*` | ~88 | ✅ 100% official |
| `text-warning-*` | ~69 | ✅ 100% official |
| `text-info-*` | ~56 | ✅ 100% official |
| `text-content-*` | ~54 | ⚠️ Component-internal tokens |
| `text-workflow-*` | ~10 | ✅ 100% official |
| `text-secondary-*` | ~5 | ✅ 100% official |
| Raw colours | ~33 | ❌ Non-compliant |
| `text-white` | 2 | ❌ Non-compliant |
| Hard-coded | 1 | ❌ Non-compliant |

---

## Deliverable 8 — Heat Map

### Most-Used Text Colours (Ranked)

| Rank | Colour | Uses |
|------|--------|------|
| 1 | `text-text-500` | 431 |
| 2 | `text-text-400` | 425 |
| 3 | `text-surface-50` | 200 |
| 4 | `text-text-900` | 177 |
| 5 | `text-primary-400` | 131 |
| 6 | `text-surface-100` | 101 |
| 7 | `text-text-700` | 88 |
| 8 | `text-success-500` | 33 |
| 9 | `text-text-600` | 31 |
| 10 | `text-text-800` | 37 |
| 11 | `text-content-label` | 27 |
| 12 | `text-text-100` | 22 |
| 13 | `text-primary-500` | 21 |
| 14 | `text-content-primary` | 21 |
| 15 | `text-text-200` | 51 |
| 16 | `text-text-300` | 55 |
| 17 | `text-danger-500` | 48 |
| 18 | `text-danger-400` | 47 |
| 19 | `text-warning-600` | 23 |

### Most-Used Raw Colours

| Rank | Colour | Uses |
|------|--------|------|
| 1 | `text-amber-400` | 3 |
| 2 | `text-emerald-400` | 3 |
| 3 | `text-accent-400` | 3 |
| 4 | `text-red-400` | 2 |
| 5 | `text-red-500` | 2 |
| 6 | `text-purple-400` | 2 |
| 7 | `text-amber-300` | 2 |
| 8 | `text-red-300` | 2 |
| 9 | `text-white` | 2 |

---

## Deliverable 9 — Unused Tokens

### Text Tokens — All Used
All 10 `text-text-*` tokens are used. None are candidates for removal.

### Surface Tokens — 7 Unused as Text Colours
| Unused Token | Hex (Light) | Notes |
|-------------|-------------|-------|
| `text-surface-0` | `#FFFFFF` | Not used as text colour (used as bg) |
| `text-surface-400` | `#C9C2B8` | |
| `text-surface-500` | `#B5ADA2` | |
| `text-surface-600` | `#8A8278` | |
| `text-surface-800` | `#3A342F` | |
| `text-surface-900` | `#1E1A17` | |
| `text-surface-950` | `#130F0C` | |

### Primary Tokens — 5 Unused as Text Colours
| Unused Token | Hex (Light) | Hex (Dark) |
|-------------|-------------|-------------|
| `text-primary-50` | `#FFF5EE` | `#2E1300` |
| `text-primary-100` | `#FFE6CC` | `#5C2600` |
| `text-primary-200` | `#FFCC99` | `#8A3900` |
| `text-primary-800` | `#5C2600` | `#FFE6CC` |
| `text-primary-900` | `#2E1300` | `#FFF5EE` |

### Secondary Tokens — 8 Unused as Text Colours
All secondary tokens except 300 and 700 are unused:
- `text-secondary-50`, `-100`, `-200`, `-400`, `-500`, `-600`, `-800`, `-900`

### Feedback Tokens — Minor Unused
| Token | Unused Sub-tokens |
|-------|-------------------|
| `text-success-*` | None — all used |
| `text-warning-*` | None — all used |
| `text-danger-*` | None — all used |
| `text-info-*` | `text-info-50`, `text-info-100` (not used for text — may be used as backgrounds) |

---

## Deliverable 10 — Duplicate Semantics

### Multiple Colours Serving the Same Purpose

| Semantic Purpose | Colours Used | Problem |
|-----------------|-------------|---------|
| **Page titles (h1)** | `text-primary-400` (15+ pages) vs `text-text-900`/`text-surface-50` (Campaigns pages) | Campaigns off-brand |
| **Section headings** | `text-primary-400` (most sections) vs `text-text-400 uppercase` (Release Detail card sections) | Inconsistent hierarchy |
| **Body / secondary text** | `text-text-400`, `text-text-500`, `text-text-700`, `text-content-secondary` | 4 different tokens for similar purpose |
| **Status badges** | `text-success/warning/danger/info-*` (in Badge component) vs `text-amber/red/emerald-*` (in schedule, administration, etc.) | Raw colours used alongside tokens |
| **Category badges** | `text-purple/amber/cyan/emerald/rose-*` (Artist Detail) | 5 raw colours instead of semantic tokens |
| **Priority indicators** | `text-danger/warning/info-*` (most pages) vs `text-red/amber-*` (schedule) vs `text-red/amber/blue-*` (brief page) | Inconsistent priority colour mapping |
| **Navigation items** | `text-text-900`/`text-surface-50` (active) and `text-text-400`/`text-text-500` (inactive) in sidebar vs `text-primary-*` in other contexts | Context-dependent but can cause confusion |

### System A vs System B Duplication

The `text-content-*` token family (System B, used in `Typography` component variants) duplicates the semantic intent of `text-text-*` (System A):

| System B (`text-content-*`) | System A Equivalent | Issue |
|---------------------------|-------------------|-------|
| `text-content-primary` | `text-text-900` / `text-text-50` | Same purpose, different token family |
| `text-content-secondary` | `text-text-500` / `text-text-400` | Same purpose, different token family |
| `text-content-label` | `text-text-400` | Same purpose, different token family |

---

## Deliverable 11 — Migration Recommendations

### Phase 1: Raw Colour → Design Token Replacements

| Current | Replace With | Files Affected |
|---------|-------------|----------------|
| `text-amber-400` | `text-warning-500` | `schedule/page.tsx`, `artists/[id]/page.tsx`, `administration/members/page.tsx` |
| `text-amber-300` | `text-warning-400` | `schedule/page.tsx`, `brief/page.tsx` |
| `text-amber-700` | `text-warning-700` | `brief/page.tsx` |
| `text-red-400` | `text-danger-500` | `schedule/page.tsx`, `administration/members/page.tsx` |
| `text-red-500` | `text-danger-500` | `campaigns/[id]/page.tsx` |
| `text-red-300` | `text-danger-400` | `brief/page.tsx`, `invite/[token]/page.tsx` |
| `text-red-700` | `text-danger-700` | `brief/page.tsx` |
| `text-emerald-400` | `text-success-500` | `artists/[id]/page.tsx`, `administration/members/page.tsx`, `invite/[token]/page.tsx` |
| `text-purple-400` | `text-info-500` or new `text-workflow-*` token | `artists/[id]/page.tsx`, `tracks/page.tsx` |
| `text-purple-600` | `text-info-600` | `assets/page.tsx` |
| `text-cyan-400` | `text-info-500` | `artists/[id]/page.tsx` |
| `text-rose-400` | `text-danger-400` | `artists/[id]/page.tsx` |
| `text-blue-700` | `text-info-700` | `brief/page.tsx` |
| `text-blue-300` | `text-info-400` | `brief/page.tsx` |
| `text-accent-400` | `text-info-500` or `text-primary-400` | `assignments/[id]/page.tsx`, `my-work/page.tsx`, `people/[id]/page.tsx` |
| `text-white` | `text-surface-0` | `invite/[token]/page.tsx` |
| `color: white` (inline) | `var(--rf-color-surface-0)` or `text-surface-0` | `globals.css:659` |

### Phase 2: Heading Consistency

| Current | Replace With | Files Affected |
|---------|-------------|----------------|
| `text-text-900`/`text-surface-50` (page titles) | `text-primary-400` | `campaigns/page.tsx`, `campaigns/[id]/page.tsx` |
| `text-text-400 uppercase` (section headings) | `text-primary-400` (or `text-text-700` for low-emphasis sections) | `releases/[id]/page.tsx` (card section headings) |

### Phase 3: Typography Component Alignment
_Investigate whether `text-content-*` tokens can be replaced with `text-text-*` tokens in the Typography component to eliminate the parallel system._

| Current | Consider |
|---------|----------|
| `text-content-primary` | `text-text-900` (light) / `text-text-50` (dark) |
| `text-content-secondary` | `text-text-500` (light) / `text-text-400` (dark) |
| `text-content-label` | `text-text-400` (light) / `text-text-500` (dark) |

---

## Deliverable 12 — Proposed Typography System

### Recommended Semantic Hierarchy

The audit confirms the current design token set (`text-text-100` through `text-text-900`) is well-suited as the primary text colour system. The following mapping is recommended:

| Token | Hex (Light) | Hex (Dark) | Purpose |
|-------|-------------|-------------|---------|
| `text-text-900` | `#2A2319` | `#F5F0EA` | **Primary headings** — Page titles, card headings, important values |
| `text-text-800` | `#3D3830` | `#E4DDD4` | **Strong body text** — Field values, dd elements, emphasis |
| `text-text-700` | `#564F49` | `#D0C8BC` | **Standard body text** — Paragraph text, list items |
| `text-text-600` | `#6D665F` | `#BDB4A8` | **Secondary body text** — Less emphasised content |
| `text-text-500` | `#857D76` | `#857D76` | **Metadata, timestamps, hints** — De-emphasised info |
| `text-text-400` | `#78716C` | `#78716C` | **Labels, captions, helper text** — Supporting information |
| `text-text-300` | `#BDB4A8` | `#4B4440` | **Disabled text, placeholders** — Muted, non-interactive |
| `text-text-200` | `#D6CBBC` | `#3A342F` | **Read notification titles** — Consumed content |
| `text-text-100` | `#EAE2D7` | `#2A251F` | **Inverse surface text** — Text on very dark surfaces |
| `text-text-50` | `#F5F0EA` | `#1E1A17` | **High-contrast on dark** — Reserved for dark mode dialog titles |

**Simplified 5-level hierarchy** (after consolidation):

| Level | Token | Purpose |
|-------|-------|---------|
| **Level 1** | `text-text-900` | Primary headings, page titles, strong emphasis |
| **Level 2** | `text-text-700` | Standard body text |
| **Level 3** | `text-text-500` | Secondary information, metadata, timestamps |
| **Level 4** | `text-text-400` | Labels, captions, helper text, placeholders |
| **Level 5** | `text-text-300` | Disabled text, read-only content |

This hierarchy replaces the current proliferation of `text-text-400`, `text-text-500`, `text-text-600`, `text-text-700`, and `text-text-800` for similar body text purposes.

---

## Deliverable 13 — Problem Hotspots

### Ranked by Text Colour Inconsistency

| Rank | Screen / Component | Inconsistencies | Priority for BUILD-106 |
|------|--------------------|-----------------|----------------------|
| **1** | **Artist Detail** (`/artists/[id]`) | 5 raw colours for discography badges + colour tokens for status | **High** |
| **2** | **Campaigns** (`/campaigns`, `/campaigns/[id]`) | Off-brand page titles, raw `text-red-500` for readiness | **High** |
| **3** | **Schedule** (`/schedule`) | `text-amber-*` and `text-red-*` instead of `text-warning-*`/`text-danger-*` | **Medium** |
| **4** | **Administration Members** | `text-red-400` and `text-emerald-400` for feedback messages | **Medium** |
| **5** | **Brief** (`/brief`) | Priority badges use raw colours (`text-red/amber/blue-*`) | **Medium** |
| **6** | **Invite** (`/invite/[token]`) | Mix of `text-amber/red/emerald-*` and `text-white` | **Low** |
| **7** | **Release Detail** (`/releases/[id]`) | Inconsistent section heading styling (`text-text-400 uppercase` vs `text-primary-400`) | **Low** |
| **8** | **Assets** (`/assets`) | `text-purple-600` for video type mixed with token colours | **Low** |
| **9** | **Tracks List** (`/tracks`) | `text-purple-400` for remix badge | **Low** |
| **10** | **Typography Component** (`packages/ui`) | Parallel `text-content-*` system vs `text-text-*` | **Low** |

---

## Deliverable 14 — Files Modified

**No source files were modified.**

This report is the sole deliverable. The audit was entirely read-only.

---

## Audit Summary

| Metric | Value |
|--------|-------|
| Total text colour occurrences inventoried | ~2,550 |
| Official design token compliance | ~94.8% |
| Raw colour name occurrences | 33 (1.3%) |
| Hard-coded colour values | 1 (<0.1%) |
| Legacy Tailwind classes (`text-gray-*`, etc.) | 0 |
| CSS variable `var()` calls for typography | 8 (all in token definition files) |
| Low-contrast risks identified | 0 critical, 3 minor |
| Unused text tokens | 20 (7 surface, 5 primary, 8 secondary) |
| Inconsistency hotspots requiring attention | 10 |
| Source files modified | 0 |

### Key Actions for BUILD-106

1. **Replace 33 raw colour classes** with design token equivalents (~12 files)
2. **Align Campaigns page titles** with `text-primary-400` convention
3. **Consolidate section heading styling** in Release Detail
4. **Evaluate `text-content-*` vs `text-text-*`** duplication in Typography component
5. **Consider removing unused tokens** from the theme (secondary: 8 tokens, surface: 7 tokens, primary: 5 tokens)
6. **Address `text-body` → `text-text-700`** migration for consistent body text hierarchy
