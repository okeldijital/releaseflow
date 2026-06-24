# Organization Settings

## Route Structure

```
/settings                          → Organization (profile, branding)
/settings/team                     → Team (members, roles, invites)
/settings/workflows                → Workflow stage templates
/settings/templates                → Release template defaults
/settings/integrations             → API keys, webhooks, DSPs
/settings/billing                  → Plan, invoices, payment
/settings/account                  → Profile, password, notifications
```

All settings pages share the same layout: sidebar (org-level) + settings
sub-navigation (left vertical tabs) + content area.

---

## S-1 Organization Profile

### Layout

```
Settings
├─ ● Organization          ┌──────────────────────────────────────┐
│  ○ Team                  │  Organization Settings              │
│  ○ Workflows             │                                      │
│  ○ Templates             │  Organization name                   │
│  ○ Integrations          │  ┌──────────────────────────────┐   │
│  ○ Billing               │  │ Acme Records                 │   │
│  ○ Account               │  └──────────────────────────────┘   │
│                          │                                      │
│                          │  URL slug                            │
│                          │  ┌──────────────────────────────┐   │
│                          │  │ acme-records                 │   │
│                          │  └──────────────────────────────┘   │
│                          │  releaseflow.app/acme-records        │
│                          │                                      │
│                          │  Organization type                   │
│                          │  ┌──────────────────────────────┐   │
│                          │  │ Record Label          ▼      │   │
│                          │  └──────────────────────────────┘   │
│                          │                                      │
│                          │  Country │ Timezone                  │
│                          │  ┌─────┐  ┌──────────────────────┐  │
│                          │  │ US  │  │ America/New_York ▼   │  │
│                          │  └─────┘  └──────────────────────┘  │
│                          │                                      │
│                          │  ┌──────────────────────────────┐   │
│                          │  │  Save changes                │   │
│                          │  └──────────────────────────────┘   │
│                          └──────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| Organization name | Text | Yes | — | 1-100 chars, trimmed |
| URL slug | Text | Yes | Auto from name | Alphanumeric + hyphens, unique, 3-50 chars |
| Organization type | Select | Yes | Record Label | Enum: Record Label, Independent Artist, Management Company, Publisher, Agency |
| Country | Select | Yes | — | ISO 3166-1 alpha-2 |
| Timezone | Select | Yes | America/New_York | IANA timezone list |
| Brand color | Color | No | #7C3AED | Hex format |
| Logo | Image upload | No | — | PNG/SVG/WEBP, max 2MB, 500×500px |
| Default language | Select | No | English (US) | ISO 639-1 with region |

### Behaviors

- Slug auto-generates from org name on creation; manually editable in settings.
- Slug uniqueness checked asynchronously on input.
- Brand color preview updates live as user types hex or uses picker.
- Logo upload: drag-and-drop zone, preview after upload, shows file size and dimensions.
- "Save changes" button enables only when unsaved changes exist.
- "Cancel" reverts to last saved state.

---

## S-2 Team Management

### Layout

```
Settings > Team

┌────────────────────────────────────────────────────────────┐
│  Team Members                                    + Invite  │
│                                                             │
│  ┌──────┬───────────────┬──────────┬───────────┬──────────┐│
│  │      │ Name           │ Role     │ Status    │ Actions  ││
│  ├──────┼───────────────┼──────────┼───────────┼──────────┤│
│  │  👤  │ Jane Admin     │ Admin    │ ● Active  │ [...]   ││
│  │  👤  │ Alex PM        │ PM       │ ● Active  │ [...]   ││
│  │  👤  │ Sam A&R        │ A&R      │ ◌ Pending │ [...]   ││
│  │  👤  │ Taylor Artist  │ Artist   │ ● Active  │ [...]   ││
│  └──────┴───────────────┴──────────┴───────────┴──────────┘│
│                                                             │
│  Showing 4 of 12 members                                    │
└────────────────────────────────────────────────────────────┘
```

### Columns

| Column | Content | Sortable |
|--------|---------|----------|
| Avatar | Initials or photo (24px) | No |
| Name | Full name + email below (muted) | Yes |
| Role | Role badge | Yes |
| Status | ● Active / ◌ Pending (never accepted) / ✕ Inactive | Yes |
| Actions | Edit role, Remove | No |

### Actions

| Action | Who Can Perform | Behavior |
|--------|----------------|----------|
| Invite member | Owner, Admin, PM (self-scoped) | Opens invite modal (see Invitation Experience doc) |
| Edit role | Owner, Admin, PM (self-scoped) | Dropdown to change role; confirmation for demotion |
| Remove member | Owner, Admin | Confirmation dialog: "Remove [name] from [org]? They will lose access to all releases." |
| Resend invite | Owner, Admin | Re-sends invitation email to pending member |
| Cancel invite | Owner, Admin | Revokes pending invitation |

### Role Change Rules

| Change | Valid | Note |
|--------|-------|------|
| Admin → Owner | Yes | Requires second Owner approval (if max 2 not reached) |
| Owner → Admin | Yes | Cannot demote self if last Owner |
| Any → Viewer | Yes | No restrictions |
| Viewer → Any | Yes | Requires appropriate `user:assign_role` |
| Last Owner demotion | No | API rejects — must transfer ownership first |

---

## S-3 Workflow Configuration

### Layout

```
Settings > Workflows

┌────────────────────────────────────────────────────────────┐
│  Workflow Templates                                         │
│                                                             │
│  Active template: Single Pipeline                           │
│                                                             │
│  ≡  Planning                       ⚙ can_skip: false   [×] │
│     Required deliverables: Release plan, Track list        │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Production                      ⚙ can_skip: false   [×] │
│     Required deliverables: Raw audio files                 │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Mixing                          ⚙ can_skip: false   [×] │
│     Required deliverables: Stereo mix (WAV 24/48)          │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Mastering                       ⚙ can_skip: false   [×] │
│     Required deliverables: Master file (WAV 16/44.1)       │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Artwork                         ⚙ can_skip: false   [×] │
│     Required deliverables: Cover art (3000x3000)           │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Distribution                    ⚙ can_skip: false   [×] │
│     Required deliverables: All metadata, UPC, ISRC         │
│     Required approvals: 0                                   │
│  ────────────────────────────────────────────────────────── │
│  ≡  Release                         ⚙ can_skip: false   [×] │
│     Required deliverables: Release date confirmed          │
│     Required approvals: 0                                   │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  + Add stage                                     │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Drag to reorder    |    × to remove    |    ⚙ settings    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Save template                                   │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

### Per-Stage Settings (⚙)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Stage name | Text | — | Display name (e.g., "Mixing") |
| can_skip | Toggle | false | Allow stage to be skipped |
| required_approvals | Number | 0 | Number of approvals needed before stage completes |
| required_deliverables | Text[] | [] | List of required deliverables per stage |

### Behaviors

- Drag handle `≡` to reorder stages.
- `×` to remove stage (confirmation: "Remove [stage name]? Releases using this template will not be affected.")
- `+ Add stage` adds a new stage at the bottom with default name "New Stage".
- Stage settings (⚙) opens inline or modal for stage configuration.
- Changes apply to new releases only; existing releases retain their copied stage definitions.
- Four templates available: Single, EP, Album, Remix — selectable via dropdown.

---

## S-4 Release Templates

### Layout

```
Settings > Templates

┌────────────────────────────────────────────────────────────┐
│  Release Templates                                          │
│                                                             │
│  Template:  [Single ▼]                                      │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Default settings for Single releases                   ││
│  │                                                        ││
│  │  Default stages: Single Pipeline (7 stages)            ││
│  │  Default tracks: 1                                      ││
│  │  Required contributors: Artist, Producer                ││
│  │                                                        ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │  Metadata presets                                │  ││
│  │  │  ┌──────────────────────────────────────────┐   │  ││
│  │  │  │  Genre: [Select ▼]                       │   │  ││
│  │  │  │  Language: [English (US) ▼]              │   │  ││
│  │  │  │  Label: [Acme Records]                   │   │  ││
│  │  │  │  Copyright: [℗ [year] [label]]          │   │  ││
│  │  │  └──────────────────────────────────────────┘   │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  │                                                        ││
│  │  ┌──────────────────────────────────────────────────┐  ││
│  │  │  Save template                                  │  ││
│  │  └──────────────────────────────────────────────────┘  ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Workflow template | Select | Single Pipeline | Which stage template to use |
| Default tracks | Number | 1 (Single), 4 (EP), 10 (Album), 1 (Remix) | Auto-created on release creation |
| Required contributors | Multi-select | Per template | Roles that must be assigned |
| Genre | Select | — | Pre-selected genre for new releases |
| Language | Select | English (US) | Default language for track metadata |
| Label | Text | Org name | Pre-filled label on new releases |
| Copyright | Template | ℗ [year] [label] | Auto-generated copyright string |

### Behaviors

- Changes apply to new releases only. Existing releases retain their creation-time values.
- "Save template" persists the preset values for the selected template type.
- Four template types: Single, EP, Album, Remix — switch via dropdown to configure each.

---

## S-5 Integrations

### Layout

```
Settings > Integrations

┌────────────────────────────────────────────────────────────┐
│  Integrations                                               │
│                                                             │
│  ─── API Keys ────────────────────────────────────────────  │
│                                                             │
│  ┌──────┬──────────────┬──────────────┬──────────┬────────┐│
│  │ Name │ Key           │ Created      │ Last Used│ Actions││
│  ├──────┼──────────────┼──────────────┼──────────┼────────┤│
│  │ Prod │ rf_prod_•••• │ Jan 15, 2026 │ 2h ago   │ [...] ││
│  │ Dev  │ rf_dev_••••• │ Feb 01, 2026 │ Never    │ [...] ││
│  └──────┴──────────────┴──────────────┴──────────┴────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  + Generate new key                               │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ─── Webhooks ────────────────────────────────────────────  │
│                                                             │
│  ┌──────────┬──────────────┬───────────┬────────┬─────────┐│
│  │ URL      │ Events        │ Status    │ Last   │ Actions ││
│  ├──────────┼──────────────┼───────────┼────────┼─────────┤│
│  │ https:// │ release.*    │ ● Active  │ 1h ago │ [...]   ││
│  └──────────┴──────────────┴───────────┴────────┴─────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  + Add webhook                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ─── DSP Connections ────────────────────────────────────  │
│                                                             │
│  Spotify        ● Connected     [Disconnect]               │
│  Apple Music    ● Connected     [Disconnect]               │
│  Tidal          ○ Not connected [Connect]                   │
│  Amazon Music   ○ Not connected [Connect]                   │
└────────────────────────────────────────────────────────────┘
```

### API Keys

| Action | Behavior |
|--------|----------|
| Generate | Modal: name input → key revealed once (copy to clipboard), stored as hash |
| Revoke | Confirmation dialog: "Revoke [name]? Applications using this key will lose access immediately." |
| Copy | One-click copy to clipboard; "Copied" toast |
| Regenerate | Replaces key; old key immediately invalidated |

### Webhooks

| Field | Description |
|-------|-------------|
| URL | HTTPS endpoint that receives events |
| Events | Selectable: release.*, stage.*, task.*, asset.*, campaign.*, dist.* |
| Status | Active / Paused / Failed (after 5 consecutive failures) |
| Secret | Auto-generated HMAC secret for payload signing |

### DSP Connections

| DSP | Connection Type | Status |
|-----|----------------|--------|
| Spotify | OAuth or API token | Connected / Not connected / Error |
| Apple Music | API token (Apple Developer) | Connected / Not connected / Error |
| Tidal | API token | Connected / Not connected |
| Amazon Music | API token | Connected / Not connected |

---

## S-6 Billing

### Layout

```
Settings > Billing

┌────────────────────────────────────────────────────────────┐
│  Billing                                                    │
│                                                             │
│  ─── Current Plan ────────────────────────────────────────  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Plan: ReleaseFlow Pro               [Manage Plan ▼]  ││
│  │  Status: ● Active                                       ││
│  │  Renews: Aug 15, 2026                                   ││
│  │  Price: $49/mo                                          ││
│  │  Usage: 12 / 50 releases   3 / 10 team members         ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ─── Invoices ────────────────────────────────────────────  │
│                                                             │
│  ┌──────────┬──────────┬─────────┬───────────┬────────────┐│
│  │ Date     │ Invoice #│ Amount  │ Status    │ Download   ││
│  ├──────────┼──────────┼─────────┼───────────┼────────────┤│
│  │ Jul 01   │ INV-2026 │ $49.00  │ ● Paid    │ [PDF]     ││
│  │ Jun 01   │ INV-2026 │ $49.00  │ ● Paid    │ [PDF]     ││
│  └──────────┴──────────┴─────────┴───────────┴────────────┘│
│                                                             │
│  ─── Payment Method ──────────────────────────────────────  │
│                                                             │
│  💳 Visa ending in 4242     Expires 12/28    [Update]      │
└────────────────────────────────────────────────────────────┘
```

### Plan Features (V1)

| Feature | Free | Pro |
|---------|------|-----|
| Releases | 5 | Unlimited |
| Team members | 3 | Unlimited |
| Storage | 1GB | 10GB |
| Reports | Basic | Advanced |
| API | — | Included |
| Support | Email | Priority |

### Permissions

| Action | Owner | Admin |
|--------|-------|-------|
| View plan details | ● | ● |
| Change plan | ● | − |
| Update payment method | ● | − |
| View invoices | ● | ● |
| Download invoices | ● | ● |
| Cancel subscription | ● | − |

---

## S-7 Account Settings

### Layout

```
Settings > Account

┌────────────────────────────────────────────────────────────┐
│  Account Settings                                           │
│                                                             │
│  ─── Profile ────────────────────────────────────────────  │
│                                                             │
│  Full name                                                  │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Jane Admin                                       │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Email                                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │  jane@label.com                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ─── Password ───────────────────────────────────────────  │
│                                                             │
│  Current password                                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │  •••••••••••••                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  New password                                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │  •••••••••••••                                   │      │
│  └──────────────────────────────────────────────────┘      │
│  ● At least 8 characters                                   │
│  ● At least one uppercase letter                           │
│  ● At least one number                                     │
│  ● At least one special character                          │
│                                                             │
│  Confirm new password                                       │
│  ┌──────────────────────────────────────────────────┐      │
│  │  •••••••••••••                                   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ─── Notifications ──────────────────────────────────────  │
│                                                             │
│  Email notifications                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ☑ Task assigned to me                            │    │
│  │  ☑ Stage ready for my approval                    │    │
│  │  ☐ Deadline approaching (24h before)              │    │
│  │  ☐ Release status changes                         │    │
│  │  ☐ New team member joined                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Push notifications                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ☑ Task assigned to me                            │    │
│  │  ☑ @mentions                                      │    │
│  │  ☐ All notifications                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Save changes                                   │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

### Behaviors

- Full name and email saved on blur or save button.
- Email change triggers verification: "We sent a verification link to [new email]."
- Password strength meter shown in real-time (same as registration).
- Password change requires current password for validation.
- Notification preferences saved per user (not per role).
- "Save changes" enables only when unsaved changes exist.
