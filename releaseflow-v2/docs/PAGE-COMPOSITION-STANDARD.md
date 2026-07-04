# Page Composition Standard

## 1. Dominant Region

Every page has exactly one dominant region. This is the visual anchor that answers the user's primary question.

**Operations Center:** Operational Summary — health, confidence, and recommended actions in a single scan.
**Release Workspace:** Release hero + health state — title, status, and readiness at a glance.
**Artist Workspace:** Artist health + readiness — "Should I worry about this artist today?"

The dominant region must:
- Occupy the top third of the viewport.
- Use the largest type on the page (after the topbar H1).
- Have the most whitespace around it.
- Contain no decorative borders or shadows.

## 2. Supporting Region

Exactly one supporting region follows the dominant region. It provides context or next action.

**Operations Center:** Attention panel — alerts, blockers, deadlines.
**Release Workspace:** Workflow / Readiness — the "how" and "what's missing."
**Artist Workspace:** Active releases / releases list.

The supporting region must:
- Use lower contrast typography than the dominant region.
- Have less whitespace than the dominant region.
- Remain visually subordinate even when data-rich.

## 3. Tertiary Region

Everything else: lists, metadata, activity feeds, quick actions.

- Placed last in the scan path.
- Uses the lightest text weight and smallest type.
- May collapse into silence (removed entirely) if it does not serve a decision.

## 4. Scan Path Enforcement

```
1. Topbar (orientation)
2. Hero / Dominant Region (status)
3. Supporting Region (action)
4. Tertiary Region (detail)
5. [Silence — no footer, no chrome]
```

No exceptions. No custom spacing scales per page.

## 5. Density Zones

Information density increases toward the decision point.

| Zone | Density | Technique |
|------|---------|-----------|
| Dominant | Low | Large type, generous whitespace, no chrome |
| Supporting | Medium | Compact rows, minimal decoration |
| Tertiary | High | Tight spacing, clear labels, scannable lists |

## 6. Structural vs Decorative

- **Structural:** Borders that separate semantically distinct regions; table row separators; input boundaries.
- **Decorative:** Borders used for card decoration, section separation, or visual interest.

**Rule:** If a border does not separate semantically distinct content, remove it.

## 7. Whitespace as Layout Tool

Whitespace is never "empty space." It is an active layout tool that:
- Groups related items.
- Separates distinct regions.
- Signals importance through proportion.
- Creates calm under data-rich conditions.

**Ratio:** Section-to-section spacing is 7:1 (`mb-14`). Heading-to-body is 3:1 (`mb-3`). Body-to-body is 2:1 (`mb-2`). Inline gap is 1:1 (`gap-2`). Micro gap is 0.5:1 (`gap-1`).

## 8. Visual Silence

Visual silence is the intentional absence of decoration.

- No footer dividers.
- No decorative borders.
- No background patterns.
- No "chrome" around content.
- The page breathes. The user thinks.

**Rule:** If removing an element does not reduce clarity, remove it.
