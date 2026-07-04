# RFDS-004 — Iconography

**Status:** Active
**Version:** 1.0

---

## Principle

Icons support recognition. Never decoration.

Every icon must have: operational meaning, accessibility label, size token, weight token, and defined interaction states.

Maximum one icon per primary concept.

---

## Icon Sizes

| Token | Value | Use |
|-------|------:|-----|
| `icon.sm` | 16px | Inline with text, table cells |
| `icon.md` | 20px | Navigation, actions, toolbars |
| `icon.lg` | 24px | Hero moments, empty states |

No icon larger than 24px. An oversized icon is decoration.

---

## Icon Stroke

| Token | Value | Use |
|-------|------:|-----|
| `icon.stroke` | 1.75px | Consistent stroke weight for all icons |

No thin (1px) icons — they disappear on lower-resolution displays. No thick (3px+) icons — they dominate text.

---

## Icon Usage Rules

### Rule 1: One icon per primary concept

A primary action has one icon. A navigation item has one icon. A status indicator has one dot. Never two icons for the same concept.

### Rule 2: Icons on the left

Icons precede their associated text. The user scans icons to find content. Icons on the right are decorative.

```
✓  [icon] Release name    ← user scans icon, then reads
✗  Release name [icon]     ← user reads, then sees icon (too late)
```

### Rule 3: Icons are semantic

| Icon | Meaning |
|------|---------|
| + (plus) | Create, add |
| → (arrow) | Navigate, open |
| ✓ (check) | Complete, approved |
| ✗ (close) | Cancel, remove |
| ⚠ (warning) | Attention required |
| 🔒 (lock) | Blocked, inaccessible |
| 📋 (document) | Release, document |
| 👤 (person) | Artist, user |
| 📁 (folder) | Asset, file |
| ⚙ (gear) | Settings |

No icon that does not have a documented meaning.

### Rule 4: Icons have accessible labels

Every icon must have `aria-label` or be accompanied by visible text. A decorative icon (no meaning) must have `aria-hidden="true"`.

### Rule 5: Icons in buttons

A button may have one icon. The icon is always left of the text. The icon and text share the same colour.

### Rule 6: Icons in navigation

Each navigation item has one icon. The icon is 20px. The stroke is 1.75px. The colour is text-400 (inactive) or primary-500 (active).

---

## Icon Anti-Patterns

| Anti-Pattern | Reason |
|-------------|--------|
| Icon without label | Not accessible |
| Two icons for one concept | Redundant |
| Oversized icon (>24px) | Competing with text |
| Icon on right of text | Wrong scan order |
| Different icon styles per page | Inconsistent visual language |
| Icon that duplicates a text meaning | Noise |

---

## Validation

- [ ] Every icon has `aria-label` or visible text
- [ ] No icon larger than 24px
- [ ] One icon per primary concept
- [ ] Icons precede text
- [ ] Consistent 1.75px stroke
- [ ] No icon used for decoration only
