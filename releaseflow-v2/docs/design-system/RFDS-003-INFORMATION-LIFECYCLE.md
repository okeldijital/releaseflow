# RFDS-003 — Information Lifecycle

**Status:** Active
**Version:** 1.0

---

## Purpose

Nothing remains permanently important. Every information element has a lifecycle:

```
Created
    ↓
Active
    ↓
Resolved or Demoted
    ↓
Archived
    ↓
Expired
```

A blocked release is critical. A resolved release is history. A release that expired three months ago does not exist on the current screen.

---

## The Four Transitions

### Promotion

When an element's urgency increases, it moves **up** the tier hierarchy.

| From | To | Trigger |
|------|----|---------|
| Tier 4 (Evidence) | Tier 2 (Assessment) | Evidence shows risk indicators |
| Tier 4 (Evidence) | Tier 3 (Decision) | Evidence demands immediate action |
| Tier 5 (Context) | Tier 3 (Decision) | Context reveals a blocker |
| Tier 6 (History) | Tier 4 (Evidence) | Recent event changes the picture |

**Rule**: When promoting, update the visual weight AND the position in the page.

### Demotion

When an element is resolved or its urgency decreases, it moves **down** the tier hierarchy.

| From | To | Trigger |
|------|----|---------|
| Tier 3 (Decision) | Tier 4 (Evidence) | Action completed |
| Tier 3 (Decision) | Tier 5 (Context) | Action deferred |
| Tier 2 (Assessment) | Tier 4 (Evidence) | Assessment passed |
| Tier 4 (Evidence) | Tier 5 (Context) | No longer needed for current decision |

**Rule**: When demoting, remove from primary content area. Move to history or context.

### Archival

When an element is no longer active, it moves to **history**.

| From | To | Trigger |
|------|----|---------|
| Tier 4 (Evidence) | Tier 6 (History) | Resolved, no longer in current scope |
| Tier 2 (Assessment) | Tier 6 (History) | No longer relevant |
| Tier 5 (Context) | Tier 6 (History) | Viewed, no longer needed |

**Rule**: History items remain visible for a defined period, then expire.

### Expiration

After the retention period, items disappear from the current page.

| Item Type | Retention |
|-----------|----------|
| Activity events | 30 days |
| Resolved blockers | 14 days |
| Completed readiness checks | 30 days |
| Stage transitions | 90 days |
| System-level events | 365 days |

Expired items move to the dedicated history page, not the current page.

---

## Lifecycle Examples

### Blocked Release

```
Created           → Tier 4 (Evidence: appears in table)
    ↓ status changes to "blocked"
Active Blocker   → Tier 2 (Assessment: shows critical health)
    ↓ promotion
Critical          → Tier 1 (Situation: appears in hero briefing)
    ↓ demoted after resolution
Resolved         → Tier 5 (Context: appears in context rail)
    ↓ archived
History          → Tier 6 (History: appears in activity feed)
    ↓ expired after 30 days
Gone             → Removed from current page
```

### Readiness Check

```
Pending           → Tier 4 (Evidence: shown in table)
    ↓ submitted
Submitted         → Tier 4 (Evidence: still in table)
    ↓ approved
Approved          → Demoted to context (Tier 5: shown in context rail)
    ↓ after 7 days
Archived         → Tier 6 (History: in activity feed)
    ↓ after 30 days
Expired          → Removed
```

---

## Promotion Rules

When promoting an element:

- [ ] Update visual weight (larger type, bolder color)
- [ ] Move to the correct zone
- [ ] Update the page narrative
- [ ] Animate the transition (if RFDS-007 permits)
- [ ] Notify the user via activity feed

**The system should explain why something was promoted.** "This release is now critical because X changed."

---

## Demotion Rules

When demoting an element:

- [ ] Remove from primary content area
- [ ] Update to quieter visual treatment
- [ ] Move to history or context zone
- [ ] Maintain discoverability (user can still find it)

**Demotion should feel like resolution, not loss.** The user fixed the problem. The interface acknowledges that.

---

## Archival Rules

When archiving:

- [ ] Move to history feed
- [ ] Include timestamp and resolution reason
- [ ] Group related events (e.g., "Stage X completed, all 3 tasks done")
- [ ] Maintain a maximum of 50 visible history items per page

**Archival is not deletion. The user can always find what happened.**

---

## Expiration Rules

When expiring:

- [ ] Move to dedicated history page (not current page)
- [ ] Available via global activity search
- [ ] Retention period starts at the moment of demotion
- [ ] Critical events retain longer than routine events

**Expiration respects that memory is finite. Important things are remembered. Routine things pass.**

---

## Lifecycle Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Elements that never demote | The page becomes crowded over time |
| Elements that never expire | History grows unbounded |
| Promotion without notification | User doesn't know priority changed |
| Demotion without resolution context | User feels they lost information |
| Permanent "critical" status | Trust erodes when nothing resolves |
| All items at same lifecycle | No hierarchy of importance |
