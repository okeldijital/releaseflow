# RFDS-005 — Breadcrumbs

**Status:** Active
**Version:** 1.0

---

## Principle

Breadcrumbs provide orientation. They show where the user is within the application hierarchy.

VH: 30.

---

## Format

```
Releases / Lua · EP / Workflow
```

Current page: bold text-800. Previous items: text-400 with underline on hover. Separator: text-300 chevron.

---

## Behaviour

- Always visible in topbar, left of search
- Truncate to last 3 items on narrow screens
- Each segment is a clickable link (except the current page)
