# State Ownership Map — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Zustand Stores

| Store | Owner | State | Consumers | Actions |
|-------|-------|-------|-----------|---------|
| `org-store.ts` | AppLayout | `activeOrgId`, `orgsLoaded` | 13 components | `setActiveOrgId`, `setOrgsLoaded` |
| `role-store.ts` | AppLayout | `role`, `loading` | role-checking code | `resolveRole`, `reset` |
| `toast-store.ts` | ToastContainer | `toasts[]` | Toast system | `addToast`, `dismissToast` |

---

## React Context (Authentication)

| Context | Owner | State | Consumers |
|---------|-------|-------|-----------|
| `auth-context.tsx` | AppProviders | `user`, `loading` | All authenticated pages |

---

## Component-Local State

Each page manages its own derived state:

| Page | Local State |
|------|-------------|
| Dashboard | Release rows, away summary, refresh timer |
| Release Workspace | Release, workflow, stages, tasks, requirements, deliverables, dependencies, distPackage, ownership |
| Artist Workspace | Artist, readiness, releases, credits, editing state |

---

## State Flow

```
Firebase Auth
     │
     ▼
 auth-context (user, loading)
     │
     ▼
 AppLayout
     ├── org-store (activeOrgId, orgsLoaded)
     ├── role-store (role, loading)
     │
     ▼
 Pages read stores, manage own local state
     │
     ▼
 Hooks (useOperationsCenter) orchestrate services
     │
     ▼
 Services call repositories
     │
     ▼
 Repositories call Firebase
```

---

## Sign-Out Cleanup

On sign-out, the following state is cleared:

1. `firebaseSignOut()` — Firebase Auth session
2. `orgStore.setActiveOrgId(null)` — clears organization
3. `orgStore.setOrgsLoaded(false)` — resets loading state
4. `roleStore.reset()` — resets role to viewer

No state persists across sign-out.
