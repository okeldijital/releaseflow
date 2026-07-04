# PX-305 — Editorial Composition Standard

## 1. Dominant Element

Every screen has **one** dominant region. This is the first place the eye lands. It must answer the user's primary question within 2 seconds.

- **Operations Center:** Operational Summary (health + confidence + recommendations)
- **Release Workspace:** Release hero + health state
- **Artist Workspace:** Artist health + readiness summary

No other element may compete for attention. If two elements shout, neither is heard.

## 2. Supporting Element

The dominant region is always followed by exactly one supporting region that provides context or next action.

- **Operations Center:** Attention panel (alerts, blockers, deadlines)
- **Release Workspace:** Workflow / Readiness (the "how" and "what's missing")
- **Artist Workspace:** Active releases / releases list

Supporting elements use **lower contrast typography** and **more whitespace** to signal secondary importance.

## 3. Tertiary Element

Everything else: lists, metadata, activity feeds, quick actions.

- Placed last in the scan path.
- Uses the lightest text weight and smallest type.
- May collapse into silence (removed entirely) if it does not serve a decision.

## 4. Scan Path

```
1. Topbar (orientation: where am I?)
2. Hero / Dominant Region (status: what's happening?)
3. Supporting Region (action: what do I do?)
4. Tertiary Region (detail: what else?)
5. [Silence — no footer, no chrome]
```

The scan path is **strictly top-to-bottom, left-to-right**. No diagonal movement. No competing horizontal bands.

## 5. Whitespace Ratios

| Relationship | Ratio | Token Equivalent |
|--------------|-------|------------------|
| Section to section | 7:1 | `mb-14` (56px) |
| Heading to body | 3:1 | `mb-3` (12px) |
| Body to body | 2:1 | `mb-2` (8px) |
| Inline gap | 1:1 | `gap-2` (8px) |
| Micro gap | 0.5:1 | `gap-1` (4px) |

Whitespace is **active**, not passive. It groups, separates, and prioritizes.

## 6. Optical Balance

- Left-aligned text anchors the eye.
- Right-aligned actions balance the composition without competing.
- Asymmetric layouts (e.g., hero left, actions right) create tension that resolves when the user reads the supporting text.
- Avoid center-aligned text blocks wider than 600px. They create visual vibration.

## 7. Page Rhythm

Every page follows the same vertical rhythm:

```
Header (64px)
↓ 48px
Dominant Region
↓ 56px
Supporting Region
↓ 48px
Tertiary Region
↓ 32px
[Silence]
```

No exceptions. No custom spacing scales per page.

## 8. Visual Silence

Visual silence is the intentional absence of decoration.

- No footer dividers.
- No decorative borders.
- No background patterns.
- No "chrome" around content.
- The page breathes. The user thinks.

**Rule:** If removing an element does not reduce clarity, remove it.

## 9. Border Philosophy

Borders are **structural**, never decorative.

- Borders may separate **semantically distinct** regions.
- Borders may indicate **interactive boundaries** (inputs, tables).
- Borders may **not** be used for:
  - Card decoration (use spacing instead).
  - Section separation (use whitespace instead).
  - Visual interest (use typography instead).

**Implementation:**
- Use `border-surface-200/60` or lower opacity.
- Prefer `bg-surface-50` (tonal zones) over borders.
- Prefer `shadow-card` over heavy borders.

## 10. Grouping Rules

- **Proximity > Borders:** Items closer together are perceived as grouped.
- **Alignment > Dividers:** Shared alignment creates invisible grouping.
- **Typography > Backgrounds:** Bold text groups faster than colored backgrounds.

When in doubt, **remove the container** and let typography and spacing do the work.

## 11. Density Rules

Information density increases **toward the decision point**.

- High-level summaries: low density, large type, generous whitespace.
- Operational lists: medium density, compact rows, minimal chrome.
- Forms / data entry: high density, tight spacing, clear labels.

Density is not a page-level setting; it is a **regional** technique.
