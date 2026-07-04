# RFDS-006 — Component Contracts

**Status:** Active
**Version:** 1.0

---

## Contract Template

Every component MUST declare:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Unique component identifier |
| Category | Yes | One of seven categories |
| Purpose | Yes | Single-sentence responsibility |
| VH | Yes | Visual weight (10–100) |
| Information Tier | Yes | Tier 1–7 from RFDS-003 |
| Zone | Yes | Zone from RFDS-002 |
| Navigation Priority | If navigational | Priority from RFDS-005 |
| States | Yes | All possible states |
| Accessibility | Yes | ARIA requirements |
| Responsive | Yes | Breakpoint behaviour |
| Inputs | Yes | Props/parameters |
| Outputs | Yes | Rendered output + callbacks |
| References | Yes | RFDS documents this component depends on |

---

## Example Contracts

### OperationalSummary

```
Name: OperationalSummary
Category: Informational
Purpose: Summarise operational state at a glance
VH: 80
Information Tier: Assessment (Tier 2)
Zone: Decision
States: Loading, Ready, Warning, Critical, Empty, Error
Accessibility: role="region" aria-label="Operational Summary"
Responsive: 640px reading width, stacks on mobile
Inputs: healthScore, currentStage, completedStages, totalStages,
        readyItems, totalItems, pendingApprovals, blockers,
        daysUntilRelease, lastEvaluated
Outputs: Rendered operational summary card
References: RFDS-002 (alignment), RFDS-004 (typography, colour)
```

### HealthRing

```
Name: HealthRing
Category: Informational
Purpose: Circular visualisation of health percentage
VH: 60
Information Tier: Assessment (Tier 2)
Zone: Context
States: Excellent (≥90), Healthy (70–89), Attention (50–69),
        Blocked (30–49), Critical (<30), Empty
Accessibility: role="img" aria-label="Health: X%"
Responsive: Defaults to md (144px), sm (96px) on mobile
Inputs: health, readiness, timelineConfidence, workflowCompletion,
        currentStage, daysUntilRelease, size
Outputs: SVG ring with colour-coded arc and central text
References: RFDS-004 (colour, luminance)
```

### Sidebar

```
Name: Sidebar
Category: Navigational
Purpose: Primary spatial navigation system
VH: 40
Information Tier: Navigation (Tier 7)
Zone: Navigation
Navigation Priority: 4
States: Expanded, Collapsed, MobileDrawer
Accessibility: role="navigation" aria-label="Main navigation"
Responsive: Persistent on desktop, drawer on mobile
Inputs: items, sections, activePath, onNavigate, userEmail, onSignOut
Outputs: Navigation rail with icon+label items
References: RFDS-002 (width, alignment), RFDS-004 (VH-40 max)
```

### Button

```
Name: Button
Category: Operational
Purpose: Trigger a primary or secondary action
VH: 90 (primary), 60 (secondary)
Information Tier: Decision (Tier 3, primary), Context (Tier 5, secondary)
Zone: Decision or Context
States: Idle, Hover, Pressed, Focus, Loading, Disabled, Success, Error
Accessibility: role="button", focus-visible ring
Responsive: Full-width on mobile if primary
Inputs: variant, size, loading, icon, fullWidth, onClick, disabled
Outputs: Rendered button element
References: RFDS-004 (colour, emphasis), RFDS-005 (focus model)
```

---

## Contract Validation

- [ ] Every component has a documented contract
- [ ] No component missing category, VH, tier, zone
- [ ] All states documented
- [ ] Accessibility requirements specified
- [ ] Responsive behaviour specified
- [ ] Inputs/outputs specified
- [ ] References traceable to RFDS documents
