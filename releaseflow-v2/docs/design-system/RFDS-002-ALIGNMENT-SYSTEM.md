# RFDS-002 — Alignment System

**Status:** Active
**Version:** 1.0

---

## Principle

The most overlooked aspect of the current UI.

Every page must define:
- A primary alignment line
- A secondary alignment line
- A shared left edge
- A shared right edge
- A baseline grid

Without explicit alignment, every element begins at an arbitrary position. The result is subtle visual chaos — nothing aligns with anything else, but no individual element is wrong.

---

## The Primary Line

Every page has **one primary vertical alignment line** at its left edge. This is the leftmost point of the content area, typically 32–80px from the canvas edge depending on breakpoint.

All headings begin at this line. All body text begins at this line. All input fields begin at this line. All table cells begin at this line.

```
│ Hero
│ Briefing
│ Assessment label
│ Action text
│ Table title
│ Activity heading
```

Nothing is left of the primary line except for the navigation rail. Nothing extends right of the secondary line (right margin) except for the context rail.

---

## The Secondary Line

The secondary line is the **right edge** of the content. It defines how much breathing room the content has on its right side.

For pages with a context rail (Release Workspace, Artist Workspace), the secondary line is the left edge of the context rail. The context rail itself has a defined width (360px).

For pages without a context rail (Operations Center), the secondary line is the right margin (typically 80–120px from the canvas edge).

---

## Shared Edges

### Left Edge (Primary Line)
| Element | Position |
|---------|----------|
| H1 (page title / date) | Flush left, primary line |
| H2 (section title) | Flush left, primary line |
| H3 (subsection title) | Flush left, primary line |
| Body text | Flush left, primary line |
| Form labels | Flush left, primary line |
| Table column headers | Flush left, within table |
| Table cell content | Flush left, within cell |
| Button text | Centered within button, flush left to button's container |

### Right Edge (Secondary Line)
| Element | Position |
|---------|----------|
| Right-aligned timestamps | Flush right, within column |
| Right-aligned metadata | Flush right, within column |
| Table action buttons | Flush right, within row |
| Numeric table cells | Right-aligned for reading |

---

## Baseline Grid

Typography and components align to a 4px baseline grid within a section.

```
Element heights are multiples of 4px:
  16, 20, 24, 28, 32, 36, 40, 44, 48
```

### What This Means in Practice

A 40px row height is not arbitrary — it is exactly 10 baseline units. A 24px icon is 6 baseline units. The 4px baseline ensures that any two adjacent text elements align their descenders, ascenders, and baselines perfectly.

### Implementation

Use `space-y-4`, `space-y-6`, `space-y-8` (16, 24, 32px) for vertical rhythm. Use `h-10`, `h-12`, `h-14` (40, 48, 56px) for container heights. All values are multiples of 4.

---

## Alignment Validation

Every page must pass:

- [ ] Every heading begins at the primary line (left edge of content)
- [ ] Every body element begins at the primary line
- [ ] Right-aligned elements end at the secondary line
- [ ] No element extends past the canvas minus margins
- [ ] All vertical spacing is a multiple of 4
- [ ] All heights are multiples of 4
- [ ] The reading column's left edge aligns with the section's left edge
- [ ] No element begins at an "indented" position without justification

---

## The Shared Left Edge

When multiple sections appear on a page, they all share the same left edge. This creates vertical alignment that the eye reads as order.

```
Section 1:  │ Hero starts at 80px
Section 2:  │ Assessment starts at 80px
Section 3:  │ Actions starts at 80px
Section 4:  │ Metrics starts at 80px
Section 5:  │ Releases starts at 80px
```

If section 3 starts at 100px while others start at 80px, the eye reads "this section is different" — and that may be intentional. But it should always be a deliberate decision, not an accident of arbitrary spacing.

---

## Anti-Patterns

| Anti-Pattern | Result |
|-------------|--------|
| Heading at 80px, body at 85px | Subtle misalignment, eye detects it as "off" |
| Two columns with different left edges | Race condition in the eye |
| Random vertical spacing (19px, 23px, 31px) | No rhythm, page feels jittery |
| Right-aligned text at inconsistent right edges | Same data type at different right margins |
