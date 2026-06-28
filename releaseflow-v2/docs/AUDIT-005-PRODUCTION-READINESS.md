# AUDIT-005 — Production Readiness

| Field | Value |
|---|---|
| Audit date | 2026-06-28 |
| Audit version | 1.0 |
| Scope | 13-dimension readiness review; explicit Go / No-Go |
| Status scale | Ready / Partially Ready / Not Ready |

---

## 1. Authentication

**Status:** Partially Ready

**Evidence:**
- Email + Google sign-in work end-to-end (`app/(auth)/sign-in/page.tsx:11-143`).
- `onAuthStateChanged` listener at `contexts/auth-context.tsx:41-44` exposes `user` and `loading`.
- Sign-out at `app/(app)/layout.tsx:215-218` works.
- Forgot-password page exists at `app/(auth)/forgot-password/page.tsx`.

**Key gaps:**
- **Google `displayName` is not set** after `signInWithPopup` (`sign-in/page.tsx:25-35`). The Firebase user record has no display name unless set elsewhere.
- **No email verification** flow.
- **No reauthentication** for sensitive operations.
- **No rate limiting** on email/password.
- **Stores not cleared on sign-out** (`useOrgStore.activeOrgId`, `useRoleStore.role`, `useToastStore.toasts` retain state — though the redirect masks this).
- **No password strength requirements** (sign-up form doesn't validate complexity).
- **No 2FA / MFA**.

**Estimated effort to fix:** M-L (1-2 weeks for email verification + 2FA; days for the rest)

---

## 2. Authorization (Tenant Isolation)

**Status:** **Not Ready** — P0 blocker

**Evidence:**
- `firestore.rules:9-43` allows `read,write: if isAuth()` on 26 of 28 collections.
- Only `releases` enforces `createdBy == request.auth.uid` on create/update/delete (`firestore.rules:12`).
- `artists` (`rules:26`) and `rights_holders` (`rules:29`) are global — any auth user can read or edit any artist/rights-holder (`lib/artist-service.ts:54-61`, `lib/rights-service.ts:20-25`).
- `memberships` (`rules:10`) — any auth user can grant themselves any role in any org.
- No custom claims on the auth token; no server-side role check.
- Client-side cross-org check at `releases/[id]/page.tsx:111-113` is the only per-resource gate; trivially bypassed via `getDoc` from the console.

**Key gaps:**
- **Cross-org write access** for 26 collections.
- **No tenant scoping** on `artists`, `rights_holders`.
- **Role is a free string** (`roleId: 'owner'`) on memberships, not validated server-side.

**Estimated effort to fix:** L (1-2 weeks for custom claims + per-org rule helpers + migration of `artists`/`rights_holders` to be org-scoped)

---

## 3. Data Integrity

**Status:** **Not Ready** — P0 blocker

**Evidence:**
- **Activity log corruption** — `contributor/page.tsx:80`, `approvals/page.tsx:45, 50`, and `notification-service.ts:31, 47, 59` write `activities` with `releaseId: ''`. These records never appear in any release's `ActivityTab` (`releases/[id]/page.tsx:909`).
- **Delete release has no cascade** — `releases/[id]/page.tsx:194-199` only deletes the release doc. Child docs (workflows, stages, tasks, requirements, activities, deliverables, dependencies, ownerships) are orphaned.
- **No transaction for org+membership** — `onboarding/page.tsx:43-56` and `organizations/page.tsx:64-69` issue sequential `addDoc` calls. If the second fails, the org exists with no membership.
- **Type violation** — `edit/page.tsx:113` writes `explicit: null` but the type is `boolean`.
- **No slug uniqueness** — `organizations.slug` is not unique-enforced anywhere; two orgs can share a slug.
- **No batch error handling** — `releases/new/page.tsx:134` `await batch.commit()` is bare.

**Key gaps:**
- `releaseId: ''` activity writes (3 sites).
- Orphan-on-delete.
- Atomic org+membership creation.

**Estimated effort to fix:** M (1 week for activity log fix + atomic org creation + delete cascade)

---

## 4. Loading States

**Status:** Partially Ready

**Evidence:**
- Top-level pages have skeleton UI: `dashboard/page.tsx`, `releases/[id]/page.tsx:213-233`, `contributor/page.tsx:108-126`, `approvals/page.tsx:54-62`.
- `useAuth().loading` returns `null` for the whole app on initial auth check (`layout.tsx:213`).
- Submitting state on create forms: `releases/new`, `artists/new`, `campaigns/new`, `rights-holders/new`, `organizations` all have `submitting` boolean with button label change.

**Key gaps:**
- **Infinite skeleton on error**: `releases/[id]/page.tsx:134` `Promise.all` rejects on any failure; `setLoading(false)` is never reached. Same pattern in `approvals/page.tsx:25-33` and `contributor/page.tsx:43-72`.
- **Stuck submit buttons** on error: `releases/new/page.tsx:134` bare `batch.commit()` doesn't reset `submitting` on failure.
- **No loading state on inline actions** (task checkbox complete, dependency status toggle).
- **No optimistic updates** for any mutation.
- **No skeleton on organization switch** — pages re-render with stale data for a beat.

**Estimated effort to fix:** S-M (1 week for try/catch + toast + reset on all mutations)

---

## 5. Error States

**Status:** Partially Ready

**Evidence:**
- Sign-in form: `<Alert type="error">` shows Firebase error message (`sign-in/page.tsx:60-64`).
- Onboarding form: same pattern (`onboarding/page.tsx:50-58`).
- `error-boundary.tsx` exists and is mounted in the root layout.

**Key gaps:**
- **`console.error` only** (no user feedback) in: `artists/new/page.tsx:52-53`, `organizations/page.tsx:71-73` (when not in onboarding), `rights-holders/new/page.tsx`, `releases/[id]/edit/page.tsx:91-117` (no try/catch).
- **Raw Firebase error strings** in alerts (e.g. "auth/invalid-credential") — not localized, not user-friendly.
- **Toast system unused** — `useToastStore.add` and `toast.success`/etc. helpers are defined but no page calls them. `useOptimistic` is the only consumer, and it's dead.
- **No retry** on any failed action.
- **No 404 page** for unknown routes (Next.js default).

**Estimated effort to fix:** S-M (1 week to standardize error handling and wire toast)

---

## 6. Recovery

**Status:** Not Ready

**Evidence:**
- No retry logic anywhere.
- No queued writes (offline or otherwise).
- No transactional compensation for partial failures.
- If `batch.commit()` fails, the user has no path forward except manually re-entering the form (and `submitting` is still `true`).

**Key gaps:**
- **No retry on transient errors** (Firestore has `unavailable` errors that benefit from exponential backoff).
- **No write queue / persistence** for offline scenarios.
- **No undo** for any destructive action (delete release, delete task).

**Estimated effort to fix:** L (multi-week for offline support; S for retry wrappers)

---

## 7. Offline Support

**Status:** Not Ready

**Evidence:**
- No service worker.
- No Firestore offline persistence enabled (`enableIndexedDbPersistence` is not called in `lib/firebase.ts`).
- No local state caching (no SWR, no React Query).
- All stores are in-memory Zustand.

**Key gaps:**
- App is unusable without network.
- No "you're offline" indicator.

**Estimated effort to fix:** L (1-2 weeks for Firestore persistence + SW + indicators)

---

## 8. Performance

**Status:** Partially Ready

**Evidence:**
- Firestore indexes defined for the most common queries (`firestore.indexes.json`: 25 indexes).
- `getDocs` queries use `limit` and `orderBy` correctly.
- `useOrgStore` is in-memory (no persist overhead).
- Dashboard pulls all data via `useOperationsCenter` in parallel where possible.

**Key gaps:**
- **N+1 query loops** at:
  - `releases/[id]/page.tsx:129` — `getTasksByStage` per stage.
  - `artists/[id]/page.tsx:79` — `getDoc` track per credit.
  - `approvals/page.tsx:25-33` — `getDoc` deliverable per pending request.
  - `useOperationsCenter.ts:117-194` — 5+ reads per release.
- **No pagination** on `/releases` list (`releases/page.tsx:24-29` — `orderBy('updatedAt', 'desc')` with no `limit`).
- **No memoization** of heavy transforms (e.g. `useOperationsCenter.ts:67-77` `toDate` is in render path).
- **No virtualization** of long lists.
- **9 useEffect hooks in `releases/[id]/page.tsx`** — re-fires on most prop changes.
- **Re-fetches on every tab switch** — no cache.
- **Bundle includes unused `packages/firebase` (Cloudinary)** — dead ~10 KB.

**Estimated effort to fix:** M-L (1-2 weeks for N+1 fixes + pagination)

---

## 9. Accessibility (a11y)

**Status:** Partially Ready

**Evidence:**
- `aria-label="Active organisation"` on the topbar select (`layout.tsx:235`).
- `aria-current` set on active sidebar item (`packages/ui/src/navigation/sidebar.tsx`).
- Form labels via `<label>` (e.g. `releases/new/page.tsx`).
- Focus rings on inputs (`focus:ring-2 focus:ring-primary-500/20`).
- Skip-to-content link: not present.

**Key gaps:**
- **No keyboard shortcut documentation** in the UI; `useKeyShortcuts` hook is dead.
- **Sidebar mobile overlay** starts open by default (`collapsed` initial `false` in `app-shell.tsx:30`) — trap for keyboard users on mobile.
- **Status badges / colored chips** are color-only indicators (priority, severity). No icon or text label.
- **No focus management** when modals/dialogs open (no modals currently).
- **No skip link**.
- **Form errors not linked** to fields via `aria-describedby` (alert is at the top of the form).
- **Heading hierarchy** may be inconsistent on tab content (e.g. `releases/[id]/page.tsx` uses `<h3>` after `<h1>` then `<h2>` for tab content).

**Estimated effort to fix:** M (1-2 weeks)

---

## 10. Logging

**Status:** Partially Ready

**Evidence:**
- Activity log (`activities` collection) is written for most mutations: `release.created`, `workflow.generated`, `task.created`, `task.assigned`, `task.completed`, `release.status.changed`, `notification.created`/`read`/`archived`.
- 25+ activity types defined in the `ActivityType` union (`types.ts:386-412`).
- `logActivity` helper at `lib/workflow-service.ts:71-89` is the single point of activity writes.

**Key gaps:**
- **Activity log corruption** (see §3 Data Integrity): 3 sites write `releaseId: ''`.
- **No log for release delete**, **stage delete**, **task unassign** (no UI for unassign).
- **No structured logging** on the client (no JSON, no level, no correlation id).
- **No server-side logging** (no Cloud Functions; no error reporting service).
- **No PII redaction** discipline — `user.email` is logged into `Notification` and may surface in activity feed.

**Estimated effort to fix:** S-M (1 week to add Sentry or similar; fix the empty-releaseId bug)

---

## 11. Monitoring

**Status:** **Not Ready** — P0 blocker for production

**Evidence:**
- No external monitoring tool integrated (no Sentry, no LogRocket, no Datadog).
- No uptime monitoring.
- No performance metrics.
- No error reporting in production.
- No analytics.

**Key gaps:**
- **No way to know** if the app is broken in production.
- **No user-facing health page** for incidents (the `/diagnostics` page is a read-only summary of Firestore counts — see `app/(app)/diagnostics/page.tsx`).
- **No Firebase Analytics**.

**Estimated effort to fix:** M (1-2 weeks for Sentry + Firebase Analytics + uptime check)

---

## 12. Security

**Status:** **Not Ready** — P0 blocker (see also §2 Authorization)

**Evidence:**
- API key, auth domain, project ID, etc. are in `NEXT_PUBLIC_*` env vars (bundled into client). Expected for Firebase, but means a rebuild is required to rotate the key.
- **Firestore rules are too permissive** (see §2).
- **No CSRF protection** (Firebase Auth token mitigates most vectors, but no `state` token for Google sign-in).
- **No content security policy** headers configured in `vercel.json` or `next.config.js`.
- **No rate limiting** on any write.
- **Client-side schema validation** only — no server-side validation of write shapes.
- **Cloudinary functions exist but never used** — no upload path; once wired, signature must be server-side.

**Key gaps:**
- **Tenant isolation (covered in §2)**.
- **No CSP** (or any security headers).
- **No rate limiting** on writes or sign-in attempts.
- **No secret management** — all env in plain `.env` files.

**Estimated effort to fix:** L (1-2 weeks for rules + CSP + secret rotation)

---

## 13. Scalability

**Status:** Partially Ready

**Evidence:**
- Composite indexes defined for the 25 most common query patterns.
- `getDocs` with `limit` on most list queries.
- `useOrgStore` is per-client (no central state).

**Key gaps:**
- **No pagination** anywhere — `/releases`, `/artists`, `/rights-holders`, `/campaigns`, `/contributor` all return up to `limit(50)` or unlimited. A single org with 1000+ releases will return 1000 in one shot.
- **Hot-spot risk**: `/dashboard` triggers `useOperationsCenter` which issues 5+ reads per release on every visit. With 100 releases, that's 500+ reads.
- **No archival strategy** for completed/archived releases.
- **N+1 loops** (see §8) compound the cost.
- **No read replicas** or `runQuery` pagination.

**Estimated effort to fix:** M-L (1-2 weeks for pagination + dashboard read batching)

---

## Summary

| Dimension | Status | Priority |
|---|---|---|
| Authentication | Partially Ready | P2 |
| Authorization (tenant isolation) | **Not Ready** | **P0** |
| Data Integrity | **Not Ready** | **P0** |
| Loading States | Partially Ready | P2 |
| Error States | Partially Ready | P2 |
| Recovery | Not Ready | P2 |
| Offline Support | Not Ready | P3 |
| Performance | Partially Ready | P1 |
| Accessibility | Partially Ready | P3 |
| Logging | Partially Ready | P1 |
| Monitoring | **Not Ready** | **P0** |
| Security | **Not Ready** | **P0** |
| Scalability | Partially Ready | P1 |

---

## Go / No-Go Assessment

### Recommendation: **NO-GO** for production

**Blockers (must fix before any external user):**
1. **Tenant isolation** (P0) — any auth user can edit any other org's data. `firestore.rules` and the global `artists` / `rights_holders` collections must be fixed.
2. **Data integrity** (P0) — `releaseId: ''` activity writes silently corrupt the feed; delete release orphans child docs; org+membership creation is not atomic.
3. **Monitoring** (P0) — without external error reporting, the first sign of a production issue will be user complaints. Sentry (or similar) must be integrated.
4. **Security headers + CSP** (P0) — no headers configured; the app is one XSS away from credential theft.

**Required pre-launch fixes (~2-3 weeks of work):**
1. Rewrite `firestore.rules` to enforce per-org membership + custom claims (1 week).
2. Add `organizationId` to `artists` and `rights_holders`, migrate data, update rules (1 week).
3. Fix activity log `releaseId: ''` (1 day) + add delete cascade via Cloud Function (2 days).
4. Atomic org creation (1 day).
5. Add Sentry (2 days) + CSP headers (1 day).
6. Standardize error handling: try/catch on all mutations, wire `useToastStore` (1 week).
7. Add pagination to all list pages (2-3 days).
8. Eliminate N+1 loops (3-5 days).

**Conditional go (if timeline is hard):**
- Internal beta with a small trusted set of users, behind a privacy wall, with manual data cleanup. Tenants of size 1 only.
- This is not a viable posture for any external launch.

### Estimated time to production-ready
- P0 fixes only: 2-3 weeks (1 senior engineer)
- P0 + P1 fixes: 5-6 weeks
- All dimensions: 8-10 weeks
