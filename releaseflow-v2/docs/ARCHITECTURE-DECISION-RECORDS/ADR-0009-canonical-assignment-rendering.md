# ADR-0009 — Canonical Assignment Rendering Contract

**Status:** Accepted  
**Date:** 2026-07-20  
**Related:** EPIC-207, ADR-0008 (Release rendering)  
**Decision makers:** ReleaseFlow product & engineering

---

## Context

Assignments are the primary unit of day-to-day work in ReleaseFlow. Historically, assignment lists used ad-hoc rows, mobile-only cards, and duplicated filtering on the dashboard.

EPIC-207 establishes Assignment Workspace 2.0 as the operational centre and hardens rendering the same way ADR-0008 hardened Release summaries.

---

## Decision

There is **exactly one** component responsible for rendering an Assignment summary:

```
AssignmentCard
```

Every Assignment summary displayed anywhere must eventually render through this component.

### Rendering pipeline

```
Firestore
    ↓
Repository          (getAssignments — retrieval only)
    ↓
Application Service (enrichment, Work Score, Release context)
    ↓
Workspace Builder   (organization: sections, sort, projections)
    ↓
Workspace Section
    ↓
AssignmentCard      (presentation)
    ↓
DOM
```

### Responsibilities

| Layer | Owns | Must never |
|-------|------|------------|
| **Repository** | Querying Assignment records | UI, Work Score, Needs Attention |
| **Service** | Enrichment, Work Score, urgency, Release/Track/Artwork batching | Section markup |
| **Workspace Builder** | Grouping, sorting, projecting sections | Presentation |
| **AssignmentCard** | Title, artwork, badges, status, due, actions, modes | Business rules / scoring |

---

## Integrity rule

After user-applied filters, the **catalogue** is the integrity source of truth:

```
incoming = catalogue.length
outgoing = Σ(canonical section items)   // All Assignments
assert incoming === outgoing
```

- Projection sections (Needs Attention, Due Today, Awaiting Review, Recently Updated) may re-surface items.
- Projections are excluded from the integrity sum.
- Development/test builds throw on mismatch; production does not.

---

## Work Score

Centralized in `assignment-work-score.ts`:

| Signal | Points |
|--------|--------|
| Overdue | +100 |
| Blocked | +80 |
| Due Today | +60 |
| High Priority | +40 |
| Review | +30 |
| Assigned To Me | +20 |
| Updated Today | +10 |

Needs Attention sorts by `workScore` descending (max 10).

---

## Modes

`workspace` · `compact` · `table` · `table-row` (alias) · `detailed` · `search`

Modes change layout only. No mode may return `null`.

---

## Prohibited patterns

```tsx
// ❌ Bespoke assignment summary row
<div className="assignment-row">{assignment.title}</div>

// ❌ Dashboard widget with its own query + scoring rules
```

Allowed:

```tsx
// ✅ Layout shell + AssignmentCard
{records.map((r) => (
  <AssignmentCard key={r.assignment.id} record={r} mode="compact" />
))}
```

---

## Implementation references

| Artifact | Path |
|----------|------|
| Composable query | `apps/web/src/lib/assignment-repository.ts` → `getAssignments` |
| Work Score | `apps/web/src/lib/assignment-work-score.ts` |
| Enrichment service | `apps/web/src/lib/assignment-workspace-service.ts` |
| Workspace builder | `apps/web/src/lib/assignment-workspace.ts` |
| Canonical card | `apps/web/src/components/assignments/cards/AssignmentCard.tsx` |
| Workspace page | `apps/web/src/app/(app)/assignments/page.tsx` |
| Tests | `apps/web/src/__tests__/epic-207-assignment-workspace.test.ts` |

---

## Consequences

**Positive**

- One operational workspace for “what should I work on now?”
- Dashboard My Work reuses the same service + builder (BUILD-016)
- Silent catalogue drops fail in development

**Trade-offs**

- Legacy mobile `components/mobile/assignment-card.tsx` remains for contributor home until migrated; new workspace and dashboard use the canonical card.
