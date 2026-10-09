# Firestore Tenant-Isolation Authorization Matrix (RR-001)

Status: Audit working document; source-reviewed 2026-10-10  
Branch: audit/rr-001-firestore-emulator-tests  
Scope: Client Firestore rules. This is a source-level matrix, not proof that each exploit path has been reproduced. No production changes are authorized.

## Authorization principles

1. Tenant-owned records must be checked against an authoritative organization boundary: immutable organizationId, a parent entity, or an organization-scoped path.
2. A client-supplied organizationId is not proof of access. Create rules must validate membership/role and linked-parent tenancy.
3. Updates must prevent changing tenant boundaries and authorize against existing and resulting data.
4. Child/link records must validate access to parent records. Test both same-tenant positive cases and cross-tenant negative cases.
5. User-owned records must be scoped to request.auth.uid. Worker-owned queues should not be available to arbitrary clients.
6. Preserve onboarding/invitation flows only with explicit positive and negative regression tests.
7. Do not infer schema from collection names. Mark unknown mappings unresolved until application call sites and document shapes are inspected.

## Matrix

| Collection/path | Source finding | Authoritative boundary / proposed guard | Required tests | Disposition |
|---|---|---|---|---|
| organizations/{orgId} | Any authenticated user can read | Owner/member unless metadata is intentionally public; verify onboarding and invitation call sites | A/B owner/member/non-member get/list; owner create/update; non-owner mutation denied | Visibility decision required |
| organizations/{orgId}/artists/{artistId} | Read condition is member OR authenticated, effectively any authenticated user | Path org membership; manager+ writes | Same-org read/write; cross-org and non-member get/list/write denied | Tenant guard required |
| organizations/{orgId}/members/{memberId} | Self-read and invitation/owner paths | Path org; validated invitation for self-service; owner/admin role changes | Self-elevation denied; invitation acceptance allowed; cross-org enumeration denied | Partial coverage |
| organizations/{orgId}/media_assets/{id} | mediaGuard only checks authentication | Path org membership; role policy requires domain confirmation | A/B membership matrix for CRUD; spoofed tenant denied | Tenant guard required |
| organizations/{orgId}/media_versions/{id} | mediaGuard only checks authentication | Path org membership and parent asset tenant | Same-org access; parent mismatch and cross-org denied | Tenant guard required |
| organizations/{orgId}/media_usage/{id} | mediaGuard only checks authentication | Path org membership; confirm client-write requirement | Same-org allowed where needed; non-member/cross-org denied | Tenant guard required |
| organizations/{orgId}/media_reviews/{id} | mediaGuard only checks authentication | Path org membership; review role policy unresolved | Same-org reviewer allowed; unauthorized role/cross-org denied | Tenant guard and role decision |
| organizations/{orgId}/media_comments/{id} | mediaGuard only checks authentication | Path org membership and parent relation if present | Same-org access; cross-org and parent mismatch denied | Tenant guard required |
| organizations/{orgId}/artworks/{id} | mediaGuard only checks authentication | Path org membership; confirm release/artwork relation | Same-org access; non-member/cross-org/forged parent denied | Tenant guard required |
| organizations/{orgId}/storage_locations/{id}, storage_policies/{id}, folder_templates/{id}, storage_references/{id} | Membership checks and some org field checks already exist | Path org + active membership; orgId immutable | Same-org positive; cross-org/non-member and orgId mutation denied | Expand regression coverage |
| memberships/{id} | Owner/invitation checks and self-record paths | User + organization; accepted invitation or owner-authorized owner membership | Self-elevation, forged role, cross-org reads, role changes, invitation positive/negative | Partial coverage |
| roles/{id} | Authenticated read/write | UNRESOLVED: global role definitions or tenant-owned assignments? | Test intended global reads and tenant mutations | Schema/call-site review |
| releases/{id} | Org-scoped read, manager create/update, admin delete | organizationId + role | Cross-tenant get/list/mutation; forged create/update tenant; lifecycle/version invariants | Expand coverage |
| workflows/{id} | Org membership guard; any member can create/update/delete | organizationId; confirm role policy | Same-org and cross-org CRUD; collaborator permission matrix | Role policy review |
| stages/{id} | Authenticated read/write | UNRESOLVED: likely workflow child; inspect schema/call sites | Parent workflow access and cross-org CRUD | Schema/call-site review |
| tracks/{id} | Org-scoped and role-checked | Immutable organizationId + role | CRUD/list/query, tenant mutation attempts | Expand coverage |
| release_tracks/{id} | Org-scoped read; validates linked release/track on writes | Both linked entities must belong to same org | Same-org CRUD/query; cross-org/forged link denied | Partial coverage |
| track_artists/{id} | Org-scoped read; validates track and nested artist on writes | Track and nested artist must belong to same org | Query compatibility; cross-org links denied | Partial coverage |
| assignments/{id} | Authenticated read/update/delete; create checks only entityId | UNRESOLVED: derive tenant from entityId parent; define role policy | Parent access for each action; forged entityId denied | Critical candidate |
| production_deliverables/{id} | Authenticated read/update/delete; create checks field presence only | Track tenant must equal immutable organizationId | Same-org linked track; cross-org track and spoofed tenant denied | Critical candidate |
| credits/{id}, contributors/{id} | Authenticated read/write | UNRESOLVED: map to release/track/organization parent | Same/cross-org parent CRUD | Critical candidate |
| tasks/{id} | Authenticated read/update/delete; create accepts organizationId OR stageId | UNRESOLVED: map task to release/workflow/stage | Parent tenant CRUD; tenant mutation denied | Critical candidate |
| comments/{id}, deliverables/{id}, release_requirements/{id}, asset_references/{id} | Authenticated read/write | Map parent entity and tenant; immutable links | Same-org flow; cross-org and forged parent denied | Critical candidate |
| approval_requests/{id} | Authenticated read/write | Release/asset parent tenant plus approver/state policy | Valid approval; cross-org and unauthorized state transition denied | Critical candidate |
| distribution_packages/{id} | Authenticated read/write | Release parent tenant | Same-org preparation; cross-org CRUD denied | Critical candidate |
| campaigns/{id}, campaign_tasks/{id} | Authenticated read/write | UNRESOLVED: confirm release-promotion domain and parent | Release-linked same-org path; cross-org denied | Critical candidate; schema review |
| release_artists/{id}, track_credits/{id} | Authenticated read/write | Release/track and artist/contributor same-tenant integrity | Same-org links; cross-org/forged parent denied | Critical candidate |
| rights_holders/{id}, release_ownerships/{id}, track_ownerships/{id} | Authenticated read/write | Release/track tenant; ownership mutation roles need confirmation | Cross-org reads/writes denied; unauthorized rights changes denied | Critical candidate |
| release_budgets/{id}, cost_items/{id} | Authenticated read/write | Release parent tenant; finance permissions require confirmation | Same-org authorized flow; cross-org/unauthorized role denied | Critical candidate |
| resource_assignments/{id} | Authenticated read/write | Assignment/resource/release parent chain | Parent and cross-org mismatch denied | Critical candidate |
| dependencies/{id} | Authenticated read/write | Both dependency endpoints must be in same tenant | Same-org edge allowed; cross-org edge denied | Critical candidate |
| operational_alerts/{id} | Authenticated read/write | UNRESOLVED: alert parent and whether client mutation is intended | Authorized reads; forged create/update/delete denied | Critical candidate |
| release_milestones/{id} | Create references resource.data.organizationId | Create should validate request.resource.data.organizationId plus membership; verify intended role | Same-org create succeeds; cross-org create denied; orgId immutable | Likely create logic defect; test first |
| people/{id}, assets/{id} | Membership and tenant checks present | organizationId + role; immutable tenant | CRUD/list/query matrix and spoofed tenant denied | Expand coverage |
| invitations/{token} | Public get; authenticated list; manager create; invitee acceptance | Unguessable token get only; minimize public fields | Token get positive; unauthenticated list denied; wrong email/org/role denied | Intentional exception; review |
| activity_events/{id} | Org-scoped read/create; immutable | organizationId + active membership | List/query, actor/org spoof tests | Expand coverage |
| notifications/{id} | User-scoped existing record; create checks request user | userId equals auth UID for every operation | Own-user CRUD; other-user CRUD denied | Review create rule overlap |
| users/{uid}, user_preferences/{uid}, notification_preferences/{uid}, calendar_preferences/{uid} | User-scoped rules | UID/document ID equality; protect privilege fields | Own-user positive; other-user denied; protected field mutation denied | Expand coverage |
| assignment_comments/{id} | Authenticated read; any authenticated update | Parent assignment access + author/editor role | Accessible/inaccessible parent CRUD; forged author/org denied | Critical candidate |
| assignment_watchers/{id} | Authenticated read/delete; weak create | Parent assignment access and watcher-target policy | Cross-org read; unauthorized add/remove denied | Critical candidate |
| assignment_comment_reads/{id} | Authenticated read; user-scoped update/delete only | User ID plus parent comment/assignment access | Own marker allowed; other-user/inaccessible parent denied | Critical candidate |
| notification_events/{id} | Authenticated read/list; create checks actor only | UNRESOLVED: tenant/user scope and whether client create is needed | Non-member read/list denied; actor spoof denied | Critical candidate |
| deliverable_links/{id} | Authenticated read; create checks assignmentId; any auth update/delete | Parent assignment/deliverable tenant and link integrity | Parent access and cross-org link tests | Critical candidate |
| user_notifications/{id} | Read/update user-scoped; create only requires userId/eventId present | Recipient scope; client cannot target other users | Own-user create/read/update; cross-user create denied | Create rule needs hardening |
| notification_processing/{id} | Authenticated read/create | Worker-owned queue unless a documented client use exists | Client read/write denied; server worker tested separately | Critical candidate |
| email_queue/{id} | Authenticated read/create pending | Worker-owned queue; avoid exposing recipient/email payload | Client read denied; forged recipient/event denied | Critical candidate |
| push_subscriptions/{id} | User-scoped | userId equals auth UID and is immutable | Own-user CRUD; other-user denied | Expand coverage |
| push_queue/{id} | Authenticated read; pending create | Worker-owned queue | Client read/forged writes denied; worker tested separately | Critical candidate |
| release_readiness_history/{id} | Authenticated read; create checks releaseId/orgId presence only | Release parent tenant must equal organizationId; preferably server-created | Same-org read/create; cross-org and forged release denied | Critical candidate |
| feedback/{id} | Create-only; own user and membership required | Keep create-only and validate membership | Valid same-org create; non-member/spoofed user/org denied | Add tests |

## Execution order

### P0 — Clear tenant-boundary defects
1. Fix artist reads and media subcollection membership guards.
2. Decide organization root read visibility after checking onboarding/invitation call sites.
3. Map assignments, production_deliverables, release_milestones, release_readiness_history, and assignment collaboration to authoritative parents.
4. Remove authenticated-only client access to worker queues after confirming UI dependencies; prefer server-mediated operations.

### P1 — Schema-dependent rules
1. Inspect application read/write call sites and stored document shapes for every UNRESOLVED collection.
2. Record exact parent fields and role semantics before rewriting rules.
3. For each rule change, add tests for same-tenant permitted access, cross-tenant denial, non-member denial, forged parent/tenant denial, and unauthenticated denial.
4. Preserve legacy exceptions only when documented and tested.

### P2 — Certification
1. Run the full emulator suite and report exact output.
2. Run web unit tests and typecheck.
3. Exercise authenticated browser flows for org creation, invitation acceptance, release creation/edit, tracks/links, artwork/media, assignment, approval, and distribution preparation.
4. Update RF-SEC-001/RF-SEC-002 and the Functional Validation Register with actual results.
5. Keep PR #2 draft. Do not deploy until critical tenant-isolation paths are tested and remediated.

## Evidence boundary

This matrix is based on source review of releaseflow-v2/firestore.rules. It does not claim that every finding has been reproduced at runtime. Existing passing tests verify only their specific assertions. Schema-dependent mappings are intentionally unresolved.
