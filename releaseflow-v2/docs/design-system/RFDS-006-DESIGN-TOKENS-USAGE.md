# RFDS-006 — Design Token Usage

**Status:** Active
**Version:** 1.0

---

## Principle

Components may not invent tokens. Every visual value must reference an existing token from PDS, RFDS-002, or RFDS-004.

---

## Token References Per Component

### Button

| Property | Token Source | Value |
|----------|-------------|-------|
| Height | PDS | h-9 (36px), h-10 (40px), h-12 (48px) |
| Padding horizontal | PDS | px-3 (12px), px-4 (16px) |
| Radius | PDS | rounded-md (10px) |
| Colour (primary) | RFDS-004 | primary-500 |
| Colour (hover) | RFDS-004 | primary-600 |
| Colour (active) | RFDS-004 | primary-700 |
| Pressed scale | RFDS-004 | scale-[0.98] |
| Transition | PDS | duration-150 ease-out |
| Focus ring | RFDS-004 | ring-2 ring-primary-500 ring-offset-2 |

### Card

| Property | Token Source | Value |
|----------|-------------|-------|
| Padding | RFDS-002 | p-4 (16px), p-6 (24px), p-8 (32px) |
| Radius | PDS | rounded-lg (14px) |
| Border | RFDS-004 | border border-surface-200 |
| Background | RFDS-004 | bg-white (surface-0) |
| Shadow (idle) | PDS | shadow-card |
| Shadow (hover) | PDS | shadow-raised |
| Transition | PDS | duration-200 ease-out |

### Sidebar Nav Item

| Property | Token Source | Value |
|----------|-------------|-------|
| Height | PDS | min-h-[40px] |
| Padding horizontal | RFDS-002 | px-3 (12px) |
| Padding vertical | RFDS-002 | py-1.5 (6px) |
| Radius | PDS | rounded-md (10px) |
| Text (idle) | RFDS-004 | text-text-400 |
| Text (hover) | RFDS-004 | text-text-700 |
| Text (active) | RFDS-004 | text-text-900 |
| Font size | PDS | text-[13px] |
| Transition | PDS | duration-150 |

---

## Token Rules

1. Every visual property must reference a token
2. No `!important` overrides
3. No arbitrary values (e.g., `mt-[23px]`)
4. No inline styles for spacing or colour
5. Dark mode tokens must be present for every colour

---

## Token Reference Map

```
Component
    │
    ├── Spacing  → RFDS-002 Spatial Tokens
    ├── Colour   → RFDS-004 Colour Responsibility
    ├── Motion   → PDS Motion Tokens
    ├── Radius   → PDS Radius Tokens
    ├── Shadow   → PDS Shadow Tokens
    ├── Typography → PDS Typography Tokens
    └── Layout   → RFDS-002 Width/Height Tokens
```

No component may reference a token from a future RFDS. Components may only reference PDS and RFDS-001 through RFDS-005.

---

## Validation

- [ ] No hard-coded values in any component
- [ ] Every colour references a PDS token
- [ ] Every spacing references RFDS-002
- [ ] Every visual weight references RFDS-004
- [ ] No `!important` overrides
- [ ] Dark mode tokens present
