# RFDS-001 — Implementation Rules

**Status:** Active
**Version:** 1.0

---

## Purpose

These rules govern how every feature specification, blueprint, and UI task must be written and implemented. They ensure RFDS produces testable, objective specifications rather than subjective guidance.

---

## Mandatory Document References

Every UI specification MUST reference:

1. **The PDS** — Product Design Standards
2. **The RFDS** — This design system
3. **The applicable blueprint** — The feature's page blueprint
4. **The component library** — Shared components and their contracts

If a specification does not reference these, it cannot be implemented.

---

## Language Rules

### Avoid Subjective Language

These words are **banned** in UI specifications:

- "modern"
- "clean"
- "nice"
- "beautiful"
- "elegant"
- "sleek"
- "minimalist" (unless referencing the explicit "Quiet interfaces" principle)
- "user-friendly"
- "intuitive"

These words do not communicate. They are preferences, not specifications.

### Use Objective Criteria

Express requirements using measurable properties:

| Subjective | Objective |
|-----------|-----------|
| "A nice spacing" | "24px vertical rhythm" |
| "Should feel modern" | "Should use Inter typeface at 14px" |
| "Looks clean" | "No decorative borders" |
| "Better hierarchy" | "Date is 40px, status is 15px" |
| "More spacious" | "64px between hero and assessment" |
| "Fits well" | "Within 840px max-width" |

---

## What Every Spec Must Define

### 1. Layout Structure
- Maximum page width
- Content column vs full-width zones
- Vertical rhythm between sections
- Reading width (65-80 character lines)
- Position on the page (top, middle, bottom)
- Z-index priority order

### 2. Typography
- Exact font sizes (in px or rem)
- Font weights
- Line heights
- Letter spacing
- Color from PDS tokens (text-900, text-500, etc.)
- Hierarchy levels (H1, H2, body, caption)

### 3. Color
- Only PDS semantic colors
- Hover, active, focus states specified
- Dark mode behavior
- Luminance contrast ratio where critical (≥ 4.5:1 for body, ≥ 3:1 for large text)

### 4. Spacing
- All gaps from PDS 8-point grid
- No arbitrary values
- Section rhythm specified
- Padding and margin per element

### 5. Interaction
- Hover, focus, active, pressed states
- Timing (must use PDS motion tokens: 100/150/200/300ms)
- Easing (standard, enter, exit)
- Keyboard interactions
- Touch target minimum (44px)

### 6. Accessibility
- ARIA roles and labels
- Heading hierarchy
- Focus order
- Screen reader behavior
- Color contrast
- Touch targets

### 7. Responsive
- Breakpoint behavior (mobile, tablet, desktop, wide)
- Element reflow
- Content priority at each breakpoint
- Touch interactions vs hover

### 8. States
- Default (idle)
- Hover
- Focus
- Active/pressed
- Loading
- Success
- Warning
- Error
- Disabled
- Empty (no data)
- Partial (some data)

---

## Spec Format

Every UI spec should follow this structure:

```markdown
# Page / Component Name

## Governance
[Standard declaration]

## Purpose
[Single sentence]

## Layout
[Structure, width, rhythm]

## Content
[Section by section, in priority order]

## States
[All documented states]

## Interactions
[Hover, click, keyboard]

## Accessibility
[ARIA, contrast, keyboard]

## Responsive
[Mobile, tablet, desktop, wide]

## Acceptance Criteria
[Checklist of measurable outcomes]
```

---

## Acceptance Criteria Standards

Every spec's acceptance criteria must be **observable**, **measurable**, and **testable**.

### Observable
The user can see, hear, or interact with the result.

### Measurable
Numbers, thresholds, specific values. Not "looks good" — "passes 4.5:1 contrast ratio."

### Testable
An automated test or human reviewer can verify in <30 seconds.

---

## Anti-Patterns in Spec Writing

| Anti-Pattern | Problem |
|-------------|---------|
| "The page should look modern" | Subjective — non-implementable |
| "Add a clean header" | "Clean" has no definition |
| "Make it feel premium" | "Premium" varies by viewer |
| "Optimize the layout" | Untestable — optimise against what? |
| "Use appropriate spacing" | "Appropriate" defined by whom? |
| "Add visual interest" | "Interest" is preference, not requirement |

---

## Review Checklist

Before submitting a spec, verify:

- [ ] References PDS, RFDS, and relevant blueprint
- [ ] Contains no subjective language
- [ ] Every requirement is observable, measurable, testable
- [ ] States documented (default, hover, focus, active, loading, success, error, disabled, empty)
- [ ] Responsive behavior defined per breakpoint
- [ ] Accessibility requirements specified
- [ ] Motion uses PDS timing tokens
- [ ] Colors are PDS semantic tokens
- [ ] Spacing uses 8-point grid
- [ ] Typography specifies exact sizes
