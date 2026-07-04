# PX-306 — Table Language

## Before

- Bordered container with rounded corners
- Header with background (`bg-surface-50`)
- Heavy column headers: `text-xs font-semibold uppercase tracking-wider`
- Row separators: `border-surface-100`
- CRUD grid aesthetic

## After

### Container
- Removed outer border
- Removed rounded corners
- Removed background
- Table sits directly in page whitespace

### Header
- Reduced to `text-[10px] font-medium uppercase tracking-wider text-text-400`
- No background
- Minimal border: `border-surface-200/50`
- Sort icon reduced to `h-3 w-3`

### Rows
- Separator reduced to `border-surface-100/40`
- Hover reduced to `hover:bg-surface-50/50`
- Text weight normal (`font-normal` via inherited)
- Critical health shown via colored dot + text, not heavy badge

### Columns
- Release column: title + subtitle as primary narrative
- Health column: colored dot + state text (no pill)
- Stage column: plain text
- Deadline column: colored dot + relative date
- Owner column: muted text

## Definition of Done

The eye reads rows as operational narratives before columns.

## Status

✅ Complete
