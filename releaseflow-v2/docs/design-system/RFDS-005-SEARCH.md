# RFDS-005 — Search

**Status:** Active
**Version:** 1.0

---

## Principle

Search provides direct access to any entity by name. It is available from the topbar and the command palette.

VH: 50.

---

## Locations

| Location | Behaviour |
|----------|-----------|
| Topbar (desktop) | Inline search field, 224px wide |
| Command Palette | Opens with ⌘K, search as primary function |
| Topbar (mobile) | Icon only, expands to full-width overlay |

---

## Search Scope

| Entity | Searched By | Results |
|--------|------------|---------|
| Releases | Title | Name + type + status |
| Artists | Name | Name + type + genres |
| Assets | Filename | Name + type + release |
| People | Name | Name + role |

---

## Results Format

```
┌────────────────────────────────┐
│ Lua · EP · ⬤ in_production     │
│ Kinn Timo · Original Artist    │
│ artwork-v3.png · Artwork       │
└────────────────────────────────┘
```

---

## Empty State

No results → "No results found." No decoration.

---

## Keyboard

- ⌘K opens search
- Enter selects first result
- ↓ ↑ navigates results
- Esc closes
