# TASK-2602 — Split Editor

## Concept

A visual editor for percentage splits. Used across all ownership domains
(Master, Publishing, Mechanical, Neighbouring) wherever ownership or
revenue is divided among multiple parties.

Live validation ensures splits always sum to 100%. The editor provides
three views: Bar, Donut, and Table.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Edit Publishing Split · Track 1: Lua                            │
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐  │
│  │                 │    │                                       │  │
│  │    ┌─────────┐  │    │  ─── Split ────────────────────────  │  │
│  │    │ ████████ │  │    │                                       │  │
│  │    │ ████████ │  │    │  Kinn Timo          50%             │  │
│  │    │ ████████ │  │    │  ████████████████████████░░░░░░░░   │  │
│  │    │ ████░░░░ │  │    │  Writer's share    SAMRO           │  │
│  │    │ ████░░░░ │  │    │                                       │  │
│  │    │          │  │    │  Acme Publishing     25%             │  │
│  │    └─────────┘  │    │  ████████████░░░░░░░░░░░░░░░░░░░░   │  │
│  │                 │    │  Publisher share    SAMRO           │  │
│  │   50% Kinn Timo│    │                                       │  │
│  │   25% Acme Pub │    │  Artist Y            25%             │  │
│  │   25% Artist Y │    │  ████████████░░░░░░░░░░░░░░░░░░░░   │  │
│  │                 │    │  Co-writer          ASCAP           │  │
│  └─────────────────┘    │                                       │  │
│                          │  ──────────────────────────────────  │  │
│                          │  Total: 100%  ✓                      │  │
│                          └─────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  + Add Party  │  │  Auto-split  │                               │
│  └──────────────┘  └──────────────┘                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Three Views

### 1. Bar View (default)

```
Kinn Timo         50%  ████████████████████████████████████████████████
Acme Publishing   25%  ████████████████████████
Artist Y          25%  ████████████████████████
                       ───────────────────────────────────────────────
                       Total: 100%  ✓
```

Each bar is a horizontal bar with the party name, percentage, and a
color-coded bar. Bars are proportional to their percentage.

### 2. Donut View

```
          ┌──────────────────┐
          │     ┌──────┐     │
          │     │░░░░░░│     │
          │     │░░░░░░│     │  ← Inner circle with remaining %
          │     │  50% │     │
          │  ┌──┘░░░░░░└──┐  │
          │  │  ░░░░░░░░  │  │
          │  │  ░░░░░░░░  │  │
          │  │  ░░░░░░░░  │  │
          │  └──┐░░░░░░┌──┘  │
          │     │░░░░░░│     │
          │     │░░░░░░│     │
          │     └──────┘     │
          │                  │
          │  Kinn Timo  50%  │
          │  Acme Pub   25%  │
          │  Artist Y   25%  │
          └──────────────────┘
```

Colors map to parties. Hovering a segment shows the party name and
percentage in a tooltip.

### 3. Table View

```
┌────────────────────────────────────────────────────────────────┐
│  # │ Party            │ Type      │ PRO   │ Share │ Actions  │
│────┼──────────────────┼───────────┼───────┼───────┼──────────│
│  1 │ Kinn Timo        │ Writer    │ SAMRO │  50%  │ ⋯  [×]  │
│  2 │ Acme Publishing  │ Publisher │ SAMRO │  25%  │ ⋯  [×]  │
│  3 │ Artist Y         │ Co-writer │ ASCAP │  25%  │ ⋯  [×]  │
│────┼──────────────────┼───────────┼───────┼───────┼──────────│
│    │                  │           │       │ 100% ✓│          │
└────────────────────────────────────────────────────────────────┘
```

Each row is editable inline. The last row always shows the running total.

---

## Live Validation

As the user edits percentages, the editor validates in real time:

### Valid States

```
Total: 100%  ✓  (green checkmark, submit enabled)
Total: 100%  ✓  3 parties  (green)
```

### Warning States

```
Total: 85%  ⚠  15% unallocated  (amber, submit disabled)
                ┌──────────────────┐
                │  Distribute 15%  │  ← One-click fix
                └──────────────────┘
```

```
Total: 110%  ⚠  10% over-allocated  (red, submit disabled)
                 Reduce by 10% to continue.
```

### Fatal States

```
Total: 45%  ✕  At least 51% more required  (red, submit disabled)
Total: 200%  ✕  Over by 100%  (red, submit disabled)
```

---

## Party Rows

Each party row in the bar/table view:

```
┌──────────────────────────────────────────────────────────────────┐
│  1 │ [Kinn Timo        ▼]  │ [Writer ▼]  │ [SAMRO ▼]  │ [50]% │
│    │                        │              │             │       │
│    │  ─── Expanded ───────────────────────────────────── │       │
│    │  IPI: [00123456789]    │ Territory: [Worldwide ▼]  │       │
│    │  Contract: [link]      │ Notes: [optional]         │       │
│    │                        │                           │       │
│    │  ┌──────────┐  ┌──────────┐                            │       │
│    │  │  Remove  │  │  Lock %  │                            │       │
│    │  └──────────┘  └──────────┘                            │       │
└──────────────────────────────────────────────────────────────────┘
```

### Locked Percentages

A locked percentage is fixed — the auto-distribute function won't change
it. Useful when a contract specifies a fixed rate (e.g., "Publisher
always gets 25%").

```
Kinn Timo         50%  ████████████████████████  [Locked 🔒]
Acme Publishing   25%  ████████████              [Locked 🔒]
Artist Y          25%  ████████████
```

If both Kinn Timo and Acme Publishing are locked at 50% + 25% = 75%, only
the remaining 25% is distributable among unlocked parties.

---

## Auto-Split

The "Auto-Split" button distributes unallocated percentage evenly among
all unlocked parties:

```
Before:                          After:
Kinn Timo    50% (locked)        Kinn Timo    50% (locked)
Acme Pub      0%                 Acme Pub     25%
Artist Y      0%                 Artist Y     25%
Total:       50%                 Total:      100% ✓
```

Auto-split only affects unlocked parties. If all parties are locked and
the total ≠ 100%, an error is shown: "All parties are locked. Cannot
auto-split. Total: 75%."

---

## Adding a Party

```
┌──────────────────────────────────────────────────┐
│  + Add Party to Publishing Split             [×] │
│                                                    │
│  Party *                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔍 Kinn Timo                                 │  │
│  │ ─────────────────────────────────────────  │  │
│  │ ○ Kinn Timo (Artist)                        │  │
│  │ ○ Acme Publishing (Org)                     │  │
│  │ ✚ Create new party                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Type *                                             │
│  ┌──────────────────────────────────────────────┐  │
│  │ Writer                                ▼      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  PRO                                                │
│  ┌──────────────────────────────────────────────┐  │
│  │ SAMRO                                  ▼     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Share %                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ 0                                            │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Add Party                                   │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Mobile View

```
┌──────────────────────────────┐
│  Publishing Split · Lua     │
│                               │
│  ┌────────────────────────┐  │
│  │██████████░░░░░░░░░░░░░░│  │
│  │████░░░░░░░░░░░░░░░░░░░░│  │
│  │████░░░░░░░░░░░░░░░░░░░░│  │
│  └────────────────────────┘  │
│  50% · 25% · 25%             │
│  100% ✓                      │
│                               │
│  ── Parties ──               │
│                               │
│  Kinn Timo          50%      │
│  Writer · SAMRO              │
│  [Edit]                      │
│                               │
│  Acme Publishing    25%      │
│  Publisher · SAMRO           │
│  [Edit]                      │
│                               │
│  Artist Y           25%      │
│  Co-writer · ASCAP           │
│  [Edit]                      │
│                               │
│  [+ Add Party]               │
└──────────────────────────────┘
```

---

## Data Model

```typescript
interface SplitEditor {
  context: 'master' | 'publishing' | 'neighbouring' | 'mechanical';
  resourceId: string;            // Track ID or Release ID
  parties: SplitParty[];
  total: number;                 // Must equal 100
  status: 'valid' | 'under_allocated' | 'over_allocated';
}

interface SplitParty {
  id: string;
  partyId: string;               // FK to Artist or Organization
  partyName: string;
  type: string;                  // "Writer", "Publisher", "Label", "Producer", etc.
  pro?: string;                  // PRO name if applicable
  ipi?: string;
  share: number;                 // 0–100
  locked: boolean;               // If true, auto-split won't change this
  territory?: string[];          // Default: ["worldwide"]
  contractRef?: string;
}
```
