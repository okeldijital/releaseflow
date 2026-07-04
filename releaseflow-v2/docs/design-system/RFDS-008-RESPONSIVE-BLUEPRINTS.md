# RFDS-008 — Responsive Blueprints

**Status:** Active
**Version:** 1.0

---

## Principle

Each blueprint defines how it recomposes across breakpoints. Not resizing — recomposition.

---

## Executive Briefing (Operations Center)

```
Desktop (≥1024px)
    Hero (640px)
    Assessment 2-col (640px)
    Actions list (640px)
    Metrics inline (640px)
    Table full-width (960px)
    Activity list (640px)

Tablet (640–1023px)
    Hero (full)
    Assessment 1-col (full)
    Actions list (full)
    Metrics inline
    Table scroll (sticky first column)
    Activity list

Mobile (<640px)
    Hero (full)
    Assessment 1-col stacked
    Actions stacked, full-width text
    Metrics stacked
    Table → card list
    Activity list
```

---

## Workspace (Release + Artist)

```
Desktop (≥1280px)
    Hero + Context Rail (360px, right)
    Tabs horizontal
    Content 960px
    Context Rail visible

Desktop (1024–1279px)
    Hero + Context Rail (320px, right)
    Tabs horizontal
    Content full

Tablet (768–1023px)
    Hero full width
    Tabs scroll
    Context: drawer overlay
    Workflow: scroll

Mobile (<768px)
    Hero stacked
    Tabs icons only, scroll
    Context: inline below content
    Workflow: single-column swipe
    Table → cards
```

---

## Collection (Lists)

```
Desktop:  Full table, filters inline
Tablet:   Table scroll, filters stacked
Mobile:   Card list, filters stacked
```

---

## Creation (Forms)

```
Desktop:  Form 720px centered, fields 2-col
Tablet:   Form full width, fields 2-col
Mobile:   Form full width, fields stacked, buttons full-width
```

---

## Review

```
Desktop:  Evidence 2-col, decisions inline
Tablet:   Evidence stacked, decisions inline
Mobile:   Evidence stacked, decisions stacked full-width
```

---

## Common Recomposition Rules

1. **Tables → Cards** at <640px: each row becomes a card with key/value pairs
2. **2-col → 1-col** at <1024px
3. **Context Rail → Drawer** at <1280px
4. **Tabs: text → icons** at <768px
5. **Primary action always visible** — never behind a menu
6. **Touch targets ≥44px** on mobile
7. **No horizontal scroll** on mobile except tables

---

## References

RFDS-002 (breakpoints), RFDS-007 (per-pattern responsive)
