# RFDS-006 — Component Taxonomy

**Status:** Active
**Version:** 1.0

---

## The Seven Categories

### 1. Structural (VH 10–40)

Layout only. No business logic. No data fetching.

| Component | Role |
|-----------|------|
| Page | Top-level content wrapper |
| Section | Vertical content division |
| Container | Width-constrained wrapper |
| Grid | Column-based layout |
| Stack | Vertical/horizontal stacking |
| Divider | Structural separation (VH-10) |
| Spacer | Intentional whitespace |

### 2. Informational (VH 40–80)

Display information. Read-only. No user input.

| Component | Role |
|-----------|------|
| Badge | Inline label or category |
| StatusBadge | Operational state indicator |
| MetricCard | Single KPI display |
| HealthRing | Circular health visualisation |
| ReadinessStack | Operational readiness checklist |
| OperationalSummary | Aggregate operational state |
| ReleaseJourney | Stage progression visualisation |
| Typography | Semantic text rendering |

### 3. Operational (VH 60–90)

Enable work. User interaction. Data modification.

| Component | Role |
|-----------|------|
| Button | Primary action trigger |
| Input | Single-line text entry |
| Select | Single/multi value selection |
| Table | Tabular data display |
| ProgressBar | Completion visualisation |
| WorkflowBoard | Stage management board |
| Tabs | View switching |
| Checkbox | Boolean toggle |

### 4. Navigational (VH 30–60)

Move through the product. No data modification.

| Component | Role |
|-----------|------|
| Sidebar | Primary navigation rail |
| Topbar | Global header |
| Breadcrumbs | Orientation trail |
| CommandPalette | Power-user ⌘K navigation |
| Search | Global entity search |
| Pagination | Page through lists |

### 5. Contextual (VH 50–60)

Supporting information. Peripheral to work.

| Component | Role |
|-----------|------|
| ContextRail | Right-side context panel |
| Tooltip | Hover explanation |
| Popover | Click-to-reveal detail |
| Tag | Inline classification |
| Avatar | User/artist representation |

### 6. Feedback (VH 50–70)

Inform of state change. No permanent UI.

| Component | Role |
|-----------|------|
| EmptyState | No data placeholder |
| LoadingState | Loading indicator |
| Skeleton | Content placeholder |
| Toast | Transient notification |
| Alert | Persistent notification |
| Banner | Page-level notification |
| ConfirmationDialog | Destructive action guard |

### 7. Overlay (VH 50–90)

Temporary interaction. Demands focus.

| Component | Role |
|-----------|------|
| Modal | Focused task dialog |
| Drawer | Side panel overlay |
| Dropdown | Temporary option list |
| Dialog | Confirmation or input prompt |

---

## Taxonomy Rules

1. A component belongs to exactly one category
2. A component may not span categories (no structural + operational)
3. New categories require an RFDS amendment
4. Every component must self-identify its category in its contract
