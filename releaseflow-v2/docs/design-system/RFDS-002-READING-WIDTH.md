# RFDS-002 — Reading Width

**Status:** Active
**Version:** 1.0

---

## Principle

Different information demands different widths. Stretching editorial content across the full canvas destroys legibility. Stretching tables into a reading column destroys their utility.

| Content | Width | Rationale |
|---------|------:|-----------|
| Situation (hero) | **640px** | Long lines exhaust the eye. 65 char per line. |
| Editorial copy | **640px** | Same. Read at a comfortable pace. |
| Assessment | **640px** | 2-column grid, 320px each. Comparable. |
| Actions | **640px** | Scannable. One action per line. |
| Metrics | **640px** | Inline format. Not a table. |
| Forms | **720px** | Inputs need width for labels + values. |
| Tables | **960–1120px** | Columns need horizontal room. |
| Activity | **640px** | Read-only. Compact entries. |

---

## Reading Column Standard

```
Canvas:        1280px
Margin:         80px
Content:      1120px

Reading:       640px
Left padding:  240px
Right padding: 240px
```

The reading column is centred horizontally within the content area, leaving generous empty space on both sides. This empty space is **active** — it signals that the content is the focal point, not the surrounding chrome.

---

## When Reading Width Fails

### Too wide
- 1000px+ → eye loses its place when returning to the start of a line
- 800px+ → sentences feel exhausting to read
- No tracking of characters per line

### Too narrow
- <500px → lines break too often, disrupting flow
- <400px → vertical rhythm dominates, text feels cramped

### Just right
- 640–720px → 60–80 characters per line → natural reading rhythm
- Enough width for an editorial feel
- Empty space on sides reinforces focus

---

## Per-Page Mapping

### Operations Center

| Section | Width | Justification |
|---------|------:|---------------|
| Hero briefing | 640px | Editorial |
| Assessment grid | 640px (2 × 320px) | Comparable items |
| Actions list | 640px | Scannable, one per line |
| Metrics inline | 640px | Not a table |
| Active Releases table | 960px | Multi-column data |
| Attention panel | 640px | Same context |
| Activity feed | 640px | Compact entries |

### Release Workspace

| Section | Width |
|---------|------:|
| Release hero | 960px (context rail alongside) |
| Tab content | 960–1120px (full context) |
| Context rail | 360px (fixed) |

### Artist Workspace

| Section | Width |
|---------|------:|
| Artist hero | 960px (context rail alongside) |
| Discography | 960–1120px (table) |
| Credits | 960px |
| Press Kit | 720px (form-like) |

---

## Responsive Width Behaviour

Reading columns do NOT scale proportionally with viewport.

| Viewport | Reading Column |
|----------|----------------:|
| ≥1024px (desktop) | 640px |
| 768–1023px (laptop) | 640px |
| 640–767px (tablet) | 100% (within margins) |
| <640px (mobile) | 100% (within margins) |

The reading column stays at 640px until the canvas itself drops below ~700px. On smaller screens, the column fills the available width. This preserves the reading experience.

Evidence widths (tables) CAN scale. On mobile, tables collapse to cards or horizontal scroll.

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong |
|-------------|---------------|
| Full-width body text across 1280px | Eye loses place. Line too long. |
| Reading column at 400px | Lines too short. Vertical choppiness. |
| Mixing reading and evidence widths in the same paragraph | Eye cannot establish a rhythm. |
| Tables stretched to 1200px+ | Reader's eye loses column alignment. |
| No reading column at all | Everything competes equally. Nothing wins. |

---

## Validation

- [ ] No paragraph exceeds 720px wide
- [ ] No table is narrower than 960px on desktop
- [ ] No form input is inside a column wider than 800px
- [ ] Empty space flanks every reading column
- [ ] Every page has a documented reading column width
