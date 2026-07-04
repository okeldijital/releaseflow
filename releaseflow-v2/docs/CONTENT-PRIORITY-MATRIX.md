# Content Priority Matrix — ReleaseFlow

**Version:** 1.0

---

## Priority Definitions

| Priority | Label | Rule |
|----------|-------|------|
| P1 | Must always be visible | Above the fold, no scrolling required |
| P2 | Visible without scrolling | At or near the top of the content area |
| P3 | Secondary context | Visible after initial scan, may require scrolling |
| P4 | Progressive disclosure | Available via tab, expand, or hover |
| P5 | Historical/reference only | Bottom of page, activity tab, or settings |

---

## Operations Center

| Field / Element | Priority | Rationale |
|-----------------|----------|-----------|
| Page title | P1 | Identity — "Operations Center" |
| + Create Release button | P1 | Primary action |
| OperationalSummary | P1 | Answers "what's happening?" |
| Active Releases — Release name | P1 | Core identity per release |
| Active Releases — Health state | P1 | Operational status |
| Active Releases — Current stage | P2 | Progression |
| Active Releases — Deadline | P2 | Time pressure |
| Active Releases — Owner | P3 | Accountability |
| Alerts (Critical items) | P1 | Immediate attention |
| Blocked Work | P2 | Blocker identification |
| Deadlines | P2 | Time pressure |
| Org Pulse — Active count | P2 | Aggregate awareness |
| Org Pulse — Blocked count | P2 | Risk awareness |
| Org Pulse — Shipped count | P3 | Historical context |
| Recent Activity | P4 | Historical, collapsible |
| Quick Actions | P3 | Navigation aid |
| Refresh button | P4 | Utility |

---

## Release Workspace (Hero)

| Field / Element | Priority | Rationale |
|-----------------|----------|-----------|
| Release artwork | P1 | Identity, recognition |
| Release title | P1 | Primary identity |
| Release type | P2 | Context |
| Genre | P3 | Context |
| Release date | P2 | Timeline awareness |
| Health pill (% + label) | P1 | Operational status |
| Current stage badge | P1 | Progression |
| Rights badge | P2 | Readiness indicator |
| Blocker count badge | P1 | Critical awareness |
| Advance Stage button | P1 | Primary action |
| Edit button | P3 | Secondary action |
| Delete button | P4 | Destructive, rare |

---

## Release Workspace (Context Rail)

| Field / Element | Priority | Rationale |
|-----------------|----------|-----------|
| Health Ring | P1 | Visual health summary |
| Readiness Stack | P2 | Detailed readiness |
| Dependencies | P2 | Blocker identification |
| Attention items | P2 | Action items |
| Release date | P3 | Context |
| Owner | P3 | Accountability |

---

## Release Workspace (Tabs)

| Tab | Priority | Rationale |
|-----|----------|-----------|
| Overview | P1 | Default view, highest-value |
| Workflow | P1 | Core operational tool |
| Assets | P2 | Deliverable management |
| Distribution | P2 | Readiness + packaging |
| Rights | P2 | Ownership management |
| Activity | P3 | Historical |
| Campaigns | P4 | Secondary |
| Budget | P4 | Secondary |
| Credits | P4 | Secondary |
| Settings | P5 | Rarely accessed |

---

## Artist Workspace

| Field / Element | Priority | Rationale |
|-----------------|----------|-----------|
| Artist avatar | P1 | Identity |
| Artist name | P1 | Primary identity |
| Artist type | P2 | Context |
| Country | P3 | Context |
| Genres | P2 | Creative identity |
| Profile completeness | P1 | Operational status |
| Active/Completed stats | P1 | Operational awareness |
| Social links | P3 | Reference |
| + Add Release button | P1 | Primary action |
| OperationalSummary | P1 | Aggregate health |
| Active Releases section | P1 | Core content |
| Completed Releases | P3 | Historical |
| Profile (bio) | P3 | Reference |
| Credits tab | P4 | Secondary |
| Press Kit tab | P5 | Rarely accessed |

---

## Application Rule

When designing a screen, apply the priority matrix in this order:

1. **Place all P1 items first** — they must be visible without scrolling
2. **Place P2 items next** — they should be visible without scrolling if possible
3. **Place P3 items below** — they appear after the initial scan
4. **Place P4 items in tabs or collapsible sections**
5. **Place P5 items last** — they should never compete for attention

If a P1 item is empty (e.g., no alerts), **collapse the section entirely** rather than displaying an empty state. Empty states for P2-P5 may be displayed inline.
