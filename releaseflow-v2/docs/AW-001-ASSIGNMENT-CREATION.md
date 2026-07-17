# AW-001 — Assignment Creation Redesign

**Priority:** High  
**Status:** Implemented

## Summary

Assignment creation no longer accepts internal IDs. Managers work with:

1. **Release** (searchable, with artwork)
2. **Contributor** (searchable active people + invite)
3. **Contribution Role** (controlled list)
4. Title, description, priority, due date, hours

Authorization continues via `AuthorizationService.requireManageAssignments`.

## Files

| File | Purpose |
|------|---------|
| `lib/contribution-roles.ts` | Controlled contribution roles + title templates |
| `components/assignments/release-selector.tsx` | Full-screen searchable release picker |
| `components/assignments/contributor-selector.tsx` | Contributor picker, workload, invite |
| `app/(app)/assignments/new/page.tsx` | Redesigned create page |
| `components/assignment-dialog.tsx` | Same model for dialogs |
| `lib/assignment-service.ts` | RBAC on create |
| `__tests__/contribution-roles.test.ts` | Unit tests |

## Flow

```
Select Release → Select Contributor → Contribution Role → Details → Create
     ↓                    ↓
  context card      context + workload
```

Invite from contributor picker uses existing `invitePerson` (platform role only).
