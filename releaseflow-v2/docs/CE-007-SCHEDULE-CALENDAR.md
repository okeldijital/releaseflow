# CE-007 — Schedule & Calendar Workspace

**Status:** Implemented  
**Date:** 2026-07-17  
**Prerequisites:** CE-001 … CE-006

---

## Architecture Summary

```
assignments (source of truth)
        │
        ▼
schedule-service  (project only — no duplicate store)
        │
        ├── Agenda / Day / Week / Month views
        ├── Workload summary
        ├── Conflict detection
        └── Filters + search
        │
        ▼ (reschedule)
assignment-service.rescheduleAssignment
        ├── activity_events (due_date.changed)
        └── notification_events (assignment.rescheduled)
```

### Schedule service

- Loads assignments with **scope enforcement** (collaborator = own only; managers = team/person/role).
- Enriches with person names + release context (artwork, release, track).
- Builds calendar models, agenda sections, week buckets, month meta.
- Detects conflicts (multiple due, time overlap, day overload > 5).

### Drag & drop

- Managers only (`canReschedule`).
- Drop on week column → confirmation dialog → `rescheduleAssignment`.
- Collaborators: read-only cards (no drag).

### Events

| Type | When |
|---|---|
| `assignment.rescheduled` | Due date changed by manager |
| `assignment.conflict` | Conflicts detected on load |
| `assignment.due_today` / `due_tomorrow` | Projected on schedule load |

Processor (CE-006) turns these into user notifications.

---

## Data Model

### `calendar_preferences`

| Field | Type |
|---|---|
| userId | string (doc id) |
| defaultView | `agenda` \| `day` \| `week` \| `month` |
| weekStartsOn | 0–6 |
| showWeekends | boolean |
| compactMode | boolean |
| updatedAt | Timestamp |

Assignments are **not** duplicated. Due dates live on `assignments.dueDate`.

### Relationships

- Assignment → Person (assignee) → Schedule card  
- Assignment → Release context (read-only artwork/title)  
- Release milestones → read-only calendar overlays  

---

## File Summary

### New

| File | Purpose |
|---|---|
| `lib/schedule-date-utils.ts` | Pure date helpers |
| `lib/schedule-service.ts` | Calendar models, filters, conflicts, workload |
| `lib/calendar-preferences-repository.ts` | User calendar prefs |
| `components/schedule/schedule-assignment-card.tsx` | Card UI |
| `components/schedule/schedule-workload.tsx` | Summary strip |
| `components/schedule/schedule-views.tsx` | Agenda/Day/Week/Month |
| `__tests__/schedule-service.test.ts` | Unit tests |
| `docs/CE-007-SCHEDULE-CALENDAR.md` | This doc |

### Modified

| File | Purpose |
|---|---|
| `app/(app)/schedule/page.tsx` | Full assignment calendar workspace (replaces release timeline placeholder) |
| `lib/assignment-service.ts` | `rescheduleAssignment` + activity/events |
| `lib/notification-type-registry.ts` | Schedule event types |
| `firestore.rules` | `calendar_preferences` |

---

## Validation

| Check | Result |
|---|---|
| TypeScript | Pass |
| Lint | Pass (pre-existing warnings only) |
| Tests | **563 passed** (incl. `schedule-service.test.ts`) |
| Production build | Pass |

## Acceptance

- [x] /schedule fully implemented (Agenda, Day, Week, Month)
- [x] Assignments source of truth
- [x] Collaborator = own only; manager team scopes
- [x] Reschedule + drag-drop (managers) with confirm
- [x] Activity + notification events on due change
- [x] Conflict badges
- [x] Read-only milestones
- [x] Preferences persisted
- [x] Responsive (agenda default on phone)
