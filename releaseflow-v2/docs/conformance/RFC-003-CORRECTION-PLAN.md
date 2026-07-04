# RFC-003 — Correction Plan

**Date:** 2026-06-29

---

## Block 1: Table Standardization (DD-002, DD-005)

Replace Rights Holders card list with `<Table>` component.

```
Before: {holders.map(h => <Card key={h.id} padding="sm">...</Card>)}
After:  <Table columns={columns} data={holders} />
```

**Effort**: ~5 lines

## Block 2: Width Standardization (DD-004)

Standardize Assets page width.

```
Before: max-w-6xl
After:  max-w-4xl
```

**Effort**: 1 line

## Block 3: Subtitle Standardization (DD-003)

Standardize Artists subtitle to match Releases pattern.

**Effort**: 1 line

## Block 4: Language (DD-006)

Update Assets page description to operational language.

**Effort**: 1 line

## Block 5: Operational List (DD-001)

Integrate data hook for Assets page to show actual asset list.

**Effort**: Medium — needs org-scoped asset query

---

## Effort Summary

| Block | Time |
|-------|------:|
| Table standardization | 2 min |
| Width + subtitle + language | 1 min |
| Operational list (Assets) | 15 min |
| **Total** | **~18 min** |
