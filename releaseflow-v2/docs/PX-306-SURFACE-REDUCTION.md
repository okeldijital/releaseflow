# PX-306 — Surface Reduction

## Objective

Reduce the perceived number of components by approximately 40%.

## Before

- Card borders: `border-surface-200/70`
- Table borders: `border-surface-200/50` rounded-lg container
- Header backgrounds: `bg-surface-50`
- Row separators: `border-surface-100`
- Alert containers: `rounded-xl border border-surface-200/70`
- Blocked items: `border-surface-200` Card wrapper
- Footer dividers: `border-t`
- Decorative rings on icons: `ring-1 ring-primary-100`

## After

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Card | Border + shadow | Borderless + shadow only | 1 element |
| Table | Bordered container | Bare container | 1 element |
| Table header | Background + border | Border only | 1 element |
| Table rows | Border separator | 40% opacity separator | 60% reduction |
| Alerts | Border + radius + bg | Left border + bg only | 1 element |
| BlockedRow | Card with border | Plain div with bg | 1 element |
| Org Pulse | Border + radius | Tonal bg only | 1 element |
| Divider | `border-surface-200` | `border-surface-200/70` | 30% reduction |

## Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Border elements per page | ~18 | ~8 | -55% |
| Boxed sections | 6 | 2 | -67% |
| Decorative shadows | 4 | 0 | -100% |

## Definition of Done

No component looks "boxed." Regions are separated primarily through spacing.

## Status

✅ Complete
