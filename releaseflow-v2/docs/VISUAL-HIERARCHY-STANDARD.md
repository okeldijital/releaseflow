# Visual Hierarchy Standard

## 1. The One H1 Rule

Every screen has exactly one `<h1>`. The topbar owns the screen title. Content sections use `<h2>` or `<p>` with identical visual weight but reduced semantic emphasis.

**Implementation:**
- Topbar renders `<h1>` with `text-[1.75rem] font-semibold tracking-tight`.
- All content-level titles are `<p>` with the same class names.
- No page has competing reading anchors.

## 2. Type Ramp

| Role | Size | Weight | Color | Tracking |
|------|------|--------|-------|----------|
| Screen Title (H1) | 1.75rem | 600 | text-900 | tight |
| Section Header (H2) | 0.875rem | 600 | text-900 | normal |
| Body | 0.875rem | 400 | text-700 | normal |
| Supporting | 0.75rem | 400 | text-500 | normal |
| Metadata | 0.6875rem | 400 | text-400 | wide |
| Caption | 0.625rem | 400 | text-400 | wider |

**Rule:** Hierarchy is communicated through size and weight, never through color alone.

## 3. Color as Signal, Not Decoration

- **Primary (Burnt Sienna):** Used only for CTAs, active states, and critical indicators.
- **Success/Warning/Danger:** Used only for status communication.
- **Text scale:** Used for all hierarchy.
- **Surface scale:** Used for tonal zones, never for decoration.

**Rule:** If a color does not communicate state or meaning, remove it.

## 4. Dominance Through Proportion

The dominant element is not the largest element — it is the element with the most whitespace around it.

**Operations Center:**
- Operational Summary has `mb-14` of whitespace above and below.
- Attention panel has `mb-14` of whitespace.
- Active Releases has `mb-14` of whitespace.
- Org Pulse has `mb-14` of whitespace.
- Recent Activity has no bottom margin — it fades into silence.

**Release Workspace:**
- Hero has `mb-10` of whitespace.
- Journey has `mb-10` of whitespace.
- Operational Summary has `mb-10` of whitespace.
- Workspace tabs have `mb-8` of whitespace.

**Artist Workspace:**
- Hero has `mb-10` of whitespace.
- Artist Health (Operational Summary) has `mb-10` of whitespace.
- Workspace tabs have `mb-8` of whitespace.

## 5. Visual Weight Distribution

- **Heavy:** Dominant region title, health indicators, primary CTA.
- **Medium:** Section headers, supporting text, table rows.
- **Light:** Metadata, timestamps, captions, quick actions.

**Rule:** The eye should never land on a medium-weight element before a heavy one.

## 6. Alignment as Hierarchy

- **Primary content:** Left-aligned.
- **Primary actions:** Right-aligned in the hero.
- **Secondary actions:** Left-aligned below primary content.
- **Metadata:** Right-aligned or trailing in rows.

**Rule:** Alignment creates invisible grouping. Use it before borders.

## 7. The Silence Rule

Every page must have at least one region of visual silence — an area with no text, no borders, no backgrounds.

- **Operations Center:** Recent Activity fades into silence at the bottom.
- **Release Workspace:** The workspace tabs sit in silence before the content.
- **Artist Workspace:** The tabs sit in silence before the content.

**Rule:** If a page has no silence, it has no calm. If it has no calm, it has no focus.

## 8. Decision Point Density

Information density increases toward the decision point.

- **High-level summaries:** Low density, large type, generous whitespace.
- **Operational lists:** Medium density, compact rows, minimal chrome.
- **Forms / data entry:** High density, tight spacing, clear labels.

**Rule:** Density is not a page-level setting; it is a regional technique.
