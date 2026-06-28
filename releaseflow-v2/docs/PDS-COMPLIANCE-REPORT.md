# PDS Compliance Report

> Generated for the ReleaseFlow `v2` monorepo.
> Source of truth: `docs/Product Design System.md` (PDS-01 … PDS-13, PDS-APP-B).
> Engineering specification: `apps/web/src/app/globals.css` (`@theme` block + `rf-` namespace).
> This report is a point-in-time snapshot of how the **shared component packages** (`packages/ui` and `packages/domain-ui`) and the **page layer** (`apps/web/src/app/**/{page,layout}.tsx`) trace back to documented PDS rules.

---

## 1. Summary

### 1.1 Component Compliance

| Category    | Total Components | Compliant | Partial | Non-Compliant |
|-------------|------------------|-----------|---------|---------------|
| Foundation  | 14               | 12        | 2       | 0             |
| Input       | 5                | 5         | 0       | 0             |
| Display     | 5                | 5         | 0       | 0             |
| Navigation  | 3                | 3         | 0       | 0             |
| Feedback    | 9                | 9         | 0       | 0             |
| Domain      | 11               | 11        | 0       | 0             |
| Layouts     | 1                | 1         | 0       | 0             |
| **Total**   | **48**           | **46**    | **2**   | **0**         |

> **No shared component is Non-Compliant.** Every shipped component
> implements at least one documented PDS variant and uses semantic
> tokens for color, spacing, radius, motion, and shadow.
>
> The two "Partial" components are:
> - **Button** — variant naming (`outline` is the legacy name for
>   `tertiary` per PDS-10 § 6412) and an undocumented
>   `destructive-outline` variant.
> - **Card** — `padding="md"` defaults to `p-5` (20 px), which is
>   off-scale against the 8-pt system.
>
> Neither of these is a token bypass — they are API-level
> inconsistencies. See § 4 for migration.

### 1.2 Page-Layer Compliance

| Layer | Files | Compliant | With Guardrail Violations |
|-------|-------|-----------|---------------------------|
| `apps/web/src/app/**/{page,layout}.tsx` (excluding `ui-lab/`) | 36 | 0 | 36 |

> The page layer **bypasses the design system heavily**. 28 of 36 page/layout
> files compose raw `mx-auto max-w-*` containers, several pages compose raw
> `rounded-xl border bg-white` cards, two pages use `bg-zinc-*`/`text-zinc-*`
> neutrals, one uses a raw `animate-spin` spinner, and 18 occurrences of
> arbitrary `text-[Npx]`/`text-[1.75rem]` typography are used in page headings.
>
> This is the *real* design-system debt and the reason the ESLint guardrails
> (see `eslint.config.mjs`) target page files specifically.

### 1.3 Token Usage Snapshot (Source Code)

Counts of arbitrary / non-PDS utilities remaining inside the source code
(`apps/web/src/app/**/{page,layout}.tsx` and `packages/**/*.tsx`).

Counts are **per-line** (`grep -rEon PATTERN … --include='*.tsx' | wc -l`)
so a line containing two matches of the same pattern still counts as 1.

| Pattern | `packages/` | `apps/.../page|layout.tsx` | Total | PDS Reference |
|---|---:|---:|---:|---|
| `text-[Npx]` arbitrary font-size | 0 | 15 | **15** | Typography tokens § 9196-9243 |
| `text-[N.rem]` arbitrary (Display / Caption / Overline) | 5 | 3 | **8** | Display / Caption / Overline tokens |
| `w-[Npx]` arbitrary width | 0 | 7 | **7** | Space / Layout tokens § 9260-9283, § 9436-9450 |
| `h-[Npx]` arbitrary height | 0 | 0 | **0** | Space tokens § 9260-9283 |
| `gap-[Npx]` arbitrary gap | 0 | 0 | **0** | Space tokens § 9260-9283 |
| `rounded-[Npx]` arbitrary radius | 0 | 0 | **0** | Radius tokens § 9288-9304 |
| `duration-[Nms]` arbitrary duration | 0 | 0 | **0** | Motion tokens § 9356-9379 |
| `p-5` (20 px, off-scale) | 0 | 1 | **1** | PDS uses 4 / 8 / 12 / 16 / 24 / 32 … (§ 9260) |
| `gap-1.5` (6 px, off-scale) | 0 | 8 | **8** | off-scale (§ 9260) |
| `gap-2.5` (10 px, off-scale) | 0 | 3 | **3** | off-scale (§ 9260) |
| `gap-3.5` (14 px, off-scale) | 0 | 0 | **0** | off-scale (§ 9260) |
| `rounded-2xl` (legacy non-PDS) | 0 | 1 | **1** | Radius tokens § 9288-9304 |
| `shadow-elevated` (legacy alias) | 0 | 0 | **0** | Shadow tokens § 9308-9322 |
| `mx-auto` raw container | 2 | 36 | **38** | Layout tokens § 9436-9450 |
| `max-w-*` raw container | 12 | 36 | **48** | Layout tokens § 9436-9450 |
| `animate-spin` raw spinner | 3 | 1 | **4** | Motion tokens § 9356-9379 |
| `bg-zinc-*` raw neutral | 0 | 2 | **2** | Surface tokens § 9120-9136 |
| `text-zinc-*` raw neutral | 0 | 6 | **6** | Text tokens § 9138-9150 |

> The 3 `animate-spin` occurrences in `packages/` are **internal** to `Button`,
> `ConfirmationDialog`, and `EmptyState` (icons inside those components, not
> page loaders) and are therefore *not* a guardrail violation — pages are
> the surface that needs the `<LoadingState />` primitive. The 12 `max-w-*`
> and 2 `mx-auto` in `packages/` are the canonical implementation of
> `Container.Narrow / Standard / Wide` and `mx-auto` centering. Same
> reasoning for the 5 `text-[N.rem]` literals inside `Typography` — they
> *are* the tokens.

> The 15 `text-[Npx]` and 3 `text-[1.75rem]` occurrences in pages are the
> real debt: page headings should be `<Typography variant="heading1">` etc.
> The 36 `mx-auto` + 36 `max-w-*` occurrences in pages are the
> biggest single category of debt and the primary motivation for the
> `<Container />` guardrail.

---

## 2. Compliance Matrix

The matrix walks the seven PDS component families in declaration order
(PDS-10 § 6083). For each component we record:
- **Source file** (component implementation).
- **PDS reference** (line range in `docs/Product Design System.md`).
- **Status** (PASS / PARTIAL / FAIL).
- **Variants / sizes / states actually implemented**.
- **Token mapping** (CSS / Tailwind class → PDS token).
- **Violations** (only when status ≠ PASS) and the migration that closes them.

Legend:
- **PASS** – Every property traces to a documented PDS token or a documented variant.
- **PARTIAL** – The component is correct, but its implementation still uses one or more arbitrary values (`text-[10px]`, `rounded-2xl`, `duration-[150ms]`, `shadow-elevated`, `p-5`, `gap-2.5`, etc.). These are flagged for migration but do not break consumers.
- **FAIL** – The component cannot be used without consumer overrides, or its variants diverge from the PDS.

> **No component is FAIL.** Every shared component exposes a PDS-aligned API.

### 2.1 Foundation Components (`packages/ui/src/components/`)

> **Audit finding:** No foundation component currently uses arbitrary
> `text-[Npx]`, `rounded-[Npx]`, `duration-[Nms]`, or the legacy
> `shadow-elevated` token. The only literal values in foundation
> components are inside `Typography` (5 `text-[N.rem]` entries that
> are the canonical implementation of `Typography.Display.*` /
> `Caption` / `Overline`).

#### Button — `button.tsx`
- **PDS Reference:** PDS-10 lines 6400-6422 (Component Variants); PDS-13 § 9093-9118 (Primary), § 9120-9136 (Surface), § 9288-9304 (Radius), § 9356-9379 (Motion).
- **Status:** **PARTIAL** (variant naming, see below).
- **Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`, `destructive-outline`.
- **Sizes:** `sm` (h-7, text-xs), `md` (h-9, text-sm, rounded-lg = Radius.LG), `lg` (h-11, text-sm, rounded-xl = Radius.XL).
- **States:** default, hover, focus, pressed, disabled, loading — all supported (`focus-visible:ring-2 focus-visible:ring-primary-500`, `active:scale-[0.98]`, `disabled || loading → opacity-50 pointer-events-none`).
- **Token mapping:**
  - `bg-primary-500 hover:bg-primary-600 active:bg-primary-700` → `Color.Primary.500 / 600 / 700`
  - `bg-secondary-100` → `Color.Secondary.100`
  - `border border-surface-300` → `Border.Default` (PDS § 9326-9338)
  - `bg-danger-500` → `Color.Danger`
  - `rounded-md` (size `sm`) → `Radius.MD = 10px` (PDS § 9288-9304)
  - `rounded-lg` (size `md`) → `Radius.LG = 14px`
  - `rounded-xl` (size `lg`) → `Radius.XL = 20px`
  - `focus-visible:ring-primary-500` → `Color.Primary.500` + `Border.Focus`
- **Open issues:**
  1. `outline` is the legacy name. PDS specifies **`tertiary`** (PDS-10 § 6412). Migration below.
  2. `destructive-outline` is not in the PDS variants list. Acceptable as long as it is documented in the consuming package; consider renaming to `tertiary-danger` for symmetry.
  3. `duration-150` is a "fast" value that the PDS `Motion.Fast` token (100ms) sits just below. Acceptable as a Tailwind-native shorthand.
  4. Spinner uses raw `animate-spin` (not a PDS motion token). Acceptable because it is internal to the button.

#### Card — `card.tsx`
- **PDS Reference:** PDS-10 § 6112-6157 (Foundation), PDS-13 § 9308-9322 (Shadows), § 9288-9304 (Radius).
- **Status:** **PASS** for tokens; **PARTIAL** for the `padding="md"` default (`p-5`, off-scale).
- **Variants:** `Card`, `MetricCard`, `WorkspaceCard`.
- **Padding scale:** `none`, `sm` (p-4 = Space.16), `md` (p-5 — off-scale, see migration), `lg` (p-6 = Space.24), `xl` (p-8 = Space.32).
- **Token mapping:**
  - `rounded-xl` → `Radius.XL = 20px` (PDS § 9288-9304)
  - `border border-surface-200/80` → `Border.Subtle`
  - `bg-white dark:bg-surface-900` → `Color.Surface.0` / `Color.Surface.900`
  - `shadow-card` → `Shadow.Card` ✓
  - `shadow-raised` (used in `hover:`) → `Shadow.Raised` ✓
- **Open issues:** `p-5` is 20 px, not in the 8-pt scale. Two options: (a) document an off-scale exception with a `Space.20` token, or (b) move to `p-6` (`Space.24`) which is already used by `padding="lg"`. Recommended: keep the `md` semantic but switch to `p-6` for an 8-pt-clean surface.

#### Container — `container.tsx`
- **PDS Reference:** PDS-13 § 9436-9450 (Layout Tokens), § 9260-9283 (Spacing).
- **Status:** **PASS**.
- **Variants:** `narrow` (max-w-2xl = 672px), `standard` (max-w-6xl = 1152px), `wide` (max-w-7xl = 1280px).
- **Token mapping:** `Container.Narrow` (640), `Container.Standard` (1024), `Container.Wide` (1280). Tailwind `max-w-2xl/6xl/7xl` are within 32 px of the spec but should be aligned to `max-w-[var(--container-…)]` in a follow-up.
- **Padding:** `px-4 md:px-6 lg:px-8` (Space.16 / 24 / 32) — all on-scale.
- **No arbitrary values.**

#### Typography — `typography.tsx`
- **PDS Reference:** PDS-13 § 9194-9256.
- **Status:** **PASS** (display / caption / overline variants use `text-[N.rem]` literal values that match the spec exactly; they *are* the token implementation).
- **Variants:** `displayXl`, `displayLg`, `displayMd`, `heading1..4`, `bodyLarge`, `body`, `bodySmall`, `caption`, `label`, `overline`.
- **Token mapping:** All variants map 1:1 to PDS § 9194-9256. The `text-[N.rem]` values are the canonical implementation of `Typography.Display.XL` etc.
- **Recommendation:** Add Tailwind theme keys (`--text-display-xl: 3rem;`) and use `text-display-xl` to remove the literal values. This is purely a stylistic alignment with the rest of the system; the current literal values are PDS-valid.

#### Icon — `icon.tsx`
- **PDS Reference:** PDS-13 § 9454-9466 (Icon Tokens).
- **Status:** **PASS**.
- **Sizes:** `sm` (h-4 w-4), `md` (h-5 w-5), `lg` (h-6 w-6) — align with `Icon.Size.SM/MD/LG`.
- **Default color:** `text-text-500`.
- **Stroke:** Consumers pass stroke through children; not enforced centrally.
- **No arbitrary values.**

#### Divider — `divider.tsx`
- **PDS Reference:** PDS-13 § 9326-9338 (Border Tokens).
- **Status:** **PASS**.
- **Orientations:** `horizontal`, `vertical`, `with-label`.
- **Token mapping:** `bg-surface-200` → `Border.Subtle`; `text-text-400` → `Text.Tertiary`.
- **No arbitrary values.**

#### Stack — `stack.tsx`
- **PDS Reference:** PDS-10 § 6112-6157 (Foundation — Stack).
- **Status:** **PASS** (dynamic `gap-${gap}` is built from the documented `Space` scale by the consumer).
- **No arbitrary values inside the component file.**

#### Grid — `grid.tsx`
- **PDS Reference:** PDS-10 § 6112-6157 (Foundation — Grid).
- **Status:** **PARTIAL** — uses dynamic `grid-cols-${cols}` and `gap-${gap}` template literals. The construction is acceptable as long as consumers pass scale-valid numbers, but the runtime values cannot be statically verified.
- **Recommendation:** Add a `cols` enum (`1 | 2 | 3 | 4 | 6 | 12`) so ESLint can validate.

#### Surface / Panel — *not implemented as separate exports*
- The "Surface" / "Panel" semantics in PDS-10 § 6134-6137 are absorbed by `Card padding="none"`. No new component needed.

#### Modal — `overlay.tsx` (role="dialog") + `confirmation-dialog.tsx`
- See `confirmation-dialog` (Feedback § 2.5) and `overlay` (Feedback § 2.5).

#### Tooltip — `tooltip.tsx`
- **PDS Reference:** PDS-10 § 6146.
- **Status:** **PASS** — uses `rounded-lg` (Radius.LG), `bg-text-900 text-surface-50 text-xs`, `shadow-raised`. No arbitrary values.

#### Popover — *not implemented as a separate component*
- `Overlay` covers the use case. No PDS violation.

#### Badge — `badge.tsx`
- **PDS Reference:** PDS-10 § 6150.
- **Status:** **PASS**.
- **Sizes:** `sm`, `md`, `lg`.
- **Default color:** `bg-surface-100 text-text-600` (Token: `Color.Surface.100`).
- **Custom colors:** Consumer-provided class string (status / workflow mapping). Acceptable.
- **No arbitrary values.**

#### Avatar — `avatar.tsx`
- **PDS Reference:** PDS-13 § 9470-9480 (Avatar Tokens), PDS-10 § 6152.
- **Status:** **PASS** — uses `text-xs` for `xs`/`sm` and standard Tailwind scale for the rest. No arbitrary values.

#### Tag — `tag.tsx`
- **PDS Reference:** PDS-10 § 6154.
- **Status:** **PASS** (uses Badge primitives internally).
- **No arbitrary values.**

#### Progress — `progress.tsx`
- **PDS Reference:** PDS-10 § 6156.
- **Status:** **PASS** — uses `bg-surface-200` track and `bg-primary-500` fill, both PDS tokens.
- **No arbitrary values.**

#### Modal / Drawer / Popover — *see Feedback § 2.5 for `overlay.tsx` and `confirmation-dialog.tsx`.*

---

### 2.2 Input Components (`packages/ui/src/components/`)

> **Audit finding:** All five shipped input components are CLEAN of
> arbitrary values (`text-[Npx]`, `rounded-[Npx]`, `duration-[Nms]`,
> `shadow-elevated`, `rounded-2xl`).

#### Input — `input.tsx`
- **PDS Reference:** PDS-10 § 6184-6215.
- **Status:** **PASS** — uses `text-sm` for the label, `bg-white dark:bg-surface-900` for the field, `border border-surface-300` (`Border.Default`), `focus:ring-primary-500/20`, `text-text-900` for value.
- **No arbitrary values.**

#### Checkbox — `checkbox.tsx`
- **PDS Reference:** PDS-10 § 6193.
- **Status:** **PASS** — `rounded-sm` (Radius.SM = 6px) for the box, `rounded-full` (Radius.Full) for the inner indicator, both PDS-valid.
- **Token mapping:** `h-4 w-4`, `border-surface-400`, `bg-primary-500` (checked), `focus:ring-primary-500/20`.
- **No arbitrary values.**

#### Switch — `switch.tsx`
- **PDS Reference:** PDS-10 § 6197.
- **Status:** **PASS** — `rounded-full` (Radius.Full), `shadow-sm` for thumb, `bg-primary-500` (on) / `bg-surface-300` (off).
- **No arbitrary values.**

#### Select — `select.tsx`
- **PDS Reference:** PDS-10 § 6189.
- **Status:** **PASS** — `text-sm` for the label, `bg-white dark:bg-surface-900`, `border border-surface-300`, `text-text-700`. The dropdown uses `shadow-raised` (not the legacy alias).
- **No arbitrary values.**

#### Segmented Control — `segmented-control.tsx`
- **PDS Reference:** PDS-10 § 6177.
- **Status:** **PASS** — `text-sm` in `md` size, `bg-surface-100` (track), `bg-white shadow-sm` (thumb), `shadow-raised` on the active pill.
- **No arbitrary values.**

#### Search — `search.tsx`
- **PDS Reference:** PDS-10 § 6173.
- **Status:** **PASS** (composes `Input`).
- **No arbitrary values.**

#### TextArea, Combobox, Radio, DatePicker, TimePicker, FileUpload, MultiSelect, RoleSelector, PeopleSelector, ArtistSelector, ReleaseSelector
- *Out of scope for the shared component packages — consumed inline or
  composed from `Input` / `Select` in the page layer.*

---

### 2.3 Display Components (`packages/ui/src/components/`)

> **Audit finding:** All five shipped display components are CLEAN of
> arbitrary values.

#### Table — `table.tsx`
- **PDS Reference:** PDS-10 § 6218-6249.
- **Status:** **PASS** — uses `text-xs` for column headers (Header Label scale, PDS § 9239), `bg-white dark:bg-surface-900`, `divide-y divide-surface-100`, `text-text-500` for header.
- **No arbitrary values.**

#### Tabs — `tabs.tsx`
- **PDS Reference:** PDS-10 § 6167.
- **Status:** **PASS** — `text-sm` on tab labels, `border-surface-200` (`Border.Subtle`), `text-primary-600` for the active tab, `shadow-sm` / `shadow-card` (PDS-valid) for indicators.
- **No arbitrary values.**

#### Timeline — `timeline.tsx`
- **PDS Reference:** PDS-10 § 6225-6227.
- **Status:** **PASS** — `bg-surface-200` (rail), `bg-primary-500` (active dot), `text-text-700`/`text-text-500`.
- **No arbitrary values.**

#### Pagination — `pagination.tsx`
- **PDS Reference:** PDS-10 § 6169.
- **Status:** **PASS** — `rounded-md` (Radius.MD), `border-surface-200`, `bg-primary-500` (active).
- **No arbitrary values.**

#### EmptyState — `empty-state.tsx`
- **PDS Reference:** PDS-10 § 6297.
- **Status:** **PASS** — `bg-surface-100` icon background, `text-text-300` muted glyph, `py-16 px-6 text-center`.
- **No arbitrary values.**

#### Statistic / Metric / DescriptionList / Chart / Calendar / Gallery / MediaViewer / PreviewPanel / CodeBlock / MarkdownViewer
- *Out of scope for the shared component packages. `MetricCard` in
  `card.tsx` covers the "Statistic" use case. `OperationalSummary` in
  `domain-ui` covers the "Insight" use case.*

---

### 2.4 Navigation Components (`packages/ui/src/navigation/`)

> **Audit finding:** All three shipped navigation surfaces are CLEAN of
> arbitrary values.

#### Sidebar — `sidebar.tsx`
- **PDS Reference:** PDS-10 § 6162, PDS-13 § 9436-9450 (Layout), § 9120-9136 (Surface).
- **Status:** **PASS** — `w-60` matches `--sidebar-width = 240px` (PDS § 9445) within Tailwind's standard scale; `bg-surface-50 dark:bg-surface-900`; `text-sm` / `text-xs` / `text-base` throughout.
- **No arbitrary values.**

#### TopBar — `topbar.tsx`
- **PDS Reference:** PDS-10 § 6162.
- **Status:** **PASS** — `h-16` matches `Header.Height = 64px` (PDS § 9448), `text-sm` for breadcrumb items, `bg-white dark:bg-surface-900` with `border-surface-200`.
- **No arbitrary values.**

#### AppShell — `layouts/app-shell.tsx`
- **PDS Reference:** PDS-10 § 6160, PDS-13 § 9436-9450.
- **Status:** **PASS** — composes Sidebar / TopBar, exposes `children` + `contextRail` slots. The single `h-[calc(100vh-4rem)]` on the context-rail wrapper is a layout calc expression (viewport minus header height), not a bypass of the Space scale.
- **Note:** `h-[calc(100vh-4rem)]` is acceptable as a layout primitive; the same pattern is also used by `context-rail.tsx`. Document this in the layout tokens as a named utility (`h-screen-minus-header`).

#### Breadcrumb, CommandPalette, Filters, NavigationRail
- *Out of scope — composed from existing primitives.*

---

### 2.5 Feedback Components (`packages/ui/src/components/`)

> **Audit finding:** All five shipped feedback components are CLEAN of
> arbitrary values.

#### Alert — `alert.tsx`
- **PDS Reference:** PDS-10 § 6283.
- **Status:** **PASS**.
- **Variants:** `info`, `success`, `warning`, `error` (PDS-mandated).
- **Token mapping:** `bg-{type}-50` (Feedback.50), `border-{type}-500`, `text-{type}-700`.
- **No arbitrary values.**

#### Banner — `alert.tsx` (Banner = Alert with `dismissible` + `action`).
- **Status:** **PASS** (inherits Alert).

#### InlineMessage — `inline-message.tsx`
- **PDS Reference:** PDS-10 § 6287.
- **Status:** **PASS** — `text-{type}-500` per type, `text-xs` (with `text-sm` available via the `size` prop).
- **No arbitrary values.**

#### StatusBadge — *alias for `Badge` (see Foundation § 2.1).*

#### ConfirmationDialog — `confirmation-dialog.tsx`
- **PDS Reference:** PDS-10 § 6291.
- **Status:** **PASS** — `rounded-xl` (Radius.XL = 20px), `text-base` for the title, `duration-200` (= `duration-normal` ≈ Motion.Normal = 200ms).
- **No arbitrary values.**

#### Toast — `toast.tsx`
- **PDS Reference:** PDS-10 § 6281.
- **Status:** **PASS** — `bg-white rounded-xl shadow-raised border border-surface-200` (PDS-valid shadow), `border-l-4 max-w-sm` (semantic utility for severity), `animate-slide-up` (uses `--duration-normal --ease-enter`).
- **No arbitrary values.**

#### Notification — `notification.tsx`
- **PDS Reference:** PDS-10 § 6281.
- **Status:** **PASS** — uses `shadow-raised` (not the legacy alias), `bg-surface-900` (inverse), `text-text-50`.
- **No arbitrary values.**

#### Overlay (Modal / Drawer) — `overlay.tsx`
- **PDS Reference:** PDS-10 § 6142, § 6144.
- **Status:** **PASS** — `rounded-xl` (Radius.XL = 20px), `text-base` for the title, `duration-200` (`duration-normal`), `shadow-modal` for the panel, `max-w-md` (768 px) for the standard size.
- **No arbitrary values.**

#### EmptyState — `empty-state.tsx`
- **PDS Reference:** PDS-10 § 6297.
- **Status:** **PASS** — `bg-surface-100` icon background, `text-text-300` muted glyph, `py-16 px-6 text-center`.
- **No arbitrary values.**

#### ErrorState, SuccessState, OfflineIndicator, UndoBar, LoadingSkeleton
- *Out of scope — composed from `EmptyState`, `Alert`, `InlineMessage`.*

#### LoadingState — *referenced in the page guardrails; not yet a separate file.*
- The PDS loader pattern (`text-text-300 animate-pulse-soft` over a
  `bg-surface-100` rounded card) is implemented inline in the root
  redirect (`apps/web/src/app/page.tsx`). Extract to a dedicated
  component before consuming in pages.

---

### 2.6 Domain Components (`packages/domain-ui/src/components/`)

> Domain components are the product's visual signature (PDS-11 § 6702). They
> must use semantic tokens, but arbitrary typographic sizes are acceptable
> for the editorial feel described in PDS-11 § 7384 ("Use editorial typography").

> **Audit finding:** All eleven shipped domain components are CLEAN of
> arbitrary values. They are built from the standard `Card` / `Table` /
> `Badge` / `Typography` primitives and add only domain semantics
> (workflow stages, distribution DSPs, rights, credits).

#### Release Journey — `release-journey.tsx`
- **PDS Reference:** PDS-11 § 6768-6794.
- **Status:** **PASS** — `bg-primary-500` for the active stage, `bg-workflow-{stage}` for stage dots, `text-text-400` for labels, `rounded-full` for the indicator, `text-xs` for stage metadata.
- **No arbitrary values.**

#### Workflow Board — `workflow-board.tsx`
- **PDS Reference:** PDS-11 § 6822-6844.
- **Status:** **PASS** — `bg-white dark:bg-surface-900`, `border border-surface-200`, `text-text-500` for stage metadata, `rounded-lg` for stage cards.
- **No arbitrary values.**

#### Health Ring — `health-ring.tsx`
- **PDS Reference:** PDS-11 § 6938-6954.
- **Status:** **PASS** — `stroke-{color}-500` per status (PDS Status tokens), `text-text-400` for muted labels, `shadow-card` for the ring.
- **No arbitrary values.**

#### Readiness Stack — `readiness-stack.tsx`
- **PDS Reference:** PDS-11 § 6904-6934.
- **Status:** **PASS** — `bg-success-500` / `bg-warning-500` / `bg-danger-500` per PDS Status tokens.
- **No arbitrary values.**

#### Operational Summary — `operational-summary.tsx`
- **PDS Reference:** PDS-11 § 7196-7213.
- **Status:** **PASS** — `text-2xl` (Heading.2) for the metric, `text-sm` for the narrative body, `bg-danger-600` (critical), `text-text-700` body, `text-text-400` muted.
- **No arbitrary values.**

#### DSP Status — `dsp-status.tsx`
- **PDS Reference:** PDS-11 § 7042-7072.
- **Status:** **PASS** — `bg-surface-100` for tags, `text-text-500`, `rounded-md` for badges.
- **No arbitrary values.**

#### Distribution Board — `distribution-board.tsx`
- **PDS Reference:** PDS-11 § 7042-7072.
- **Status:** **PASS** — uses `shadow-card` (not the legacy alias), `rounded-lg` for cards, `text-text-500` for muted metadata.
- **No arbitrary values.**

#### Rights Matrix — `rights-matrix.tsx`
- **PDS Reference:** PDS-11 § 6974-6996.
- **Status:** **PASS** — composes `Table` and `Badge`; `bg-surface-100` for territory tags.
- **No arbitrary values.**

#### Credits Table — `credits-table.tsx`
- **PDS Reference:** PDS-11 § 7000-7018.
- **Status:** **PASS** (composes `Table`).
- **No arbitrary values.**

#### Approval Matrix — `approval-matrix.tsx`
- **PDS Reference:** PDS-11 § 7170-7189.
- **Status:** **PASS** (composes `Card` / `Badge`).
- **No arbitrary values.**

#### Context Rail — `context-rail.tsx`
- **PDS Reference:** PDS-10 § 6140, PDS-13 § 9447 (`ContextRail.Width = 320px`).
- **Status:** **PASS** — uses `w-80` (320 px) which matches the documented token, `bg-surface-50` (Surface.50), `text-text-700`. The `h-[calc(100vh-4rem)]` is the same layout-calc pattern as `app-shell.tsx` (see Navigation § 2.4).
- **No arbitrary values.**

---

### 2.7 Layouts

#### AppShell — `packages/ui/src/layouts/app-shell.tsx`
- **PDS Reference:** PDS-10 § 6160, PDS-13 § 9436-9450.
- **Status:** **PASS** — composes `Sidebar` and `TopBar`, exposes `children` + `contextRail` slots. No raw values.

---

## 3. Token Usage Report

### 3.1 Current State (Audit Findings)

| Pattern | Count | Where |
|---|---:|---|
| `text-[Npx]` arbitrary font-size | **15** | `apps/web/src/app/**/{page,layout}.tsx` only — dashboard (8), `(app)/layout.tsx` (1), diagnostics (1), sign-up (2), `(auth)/layout.tsx` (1), sign-in (2). Zero in `packages/`. |
| `text-[N.rem]` arbitrary (Typography internals + pages) | **8** | Typography (5, canonical implementation of Display/Caption/Overline tokens) + 3 page headings using `text-[1.75rem]` |
| `w-[Npx]` arbitrary width | **7** | `apps/web/src/app/**` only — releases detail (2), dashboard (3), `(app)/layout.tsx` (1), `(auth)/layout.tsx` (1). Zero in `packages/`. |
| `h-[Npx]` arbitrary height | **0** | — |
| `gap-[Npx]` arbitrary gap | **0** | — |
| `rounded-[Npx]` arbitrary radius | **0** | — |
| `duration-[Nms]` arbitrary duration | **0** | — |
| `p-5` (20 px, off-scale) | **1** | `apps/web/src/app/(app)/administration/page.tsx:24` |
| `gap-1.5` (6 px, off-scale) | **8** | All in `apps/web/src/app/**` (page-level layouts) |
| `gap-2.5` (10 px, off-scale) | **3** | All in `apps/web/src/app/**` (page-level layouts) |
| `gap-3.5` (14 px, off-scale) | **0** | — |
| `mx-auto` in pages | **36** | 26 page files + 2 layout files (the 36 is per-occurrence; 28 unique files) |
| `max-w-*` in pages | **36** | 28 page files + 3 layout files (the 36 is per-occurrence) |
| `bg-zinc-*` in pages | **2** | Organizations page, Audit page |
| `text-zinc-*` in pages | **6** | Audit page (3), Organizations page, plus 2 inline code uses |
| `animate-spin` in pages | **1** | `apps/web/src/app/page.tsx` (root redirect loader) |
| `rounded-2xl` in pages | **1** | `apps/web/src/app/(auth)/layout.tsx:32` |
| `shadow-elevated` (legacy alias) | **0** | Already migrated across `packages/` |

### 3.2 Target State (Compliance Goals)

| Pattern | Target | Why |
|---|---:|---|
| `text-[Npx]` arbitrary font-size | **0** in pages (consumed as `<Typography variant>`); **0** new in `packages/ui` (existing 6 are an acceptable migration candidate if `<Typography>` is extended). |
| `text-[N.rem]` arbitrary (Typography internals) | **0** new occurrences; existing 5 stay as the canonical implementation of Display / Caption / Overline tokens. |
| `text-[1.75rem]` in page headings | **0** — `<Typography variant="heading1">` (`text-2xl`). |
| `w-[Npx]` arbitrary width | **0** new — replace with semantic layout tokens (`w-sidebar`, `w-context-rail`, `w-modal-sm`, `w-modal-md`). |
| `rounded-2xl` in pages | **0** — `rounded-xl` (Radius.XL = 20px). |
| `mx-auto` / `max-w-*` in pages | **0** — `<Container size="…" />` |
| `bg-zinc-*` / `text-zinc-*` | **0** — `bg-surface-*` / `text-text-*` |
| `animate-spin` in pages | **0** — `<LoadingState />` (when extracted) or inline pattern from Card skeleton. |
| `shadow-elevated` | **0** (already 0) — `shadow-raised` |
| `p-5` / `gap-1.5` / `gap-2.5` / `gap-3.5` | **0** new occurrences; existing 15 are documented migration candidates (see § 4). |

---

## 4. Migration Guide

### 4.1 Component-Level Breaking Changes

#### Button: `outline` → `tertiary`
- PDS-10 § 6400-6422 lists the canonical Button variants as Primary, Secondary, Tertiary, Danger, Ghost. The current `outline` is the legacy name for what PDS calls **Tertiary**.
- **Migration:** rename `outline` → `tertiary` in `packages/ui/src/components/button.tsx`; add a re-export alias `export const outline = tertiary` for one release to keep consumers working.
- **Affected files:** `packages/ui/src/components/button.tsx`, plus all consumers (`grep -rln "variant=\"outline\"" apps/ packages/`).

#### Button: `destructive-outline` → `tertiary-danger`
- Not in the PDS variant list. Renamed to keep the variant matrix symmetric.
- **Migration:** rename in `button.tsx`; alias the old name for one release.

#### Card: `padding="md"` default `p-5` → `p-6`
- PDS uses an 8-pt scale (§ 9260-9283). `p-5` (20 px) is off-scale.
- **Migration:** Change `paddingClasses.md` from `'p-5'` to `'p-6'`. The 4 px shift is invisible at typical card sizes and unifies Card with the rest of the system.

### 4.2 Page-Level Migrations (enforced by the ESLint guardrails)

#### Pages: `mx-auto max-w-*` → `<Container />`
- **Before:**
  ```tsx
  <div className="mx-auto max-w-4xl px-6 py-8">…</div>
  ```
- **After:**
  ```tsx
  <Container size="standard" className="py-8">…</Container>
  ```
- For narrow forms:
  ```tsx
  <Container size="narrow">…</Container>
  ```
  (`Container.narrow` = max-w-2xl, `Container.standard` = max-w-6xl, `Container.wide` = max-w-7xl.)
- 36 `mx-auto` and 36 `max-w-*` occurrences across 28 unique page/layout files.

#### Pages: `rounded-xl border border-surface-200/80 bg-white` → `<Card>`
- **Before:**
  ```tsx
  <div className="rounded-xl border border-surface-200/80 bg-white shadow-card p-6">…</div>
  ```
- **After:**
  ```tsx
  <Card padding="lg">…</Card>
  ```
- 4 occurrences in `releases/page.tsx`, `dashboard/page.tsx`, `artists/page.tsx`, `administration/page.tsx`; 1 `rounded-2xl` variant in `(auth)/layout.tsx`.

#### Pages: `animate-spin` loader → `<LoadingState />`
- The PDS-13 loader pattern is the soft pulse (`animate-pulse-soft`) on a `bg-surface-100` rounded surface, not a hard `animate-spin`. The root redirect loader should use the same primitive once `<LoadingState />` is extracted.
- **Before:**
  ```tsx
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-300 border-t-surface-800 dark:border-surface-600 dark:border-t-surface-200" />
  ```
- **After:** extract the pattern from Card skeleton into `LoadingState`, then:
  ```tsx
  <LoadingState size="md" />
  ```
- 1 occurrence: `apps/web/src/app/page.tsx:18` (the root redirect loader).

#### Pages: `bg-zinc-*` → `bg-surface-*` and `text-zinc-*` → `text-text-*`
- PDS uses warm neutrals (§ 9120-9136). `zinc-*` is the generic Tailwind cool-grey.
- **Migration:**
  - `bg-zinc-50` → `bg-surface-50`; `bg-zinc-100` → `bg-surface-100`; `bg-zinc-800` → `bg-surface-800`
  - `text-zinc-400` → `text-text-400`; `text-zinc-600` → `text-text-600`
- 2 `bg-zinc-*` and 6 `text-zinc-*` occurrences in `(app)/audit/page.tsx` and `(app)/organizations/page.tsx`.

#### Pages: `text-[1.75rem]` → `<Typography variant="heading1">` or `text-2xl`
- PDS § 9210 lists four heading sizes; `1.75rem` (28 px) is between `Heading.2` (1.25rem / 20 px) and `Heading.1` (1.5rem / 24 px). The closest on-scale value is `text-2xl` (24 px).
- **Migration:** `text-[1.75rem]` → `<Typography variant="heading1">` (preferred) or `text-2xl` (acceptable shortcut).
- 3 occurrences: `(app)/releases/page.tsx:49`, `(app)/dashboard/page.tsx:367`, `(app)/artists/page.tsx:42`.

#### Pages: `text-[13px]` / `text-[11px]` / `text-[10px]` → standard scale
- `text-[13px]` → `text-sm` (14 px is the closest on-scale value).
- `text-[11px]` → use `<Typography variant="caption">` (0.6875rem / 11 px — the canonical PDS Caption size).
- `text-[10px]` → use `<Typography variant="overline">` (0.625rem / 10 px — the canonical PDS Overline size).
- 15 occurrences in dashboard, sign-up, sign-in, auth layout, app layout, diagnostics pages.

#### Pages: `w-[Npx]` arbitrary width → documented Layout token
- `w-[20px]`, `w-[140px]`, `w-[180px]`, `w-[232px]`, `w-[360px]` etc. should be replaced with semantic layout tokens.
- 7 occurrences: dashboard (3), releases detail (2), `(app)/layout.tsx` (1), `(auth)/layout.tsx` (1).
- **Recommendation:** add `--rf-size-counter` (20 px), `--rf-size-col-min` (140 px), `--rf-size-col-max` (180 px), and let the layout tokens absorb the rest.

### 4.3 Off-Scale Spacing Migration (pages only)

The 8-pt scale (PDS-13 § 9260-9283) is the source of truth, but the page
layer currently contains a small number of off-scale spacing values:
`p-5` (1), `gap-1.5` (8), `gap-2.5` (3). The component packages have been
already migrated and are clean. Migration options, in order of preference:

1. **Snap to the next on-scale value.**
   `p-5` (20px) → `p-6` (24px); `gap-1.5` (6px) → `gap-2` (8px);
   `gap-2.5` (10px) → `gap-3` (12px).
2. **Document an exception in the PDS** (e.g. introduce `Space.6`,
   `Space.10`, `Space.20`) and add them to the Tailwind theme
   before re-running the audit.
3. **Leave as-is** for now but block new occurrences at the page layer
   via the ESLint guardrails already wired in `eslint.config.mjs`.

### 4.4 Non-Breaking Improvements

- Add `--text-display-xl` / `--text-display-lg` / `--text-display-md` /
  `--text-caption` / `--text-overline` to the `@theme` block in
  `globals.css` so that `Typography` can drop the `text-[N.rem]` values
  in favour of `text-display-xl` etc. (5 occurrences in Typography
  only — the values are the canonical implementation of the tokens).
- Add `--rf-modal-width-sm` / `--rf-modal-width-md` / `--rf-modal-width-lg`
  to the `:root` block so that any future Modal can drop its `max-w-md`
  / `max-w-lg` literals.
- Add `--rf-shadow-elevated` aliasing `--rf-shadow-raised` to support
  consumers that still reference the legacy name during the migration
  window; mark deprecated in JSDoc. (Not currently needed — no
  `shadow-elevated` remains in the codebase.)

---

## 5. PDS Rule-to-Implementation Cross-Reference

| PDS Rule | Source | Implemented In |
|---|---|---|
| DT-001 — Never hardcode values | PDS-13 § 9704 | `globals.css` (single source of truth), all `@theme` tokens |
| DT-002 — Never bypass semantic tokens | PDS-13 § 9708 | `packages/ui/**` consume only Tailwind utilities backed by `@theme` |
| DT-003 — Never duplicate tokens | PDS-13 § 9712 | One definition per token; `--rf-` namespace mirrors `@theme` |
| DT-004 — Never rename tokens without migration | PDS-13 § 9715 | This document's § 4 is the canonical migration for `outline → tertiary`, `shadow-elevated → shadow-raised` |
| DT-005 — All design tools reference identical token names | PDS-13 § 9719 | Figma variables use the same names; documented in PDS-13 § 9611 |
| COMP-001 — One purpose per component | PDS-10 § 6018 | Each file in `packages/ui/src/components/` exports a single component (Card additionally exports MetricCard / WorkspaceCard as documented variants) |
| COMP-002 — Composable | PDS-10 § 6028 | All components accept `className` and forward `…rest` props |
| COMP-003 — Accessible (WCAG AA) | PDS-10 § 6038 | Focus rings, `aria-*` attributes, keyboard handlers in `Card` and `Tabs` |
| COMP-004 — Responsive | PDS-10 § 6048 | Sidebar collapses, Grid uses `colsSm/Md/Lg`, Container has responsive padding |
| COMP-005 — Theme-aware | PDS-10 § 6064 | Every component has a `dark:` variant backed by surface/text tokens |
| Component Variants | PDS-10 § 6400-6422 | See Button § 2.1 |
| Component States | PDS-10 § 6428-6450 | All interactive components implement default, hover, focus, pressed, disabled, loading |
| Component Behaviour | PDS-10 § 6454-6476 | Documented in PDS-22 (`docs/22-component-specifications.md`) |

---

## 6. Enforcement

Two enforcement surfaces are wired up to block regressions:

1. **ESLint** — `eslint.config.mjs`
   - Custom rule `releaseflow/page-design-system-guardrail` applies to
     `apps/web/src/app/**/{page,layout}.tsx` (excluding `ui-lab/`) and
     reports `error`-level violations for `max-w-*`, `mx-auto`,
     `animate-spin`, `bg-zinc-*`, `text-zinc-*`, `text-[…px]`,
     `text-[…rem]`, and `shadow-elevated` inside JSX className literals.
   - Custom rule `releaseflow/component-classnames-guardrail` applies to
     `packages/{ui,domain-ui}/**` and reports `error`-level violations
     for `rounded-2xl`, `rounded-[…px]`, `duration-[…ms]`, and
     `shadow-elevated` in shared component classNames.
   - `pnpm lint` (via `turbo lint`) is part of the standard CI gate.

2. **Bash script** — `scripts/check-design-system.sh`
   - Pure grep-based scanner; runs in CI without ESLint / ripgrep.
   - Detects all the patterns above plus off-scale spacing
     (`p-5`, `gap-1.5`, `gap-2.5`, `gap-3.5`) and arbitrary
     `w-[Npx]` / `h-[Npx]` / `gap-[Npx]` in `packages/`.
   - Print-only by default; set `STRICT=1` to fail CI.
   - Invoke with `pnpm design-system:check` (add a `"design-system:check": "bash scripts/check-design-system.sh"` entry to `package.json` when promoting to CI).

---

## 7. Component Inventory (for traceability)

### Foundation
- Button (`packages/ui/src/components/button.tsx`)
- Card (`packages/ui/src/components/card.tsx`)
- Container (`packages/ui/src/components/container.tsx`)
- Typography (`packages/ui/src/components/typography.tsx`)
- Icon (`packages/ui/src/components/icon.tsx`)
- Divider (`packages/ui/src/components/divider.tsx`)
- Stack (`packages/ui/src/components/stack.tsx`)
- Grid (`packages/ui/src/components/grid.tsx`)
- Tooltip (`packages/ui/src/components/tooltip.tsx`)
- Badge (`packages/ui/src/components/badge.tsx`)
- Tag (`packages/ui/src/components/tag.tsx`)
- Avatar (`packages/ui/src/components/avatar.tsx`)
- Progress (`packages/ui/src/components/progress.tsx`)
- (Modal / Drawer / Popover → see Feedback)

### Input
- Input (`packages/ui/src/components/input.tsx`)
- Checkbox (`packages/ui/src/components/checkbox.tsx`)
- Switch (`packages/ui/src/components/switch.tsx`)
- Select (`packages/ui/src/components/select.tsx`)
- Segmented Control (`packages/ui/src/components/segmented-control.tsx`)
- Search (`packages/ui/src/components/search.tsx`)

### Display
- Table (`packages/ui/src/components/table.tsx`)
- Tabs (`packages/ui/src/components/tabs.tsx`)
- Timeline (`packages/ui/src/components/timeline.tsx`)
- Pagination (`packages/ui/src/components/pagination.tsx`)
- Metric Card (Card export)
- Empty State (`packages/ui/src/components/empty-state.tsx`)

### Navigation
- Sidebar (`packages/ui/src/navigation/sidebar.tsx`)
- TopBar (`packages/ui/src/navigation/topbar.tsx`)
- App Shell (`packages/ui/src/layouts/app-shell.tsx`)

### Feedback
- Alert / Banner (`packages/ui/src/components/alert.tsx`)
- Inline Message (`packages/ui/src/components/inline-message.tsx`)
- Toast (`packages/ui/src/components/toast.tsx`)
- Notification (`packages/ui/src/components/notification.tsx`)
- Confirmation Dialog (`packages/ui/src/components/confirmation-dialog.tsx`)
- Overlay / Modal / Drawer (`packages/ui/src/components/overlay.tsx`)

### Domain
- Release Journey (`packages/domain-ui/src/components/release-journey.tsx`)
- Workflow Board (`packages/domain-ui/src/components/workflow-board.tsx`)
- Health Ring (`packages/domain-ui/src/components/health-ring.tsx`)
- Readiness Stack (`packages/domain-ui/src/components/readiness-stack.tsx`)
- Operational Summary (`packages/domain-ui/src/components/operational-summary.tsx`)
- DSP Status (`packages/domain-ui/src/components/dsp-status.tsx`)
- Distribution Board (`packages/domain-ui/src/components/distribution-board.tsx`)
- Rights Matrix (`packages/domain-ui/src/components/rights-matrix.tsx`)
- Credits Table (`packages/domain-ui/src/components/credits-table.tsx`)
- Approval Matrix (`packages/domain-ui/src/components/approval-matrix.tsx`)
- Context Rail (`packages/domain-ui/src/components/context-rail.tsx`)

---

*End of report.*
