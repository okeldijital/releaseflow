# 06 — Typography

## Font Stack

```
Primary:  Inter (sans-serif)
Mono:     JetBrains Mono (code, ISRC/UPC, file paths)
Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Helvetica, Arial, sans-serif
```

Inter is the only typeface used for UI text. JetBrains Mono is reserved
for machine-readable values: ISRC codes, UPC codes, IPI numbers, file
paths, and technical metadata.

---

## Type Scale

All sizes in rem with pixel equivalents at 16px base. Weights follow
Inter's available weights: 400 (Regular), 500 (Medium), 600 (SemiBold),
700 (Bold).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Token        │ Size       │ Weight     │ Line Ht   │ Letter    │ Usage  │
│              │ rem / px   │            │ rem / px  │ Spacing   │        │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Display      │ 2.25 / 36  │ 700 Bold   │ 2.5 / 40  │ -0.5px    │ Page   │
│              │            │            │           │           │ titles │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Heading 1    │ 1.5 / 24   │ 600 SemiB  │ 2   / 32  │ -0.25px   │ Section│
│              │            │            │           │           │ titles │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Heading 2    │ 1.25 / 20  │ 600 SemiB  │ 1.75 / 28 │ normal    │ Card   │
│              │            │            │           │           │ headers│
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Heading 3    │ 1   / 16   │ 600 SemiB  │ 1.5 / 24  │ normal    │Sub-sec │
│              │            │            │           │           │ titles │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Body Large   │ 1   / 16   │ 400 Reg    │ 1.5 / 24  │ normal    │Long-frm│
│              │            │            │           │           │ text   │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Body         │ 0.875 / 14 │ 400 Reg    │ 1.25 / 20 │ normal    │Primary │
│              │            │            │           │           │ text   │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Body Small   │ 0.75 / 12  │ 400 Reg    │ 1   / 16  │ normal    │Meta    │
│              │            │            │           │           │caption │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Caption      │ 0.6875 / 11│ 400 Reg    │ 0.875 / 14│ normal    │Fine    │
│              │            │            │           │           │print   │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Label        │ 0.75 / 12  │ 500 Med    │ 1   / 16  │ 0.5px     │Form    │
│              │            │            │           │           │labels  │
├──────────────┼────────────┼────────────┼───────────┼───────────┼────────┤
│ Monospace    │ 0.8125 / 13│ 400 Reg    │ 1.25 / 20 │ normal    │ISRC    │
│              │            │            │           │           │UPC     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Usage by Context

### Display (36px / 700 / 2.5 line-height)

Used once per page. Never repeated. The page title.

**Where:** Executive Dashboard title, Operations Center title, Artist
name on Artist workspace home tab.

**Example:** "Lua – The Fading Light" on the release workspace.

**Constraint:** Maximum 40 characters before line-height makes the title
excessively large. Longer titles truncate.

### Heading 1 (24px / 600 / 2 line-height)

Section titles within a page.

**Where:** "Release Readiness," "Budget Status," "Upcoming Deadlines" —
every section header in every workspace.

**Constraint:** Never skips to H3. Always H1 → H2 → H3.

### Heading 2 (20px / 600 / 1.75 line-height)

Card headers, modal titles, dialog titles.

**Where:** "Cover Art," "Mixing Stage," "Submit to DSPs?" — any
contained surface with its own title.

### Heading 3 (16px / 600 / 1.5 line-height)

Sub-section titles within cards or panels.

**Where:** "Required Deliverables," "Activity & Comments" — labels
that divide content within a container.

### Body Large (16px / 400 / 1.5 line-height)

Long-form text: descriptions, bios, feedback messages.

**Where:** Artist bio, stage description, review feedback text,
creative briefs.

**Constraint:** Maximum 72 characters per line.

### Body (14px / 400 / 1.25 line-height)

Primary text. The default for everything that isn't a heading or label.

**Where:** Table cells, task titles, contributor names, button text
(medium/large buttons), form input text, comment text, notification text.

### Body Small (12px / 400 / 1 line-height)

Secondary text. Metadata, timestamps, supporting information.

**Where:** "2 hours ago," "Uploaded by Taylor," "3 of 7 stages,"
trend indicators ("+10% this week").

### Caption (11px / 400 / 0.875 line-height)

Fine print. Used sparingly.

**Where:** Legal notices, "Last updated 3 minutes ago," version numbers
in file lists ("v3"), character count limits on text inputs.

### Label (12px / 500 / 1 line-height)

Form labels, badge text, status indicators. All-caps where used for
badges.

**Where:** "TITLE," "DUE DATE," release status "DRAFT," stage status
"IN PROGRESS," column headers.

### Monospace (13px / 400 / 1.25 line-height)

Machine-readable values. Never used for human-readable text.

**Where:** ISRC codes (`USABC2500001`), UPC codes, IPI numbers,
file paths, technical metadata.

---

## Hierarchy Rules

1. **Never skip a level.** H1 → H2 → H3. Display can stand alone.
2. **One Display per page.** If the page has no title area, use H1.
3. **Body is the default.** If you're not sure which style to use, use
   Body (14px/400). Most text on screen is Body.
4. **Label is never used for body text.** Labels are 500 Medium. Using
   them for reading text makes everything feel like a form field.
5. **Caption is rare.** It exists for legal text, version numbers, and
   character counts. If you're using Caption for regular UI text,
   reconsider.

---

## Link Styling

| State | Style |
|-------|-------|
| Default | Primary color `#7C3AED`, no underline |
| Hover | Underline appears |
| Active | Darken to `#6D28D9` |
| Visited | No change (B2B app — visited state not relevant) |
| Focus | 2px Primary Muted ring |

---

## Truncation

| Context | Method |
|---------|--------|
| Single line (tables, cards) | Ellipsis: `text-overflow: ellipsis` |
| Multi-line (bios, descriptions) | Line clamp at 2 lines: `-webkit-line-clamp: 2` |
| Mobile titles | Truncate to fit with ellipsis. Full title in tooltip. |

---

## CSS Custom Properties

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
               Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;

  --text-display: 700 2.25rem/2.5rem var(--font-sans);
  --text-h1:      600 1.5rem/2rem var(--font-sans);
  --text-h2:      600 1.25rem/1.75rem var(--font-sans);
  --text-h3:      600 1rem/1.5rem var(--font-sans);
  --text-body-lg: 400 1rem/1.5rem var(--font-sans);
  --text-body:    400 0.875rem/1.25rem var(--font-sans);
  --text-body-sm: 400 0.75rem/1rem var(--font-sans);
  --text-caption: 400 0.6875rem/0.875rem var(--font-sans);
  --text-label:   500 0.75rem/1rem var(--font-sans);
  --text-mono:    400 0.8125rem/1.25rem var(--font-mono);

  --leading-display: 2.5rem;
  --leading-h1:      2rem;
  --leading-h2:      1.75rem;
  --leading-h3:      1.5rem;
  --leading-body-lg: 1.5rem;
  --leading-body:    1.25rem;
  --leading-body-sm: 1rem;
  --leading-caption: 0.875rem;
  --leading-label:   1rem;
  --leading-mono:    1.25rem;
}
```
