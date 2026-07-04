# RFDS-005 — Context Rail

**Status:** Active
**Version:** 1.0

---

## Principle

The context rail provides entity-specific operational context. It always sits to the right of the main content. It is persistent on desktop, available as a drawer on tablet, and integrated into the page flow on mobile.

VH: 60. Higher than navigation, lower than evidence.

---

## Anatomy

```
┌──────────────────────┐
│ Health Ring           │  Visual health summary
│                       │
├──────────────────────┤
│ Readiness Stack       │  Checklist of readiness items
│ Audio     ✓ Ready     │
│ Artwork   ✗ Missing   │
│ Metadata  ✓ Complete  │
│ Rights    ✗ Blocked   │
│                       │
├──────────────────────┤
│ Info                  │
│ Type: EP              │
│ Label: Acme Records   │
│ Genre: Afro Tech      │
│ UPC: 012345678901     │
│                       │
├──────────────────────┤
│ Dependencies          │
│ 🔴 Mechanical License │
│ 🟡 Sam Wilson capacity│
│                       │
├──────────────────────┤
│ Attention             │
│ ⏳ Review mix v2      │
│ 📋 Profile incomplete │
└──────────────────────┘
```

---

## Dimensions

| Screen | Width | Behavior |
|--------|------:|----------|
| Desktop (≥1280px) | 360px | Fixed right, sticky below topbar, independent scroll |
| Laptop (1024–1279px) | 360px | Fixed right |
| Tablet (768–1023px) | 360px | Drawer overlay |
| Mobile (<768px) | Full width | Integrated into page flow, below content |

---

## Content

| Section | Purpose | VH |
|---------|---------|-----|
| Health Ring | Visual health indicator | 60 |
| Readiness Stack | Operational readiness checklist | 60 |
| Info/Details | Entity metadata | 50 |
| Dependencies | Blocking items | 60 |
| Attention | Items requiring action | 60 |

---

## States

| State | Behavior |
|-------|----------|
| Visible | Desktop: always shown at ≥1280px |
| Hidden | Desktop <1280px: not shown by default |
| Drawer | Tablet: overlay from right, dismiss on outside click |
| Inline | Mobile: full-width section below main content |

---

## Section Spacing

- Each section: 24px gap from previous
- Section header: 10px annotation, text-400, uppercase tracking-widest
- Items within section: 8px gap (tight, related)

---

## Responsive Behaviour

| Breakpoint | Context Rail |
|-----------|-------------|
| ≥1280px | Fixed right, 360px |
| 1024–1279px | Fixed right, 360px |
| 768–1023px | Drawer overlay (trigger: info icon in topbar) |
| <768px | Integrated into page flow after main content |

---

## Content Rules

- Maximum 5 sections
- No primary actions (that's for the main content area)
- No tables (that's for the evidence zone)
- Dependencies show: name, status dot, age
- Attention items show: type, description, action link
