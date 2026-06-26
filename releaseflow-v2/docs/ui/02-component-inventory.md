# Component Inventory — ReleaseFlow UI

> Version: 1.0 | Last Updated: 2026-06-24

---

## Input Components

### Button

**Purpose:** Primary action trigger.

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height and padding |
| `loading` | `boolean` | `false` | Show spinner, disable click |
| `disabled` | `boolean` | `false` | Gray out, no click |
| `icon` | `ReactNode` | — | Leading icon |
| `fullWidth` | `boolean` | `false` | Stretch to container |

**Variants:** `primary` (orange fill), `secondary` (warm fill), `outline` (border only), `ghost` (no border), `danger` (red fill)

**States:** `default` → `hover` → `active` → `focus` → `disabled` → `loading`

**Backend Mapping:** Submits forms (Create Release, Save Changes, Complete Stage, Generate Package)

---

### Input

**Purpose:** Single-line text entry.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Label above input |
| `placeholder` | `string` | — | Placeholder text |
| `error` | `string` | — | Error message below |
| `hint` | `string` | — | Help text below |
| `disabled` | `boolean` | `false` | Read-only state |
| `type` | `string` | `'text'` | HTML input type |

**States:** `empty` → `focused` → `filled` → `error` → `disabled`

**Backend Mapping:** Release title, UPC, catalog number, label, genre, artist name, dependency title, budget amount

---

### Textarea

**Purpose:** Multi-line text entry.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `rows` | `number` | `3` |
| `maxLength` | `number` | — |
| `resize` | `boolean` | `true` |

**Backend Mapping:** Artist bio, release description, task description, comment content

---

### Select

**Purpose:** Single value from a list.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `options` | `{ value, label }[]` | — |
| `value` | `string` | — |
| `placeholder` | `string` | `'Select...'` |

**Backend Mapping:** Release type, stage status, task priority, deliverable type, dependency category, campaign type, rights holder type, artist type

---

### MultiSelect

**Purpose:** Multiple values from a list. Tag-based UI.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `options` | `{ value, label }[]` | — |
| `value` | `string[]` | `[]` |
| `maxItems` | `number` | — |

**Backend Mapping:** Genres (artist), writers/producers (track), featured artists

---

### DatePicker

**Purpose:** Single date selection.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `value` | `Date \| null` | `null` |
| `minDate` | `Date` | — |
| `maxDate` | `Date` | — |

**Backend Mapping:** Target release date, task due date, dependency due date, campaign start/end date

---

## Data Display Components

### Card

**Purpose:** Generic content container.

| Prop | Type | Default |
|---|---|---|
| `padding` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `hover` | `boolean` | `false` |
| `clickable` | `boolean` | `false` |

**Variants:** Default, Elevated (hover shadow), Interactive (clickable with cursor)

**Backend Mapping:** Release card, artist card, campaign card, dependency card

---

### MetricCard

**Purpose:** Single KPI display.

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Metric name |
| `value` | `string \| number` | Current value |
| `trend` | `'up' \| 'down' \| 'flat'` | Trend indicator |
| `trendValue` | `string` | e.g. `'+12%'` |
| `color` | `string` | Accent color token |

**Backend Mapping:** Total Releases (dashboard), Released count, Drafts count, Budget spent/remaining, Readiness %

---

### WorkspaceCard

**Purpose:** Entity card with metadata, actions, and status.

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Primary label |
| `subtitle` | `string` | Secondary info |
| `status` | `string` | Status badge value |
| `statusColor` | `string` | Semantic color |
| `actions` | `ReactNode` | Action buttons |
| `meta` | `{ label, value }[]` | Metadata rows |

**Backend Mapping:** Release list items, campaign list items, dependency list items

---

### Table

**Purpose:** Tabular data with sorting.

| Prop | Type | Default |
|---|---|---|
| `columns` | `ColumnDef[]` | — |
| `data` | `T[]` | — |
| `sortable` | `boolean` | `true` |
| `selectable` | `boolean` | `false` |
| `loading` | `boolean` | `false` |

**Backend Mapping:** Releases table, tasks table, deliverables table, cost items

---

### DataGrid

**Purpose:** Read-only data grid with search/filter.

| Prop | Type | Description |
|---|---|---|
| `columns` | `ColumnDef[]` | Column definitions |
| `data` | `T[]` | Row data |
| `searchable` | `boolean` | Search bar |
| `filters` | `FilterDef[]` | Column filters |

**Backend Mapping:** Track credits grid, ownership splits grid, resource assignments grid

---

### Tabs

**Purpose:** Content switching within a view.

| Prop | Type | Default |
|---|---|---|
| `tabs` | `{ id, label, count? }[]` | — |
| `activeTab` | `string` | — |
| `onChange` | `(id) => void` | — |

**Variants:** Underline, Pill, Card

**Backend Mapping:** Release detail tabs (Overview, Workflow, Deliverables, Dependencies)

---

## Overlay Components

### Modal

**Purpose:** Focused task overlay.

| Prop | Type | Default |
|---|---|---|
| `open` | `boolean` | `false` |
| `title` | `string` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `onClose` | `() => void` | — |

**Backend Mapping:** Create release, edit metadata, approve deliverable, add dependency

---

### Drawer

**Purpose:** Side panel for details/editing.

| Prop | Type | Default |
|---|---|---|
| `open` | `boolean` | `false` |
| `position` | `'left' \| 'right'` | `'right'` |
| `width` | `string` | `'400px'` |

**Backend Mapping:** Release detail panel, task detail, comment thread

---

## Status Components

### Badge

**Purpose:** Inline status/category label.

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `color` | `string` | `'neutral'` |
| `size` | `'sm' \| 'md'` | `'sm'` |

**Variants:** Filled, Outline

**Backend Mapping:** Priority (low/medium/high/critical), type (Single/EP/Album/Remix)

---

### StatusBadge

**Purpose:** Status indicator with semantic color.

| Prop | Type | Description |
|---|---|---|
| `status` | `string` | Status value |
| `statusMap` | `Record<string, StatusStyle>` | Color/dot mapping |

**Statuses:** Active, Draft, Completed, Blocked, Overdue, Approved, Rejected, At Risk, On Budget, Over Budget

**Backend Mapping:** Release status, stage status, task status, deliverable status, dependency status, budget status, campaign status

---

## Progress & Loading

### ProgressBar

**Purpose:** Completion or spend visualization.

| Prop | Type | Default |
|---|---|---|
| `value` | `number` | `0` |
| `max` | `number` | `100` |
| `color` | `string` | `'primary'` |
| `size` | `'sm' \| 'md'` | `'md'` |
| `showLabel` | `boolean` | `false` |

**Backend Mapping:** Workflow progress, readiness %, budget spend %, distribution completeness

---

### LoadingState

**Purpose:** Full-page or section loading indicator.

| Prop | Type | Default |
|---|---|---|
| `variant` | `'spinner' \| 'skeleton' \| 'pulse'` | `'spinner'` |
| `text` | `string` | `'Loading...'` |

---

### EmptyState

**Purpose:** No-data placeholder with CTA.

| Prop | Type | Default |
|---|---|---|
| `icon` | `ReactNode` | — |
| `title` | `string` | — |
| `description` | `string` | — |
| `action` | `{ label, onClick }` | — |

**Backend Mapping:** No releases, no tasks, no deliverables, no campaigns, no dependencies

---

## User Components

### Avatar

**Purpose:** User/artist profile image.

| Prop | Type | Default |
|---|---|---|
| `src` | `string` | — |
| `name` | `string` | — |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |

**Backend Mapping:** User avatar (sidebar), artist image (artist detail)

---

### AvatarGroup

**Purpose:** Stacked user avatars.

| Prop | Type | Default |
|---|---|---|
| `users` | `{ name, src? }[]` | — |
| `max` | `number` | `5` |

**Backend Mapping:** Stage assignees, contributors on release

---

## Feedback Components

### Notification

**Purpose:** In-app alert/toast.

| Prop | Type | Default |
|---|---|---|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` |
| `title` | `string` | — |
| `message` | `string` | — |
| `dismissible` | `boolean` | `true` |
| `duration` | `number` | `5000` |

**Backend Mapping:** Operational alerts, notification feed, confirmation toasts

---

## Timeline

**Purpose:** Chronological event display.

| Prop | Type | Default |
|---|---|---|
| `events` | `{ timestamp, title, description }[]` | — |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |

**Backend Mapping:** Activity feed, stage progression history, approval timeline
