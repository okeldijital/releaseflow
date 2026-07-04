# RFDS-003 — Information Priority Matrix

**Status:** Active
**Version:** 1.0

---

## Purpose

Every information type receives a numeric priority. This priority determines:

- Tier assignment
- Reading order
- Visual weight
- Disclosure level

The priority is derived from how urgently the user needs to act on the information.

---

## Priority Scale

| Priority | Tier | Time Horizon | Action |
|----------|------|--------------|--------|
| 100 | Tier 1 | Immediate | Show immediately, Tier 1 |
| 95 | Tier 1 | Immediate | Show immediately, Tier 1 |
| 90 | Tier 3 | Immediate | Show immediately, Tier 3 |
| 85 | Tier 2 | Current | Show immediately, Tier 2 |
| 80 | Tier 4 | Current | Show in primary content, Tier 4 |
| 75 | Tier 4 | Short-term | Show in primary content, Tier 4 |
| 70 | Tier 4 | Current | Show on demand, Tier 4 |
| 60 | Tier 4 | Current | Show on demand, Tier 4 |
| 50 | Tier 6 | Historical | Show in expanded section, Tier 6 |
| 20 | Tier 5 | Reference | Show in context rail, Tier 5 |
| 10 | Tier 7 | Reference | Inline only, Tier 7 |
| 5 | Tier 7 | Reference | Inline only, Tier 7 |

---

## Information Type → Priority

| Information Type | Priority | Tier | Time Horizon |
|-----------------|----------|------|---------------|
| Blocker (critical) | 100 | Tier 1 | Immediate |
| Critical Health | 95 | Tier 1 | Immediate |
| Required Action | 90 | Tier 3 | Immediate |
| Assessment State | 85 | Tier 2 | Current |
| Workflow Status | 80 | Tier 4 | Current |
| Deadline (critical) | 75 | Tier 4 | Short-term |
| Active Release | 70 | Tier 4 | Current |
| Asset Status | 60 | Tier 4 | Current |
| Recent Activity | 50 | Tier 6 | Historical |
| Related Info | 20 | Tier 5 | Reference |
| IDs | 10 | Tier 7 | Reference |
| Timestamps | 5 | Tier 7 | Reference |

---

## Priority Mapping Per Page

### Operations Center

| Element | Priority | Tier | Position |
|---------|----------|------|----------|
| Date | 100 | Tier 1 | Hero top |
| Briefing (critical) | 100 | Tier 1 | Hero body |
| Briefing (normal) | 85 | Tier 2 | Hero body |
| Assessment Health | 95 | Tier 1 | Below hero |
| Action (NOW) | 90 | Tier 3 | Below assessment |
| Metric (current) | 70 | Tier 4 | Inline below actions |
| Active Release | 70 | Tier 4 | Table |
| Blocker | 100 | Tier 1 | Attention panel |
| Deadline (overdue) | 75 | Tier 4 | Attention panel |
| Activity (recent) | 50 | Tier 6 | Bottom |

### Release Workspace

| Element | Priority | Tier | Position |
|---------|----------|------|----------|
| Release name + type | 100 | Tier 1 | Hero |
| Health Ring | 95 | Tier 1 | Context rail |
| Readiness | 85 | Tier 2 | Context rail |
| Advance Stage CTA | 90 | Tier 3 | Hero |
| Workflow Board | 80 | Tier 4 | Workflow tab |
| Asset (critical missing) | 75 | Tier 4 | Assets tab |
| Right (incomplete) | 75 | Tier 4 | Rights tab |
| Activity (recent) | 50 | Tier 6 | Activity tab |
| ID | 10 | Tier 7 | Settings tab |

### Artist Workspace

| Element | Priority | Tier | Position |
|---------|----------|------|----------|
| Artist name | 100 | Tier 1 | Hero |
| Profile completeness | 85 | Tier 2 | Hero |
| Add Release CTA | 90 | Tier 3 | Hero |
| Active Release | 70 | Tier 4 | Releases tab |
| Credit | 50 | Tier 4 | Credits tab |
| Activity (recent) | 50 | Tier 6 | Activity tab |

---

## Priority Anti-Patterns

| Anti-Pattern | Result |
|-------------|--------|
| Two elements at same priority in adjacent sections | Eye cannot decide which is important |
| Priority 100 for non-actionable info | Dilutes the urgency of actual critical items |
| Priority inflation (everything at 80) | No hierarchy |
| Priority without tier | Priority is meaningless without visual treatment |
| Different priorities but same visual weight | The hierarchy is invisible to the user |

---

## Priority Validation

Every page component must specify:
- Tier (from RFDS-003)
- Numeric priority (this matrix)
- Visual weight (from RFDS-001 attention model)
- Position (from RFDS-002 zones)

If a component is on a page but has no documented priority, it is decoration.
