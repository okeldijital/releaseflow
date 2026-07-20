# ADR-0008 — Canonical Release Rendering Contract

**Status:** Accepted  
**Date:** 2026-07-20  
**Related:** BUG-008A, BUG-008B, EPIC-206  
**Decision makers:** ReleaseFlow product & engineering

---

## Context

EPIC-206 introduced productivity sections on the Releases Workspace. During that refactor the catalogue path stopped mounting `ReleaseCard` and used a bespoke table instead.

Symptoms (BUG-008A):

- Repository returned releases correctly
- Header showed `1 of 1 release`
- No `ReleaseCard` mounted in the DOM

The release still existed. The **rendering contract** had been broken.

BUG-008A restored `ReleaseCard` for the catalogue. BUG-008B hardens the architecture so this class of regression cannot recur.

---

## Decision

There is **exactly one** component responsible for rendering a Release summary:

```
ReleaseCard
```

Every Release summary displayed anywhere in the application must eventually render through this component.

### Rendering pipeline

```
Firestore
    ↓
Repository          (retrieval only)
    ↓
Application Service (orchestration, artwork hydration)
    ↓
Workspace Builder   (organization only: group / sort / filter / prioritize)
    ↓
Workspace Section   (data + layout shell)
    ↓
ReleaseCard         (presentation)
    ↓
DOM
```

No stage may silently discard a Release after user-applied filters have been applied.

---

## Responsibilities

| Layer | Owns | Must not |
|-------|------|----------|
| **Repository** | Querying and persisting Release records | Rendering, grouping for UI |
| **Application Service** | Hydration (e.g. artwork), authz checks | Custom row markup |
| **Workspace Builder** | Grouping, sorting, filtering, prioritizing into sections | Deciding how a Release looks |
| **ReleaseCard** | Artwork, badges, lifecycle, status, readiness, metadata, menus, actions, responsive layout | Being bypassed by ad-hoc markup |

---

## Integrity rule

After filtering, the catalogue entering the workspace builder must equal the set of releases assigned to **canonical** sections (currently: All Releases):

```
incoming = catalogue.length
outgoing = Σ(canonical section items)
assert incoming === outgoing
```

- Each catalogue id appears **exactly once** in canonical sections.
- **Projection** sections (Needs Attention, Continue Working, Upcoming, Recently Updated) may re-surface the same release for productivity UX; they are excluded from the integrity sum.
- User-applied search/filters intentionally shrink the catalogue; that is not a silent discard.

### Development assertion

In `development` and `test` environments, `assertWorkspaceIntegrity()` throws:

```
Release Workspace Integrity Error
Incoming Releases: X
Rendered Releases: Y
Missing Releases:
- id
  title
```

This assertion does **not** run in production builds.

---

## ReleaseCard modes

Modes change **layout only**. They do not fork presentation ownership.

| Mode | Layout |
|------|--------|
| `workspace` | Full card (default grid) |
| `compact` | Dense card |
| `table` | Table / list row (canonical table layout) |
| `table-row` | Alias of `table` (back-compat) |
| `detailed` | Expanded metadata card |
| `search` | Search-result density (uses compact shell) |

Example:

```tsx
<ReleaseCard release={r} mode="table" variant="active" />
```

---

## Prohibited patterns

```tsx
// ❌ Bespoke release summary row
<div className="release-row">
  <img src={…} />
  <span>{release.title}</span>
</div>

// ❌ Catalogue table without ReleaseCard
<div className="grid grid-cols-12">…custom cells…</div>

// ❌ Second row component that reimplements badges/artwork/status
function ReleaseTableRow({ release }) { … }
```

Allowed:

```tsx
// ✅ Layout shell + ReleaseCard
<div className="grid …" data-release-card-grid>
  {releases.map((r) => (
    <ReleaseCard key={r.id} release={r} mode="workspace" variant={resolveReleaseCardVariant(r)} />
  ))}
</div>

// ✅ Table layout still uses ReleaseCard
<div className="divide-y …">
  {releases.map((r) => (
    <ReleaseCard key={r.id} release={r} mode="table" variant={resolveReleaseCardVariant(r)} />
  ))}
</div>
```

### Not Release summaries

The following may link to a release without being a Release summary:

- Readiness score rows (readiness insight, not catalogue presentation)
- Assignment context chips
- Activity feed text that mentions a release
- Plain navigation links (“View release”) without summary chrome

When those surfaces evolve into full release previews, they must use `ReleaseCard` (e.g. `mode="search"`).

---

## Section collapse

Collapse hides **UI only**.

- `section.items` must never be cleared or filtered when a section is collapsed.
- Collapsed sections still contribute to integrity and still own their data.

---

## Implementation references

| Artifact | Path |
|----------|------|
| Workspace builder | `apps/web/src/lib/release-workspace.ts` |
| Canonical presentation | `apps/web/src/components/release/cards/ReleaseCard.tsx` |
| Releases page | `apps/web/src/app/(app)/releases/page.tsx` |
| Regression tests | `apps/web/src/__tests__/bug-008b-canonical-release-rendering.test.ts` |

---

## Consequences

**Positive**

- One presentation surface; design changes land once.
- Silent catalogue drops fail fast in development.
- Automated tests lock the contract.

**Trade-offs**

- Productivity sections may show the same release more than once (projection vs catalogue). That is intentional.
- Migrating remaining non-summary link surfaces is out of scope unless they become previews.

---

## Acceptance (BUG-008B)

- [x] Every Release summary renders through `ReleaseCard`
- [x] Catalogue has no bespoke rendering logic
- [x] Workspace Builder cannot silently discard catalogue releases
- [x] Development assertions detect integrity mismatches
- [x] Automated tests cover cardinality and filtering
- [x] This ADR documents the contract
