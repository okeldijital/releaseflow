# RFDS-001 — Attention Model

**Status:** Active
**Version:** 1.0

---

## Purpose

The RFDS defines an explicit **attention budget** for every screen. This budget prevents visual competition and establishes clear priority.

Visual weight is not "how big something is" alone. It is a combination of:

- Position (top-of-page, center, edge)
- Typography (size, weight, contrast)
- Color (semantic emphasis)
- Spacing (negative space around it)
- Permanence (does it change?)

Two elements at "priority 70" will compete. One at "priority 90" and one at "priority 10" will not.

---

## The Priority Budget

| Priority | Purpose | Examples | Visual Treatment |
|----------|---------|---------|-------------------|
| **100** | Situation | Hero briefing, page identity | Largest type, dominant position |
| **90** | Immediate decision | Action recommendations | Bold text, clear visual weight |
| **80** | Operational state | Assessment (Health, Stage, Deadline) | Medium type, table-formatted |
| **70** | Supporting evidence | Active Releases table, Metrics | Standard text, list weight |
| **50** | Context | Tabs, section headers | Small type, quiet color |
| **20** | Navigation | Sidebar, breadcrumbs | Minimal weight, peripheral |
| **10** | History | Activity feed, audit log | Lowest contrast, smallest type |
| **5** | Metadata | IDs, timestamps, technical IDs | Color-text-400 or lighter |

---

## Priority Budget Per Page

### Operations Center

| Section | Priority | Justification |
|---------|----------|---------------|
| Hero briefing | 100 | Answers "what is happening?" |
| Immediate Actions | 90 | Answers "what should I do?" |
| Assessment | 80 | Answers "what is the current state?" |
| Metrics | 70 | Supporting evidence |
| Active Releases | 70 | Evidence the user can act on |
| Attention | 70 | Mission-critical signal |
| Org Pulse | 50 | Snapshot, not actionable |
| Recent Activity | 10 | History |

### Release Workspace

| Section | Priority |
|---------|----------|
| Release Hero (title, type, health) | 100 |
| Stage advancement (primary action) | 90 |
| OperationalSummary | 80 |
| Context Rail (Health Ring, Readiness) | 80 |
| Active tab content | 70 |
| Tab bar | 50 |
| Release Journey | 50 |
| Context rail details | 20 |

### Artist Workspace

| Section | Priority |
|---------|----------|
| Artist name + type + role | 100 |
| Profile completeness | 80 |
| Add Release (primary action) | 90 |
| Active Releases | 70 |
| Profile details | 50 |
| Context rail | 20 |

---

## How Priority Maps to Visual Treatment

| Priority | Size | Weight | Color | Position |
|----------|------|--------|-------|----------|
| 100 | 40px | medium | text-900 | Top of page |
| 90 | 15-17px | medium | text-900 | Below hero |
| 80 | 24px value, 10px label | medium | text-900 | Two-column grid |
| 70 | 14px | normal/medium | text-700 | Full width |
| 50 | 10-12px | medium uppercase | text-400 | Section headers |
| 20 | 13px | normal | text-400 | Sidebar |
| 10 | 11px | normal | text-400 | Activity feed |

---

## Anti-Patterns

### Same priority to competing elements

If two elements share a priority and occupy adjacent positions, one must win. The other must descend to a lower priority.

### Priority inflation

When everything is priority 70, nothing is. Reserve 90+ for elements that are non-negotiable to see.

### Ambiguous priority

Every section must have a documented priority. If it cannot be classified, it is decoration.

---

## New Page Protocol

When creating a new page:

1. List every section
2. Assign each a priority from this model
3. If two share the same priority, justify or demote one
4. Apply the visual treatment from the table
5. Document in the page blueprint
