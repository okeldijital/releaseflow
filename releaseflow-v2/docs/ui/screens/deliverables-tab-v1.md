# Deliverables Tab — High-Fidelity Spec

## Route

`/releases/[id]/deliverables`

## Backend Entity Validation

| Entity | Source | Validated |
|--------|--------|-----------|
| Workflow | `releases/{id}/workflows` (defines required deliverables per stage) | ✅ |
| Stage | `releases/{id}/stages` (deliverable belongs to a stage) | ✅ |
| Task | `releases/{id}/tasks` (tasks can reference deliverables) | ✅ |
| Deliverable | `releases/{id}/deliverables` (primary entity) | ✅ |
| Activity | `activity` log (upload, version, approval logged) | ✅ |
| Dependency | `releases/{id}/dependencies` (deliverable can depend on another) | ✅ |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  release workspace · Content area                                         │
│                                                                           │
│  Deliverables · Lua – The Fading Light                                   │
│  ────────────────────────────────────────────────────────────────────     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Group by: [Audio ▼]  Filter: [All Statuses ▼]                     │  │
│  │ h 40px · p 0 12px · border-b 1px #E4E4E7                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Audio ──────────────────────────────────── 4 of 5 met ────────────   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Deliverable            │ Status   │ Version│ Owner   │ Due   │    │ │
│  │─────────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ✓ Raw stems            │ ● Granted│ v2     │ 👤 ProdZ│ Aug 15│    │ │
│  │    WAV 24/48 · per track│          │ T1-T5  │         │       │    │ │
│  │    ─────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ✓ Stereo mix           │ ● Granted│ v1     │ 👤 Sam W│ Aug 20│    │ │
│  │    WAV 24/48 · per track│          │ T1-T5  │         │       │    │ │
│  │    ─────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ◐ Master file          │ ◐ Submitt│ v1     │ 👤 Sam W│ Aug 25│    │ │
│  │    WAV 16/44.1 · T1-T4  │          │ T1-T4  │         │ 🔴    │    │ │
│  │    ⚠ Track 5 pending    │          │        │         │       │    │ │
│  │    ─────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ◐ Instrumental         │ ◐ Submitt│ v1     │ 👤 ProdZ│ Sep 05│    │ │
│  │    WAV 16/44.1 · T1-T3  │          │ T1-T3  │         │ 🟢    │    │ │
│  │    ○ Optional            │          │        │         │       │    │ │
│  │    ─────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ✕ Reference mix        │ ✕ Missing│ —      │ 👤 Sam W│ Aug 20│    │ │
│  │    WAV 24/48 · optional │          │        │         │ 🔴    │    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Artwork ───────────────────────────────────── 1 of 2 met ─────────   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Deliverable            │ Status   │ Version│ Owner   │ Due   │    │ │
│  │─────────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ✓ Cover art            │ ● Granted│ v3     │ 👤 Taylor│ Sep 01│    │ │
│  │    JPG 3000×3000 · 4.2MB│          │        │         │       │    │ │
│  │    ─────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ○ Booklet               │ ○ Pending│ —      │ 👤 Taylor│ Sep 10│    │ │
│  │    PDF · optional        │          │        │         │ 🟢    │    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Video ───────────────────────────────────── 0 of 1 met ───────────   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  ○ Music video (optional) │ ○ Pending│ —   │ —       │ —     │    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Distribution ────────────────────────────── 2 of 3 met ───────────   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Deliverable            │ Status   │ Version│ Owner   │ Due   │    │ │
│  │─────────────────────────┼──────────┼────────┼─────────┼───────│    │ │
│  │  ✓ UPC code             │ ● Granted│ —      │ 👤 Alex │ Sep 01│    │ │
│  │  ✓ ISRC codes           │ ● Granted│ —      │ 👤 Alex │ Sep 01│    │ │
│  │  ✕ Metadata sheet       │ ✕ Missing│ —      │ 👤 Alex │ Sep 10│    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────   │
│  Required: 11  ·  Granted: 7  ·  Submitted: 2  ·  Pending: 1  ·  Miss: 1 │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │  + Add Deliverable                                           │        │
│  └──────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Spacing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Group bar                                                               │
│  │ Height: 40px                                                          │
│  │ Padding: 0 12px                                                       │
│  │ Border-bottom: 1px solid #E4E4E7                                      │
│  │                                                                            │
│  Group section                                                            │
│  │ Group header: h 36px · p 8px 12px · bg #F4F4F5                      │
│  │ Group header text: Label 12px/500 · #52525B                          │
│  │ Group completion: Body Small 12px/400 · #52525B · aligned right      │
│  │ Completion bar: h 4px · radius 2px · below header                    │
│  │ Section gap: 24px (xl) between groups                                │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Table rows                                                              │
│  │ Row height: variable (52–64px depending on content)                  │
│  │ Row padding: 10px 12px                                               │
│  │ Row border-bottom: 1px solid #F1F5F9 (light border)                  │
│  │ Status badge: inline, mr 8px                                          │
│  │ Version badge: inline                                                 │
│  │ Sub-text line: mt 2px · Body Small 12px · #A1A1AA                    │
│  └────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  Summary bar                                                             │
│  │ Height: 36px · p 8px 12px · bg #FAFAFA                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                │ Token         │ Size / Weight     │ Color     │
│────────────────────────┼───────────────┼───────────────────┼───────────│
│ Group header name      │ Label · 600   │ 12px / 500        │ #52525B   │
│ Group completion count │ Body Small    │ 12px / 400        │ #52525B   │
│ Deliverable name       │ Body · 600    │ 14px / 600        │ #18181B   │
│ Deliverable spec       │ Body Small    │ 12px / 400        │ #A1A1AA   │
│ Version number         │ Caption       │ 11px / 400        │ #52525B   │
│ Owner name             │ Body Small    │ 12px / 400        │ #52525B   │
│ Due date               │ Body Small    │ 12px / 400        │ urgency   │
│ Status badge text      │ Label         │ 12px / 500        │ status    │
│ Summary label          │ Label         │ 12px / 500        │ #52525B   │
│ Summary count          │ Body · 600    │ 14px / 600        │ #18181B   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Colors

### Deliverable Status

```
Status      │ Icon │ Row bg       │ Badge bg     │ Badge text
────────────┼──────┼──────────────┼──────────────┼───────────
Granted     │ ●    │ #F0FDF4      │ #DCFCE7      │ #16A34A
Submitted   │ ◐    │ #F5F3FF      │ #EDE9FE      │ #7C3AED
Pending     │ ○    │ #FFFFFF      │ #F4F4F5      │ #52525B
Missing     │ ✕    │ #FEF2F2      │ #FEE2E2      │ #DC2626
Rejected    │ ✕    │ #FEF2F2      │ #FEE2E2      │ #DC2626
Optional    │ ◐    │ #FAFAFA      │ #F4F4F5      │ #A1A1AA
```

### Group Header

```
Status      │ Background    │ Border       │ Completion Bar
────────────┼───────────────┼──────────────┼───────────────
Default     │ #F4F4F5       │ #E4E4E7      │ #16A34A / #7C3AED / #D97706
Collapsed   │ #FFFFFF       │ #E4E4E7      │ (hidden)
```

---

## Deliverable Row Anatomy

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌──── Row: h auto · p 10px 12px ──────────────────────────────────────┐ │
│  │                                                                       │ │
│  │   ● Stems              ← Status dot + Deliverable name (Body 14/600) │ │
│  │     WAV 24/48 · p/track ← Spec line (Body Small 12px · #A1A1AA)    │ │
│  │                                                                       │ │
│  │                                 ┌──────┐ ┌──────┐                    │ │
│  │                                 │ v2   │ │ 👤 PZ│  ← Badges          │ │
│  │                                 └──────┘ └──────┘                    │ │
│  │                                 Aug 15 · 🔴 Ovrdue  ← Due date       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Column Layout (per row)

```
Columns:  ┌──── Deliverable ────────────┬── Status ──┬ Version ┬ Owner ┬ Due ┐
Weights:  40% (name + spec line)        15%          10%       15%     20%

All columns right-aligned except Deliverable (left).
Status: badge pill.
Version: "v2" or "—" in Caption 11px.
Owner: avatar 20px + name or "—".
Due: date + urgency dot.
```

---

## States

| State | Condition | Visual |
|-------|-----------|--------|
| Default | Deliverables exist from template | Full table as shown |
| Group collapsed | Click group header | Rows hidden. Completion bar remains. |
| Group expanded | Click collapsed header | Rows revealed. |
| Empty (no deliverables) | Template didn't generate any | "No deliverables yet. Deliverables are created automatically when stages progress. Complete tasks in the Planning stage to see your first deliverables." |
| Empty group | Group has 0 items | Group hidden from the list. |
| Filtered by status | Status filter active | Only matching rows shown. Groups with 0 matching rows hidden. |
| Deliverable detail open | Row clicked | Slide-out panel with version history, file preview, review actions. |
| Row hover | Cursor over row | Row bg → #F5F3FF. Quick actions appear: [Download] [View] [Edit]. |

---

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Row | Click | Open deliverable detail panel (version history + preview + review). |
| Group header | Click | Collapse/expand group. State persists per session. |
| Status badge | Click | Filter by that status. |
| "Granted" badge | Hover | Tooltip: "Approved by Sam A&R · Aug 15." |
| "Missing" badge | Click | "Assign Owner" modal opens. |
| "+ Add Deliverable" | Click | Modal: select type, set required/optional, assign owner, set due date. |
| Group by dropdown | Change | Reorganize rows: by category (Audio/Artwork/Video/Distribution) or by stage. |
| Version badge | Click | Open version panel (doc 36). |

---

## Deliverable Detail Panel (Row Click)

```
┌──────────────────────────────────────────────────────────────────┐
│  Cover Art · v3                                         [×]      │
│  ───────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │           [Cover Art preview · 3000×3000 JPG]            │    │
│  │           4.2 MB · Uploaded Aug 14 by Taylor             │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ── Details ────────────────────────────────────────────────────  │
│  Format: JPG · 3000×3000 · sRGB · 300 DPI                       │
│  Stage: Artwork · Owner: Taylor · Due: Sep 01                    │
│                                                                   │
│  ── Version History ────────────────────────────────────────────  │
│  v3 · ◐ Submitted · Aug 14 · Taylor · 4.2 MB    [Preview]       │
│  v2 · ✅ Approved · Aug 10 · Taylor · 4.0 MB     [Preview]       │
│  v1 · ✕ Rejected · Aug 05 · Taylor  · 3.8 MB     [Preview]       │
│                                                                   │
│  ── Actions ────────────────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │ Download │ │ Upload v4│ │ Submit   │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1024px | Table layout with 5 columns. Grouped by category. |
| 768–1023px | Table collapses to card layout. One deliverable = one card. |
| <768px | Accordion groups. Each group expands to show deliverable cards. Full-width cards. |

---

## CSS Implementation

```css
.deliverables-list {
  padding: 16px 0;
}

.deliverable-group {
  margin-bottom: 24px;
  border: 1px solid #E4E4E7;
  border-radius: 8px;
  overflow: hidden;

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #F4F4F5;
    cursor: pointer;
    user-select: none;
    height: 36px;

    .group-name {
      font: var(--text-label);
      font-weight: 500;
    }

    .group-completion {
      font: var(--text-body-sm);
      color: #52525B;
    }

    &:hover { background: #EBEBEB; }
  }

  .completion-bar {
    height: 4px;
    border-radius: 2px;
    margin: 0 12px 8px;
    transition: width 300ms ease;
  }
}

.deliverable-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 1fr;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #F1F5F9;
  transition: background 100ms ease;
  cursor: pointer;

  &:hover { background: #F5F3FF; }

  &.granted  { background: #F0FDF4; &:hover { background: #DCFCE7; } }
  &.missing  { background: #FEF2F2; &:hover { background: #FEE2E2; } }
  &.submitted { background: #F5F3FF; &:hover { background: #EDE9FE; } }
  &.optional { background: #FAFAFA; }

  .deliverable-name {
    font: var(--text-body);
    font-weight: 600;
  }

  .deliverable-spec {
    font: var(--text-body-sm);
    color: #A1A1AA;
    margin-top: 2px;
  }

  .status-badge {
    display: inline-block;
    font: var(--text-label);
    padding: 2px 10px;
    border-radius: 9999px;
    text-align: center;
  }

  .version-badge {
    font: var(--text-caption);
    color: #52525B;
  }

  .owner { font: var(--text-body-sm); }
  .due-date { font: var(--text-body-sm); }
}

.summary-bar {
  padding: 8px 12px;
  background: #FAFAFA;
  display: flex;
  gap: 16px;
  font: var(--text-label);
  color: #52525B;
  border-top: 1px solid #E4E4E7;

  .summary-count { font-weight: 600; color: #18181B; }
}
```
