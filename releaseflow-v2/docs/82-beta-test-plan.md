# Beta Test Plan — ReleaseFlow RC1

## Test Period

- **Start**: TBD
- **Duration**: 4 weeks
- **Participants**: Invited beta group (Record Labels, Independent Artists, Management Companies)

---

## Test Scenarios

### Scenario 1 — Onboarding

1. Sign up with work email
2. Verify email
3. Create organization (Record Label)
4. Configure organization branding
5. Invite 2 team members (Admin + Producer roles)
6. Skip first release creation

**Success Criteria**: Organization created, invitations sent, dashboard visible.

### Scenario 2 — Single Release (End-to-End)

1. Create a Single release "Midnight Sessions"
2. Verify 7-stage workflow generated
3. Add 2 tracks with ISRC codes
4. Assign tasks to team members
5. Complete all tasks through workflow
6. Upload audio and artwork deliverables
7. Approve deliverables
8. Generate distribution package
9. Release marked as Ready for Distribution

**Success Criteria**: All stages complete, distribution package generated.

### Scenario 3 — Album Release with Campaign

1. Create Album release "Echoes"
2. Add 8 tracks
3. Assign contributors (Artist, Producer, Mix Engineer, Mastering Engineer)
4. Create Pre-Save campaign
5. Create Social Media campaign
6. Complete all workflow stages
7. Both campaigns complete
8. Distribution package generated

**Success Criteria**: Campaigns active and completed. All stages done.

### Scenario 4 — EP Release with Budget

1. Create EP release
2. Set budget of $5,000
3. Add cost items across production, mixing, mastering, artwork
4. Track budget health through lifecycle
5. Complete release workflow

**Success Criteria**: Budget tracking accurate. Budget stays on budget.

### Scenario 5 — Remix Release with Dependency

1. Create Remix release
2. Add legal dependency "Sample clearance"
3. Workflow cannot advance past blocked stages
4. Resolve dependency
5. Complete release

**Success Criteria**: Dependency blocks workflow until resolved.

### Scenario 6 — Permission Verification

1. Owner creates release
2. Owner assigns Producer to release
3. Producer can view release and tasks, cannot delete release
4. Viewer can view but cannot create or edit
5. Confirm role boundaries are enforced

**Success Criteria**: Each role can only perform authorized actions.

### Scenario 7 — Multi-Org Tenant Isolation

1. User in Org A creates a release
2. User in Org B cannot see Org A's release
3. Org switcher shows only user's organizations
4. Data filtered by active organization

**Success Criteria**: No cross-org data leakage.

### Scenario 8 — Mobile Validation

1. Access all primary screens on mobile viewport (375px)
2. Verify sidebar collapses to bottom tab bar
3. Verify forms are usable on mobile
4. Verify touch targets are adequate (>44px)

**Success Criteria**: All primary screens functional on mobile.

---

## Bug Reporting Template

```markdown
### Title
[Brief description of the issue]

### Severity
- [ ] Critical — System unavailable, data loss, security breach
- [ ] High — Core feature broken, no workaround
- [ ] Medium — Feature broken, workaround exists
- [ ] Low — Cosmetic, minor inconvenience

### Environment
- Browser:
- Device:
- OS:
- URL:

### Steps to Reproduce
1.
2.
3.

### Expected Behavior

### Actual Behavior

### Screenshots / Screen Recording

### Additional Context
```

---

## Severity Matrix

| Severity | Definition | Response SLA | Examples |
|---|---|---|---|
| **Critical** | System unavailable, data loss, security vulnerability | 1 hour | App crashes, data corruption, auth bypass |
| **High** | Core feature broken, no workaround | 4 hours | Cannot create release, upload fails always |
| **Medium** | Feature broken with workaround | 24 hours | Filter not working, button misaligned |
| **Low** | Cosmetic or minor inconvenience | 1 week | Typos, spacing, color issues |

---

## Exit Criteria

| Area | Target |
|---|---|
| **Build** | Clean build on Vercel |
| **TypeScript** | Zero errors (`tsc --noEmit` clean) |
| **ESLint** | Zero errors |
| **Tests** | ≥250 passing automated tests |
| **Firestore Rules** | 100% of planned rules deployed |
| **Storage Rules** | 100% of planned rules deployed |
| **Indexes** | 100% of required composite indexes created |
| **Tenant Isolation** | Cross-org data access blocked in all verified paths |
| **UI Integration** | All planned RC1 screens render without errors |
| **Diagnostics** | All systems green on diagnostics dashboard |
| **Accessibility** | No critical WCAG issues |
| **Mobile** | All primary screens validated at 375px viewport |
| **Performance** | Dashboard loads in <3s on standard connection |
| **Security** | No Critical or High severity findings |
| **Deployment** | Successful production deploy on Vercel |
| **E2E** | All 5 release type scenarios pass |
| **Zero Critical Bugs** | No open Critical severity bugs |
| **Zero High Bugs** | No open High severity bugs |

### Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Engineering Lead | | | |
| Product Owner | | | |
| QA Lead | | | |
