# RR-001 Firestore Emulator Security Regression Plan

**Status:** Prepared for isolated execution; tests have not yet been run.
**Scope:** Validate Firestore Rules authorization for RF-SEC-001 (self-assigned membership roles) and RF-SEC-002 (cross-tenant access).
**Safety boundary:** Emulator only. Never execute these tests against `releaseflow-prod`, any production Firebase project, or a developer's default Firebase project.

## 1. Purpose and exit criteria

Create a deterministic, automated security regression suite that runs against a local Firestore Emulator with synthetic users and synthetic organization data. The suite must demonstrate that:

1. An unaffiliated authenticated user cannot create a membership or organization member-index record that grants themselves an elevated role.
2. A user cannot read, create, update, or delete another organization's release-related records unless the intended authorization policy explicitly permits the operation.
3. A legitimate organization owner and an active authorized member retain the operations permitted by the documented policy.
4. All tests fail closed if the emulator is not explicitly selected or if the configured Firebase project is the production project.

Do not mark RF-SEC-001 or RF-SEC-002 fixed, verified, or closed based on source inspection alone. Runtime test results and rule review are required.

## 2. Required harness

- Use Firebase Local Emulator Suite with Firestore bound to localhost only.
- Pin the emulator port to `8080`; disable emulator UI unless needed for debugging.
- Use `@firebase/rules-unit-testing` for authenticated and unauthenticated test contexts.
- Use the Firestore Rules file at `releaseflow-v2/firestore.rules` as the rules under test.
- Load rules directly from that file; do not copy/paste a separate rules implementation into the tests.
- Seed fixtures only through `withSecurityRulesDisabled` and only in the emulator.
- Use synthetic identifiers such as `user-owner-a`, `user-member-a`, `user-outsider-b`, `org-a`, and `org-b`. Do not use real user IDs or production data.
- Tests must be repeatable and clean up or reset emulator state between cases.
- Add a dedicated command such as `pnpm test:security:firestore`. It must start or require the local emulator and exit non-zero on any failed assertion.
- Pin compatible versions of `firebase-tools` and `@firebase/rules-unit-testing`; update the appropriate package manifest and lockfile together.

## 3. Mandatory production safety guard

Before initializing test environments, assert all of the following:

- Emulator host is explicitly set to `127.0.0.1:8080` (or the test runner's documented local equivalent).
- The project ID is a dedicated non-production test ID, e.g. `releaseflow-rules-test`.
- The project ID is not `releaseflow-prod`.
- Firestore is connected to the emulator using `connectFirestoreEmulator` or the rules-unit-testing emulator environment.
- The test setup must not read credentials from application production environment files or use Firebase Admin credentials that can access production.
- If any guard fails, abort before seeding data or issuing reads/writes.

Do not rely on `.firebaserc` defaults. Do not use `firebase emulators:exec` with an implicit project ID.

## 4. Synthetic fixture model

Seed the following through rules-disabled emulator context:

- Organization A: `organizations/org-a`, `ownerId: user-owner-a`.
- Organization B: `organizations/org-b`, `ownerId: user-owner-b`.
- Active member index for `user-member-a` under `organizations/org-a/members/user-member-a`, with `userId: user-member-a`, `organizationId: org-a`, `roleId: collaborator`, `status: active`.
- Membership records for the legitimate owner/member, matching the current application schema.
- A release in each organization with matching `organizationId`, valid lifecycle, `version: 1`, and a synthetic `createdBy`.
- Representative records for at least one collection currently governed by broad authenticated-user-only rules. Choose exact paths after reviewing every `match` block and document the selected examples in the test names.

Never seed a privileged member-index entry for the attacker except in a dedicated negative-test setup where the fixture is required to evaluate another rule; do not unintentionally make the attacker an org member.

## 5. RF-SEC-001: membership and role escalation tests

Implement explicit tests for these cases:

1. **Unaffiliated user cannot self-create elevated member index:** `user-outsider-b` attempts to create `organizations/org-a/members/user-outsider-b` with `userId: user-outsider-b`, `organizationId: org-a`, `roleId: administrator`, `status: active`. Expected: denied.
2. **Unaffiliated user cannot self-create owner membership:** attacker attempts to create `memberships/{id}` for themselves in `org-a` with `roleId: owner`. Expected: denied.
3. **Unaffiliated user cannot self-create administrator membership:** same attempt with `roleId: administrator`. Expected: denied.
4. **Unaffiliated user cannot self-create manager membership:** same attempt with `roleId: release_manager`. Expected: denied.
5. **Legitimate owner can administer membership according to policy:** verify allowed owner action and verify that the target role/status fields are constrained as intended.
6. **Ordinary active collaborator cannot elevate own role:** collaborator attempts to update their own member index and membership role to `administrator`. Expected: denied.
7. **Invitation acceptance path remains functional:** test the actual approved invitation acceptance contract. If the current data model does not provide a verifiable invitation token/state, record that as a design gap; do not weaken the negative assertions to make the test pass.

The current source appears to permit self-creation based only on matching UID and a string `roleId` in both `organizations/{orgId}/members/{memberId}` and `memberships/{docId}`. The first two to four tests are expected to expose this if the rule path and schema are as described. Record actual emulator results; do not report expected results as observed results.

## 6. RF-SEC-002: cross-tenant access tests

At minimum, test organization A's outsider and organization B's member/owner against organization A data:

1. Organization B user cannot read organization A's release.
2. Organization B user cannot create a release in organization A without active membership and sufficient role.
3. Organization B user cannot update or delete organization A's release.
4. Organization B user cannot read, create, update, or delete organization A records in each representative collection governed by broad `isAuth()` rules.
5. Organization A collaborator cannot write records reserved for manager/admin roles.
6. Anonymous users are denied access to all private test fixtures.
7. An organization A owner retains permitted access to organization A and is denied access to organization B unless separately authorized.

Inventory every Firestore `match` block before declaring coverage. Include direct top-level collections and organization-scoped subcollections. Record any collection not covered by automated tests and the reason. A `organizationId` field on a document is not itself an authorization check; test both path-based and field-based tenancy patterns.

## 7. Execution and reporting

- Run the suite only against the emulator with the production safety guard enabled.
- Capture command, tool/runtime versions, timestamp, test count, pass/fail count, and relevant assertion output.
- For every failing test, record the exact document path, operation, auth principal, expected decision, and actual decision.
- Map failures to RF-SEC-001 or RF-SEC-002 in the RR-001 Defect Register.
- Fix rules in a separate remediation commit after the failing cases are reproduced; do not silently change expected assertions.
- Re-run the complete suite after remediation and report before/after results.
- Add positive regression cases so fixes do not block legitimate owner/member workflows.
- No production rule deployment is authorized by this plan. Deployment requires reviewed changes, successful emulator suite, and explicit release/deployment approval.

## 8. Current evidence status

- Source-level review has identified potential membership privilege escalation and potential cross-tenant authorization gaps.
- These findings are provisional until reproduced in the emulator.
- The repository's inspected `firebase.json` configures Firestore rules and indexes but no emulator. The inspected manifests include Vitest but do not directly declare `firebase-tools` or `@firebase/rules-unit-testing`.
- The repository's `.firebaserc` default project is `releaseflow-prod`; the test harness must override this explicitly and must never use that default.
- No production Firebase rules or data have been changed as part of this plan.
