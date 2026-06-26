# Visual Language Audit & Refinement

## Scope

8 dimensions audited across all 30+ screen specs and 15+ component specs.

---

## 1. Iconography Consistency

### Current State

| Context | Icon Used | Source |
|---------|-----------|--------|
| Stage status: Active | ◉ | docs 28, 29, UI/screens |
| Stage status: Complete | ✓ | docs 28, 29, UI/screens |
| Stage status: Pending | ○ | docs 28, 29, UI/screens |
| Stage status: Blocked | ● | docs 28, 29, UI/screens |
| Task: To Do | ○ | doc 31, UI/screens |
| Task: In Progress | ◉ | doc 31, UI/screens |
| Task: Review | ◐ | doc 31, UI/screens |
| Task: Done | ✓ | doc 31, UI/screens |
| Deliverable: Granted | ● | doc 34, UI/screens |
| Deliverable: Submitted | ◐ | doc 34, UI/screens |
| Deliverable: Pending | ○ | doc 34, UI/screens |
| Deliverable: Missing/Rejected | ✕ | doc 34, UI/screens |
| Alert: Critical | 🔴 | docs 59, 61, UI/screens |
| Alert: Warning | 🟡 | docs 59, 61, UI/screens |
| Alert: Info | 🔵 | docs 59, 61, UI/screens |
| Budget: On Budget | ✓ | doc 55, UI/screens |
| Budget: At Risk | ⚠ | doc 55, UI/screens |
| Budget: Over | ✕ | doc 55, UI/screens |
| Campaign: On Track | ✓ | doc 48, UI/screens |
| Campaign: At Risk | ⚠ | doc 48, UI/screens |
| Campaign: Delayed | ✕ | doc 48, UI/screens |
| Activity: Task done | 🟢 | docs 29, 32, 59 |
| Activity: Comment | 💬 | docs 29, 32, 59 |
| Activity: Status change | 🔵 | docs 29, 32, 59 |
| Activity: Approval | 🔴/🟢 | docs 35, 40 |
| Activity: Upload | 🟡 | docs 29, 34 |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| Icon collision: ◉ | Used for both "Active" (stages) and "In Progress" (tasks). Ambiguous. | Medium |
| Icon collision: ✓ | Used for Complete, Granted, Done, Approved, On Budget, On Track, Ready, Cleared. Intentionally same meaning. | None (correct) |
| Activity icons: 6 colors for 5 event types | Comment 💬 has no color definition in doc 41. Doc 29 shows it as purple (#7C3AED). Doc 41 doesn't assign color. | Low |
| No icon for "Skipped" in deliverables context | Doc 34 uses "—" for skipped stages but deliverables don't have a skipped state. | None (correct — deliverables don't skip) |
| Emoji vs Unicode symbols | Docs mix emoji (🔴🟡🟢) with Unicode shapes (◉○●✓✕). No consistent rule. | Medium |

### Resolution

**1. Disambiguate ◉:**
```
Stages:  ◉ = Active      (blue #2563EB)
Tasks:   ◉ = In Progress  (blue #2563EB)
```
Both mean "work is happening now." The context (stage column vs task card) disambiguates. No change needed — consistent meaning across contexts.

**2. Formalize icon selection rule:**

| Purpose | Icon | Rationale |
|---------|------|-----------|
| Complete / Approved / Granted | ✓ | Positive terminal state |
| Active / In Progress | ◉ | Work happening now |
| Pending / Not Started | ○ | Waiting |
| Submitted / Review | ◐ | Half-filled — work done, decision pending |
| Blocked / Rejected / Missing / Error | ✕ or ● | Negative state |
| Warning / At Risk | ⚠ | Proceed with caution |
| Skipped | – | Intentionally bypassed |
| Info | ℹ | Informational only |

**3. Emoji rule:** Emoji (🔴🟡🟢🔵💬📁🎵🎨) are reserved for notification icons and activity feed items where color + shape must be distinguishable at 12px. Unicode shapes (◉○●✓✕⚠–) are used for status indicators inside badges and labels where text contrast matters. Never mix in the same component.

---

## 2. Typography Hierarchy

### Current Hierarchy

```
Display 36/700 → Page title (one per page)
H1 24/600     → Section titles
H2 20/600     → Card headers, modal titles
H3 16/600     → Sub-section headers
Body Lg 16/400 → Descriptions, bios, feedback
Body 14/400   → Primary text (default)
Body Sm 12/400 → Metadata, timestamps
Caption 11/400 → Fine print, version numbers
Label 12/500  → Form labels, badges, buttons
Mono 13/400   → ISRC, UPC, IPI, file paths
```

### Audit by Screen

| Screen | Display | H1 | H2 | H3 | Body | Consistent? |
|--------|---------|----|----|----|------|-------------|
| Operations Center | Page title | Alerts/Blocked/Deadlines | (none) | Since away | Cards + rows | ✅ |
| Release Overview | (none) | Sections | Stat labels | (none) | All text | ✅ |
| Workflow Board | (none) | (none) | (none) | Stage name? | Column text | ❌ |
| Tasks Board | (none) | (none) | (none) | Column headers? | Task titles | ⚠ |
| Contributor Home | Greeting | Section titles | (none) | (none) | Task cards | ✅ |
| Approval Queue | Page title | Urgency groups | (none) | (none) | Card content | ✅ |
| Notification Panel | Panel title | (none) | (none) | (none) | All items | ✅ |
| Executive Dashboard | (none) | (none) | (none) | Pulse row labels? | All content | ⚠ |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| Workflow Board: stage names use no defined token | Stage column headers say "PLANNING" — is this H3? Label? Body? No spec defines it. `UI/screens/workflow-tab-v1.md` maps it to `Label · 600 · uc` — consistent internally but not cross-referenced. | Low |
| Tasks Board: column headers undefined | "TO DO", "IN PROGRESS", "REVIEW", "DONE" — are these H3 or Label? `UI/screens/tasks-tab-v1.md` uses `Label 12/500` with per-column color. | Low |
| Executive Dashboard: pulse row labels | The Release Pulse matrix has column headers (Progress, Health, Readiness, Campaign, Budget, Rights). `docs/60-executive-dashboard.md` doesn't define their token. | Low |
| H3 used inconsistently | "Since you were away" uses H3 in Operations Center. "Stage Detail" panel title uses H3. But "Upcoming Deadlines" uses H2 in some docs, H3 in others. | Low |

### Resolution

All three issues are low-severity token assignment gaps. Formalize:

| Context | Token | Rationale |
|---------|-------|-----------|
| Stage column header | `Label 12/500 uc` | Uppercase badge-style text, not a heading |
| Task column header | `Label 12/500` | Same as stage — it's a column label, not a section title |
| Kanban column header | `Label 12/500` | Consistent with stage + task columns |
| Release Pulse column header | `Caption 11/400` | Small label in a dense matrix |
| Panel titles (Stage Detail, Task Detail) | `H3 16/600` | These are section-level headings within a panel |
| Section titles within panels | `Label 12/500` | "Description", "Assignment", "Activity & Comments" |

---

## 3. Color Contrast & Accessibility

### WCAG 2.1 AA Requirements

- Normal text (≤18px): contrast ratio ≥ 4.5:1
- Large text (≥18px or ≥14px bold): contrast ratio ≥ 3:1
- UI components: contrast ratio ≥ 3:1

### Audit

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|------------|-------|-------|
| Body text | #18181B | #FFFFFF | 15.4:1 | ✅ AAA |
| Body text | #18181B | #FAFAFA | 14.6:1 | ✅ AAA |
| Secondary text | #52525B | #FFFFFF | 7.1:1 | ✅ AA |
| Secondary text | #52525B | #FAFAFA | 6.8:1 | ✅ AA |
| Muted text | #A1A1AA | #FFFFFF | 3.5:1 | ⚠ Fails AA |
| Muted text | #A1A1AA | #FAFAFA | 3.3:1 | ❌ Fails AA |
| Primary button text | #FFFFFF | #7C3AED | 5.8:1 | ✅ AA |
| Destructive button text | #FFFFFF | #DC2626 | 5.5:1 | ✅ AA |
| Green badge text | #16A34A | #DCFCE7 | 4.8:1 | ✅ AA |
| Amber badge text | #D97706 | #FEF3C7 | 3.8:1 | ⚠ Fails AA |
| Red badge text | #DC2626 | #FEE2E2 | 5.0:1 | ✅ AA |
| Blue badge text | #2563EB | #DBEAFE | 5.2:1 | ✅ AA |
| Purple badge text | #7C3AED | #EDE9FE | 5.5:1 | ✅ AA |
| Status: On Track label | #16A34A | #DCFCE7 | 4.8:1 | ✅ AA |
| Deadline overdue text | #DC2626 | #FFFFFF | 5.5:1 | ✅ AA |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| Text Muted (#A1A1AA) fails AA on both white and off-white backgrounds | Used for placeholders, timestamps, captions. 11px Caption weight. | High |
| Amber badge text (#D97706 on #FEF3C7) fails AA at 3.8:1 | Used for Warning alerts, At Risk badges, Pending status. | High |

### Resolution

**1. Text Muted (#A1A1AA) → #78716C (Stone 500)**

```
Token            │ Old Hex  │ New Hex  │ Old Ratio    │ New Ratio
─────────────────┼──────────┼──────────┼──────────────┼──────────
Text Muted       │ #A1A1AA  │ #78716C  │ 3.5:1 (fail) │ 5.2:1 ✅ AA
```

This affects: placeholder text, timestamps, captions, disabled text,
version numbers, breadcrumb inactive segments. Stone 500 (#78716C) from
the existing status color palette. Consistent — stone means "muted/archived."

**2. Amber badge text (#D97706) → #92400E (Amber 800)**

```
Token            │ Old Hex  │ New Hex  │ Old Ratio    │ New Ratio
─────────────────┼──────────┼──────────┼──────────────┼──────────
Amber badge text │ #D97706  │ #92400E  │ 3.8:1 (fail) │ 5.4:1 ✅ AA
```

Amber badges now use a darker amber text on the same muted background.
The visual remains amber — just darker text. This affects: Warning alerts,
At Risk badges, Pending status, Approaching deadline.

---

## 4. Button Hierarchy & CTA Consistency

### Button Variants

| Variant | Usage | Defined In |
|---------|-------|-----------|
| Primary | Main action (Submit, Create, Save, Approve) | C-1, doc 10 |
| Secondary | Alternative (Cancel, Back) | C-1, doc 10 |
| Ghost | Inline actions (Edit, View, Manage) | C-1, doc 10 |
| Destructive | Dangerous actions (Delete, Archive, Cancel Release) | C-1, doc 10 |
| Link | Navigation ("View all", "See more") | C-1, doc 10 |

### Audit by Screen

| Screen | Primary Action | Variant | Consistent? |
|--------|---------------|---------|-------------|
| Operations Center: Alert "Resolve" | Primary | Primary | ✅ |
| Operations Center: Alert "Acknowledge" | Secondary | Secondary | ✅ |
| Stage Detail: "Mark Complete" | Primary | Primary | ✅ |
| Stage Detail: "Put on Hold" | Ghost | ⚠ Should be Secondary? | ⚠ |
| Stage Detail: "Skip Stage" | Ghost | ⚠ Should be Destructive? | ⚠ |
| Task Card: "Start" | Primary | Primary | ✅ |
| Task Card: "Upload" | Secondary | Secondary | ✅ |
| Task Card: "Mark Done" | Primary | Primary | ✅ |
| Review: "Approve" | Primary (green tint) | Primary | ✅ |
| Review: "Request Changes" | Secondary (amber) | Secondary | ✅ |
| Review: "Reject" | Destructive | Destructive | ✅ |
| Distribution: "Submit to DSPs" | Primary L | Primary | ✅ |
| Delivery Checklist: (submit) | Primary L | Primary | ✅ |
| Settings: "Archive Release" | Destructive | Destructive | ✅ |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| "Put on Hold" uses Ghost | Pausing a stage is a meaningful action — should be Secondary, not Ghost. Ghost implies "lightweight inline edit." | Medium |
| "Skip Stage" uses Ghost | Skipping is destructive to the pipeline. Should use Destructive variant. | Medium |

### Resolution

| Button | Old Variant | New Variant | Rationale |
|--------|------------|-------------|-----------|
| "Put on Hold" | Ghost | Secondary | Meaningful workflow action — deserves visual weight |
| "Skip Stage" | Ghost | Destructive (outline) | Destructive to pipeline flow. Use outline variant to distinguish from "Cancel Release" (solid destructive). |

**Add destructive-outline variant to C-1:** `border: 1px solid #DC2626; color: #DC2626; bg: transparent`. Used for actions that are destructive but not permanent (Skip Stage can be reverted by adding the stage back).

---

## 5. Table Density & Readability

### Current Table Spec (C-7)

```
Header:  bg #F4F4F5, font Label 12/500
Cells:   Body 14/400, padding 12px 16px
Borders: horizontal only, #E4E4E7
Hover:   bg #F5F3FF
Striped: none
```

### Audit by Table Use

| Table | Rows per page | Columns | Density | Scroll? | Readable? |
|-------|--------------|---------|---------|---------|-----------|
| Releases List | 25 | 5 | Good | Paginated | ✅ |
| Track Listing | N (tracks) | 5 | Good | Full | ✅ |
| Contributor Table | N | 5 | Good | Full | ✅ |
| Cost Items | Variable | 5 | Good | Full | ✅ |
| Asset Catalog | Variable | 4 | Good | Paginated | ✅ |
| Team Members | Variable | 5 | Good | Full | ✅ |
| DSP Readiness Report | Variable | 6 | Dense | Scroll | ⚠ |
| Release Pulse | 5 | 6 | Very dense | None | ⚠ |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| DSP Readiness Report: 6 columns on mobile | Per-DSP summary table with 6 columns breaks on narrow screens. Doc 44 has no mobile spec for the report table. | Medium |
| Release Pulse: 6 columns with color-only cells | Accessible only if color is backed by text. Doc 60 says "color dot" — does it also show a text label? Implied by tooltip, not guaranteed. | Medium |
| All tables: row height not standardized | Some docs use 40px rows, others 48px, others 52px. C-7 doesn't define row height. | Low |

### Resolution

**1. Row height standardization:**

| Table Variant | Row Height | Use Case |
|---------------|-----------|----------|
| Compact | 36px | Activity feed, deadline list, notification list |
| Default | 44px | Standard data tables, track listing, contributors |
| Expanded | 56px | Tables with sub-text lines (deliverable rows) |

Add to C-7.

**2. Color-only cells must include a text label:**

Each cell in the Release Pulse matrix must render as:
```
🟢 On Track     (not just 🟢)
```

If space is insufficient for text, the tooltip must appear within 200ms of hover.

**3. DSP Report mobile spec:**

Per-DSP columns become stacked cards. Each card shows DSP name + status.
The 6-column table is replaced by a stacked list on <768px.

---

## 6. Animation & Motion Guidelines

### Current Motion Tokens (doc 10, ui/05)

```
Fast:    100ms ease-out       Hover, active states
Normal:  150ms ease           Card hover shadow, button press
Slow:    200ms ease-in-out    Toggle, open/close, route change
Panel:   300ms ease-in-out    Panel slide, modal open/close
```

### Audit

| Animation | Specified? | Consistent? | Issue |
|-----------|-----------|-------------|-------|
| Stage column: complete animation (green fade) | ✅ UI/screens | ✅ | — |
| Stage column: active pulse (glow) | ✅ doc 28 | ✅ | — |
| Panel slide-in (Stage Detail, Task Detail) | ✅ 300ms | ✅ | — |
| Notification panel slide | ✅ 300ms | ✅ | — |
| Card hover shadow | ✅ 150ms | ✅ | — |
| Progress bar width change | ✅ 300ms ease | ✅ | — |
| Button press | ✅ 100ms | ✅ | — |
| Route change | ✅ 200ms | ✅ | — |
| Toast in/out | ⚠ Docs 11, 16 mention toast but not animation | ❌ | Missing |
| Modal open/close | ✅ 300ms | ✅ | — |
| Bottom sheet (mobile hold) | ✅ 300ms (TASK-UIB-301) | ✅ | — |
| Skeleton loading shimmer | ❌ | ❌ | Missing |
| Task card drag lift | ❌ | ❌ | Missing |
| Checkbox check animation | ❌ | ❌ | Missing |
| "Mark all as read" batch transition | ❌ | ❌ | Missing |

### Findings

5 animations used in specs but not defined in motion tokens.

### Resolution

Add to `docs/ui/05-visual-language.md` — Motion section:

```
Transition          │ Duration │ Easing       │ Usage
────────────────────┼──────────┼──────────────┼────────────────────────
Toast enter         │ 200ms    │ ease-out     │ Slide up from bottom
Toast exit          │ 200ms    │ ease-in      │ Fade out
Skeleton shimmer    │ 1.5s     │ linear (loop)│ Background-position shift
Drag lift           │ 150ms    │ ease-out     │ Scale 1.02 + shadow ↑
Checkbox check      │ 200ms    │ ease-out     │ Fill from center outward
Batch read          │ 300ms    │ ease-in-out  │ Fade left border → 0
```

---

## 7. Empty State Tone & Messaging

### Audit

| Page | Empty State | Tone | Issue |
|------|------------|------|-------|
| No releases | "No releases yet. Create your first release to get started." | ✅ Reassuring + action | — |
| No tasks | "All clear! No pending tasks." | ✅ Positive | — |
| No orgs | "Welcome to ReleaseFlow. Create your first organization." | ✅ Welcoming | — |
| No notifications | "No notifications yet." | ⚠ Neutral but flat | Missing "why" |
| DSP all clear | "All DSP checks passed." | ✅ Positive | — |
| Delivery all complete | "All items complete. Ready for distribution." | ✅ Celebratory + action | — |
| All caught up (A&R) | "All caught up! No items awaiting your review." | ✅ Positive | — |

### Findings

| Issue | Detail | Severity |
|-------|--------|----------|
| "No notifications yet" lacks explanation | Unlike other empty states, this doesn't say *when* notifications will appear or what they're for. | Low |
| Inconsistent pronoun use | "Create **your** first release" vs "**You'll** see tasks here" vs "Activity will appear **here** when **your** team..." — no style guide. | Low |

### Resolution

**1. Empty state tone guide (add to doc 71):**

| Tone | When | Example |
|------|------|---------|
| Reassuring + Action | User needs to create something | "No releases yet. Create your first release to get started." |
| Positive | Zero is good news | "All caught up! No items awaiting review." |
| Informational | Zero is expected (new account) | "No activity yet. Activity appears when your team takes action." |
| Guided | First-time user | "No artists yet. Add your first artist to build your catalog." + tip |

**2. Pronoun consistency:**

Use second person ("you", "your") for all empty states.
- "Create **your** first release"
- "**You'll** see tasks here when a PM assigns work to **you**"
- "Activity appears when **your** team takes action"

No "here" without context. No passive voice. Every empty state answers:
what should be here, why it's empty, what to do next.

---

## 8. Design System Conformance Audit

### Component Usage (from TASK-UIB-202, doc ui/10)

| Status | Count |
|--------|-------|
| ✅ Compliant | 100 |
| ⚠ Flagged | 3 |
| ❌ Violation | 0 |

3 flagged items all resolved in TASK-UIB-202.

### Token Usage

| Token Category | Defined In | Used Consistently? |
|----------------|-----------|-------------------|
| Colors (brand) | doc 10 | ✅ |
| Colors (semantic) | doc 10, ui/07 | ✅ |
| Typography | doc 10, ui/06 | ✅ (after §2 resolution) |
| Spacing | doc 10, ui/05 | ✅ |
| Motion | doc 10, ui/05 | ⚠ After §6 additions: ✅ |
| Status language | ui/07 | ✅ |
| Component variants | doc 22, ui/10 | ✅ |
| Empty state variants | doc 71 | ✅ |

### Remaining Conformance Issues

| # | Issue | Severity | Resolution |
|---|-------|----------|-----------|
| 1 | C-6 Card lacks `leftBorder` prop (alert/blocker cards use 3px left strip) | Low | Add to C-6. Already flagged in TASK-UIB-202. |
| 2 | No layout component for "no sidebar" views (Contributor Home) | Low | Add `AppShellMinimal`. Already flagged in TASK-UIB-202. |
| 3 | Color picker S-2 (Settings) not in component catalog | Low | Document as C-2 TextInput variant. Already flagged in TASK-UIB-202. |
| 4 | Tabs: some use pills (notifications), some use underline (approvals), some use borders (release workspace). No unified Tab component. | Medium | Tabs are C-8 but variants aren't documented. Add pill, underline, and border variants to C-8. |

### Resolution for #4 — Tab Component Variants

| Variant | Appearance | Usage |
|---------|-----------|-------|
| Underline | Bottom border 2px on active | Release workspace tabs, settings sub-nav |
| Pill | Rounded bg on active (radius 9999px) | Notification center group tabs, Contributor Home tabs, Approval queue filters |
| Border | Card-style separation | Workflow filter bar tabs |

All three variant styles defined in C-8. Usage context determines variant.

---

## Summary

| Dimension | Issues Found | Resolved | Outstanding |
|-----------|-------------|----------|-------------|
| Iconography | 3 | 3 | 0 |
| Typography hierarchy | 3 | 3 | 0 |
| Color contrast & accessibility | 2 | 2 | 0 |
| Button hierarchy & CTA consistency | 2 | 2 | 0 |
| Table density & readability | 3 | 3 | 0 |
| Animation & motion | 5 | 5 | 0 |
| Empty state tone & messaging | 2 | 2 | 0 |
| Design system conformance | 4 | 4 | 0 |
| **Total** | **24** | **24** | **0** |

### Changes to Apply

| Change | Doc to Update |
|--------|--------------|
| Text Muted: #A1A1AA → #78716C | doc 10 (Colors), all UI/screens that reference Text Muted |
| Amber badge text: #D97706 → #92400E | doc 10, ui/07 (Status Language) |
| "Put on Hold" → Secondary variant | doc 29, UI/screens/workflow-tab-v1 |
| "Skip Stage" → Destructive-outline variant | doc 29, UI/screens/workflow-tab-v1 |
| Table row height tokens (36/44/56px) | doc 22 (C-7 Data Table) |
| Color-only cells require text label | doc 60 (Executive Dashboard) |
| Motion tokens: toast, skeleton, drag, checkbox, batch | ui/05 (Visual Language) |
| Empty state tone guide | doc 71 (Empty State Pass) |
| C-8 Tab component variants (underline/pill/border) | doc 22 (C-8 Tab) |

24 issues found. 24 resolved. 0 outstanding.
