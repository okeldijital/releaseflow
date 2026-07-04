# PX-306 — Invisible Interface

## Summary

Reduced interface presence while increasing operational clarity. Every change satisfies the core principles: remove before adding, whitespace replaces containers, typography replaces decoration, layout replaces borders.

## Scope

No backend, domain logic, services, hooks, repositories, routing, calculations, or Firestore code was modified. Only presentation-layer code changed.

## Phases Complete

### Phase 1 — Surface Reduction
- Removed decorative card borders from `Card`, `MetricCard`, `WorkspaceCard`
- Removed `hover:shadow-raised` from cards — spacing now defines regions
- Removed `border-surface-200` from `BlockedRow` — tonal background suffices
- Reduced table container border from `border-surface-200/50` to `border-surface-200/30`
- Removed table header background entirely
- Reduced row separators to `border-surface-100/40`

### Phase 2 — Hero Reconstruction
- **Operations Center:** Hero reduced to date + status summary only
- **Release Workspace:** Release type/date moved to inline text (no pills), rights/blockers converted to text links
- **Artist Workspace:** Type/country moved to inline text, health converted to color-only text

### Phase 3 — Operational Summary 2.0
- Removed outer border and background — feels like part of the page
- Removed internal dividers between sections
- Recommendations moved before metrics (primary over secondary)
- Confidence bar thinned to `h-px` (1px)
- Health pill reduced from `px-3 py-1` to `px-2.5 py-0.5`
- Stage pill converted from bordered badge to plain text link
- Timestamp reduced to `text-[10px]`

### Phase 4 — Table Deconstruction
- Removed outer container border
- Removed rounded corners from table container
- Headers reduced to `text-xs text-text-400 uppercase tracking-wider`
- Row separators reduced to `border-surface-100/40`
- Hover state reduced to `hover:bg-surface-50/50`

### Phase 5 — Right Rail Reconstruction
- Context rail remains continuous vertical rhythm
- No stacked cards — health ring and readiness stack share tonal surface
- No competing borders — health ring border removed

### Phase 6 — Pill Reduction
- Removed `Badge` component usage from heroes
- Converted health pills to plain text with color: `text-danger-600`
- Converted release type from `Badge` to inline text
- Reduced alert border emphasis from `border-l-[3px]` to `border-l-[2px]`
- Removed `group-hover:opacity-100` reveal pattern — links always visible

### Phase 7 — Vertical Rhythm
- Normalized all workspaces to: Header `mb-12` (48px), Hero/OpsSummary `mb-14` (56px), Supporting `mb-12` (48px), Details `mb-8` (32px), Silence `0`

### Phase 8 — Sidebar Silence
- Icon size reduced from `h-5 w-5` to `h-4 w-4`
- Active indicator reduced from `h-2 w-2` to `h-1.5 w-1.5`
- Section headings reduced from `text-[10px]` with `mb-1.5` to `text-[10px]` with `mb-1`
- Nav item font reduced from `text-[13.5px] font-medium` to `text-[13px] font-normal`
- Active state background reduced to `bg-primary-50/60`
- Footer border reduced to `border-surface-200/60`

### Phase 9 — Context over Chrome
- Alert severity labels reduced from `text-[10px]` badges to inline text
- Deadline rows converted from bordered cards to tonal rows (`bg-surface-50`)
- Empty state uses `rounded-full` icon well instead of bordered container

### Phase 10 — Silence Audit
- Removed decorative borders on cards
- Removed decorative rings from release hero icon
- Removed footer dividers
- Removed hover shadows from alerts
- Reduced topbar search border opacity
- Reduced tab container border opacity
- Reduced divider opacity

## Deliverables

- `docs/PX-306-INVISIBLE-INTERFACE.md`
- `docs/PX-306-SURFACE-REDUCTION.md`
- `docs/PX-306-CONTEXT-RAIL.md`
- `docs/PX-306-TABLE-LANGUAGE.md`
- `docs/PX-306-SILENCE-AUDIT.md`
- `docs/PX-306-BEFORE-AFTER.md`

## Evidence

- `docs/PX-306-screenshot-operations-center.png`
- `docs/PX-306-screenshot-release-workspace.png`
- `docs/PX-306-screenshot-artist-workspace.png`
- `docs/PX-306-screenshot-sidebar-expanded.png`
- `docs/PX-306-screenshot-sidebar-collapsed.png`
- `docs/PX-306-screenshot-empty-state.png`
- `docs/PX-306-screenshot-mobile.png`
- `docs/PX-306-screenshot-data-rich.png`
