# Design System

## Design Principles

1. **Purposeful** — every element has a job. No decoration for its own
   sake.
2. **Calm authority** — muted colors, generous whitespace, confident
   typography. Feels established, not trendy.
3. **Data-forward** — the content (releases, tasks, assets) takes center
   stage. UI chrome recedes.
4. **Consistent rhythm** — 4px base grid. Everything snaps to it.

---

## 1. Colors

### Brand Palette

```
Token            │ Hex       │ Usage
─────────────────┼───────────┼──────────────────────────────────────
Primary          │ #7C3AED   │ Buttons, links, active states,
                 │           │  progress indicators
                 │           │
Primary Hover    │ #6D28D9   │ Button hover / focus
                 │           │
Primary Muted    │ #EDE9FE   │ Badge backgrounds, selected rows
                 │           │
Primary Subtle   │ #F5F3FF   │ Alert banners, hover states
```

### Neutral Palette

```
Token            │ Hex       │ Usage
─────────────────┼───────────┼──────────────────────────────────────
Background       │ #FAFAFA   │ Page background
                 │           │
Surface          │ #FFFFFF   │ Cards, modals, side panels
                 │           │
Surface Muted    │ #F4F4F5   │ Table row hover, input bg
                 │           │
Border           │ #E4E4E7   │ Card borders, dividers
                 │           │
Border Light     │ #F1F5F9   │ Subtle separators
                 │           │
Text Primary     │ #18181B   │ Headings, primary body text
                 │           │
Text Secondary   │ #52525B   │ Labels, descriptions, meta
                 │           │
Text Muted       │ #A1A1AA   │ Placeholder, disabled text
                 │           │
Inverse          │ #FFFFFF   │ Text on dark backgrounds
```

### Semantic Palette

```
Token            │ Hex       │ Usage
─────────────────┼───────────┼──────────────────────────────────────
Success          │ #16A34A   │ Completed, approved, live
                 │           │
Success Muted    │ #DCFCE7   │ Success badge bg
                 │           │
Warning          │ #D97706   │ Approaching deadline, pending
                 │           │
Warning Muted    │ #FEF3C7   │ Warning badge bg
                 │           │
Error            │ #DC2626   │ Overdue, rejected, error
                 │           │
Error Muted      │ #FEE2E2   │ Error badge bg
                 │           │
Info             │ #2563EB   │ Info banners, guidance
                 │           │
Info Muted       │ #DBEAFE   │ Info badge bg
```

### Status Indicator Colors

```
Token            │ Hex       │ Meaning
─────────────────┼───────────┼──────────────────────────────────────
Status Idea      │ #8B5CF6   │ Purple — conceptual / pending
Status Active    │ #2563EB   │ Blue — in progress
Status Review    │ #D97706   │ Amber — awaiting approval
Status Done      │ #16A34A   │ Green — complete / live
Status Archived  │ #78716C   │ Stone — archived terminal
Status Blocked   │ #DC2626   │ Red — blocked / overdue
```

---

## 2. Typography

### Font Stack

```
Primary: Inter (sans-serif)
Mono:    JetBrains Mono (code, ISRC/UPC, file names)
```

### Type Scale

```
Token           │ Size    │ Weight    │ Line Ht  │ Usage
────────────────┼─────────┼───────────┼──────────┼─────────────────
Display         │ 2.25rem │ 700 Bold  │ 2.5rem   │ Page headings
                │ (36px)  │           │          │
                │         │           │          │
Heading 1       │ 1.5rem  │ 600 SemiB │ 2rem     │ Section titles
                │ (24px)  │           │          │
                │         │           │          │
Heading 2       │ 1.25rem │ 600 SemiB │ 1.75rem  │ Card headers
                │ (20px)  │           │          │
                │         │           │          │
Heading 3       │ 1rem    │ 600 SemiB │ 1.5rem   │ Sub-section
                │ (16px)  │           │          │
                │         │           │          │
Body            │ 0.875rem│ 400 Reg   │ 1.25rem  │ Paragraphs,
                │ (14px)  │           │          │  table cells
                │         │           │          │
Body Small      │ 0.75rem │ 400 Reg   │ 1rem     │ Meta, captions,
                │ (12px)  │           │          │  timestamps
                │         │           │          │
Label           │ 0.75rem │ 500 Med   │ 1rem     │ Form labels,
                │ (12px)  │           │          │  badges
                │         │           │          │
Monospace       │ 0.8125rem│ 400 Reg  │ 1.25rem  │ Codes, hashes
                │ (13px)  │           │          │
```

### Usage Rules

- **Max line length:** 72 characters for readability.
- **Heading hierarchy:** Never skip a level (H1 → H2 → H3).
- **Link style:** Primary color, underline on hover only.
- **Truncation:** Single-line with ellipsis; multi-line clamp at 2
  lines with `-webkit-line-clamp`.

---

## 3. Spacing

### 4px Grid System

```
Token   │ Pixel  │ Usage
────────┼────────┼────────────────────────────────
 0.5x   │ 2px    │ Icon gap, badge padding
 1x     │ 4px    │ Minimum spacing, inset
 2x     │ 8px    │ Tight inner padding (table cells)
 3x     │ 12px   │ Button padding, chip gap
 4x     │ 16px   │ Card padding, form spacing
 5x     │ 20px   │ Section inner padding
 6x     │ 24px   │ Between card groups
 8x     │ 32px   │ Between sections
 10x    │ 40px   │ Page section margin
 12x    │ 48px   │ Large content blocks
 16x    │ 64px   │ Page padding
 20x    │ 80px   │ Hero / empty state spacing
```

### Layout Widths

```
Token           │ Value   │ Usage
────────────────┼─────────┼──────────────────────
Content Narrow  │ 672px   │ Forms, settings
Content Default │ 896px   │ Standard pages
Content Wide    │ 1200px  │ Tables, dashboards
Content Full    │ 100%    │ Maximized views
Sidebar Width   │ 240px   │ Left navigation
Panel Width     │ 400px   │ Slide-out panels
```

---

## 4. Cards

### Default Card

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │ Card Header         [action]   │  │
│  └────────────────────────────────┘  │
│                                      │
│  Card body content with 16px         │
│  padding on all sides.               │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  Card footer with metadata           │
│  or secondary actions.               │
└──────────────────────────────────────┘

Styles:
  Background:  #FFFFFF
  Border:      1px solid #E4E4E7
  Radius:      8px
  Shadow:      0 1px 2px rgba(0,0,0,0.04)
  Padding:     16px (all sides)
  Inner gap:   12px
```

### Stat Card (Dashboard Metric)

```
┌────────────────┐
│  🎵            │
│  12            │  <- H2, semibold
│  Releases      │  <- Body, text-secondary
│  ↑ 3 this mo   │  <- Body small, success
└────────────────┘

Styles:
  Same as default card
  Icon: 32px, centered top
  Number: H2 weight 700
  Trend: small inline with arrow
```

### Clickable Card

```
  — Hover state —
┌──────────────────────────────────────┐
│  Midnight Sessions                   │
│  Album · Artist X                    │
│                                      │
│  ──[████████████░░░░░░░░]── 60%      │
│  Mastering · Due Jun 30              │
└──────────────────────────────────────┘

Styles:
  Hover:  subtle border color change
            (Primary Muted)
  Cursor: pointer
  Shadow: 0 4px 12px rgba(0,0,0,0.08) on hover
  Transition: 150ms ease
```

---

## 5. Tables

### Data Table

```
┌─────────────────────────────────────────────────────────────┐
│  Releases                              Search 🔍  Filters ▼│
│                                                             │
│  ☐ │ Title          │ Artist     │ Status     │ Stage  │ > │
│  ───┼───────────────┼────────────┼────────────┼────────┼───│
│  ☐ │ Midnight...    │ Artist X   │ 🟡 In Prog │ Mixing │ > │
│  ☐ │ Summer EP      │ Artist Y   │ 🔴 At Risk │ Artw.. │ > │
│  ☐ │ Lost Tracks    │ Various    │ 🟢 Live     │ —      │ > │
│  ☐ │ Neon Remix     │ Artist Z   │ ⚪ Idea     │ —      │ > │
│                                                             │
│  Showing 4 of 24               ← 1  2  3 ... 6 →           │
└─────────────────────────────────────────────────────────────┘

Styles:
  Header:     Background #F4F4F5, label font (12px/500)
  Cells:      Body font (14px/400), padding 12px 16px
  Borders:    Horizontal only, #E4E4E7
  Hover row:  Background #F5F3FF (Primary Subtle)
  Selected:   Background #EDE9FE (Primary Muted), left border
  Checkbox:   Custom styled, Primary color
  Striped:    No stripes — cleaner B2B look
```

### Table Variants

| Variant          | Use Case                                 |
|------------------|------------------------------------------|
| Default          | Release list, asset catalog, task board  |
| Compact          | Activity feed, audit log (smaller cells)  |
| Tree             | Workflow stages with nested tasks        |
| Expandable       | Release row expands to show tracks       |
| Sortable         | Click header to sort (show sort icon)    |
| Filterable       | Column-level dropdown filters            |

---

## 6. Forms

### Text Input

```
  Label (12px/500/text-secondary)
  ┌────────────────────────────────────┐
  │ Placeholder text                   │
  │                                    │
  └────────────────────────────────────┘
  Helper text or error message (12px)

  — States —
  Default:   Border #E4E4E7, bg #FFFFFF
  Focus:     Border Primary, ring 2px Primary Muted
  Hover:     Border #A1A1AA
  Error:     Border Error, ring 2px Error Muted
  Disabled:  Bg #F4F4F5, text #A1A1AA
  Filled:    Bg #FFFFFF, text Text Primary

  — Dimensions —
  Height:  40px
  Padding: 0 12px
  Radius:  6px
  Font:    Body (14px/400)
```

### Select

```
  Label
  ┌──────────────────────────┬──┐
  │ Select an option    ▼    │  │
  └──────────────────────────┴──┘

  — Dropdown —
  ┌──────────────────────────┐
  │ Option 1                 │
  │ Option 2          ✓      │  ← selected
  │ ─────────────────        │
  │ Option 3                 │
  └──────────────────────────┘

  Styles: Input + dropdown matches input styling.
  Max height: 240px (scrollable).
```

### Date Picker

```
  ┌──────────────────────────┬──┐
  │ Aug 15, 2026        📅  │  │
  └──────────────────────────┴──┘

  — Popover Calendar —
  ┌───── May 2026 ────┐
  │ Mo Tu We Th Fr Sa Su│
  │             1  2  3 │
  │  4  5  6  7  8  9 10│
  │ 11 12 13 14 15 16 17│
  │ 18 19 20 21 22 23 24│
  │ 25 26 27 28 29 30 31│
  └────────────────────┘
```

### Toggle

```
  ○ Off          ● On

  — States —
  Off:   Bg #E4E4E7, knob #FFFFFF
  On:    Bg Primary, knob #FFFFFF
  Focus: Ring 2px Primary Muted
```

### Button System

```
  Primary              Secondary            Ghost
  ┌────────────┐      ┌────────────┐      ┌────────────┐
  │  Save       │      │  Cancel     │      │  Edit       │
  └────────────┘      └────────────┘      └────────────┘

  Destructive          Link
  ┌────────────┐      ┌────────────┐
  │  Delete     │      │  View all   │
  └────────────┘      └────────────┘

  ── Sizes ──
  S:   32px h, 8px pad   (table actions)
  M:   40px h, 12px pad  (default)
  L:   48px h, 16px pad  (hero / empty states)

  ── Primary ──
  Bg:     Primary / Primary Hover
  Text:   #FFFFFF
  Radius: 6px

  ── Secondary ──
  Bg:     #FFFFFF
  Border: #E4E4E7
  Text:   Text Primary
  Hover:  Bg #F4F4F5

  ── Ghost ──
  Bg:     transparent
  Text:   Text Secondary
  Hover:  Bg #F4F4F5

  ── Destructive ──
  Bg:     Error / Error hover
  Text:   #FFFFFF
```

---

## 7. Status Indicators

### Dot Indicators

```
●  Idea        #8B5CF6  (purple)
●  In Progress #2563EB  (blue)
●  Review      #D97706  (amber)
●  Approved    #16A34A  (green)
●  Live        #16A34A  (green)
●  Blocked     #DC2626  (red)
●  Archived    #78716C  (stone)
```

### Badges

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Mixing   │  │  Live     │  │  Overdue  │
└──────────┘  └──────────┘  └──────────┘

Styles:
  Radius:    9999px (pill)
  Padding:   2px 10px
  Font:      Label (12px/500)
  Icon:      Optional leading dot

  ── Variants ──
  Default:  Bg #F4F4F5, text Text Secondary
  Success:  Bg #DCFCE7, text #16A34A
  Warning:  Bg #FEF3C7, text #D97706
  Error:    Bg #FEE2E2, text #DC2626
  Info:     Bg #DBEAFE, text #2563EB
  Neutral:  Bg #EDE9FE, text #7C3AED
```

### Progress Bar

```
  Stage: Mastering ── 60% ──

  ┌────────────────────────────────────┐
  │████████████████░░░░░░░░░░░░░░░░░░░░│
  └────────────────────────────────────┘
    ↑ Primary color        ↑ Surface Muted bg

  Height: 6px
  Radius: 9999px
  Transition: width 300ms ease

  — Per-state color —
  In Progress:  Primary
  At Risk:      Warning
  Complete:     Success
```

### Stage Pipeline (Visual Timeline)

```
  Idea  →  Approval  →  Production  →  Recording  →  Mixing  →
  ┌──┐     ┌──────┐     ┌────────┐     ┌────────┐    ┌─────┐
  │✓ │     │  ✓   │     │   ✓    │     │  ◌     │    │   ○ │
  └──┘     └──────┘     └────────┘     └────────┘    └─────┘

  ✓ = complete (green)     ◌ = active (blue, pulse)
  ○ = pending (border)     ● = blocked (red)
```

### Empty States

```
┌────────────────────────────────────────────┐
│                                            │
│               ┌──────────┐                  │
│               │   🎵      │                  │
│               └──────────┘                  │
│                                            │
│          No releases yet                     │
│     Create your first release to start.      │
│                                            │
│                                            │
│         ┌──────────────────────┐            │
│         │  ✚ Create Release    │            │
│         └──────────────────────┘            │
│                                            │
│     💡 Tip text in info-muted background    │
│                                            │
└────────────────────────────────────────────┘

  Icon:   64px, centered, opacity 0.4
  Title:  H2, text-primary
  Body:   Body, text-secondary
  CTA:    Primary button
  Tip:    Info badge or banner below
```

---

## 8. Shadows

```
Token           │ Value                                │ Usage
────────────────┼──────────────────────────────────────┼────────────────
Shadow Sm       │ 0 1px 2px rgba(0,0,0,0.04)          │ Cards, small
Shadow Md       │ 0 4px 6px rgba(0,0,0,0.06)          │ Dropdowns
Shadow Lg       │ 0 10px 15px rgba(0,0,0,0.08)        │ Modals
Shadow Xl       │ 0 20px 25px rgba(0,0,0,0.12)        │ Slide-out panels
```

---

## 9. Motion

```
Token           │ Duration │ Easing             │ Usage
────────────────┼──────────┼────────────────────┼─────────────────
Fast            │ 100ms    │ ease-out           │ Hover, active
Normal          │ 200ms    │ ease-in-out        │ Toggle, open/close
Slow            │ 300ms    │ ease-in-out        │ Panel slide, modal
Page Transition │ 200ms    │ ease-out + fade    │ Route changes
```

---

## 10. Breakpoints

```
Token           │ Width     │ Target
────────────────┼───────────┼────────────────
Mobile          │ < 640px   │ Phone
Tablet          │ 640-1023  │ Tablet portrait
Desktop         │ 1024-1279 │ Laptop
Wide            │ ≥ 1280px  │ Desktop / ultrawide
```

---

## 11. Component Anatomy Reference

### Release Card (Kanban / List)

```
┌──────────────────────────────────────────────┐
│  Midnight Sessions  [Album]   ⚙  ...         │
│  ──────────────────────────────────────────  │
│  Artist X                         Due Jun 30 │
│                                              │
│  Stage: Mastering  ──[████████░░░░]──  60%   │
│                                              │
│  👤 Alex (PM)    ☑ 4 tasks    📎 6 assets   │
└──────────────────────────────────────────────┘
```

### Task Row

```
  ☐ Review mix master          Midnight Sess.    Jun 28   👤 Me
```

| Part        | Style                       |
|-------------|-----------------------------|
| Checkbox    | Custom primary checkbox     |
| Title       | Body (14px/400)             |
| Release     | Body small, text-secondary  |
| Due date    | Body small; red if overdue  |
| Assignee    | Avatar (24px) + name        |

### Activity Feed Item

```
  🔵 Alex Taylor approved Mastering stage
     Midnight Sessions · 2 hours ago

  Icon:  Status icon (stage color)
  Bold:  User name (600 weight)
  Body:  Action + entity
  Meta:  Body small, text-muted
```

### Asset Thumbnail

```
  ┌──────────┐
  │  🎵      │
  │  master. │
  │  wav     │
  └──────────┘
  24-bit / 48kHz
  52.3 MB · v3

  Size:   120x120px thumbnail or 80x80px list
  Type:   File format icon overlay
  Label:  Filename (truncated)
  Meta:   Specs, size, version
  Action: Download, version history, delete
```

---

## 12. Dark Mode (Future)

Not in scope for v1, but design tokens are structured to support it:

```css
:root {
  --color-bg: #FAFAFA;
}
[data-theme="dark"] {
  --color-bg: #09090B;
  --color-surface: #18181B;
  /* ... every token mirrored */
}
```
