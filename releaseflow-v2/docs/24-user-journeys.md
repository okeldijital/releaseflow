# User Journeys

## Persona Reference

| Persona | Role | Typical Background |
|---------|------|-------------------|
| P1 — Owner | Owner | Label founder / CEO / Managing Director |
| P2 — Admin | Admin | COO / Head of Operations / Senior Manager |
| P3 — PM | Project Manager | Release coordinator / Project manager |
| P4 — A&R | A&R | A&R representative / Creative director |
| P5 — Artist | Artist | Recording artist / Musician |
| P6 — Producer | Producer | Music producer / Beatmaker |
| P7 — Engineer | Engineer (Mix/Master) | Mix engineer / Mastering engineer |
| P8 — Designer | Designer | Graphic designer / Art director / Videographer |
| P9 — Marketing | Marketing | Marketing manager / Digital strategist |
| P10 — PR | PR | Publicist / Media relations |
| P11 — Viewer | Viewer | Label partner / Distributor / Auditor |

---

## Journey Structure

Each journey follows this format:

1. **Onboarding** — First-time experience
2. **Daily/Weekly Flow** — Regular usage patterns
3. **Key Tasks** — Primary actions performed
4. **Collaboration Points** — Interactions with other roles
5. **End State** — What success looks like for this persona

---

## P1 — Owner Journey

### Onboarding

1. Signs up at `/sign-up` with work email.
2. Creates organization: enters name, selects "Record Label", country, timezone, team size.
3. Optionally uploads logo and sets brand color.
4. Invites initial team: Admin, PM, A&R, Marketing lead.
5. Creates first release as a demonstration.
6. Arrives at dashboard → sees org overview with 1 release in DRAFT.

### Daily/Weekly Flow

- Opens dashboard to see org-level stats: release count, pending tasks, team activity.
- Reviews billing and plan usage monthly.
- Occasionally visits release details to check progress.
- Monitors team productivity via Reports.
- Makes high-level decisions: approve budgets, review distribution status.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| Review org metrics | Daily | Dashboard |
| Manage billing | Monthly | Settings > Billing |
| Delete/archive releases | Rare | Release > Settings |
| Change org settings | Rare | Settings > Organization |
| Remove users | Rare | Settings > Team |
| View reports | Weekly | Reports |

### Collaboration Points

- Delegates daily ops to Admin and PM.
- Approves only critical decisions (org deletion, billing changes).
- Reviews distribution readiness before street date.

### End State

Owner sees the label running efficiently: releases ship on time, team is productive, revenue tracking (future) is accurate.

---

## P2 — Admin Journey

### Onboarding

1. Receives invitation email from Owner → clicks "Accept Invitation".
2. If new user: creates account via magic link. If existing: signs in.
3. Arrives at dashboard: sees org with existing releases, team members, tasks.
4. Explores Settings to understand org configuration.

### Daily/Weekly Flow

- Starts day with dashboard: checks pending tasks across all releases.
- Reviews release pipeline: which are in PLANNING, PRODUCTION, READY.
- Manages team: invites new members, adjusts roles, removes inactive users.
- Monitors overall progress and unblocks stalled releases.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| Review all releases | Daily | Dashboard, Releases |
| Manage team membership | Weekly | Settings > Team |
| Configure workflows | Monthly | Settings > Workflows |
| View billing | Monthly | Settings > Billing (read-only) |
| Unblock stalled releases | As needed | Release > Overview |
| Approve stage advancement | As needed | Release > Workflow |

### Collaboration Points

- Coordinates with PMs on release schedules.
- Escalates to Owner for billing or org-deletion decisions.
- Approves stage completions for A&R-signed-off work.
- Invites Producers, Engineers, Designers to specific releases.

### End State

Admin keeps the org running smoothly — releases advance predictably, the team has correct access, and bottlenecks are resolved quickly.

---

## P3 — PM Journey

### Onboarding

1. Invited by Admin, accepts via email link.
2. Assigned role: Project Manager.
3. Lands on dashboard → sees releases they are assigned to.

### Daily/Weekly Flow

- Opens dashboard → checks "My Tasks" and "Upcoming Deadlines".
- Opens each assigned release → reviews stage pipeline on Overview tab.
- Creates tasks for each stage, assigns to the right people.
- Tracks task completion and prods overdue items.
- Updates release metadata and stage status as work progresses.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View assigned releases | Daily | Dashboard, Releases |
| Create and assign tasks | Daily | Release > Overview (Quick Actions) |
| Track deadlines | Daily | Dashboard > Upcoming Deadlines |
| Advance stages | As completed | Release > Workflow |
| Edit release metadata | As needed | Release > Settings |
| Add tracks | Per release | Release > Tracks |
| Invite contributors | Per release | Release > Contributors |

### Collaboration Points

- Assigns tasks to Artists, Producers, Engineers, Designers.
- Notifies A&R when a stage needs approval.
- Reports progress to Admin.
- Coordinates with Marketing on campaign timelines.

### End State

PM delivers releases on time: every stage advances, tasks are completed, and the release hits its street date.

---

## P4 — A&R Journey

### Onboarding

1. Invited by Admin, accepts via email.
2. Assigned role: A&R.

### Daily/Weekly Flow

- Opens dashboard → sees releases needing attention.
- Reviews stage pipelines: which tracks need approval (Mixing, Mastering).
- Listens to submitted mixes/masters (via asset links).
- Approves or rejects stage completions.
- Provides notes on track quality, suggests changes.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View releases needing approval | Daily | Dashboard, Releases |
| Approve stage completion | Per stage | Release > Workflow |
| Reject with feedback | Per stage | Release > Workflow |
| Review assets | Per milestone | Release > Assets |
| Comment on tracks | As needed | Release > Tracks |

### Collaboration Points

- Approves/rejects work submitted by Producers and Engineers.
- Coordinates with PM on scheduling and priorities.
- Provides creative direction to Artist.
- Aligns with Marketing on release readiness.

### End State

A&R maintains creative quality: only releases that meet the label's standards advance to distribution.

---

## P5 — Artist Journey

### Onboarding

1. Receives invitation or is added as a contributor to a release.
2. Assigned role: Artist.
3. Sees only releases where they are credited as primary artist.

### Daily/Weekly Flow

- Opens dashboard → sees assigned releases.
- Checks tasks assigned to them (recording sessions, approvals).
- Views stage pipeline to see where their release is.
- Uploads recorded tracks or stems.
- Reviews mix/master versions and provides feedback.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View my releases | Daily | Dashboard (self-scoped) |
| Complete assigned tasks | Per deadline | Release > Tasks |
| Upload recordings/stems | Per stage | Release > Assets |
| Review mix versions | Per stage | Release > Assets |
| Edit track metadata | Per release | Release > Tracks |

### Collaboration Points

- Submits recordings for Producer/Engineer to work on.
- Receives tasks from PM.
- Receives feedback from A&R.
- Collaborates with Writer/Composer on credits (Contributors tab).

### End State

Artist focuses on creative work: recording, reviewing, and approving — without administrative overhead.

---

## P6 — Producer Journey

### Onboarding

1. Added as contributor to specific release(s).
2. Role: Producer. Self-scoped — sees only assigned releases/tasks.

### Daily/Weekly Flow

- Opens dashboard → sees tasks assigned to them.
- Views stage pipeline for the release they are producing.
- Uploads produced stems, session files, rough mixes.
- Marks tasks complete when deliverables are uploaded.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View assigned tasks | Daily | Dashboard > My Tasks |
| Upload production files | Per stage | Release > Assets |
| Complete tasks | Per deliverable | Release > Tasks |

### Collaboration Points

- Receives raw recordings from Artist.
- Sends stems to Engineer for mixing.
- Receives task assignments from PM.

### End State

Producer delivers high-quality production assets on schedule, with clear version tracking.

---

## P7 — Engineer (Mix/Master) Journey

### Onboarding

1. Added as contributor to specific release(s).
2. Role: Engineer. Self-scoped.

### Daily/Weekly Flow

- Opens dashboard → sees assigned mixing/mastering tasks.
- Downloads source assets (stems, rough mixes).
- Uploads processed files (stereo mix, master WAV).
- Marks task complete when deliverables are ready for review.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View assigned tasks | Daily | Dashboard > My Tasks |
| Download source assets | Per task | Release > Assets |
| Upload processed files | Per deliverable | Release > Assets |
| Complete tasks | Per deliverable | Release > Tasks |

### Collaboration Points

- Receives stems from Producer.
- Sends mixes to A&R for approval (via PM task chain).
- Receives revision requests from A&R.

### End State

Engineer delivers technically excellent mixes and masters with clear version history.

---

## P8 — Designer Journey

### Onboarding

1. Added as contributor to specific release(s).
2. Role: Designer. Self-scoped.

### Daily/Weekly Flow

- Opens dashboard → sees artwork tasks.
- Downloads reference assets (photos, logos).
- Uploads cover art, promotional graphics.
- Iterates on versions based on feedback.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View assigned tasks | Daily | Dashboard > My Tasks |
| Upload artwork | Per deliverable | Release > Assets |
| Delete own uploads (if incorrect) | As needed | Release > Assets |

### Collaboration Points

- Receives creative brief from PM or Marketing.
- Submits designs for A&R approval.
- Coordinates with Marketing on campaign visuals.

### End State

Designer delivers all visual assets (cover art, promotional materials) before the distribution deadline.

---

## P9 — Marketing Journey

### Onboarding

1. Invited by Admin, accepts via email.
2. Role: Marketing.

### Daily/Weekly Flow

- Opens dashboard → sees upcoming releases.
- Opens Marketing Hub → manages campaigns.
- Creates campaign plans per release: timeline, budget, assets.
- Launches campaigns (requires A&R or Admin approval).
- Monitors campaign performance via Reports.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View upcoming releases | Daily | Dashboard, Releases |
| Create campaign | Per release | Marketing Hub |
| Upload marketing assets | Per campaign | Marketing / Release > Assets |
| Launch campaign | Per milestone | Marketing Hub (requires approval) |
| View reports | Weekly | Reports |

### Collaboration Points

- Coordinates campaign timing with PM (release schedule).
- Gets approval from A&R or Admin to launch.
- Works with Designer on campaign visuals.
- Aligns with PR on press outreach timing.

### End State

Marketing launches coordinated campaigns that maximize release visibility and drive streams/sales.

---

## P10 — PR Journey

### Onboarding

1. Invited by Admin, accepts via email.
2. Role: PR.

### Daily/Weekly Flow

- Opens dashboard → sees releases needing PR support.
- Views Marketing Hub for campaign context.
- Uploads press kits, press releases, media assets.
- Tracks press coverage (future: media monitoring).

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View release schedule | Weekly | Dashboard, Releases |
| Upload press materials | Per campaign | Marketing Hub |
| View campaigns (read-only) | As needed | Marketing Hub |

### Collaboration Points

- Coordinates with Marketing on campaign timing.
- Provides press assets for Designer to incorporate.
- Receives release dates and embargo info from PM.

### End State

PR secures media coverage that amplifies the marketing campaign's reach.

---

## P11 — Viewer Journey

### Onboarding

1. Invited by Admin or Owner (e.g., label partner, distributor).
2. Role: Viewer.
3. Can view all releases, tasks, assets, reports — no create/edit/delete.

### Daily/Weekly Flow

- Opens dashboard → sees overview of all releases.
- Drills into specific releases to check status and progress.
- Views reports and analytics.
- Cannot perform any mutating actions.

### Key Tasks

| Task | Frequency | Where |
|------|-----------|-------|
| View all releases | Weekly | Dashboard, Releases |
| Check release progress | As needed | Release > Overview |
| View reports | Monthly | Reports |

### Collaboration Points

- Consumes information only — no direct collaboration.
- May provide external feedback via email/phone (outside system).

### End State

Viewer stays informed about release pipeline and label activity without needing write access.

---

## Cross-Journey Interaction Map

```
                  ┌─────────┐
                  │  Owner   │
                  └────┬────┘
                       │ delegates
                       ▼
                  ┌─────────┐
                  │  Admin   │
                  └────┬────┘
                       │ coordinates
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    ┌────────┐   ┌──────────┐   ┌──────────┐
    │   PM    │   │   A&R    │   │ Marketing │
    └───┬────┘   └────┬─────┘   └────┬─────┘
        │              │              │
   assigns tasks   approves      coordinates
        │           stages         campaign
        ▼              │              │
   ┌──────────┐        │        ┌──────────┐
   │  Artist   │◄──────┘        │    PR    │
   │ Producer  │                └──────────┘
   │ Engineer  │
   │ Designer  │
   └──────────┘

   ┌──────────┐
   │  Viewer   │ (read-only, outside collaboration loop)
   └──────────┘
```

## Journey Timeframes

| Phase | Duration | Key Activities |
|-------|----------|---------------|
| Onboarding | 5-15 min | Account creation, org setup, first release |
| Per Release (Single) | 4-8 weeks | Planning → Production → Mix → Master → Artwork → Dist → Release |
| Per Release (Album) | 12-24 weeks | Same stages, longer production phase |
| Daily Session | 5-15 min | Check tasks, review notifications, update status |
| Weekly Review | 15-30 min | Pipeline review, team sync, deadline check |
| Monthly Review | 30-60 min | Reports, billing, strategic planning |
