# RFDS-004 — Contrast System

**Status:** Active
**Version:** 1.0

---

## Principle

Contrast is semantic.

Primary information gets the highest contrast. Supporting information gets moderate contrast. Metadata gets low contrast. Decoration is almost invisible.

Every element must declare its contrast responsibility.

---

## Contrast Assignment Table

| Role | VH | Text/Background Contrast | Rationale |
|------|----|--------------------------|-----------|
| Display (Heading) | 100 | ≥ 7:1 (AAA) | Must be immediately legible |
| Statement (Body) | 90 | ≥ 4.5:1 (AA) | Operational text must be readable |
| Assessment (Value) | 85 | ≥ 7:1 | Health % deserves high contrast |
| Assessment (Label) | 80 | ≥ 3:1 | Label is subordinate to value |
| Recommendation | 85 | ≥ 4.5:1 | Actionable text must be readable |
| Evidence (Cell) | 70 | ≥ 4.5:1 | Table data must be readable |
| Evidence (Header) | 65 | ≥ 3:1 | Column headers are reference |
| Metadata | 30 | ≥ 3:1 | Secondary information, quieter |
| Annotation | 50 | ≥ 4.5:1 | Section labels must be visible |
| Navigation | 40 | ≥ 3:1 | Navigation is tool, not focus |
| Decoration | 10 | ≥ 1.5:1 | Barely visible, structural only |

---

## Contrast by Function

### Reading

Text meant to be read (body, evidence) needs 4.5:1 minimum.

### Scanning

Text meant to be scanned (assessment labels, table headers) needs 3:1 minimum.

### Noticing

Elements meant to be noticed (divider, decoration) need 1.5:1 minimum.

### Ignoring

Elements meant to be ignored (nothing). If something should be ignored, it should not exist.

---

## Primary vs Supporting

| Information Type | Contrast | Why |
|-----------------|----------|-----|
| Release title | 7:1+ | The user must identify the release immediately |
| Health % | 7:1+ | Operational health is always important |
| Body text | 4.5:1+ | Primary reading material |
| Table header | 3.0:1+ | Column headers are scannable |
| Secondary text | 3.0:1+ | Less important than body |
| Metadata | 2.5:1+ | IDs and timestamps |
| Divider | 1.5:1+ | Structural only |

---

## Text on Background

Every text layer must declare its background:

| Text Layer | Background | Minimum Ratio |
|-----------|------------|---------------|
| Display | Canvas (surface-50) | 12.6:1 (text-900 on surface-50) |
| Statement | Canvas | 7.6:1 (text-700 on surface-50) |
| Body | Canvas | 7.6:1 |
| Metadata | Canvas | 3.8:1 (text-500 on surface-50) |
| Body on Surface | Card (surface-0) | 12.6:1 (text-900 on surface-0) |
| Metadata on Surface | Card | 5.5:1 (text-500 on surface-0) |

---

## Contrast Decay

As an element demotes through the information lifecycle, its contrast decays:

```
Critical:  7:1+ contrast (must be seen)
Active:    4.5:1+ contrast (should be seen)
Regular:   3:1+ contrast (can be seen)
Archived:  2.5:1+ contrast (available if needed)
```

---

## Dark Mode Contrast

| Text Layer | Background | Minimum Ratio |
|-----------|------------|---------------|
| Display | Canvas (surface-950) | 15.2:1 (text-50 on surface-950) |
| Statement | Canvas | 10.1:1 (text-200 on surface-950) |
| Body | Canvas | 6.2:1 (text-400 on surface-950) |
| Metadata | Canvas | 3.3:1 (text-500 on surface-950) |

---

## Validation

- [ ] No text below 3:1 contrast against its background
- [ ] Display and body text ≥ 4.5:1
- [ ] Metadata ≥ 2.5:1
- [ ] Navigation ≥ 3:1
- [ ] Decoration ≥ 1.5:1
- [ ] No white text on white backgrounds
- [ ] No black text on black backgrounds
