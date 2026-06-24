# TASK-2403 — Credits Manager

## Concept

A hierarchical tree view showing every credit on a release. Grouped by
track, then by role. Each leaf is a person performing a specific role on
a specific track. This is the PM's view for verifying credits before
submission to DSPs and PROs.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Credits Manager · Lua                                                     │
│  Kinn Timo · Single · 4 tracks                                            │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ▶ Lua (Single)                                                       │ │
│  │  ├─ Track 1 · Lua                                  4 credits         │ │
│  │  │  ├─ 🎤 Kinn Timo          → Primary Artist                        │ │
│  │  │  ├─ 🎛 Kinn Timo          → Producer                              │ │
│  │  │  ├─ ✍  Kinn Timo          → Writer                                │ │
│  │  │  └─ 🎚 Sam Wilson         → Mix Engineer                          │ │
│  │  │                                                                    │ │
│  │  ├─ Track 2 · Pulse                                3 credits         │ │
│  │  │  ├─ 🎤 Kinn Timo          → Primary Artist                        │ │
│  │  │  ├─ 🎛 Kinn Timo          → Producer                              │ │
│  │  │  └─ 🎚 Sam Wilson         → Mix Engineer                          │ │
│  │  │                                                                    │ │
│  │  ├─ Track 3 · Eclipse                              3 credits         │ │
│  │  │  ├─ 🎤 Kinn Timo          → Primary Artist                        │ │
│  │  │  ├─ 🎛 Artist Y           → Co-Producer                           │ │
│  │  │  └─ 🎚 Sam Wilson         → Mastering Engineer                    │ │
│  │  │                                                                    │ │
│  │  └─ Track 4 · Horizon                              5 credits         │ │
│  │     ├─ 🎤 Kinn Timo          → Primary Artist                        │ │
│  │     ├─ 🎤 Melt 2000          → Featured Artist                       │ │
│  │     ├─ 🎛 Kinn Timo          → Producer                              │ │
│  │     ├─ ✍  Kinn Timo          → Writer                                │ │
│  │     └─ 🎚 Sam Wilson         → Mix Engineer                          │ │
│  │                                                                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  + Add Credit        ⚙ Edit Credits        📋 Export to DDEX     │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Summary: 4 tracks · 4 contributors · 15 total credits                   │
│  Required: Primary Artist ✓ · Producer ✓ · Writer ✓                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Credit Tree Anatomy

```
Track 1 · Lua                                  4 credits
├─ 🎤 Kinn Timo          → Primary Artist
├─ 🎛 Kinn Timo          → Producer
├─ ✍  Kinn Timo          → Writer
└─ 🎚 Sam Wilson         → Mix Engineer
```

| Level | Element | Content |
|-------|---------|---------|
| Root | Release name | "Lua (Single)" |
| Level 1 | Track | Track number + title + credit count |
| Level 2 | Credit | Role icon + Artist name + Role label |

---

## Role Icons

| Role | Icon | Role | Icon |
|------|------|------|------|
| Primary Artist | 🎤 | Featured Artist | 🎤 |
| Remixer | 🔄 | Producer | 🎛 |
| Co-Producer | 🎛 | Writer | ✍ |
| Composer | 🎼 | Mix Engineer | 🎚 |
| Mastering Engineer | 🎚 | Artwork Designer | 🎨 |
| Photographer | 📷 | Videographer | 🎬 |

---

## Adding a Credit

```
┌──────────────────────────────────────────────────┐
│  + Add Credit — Track 1: Lua                 [×] │
│                                                    │
│  Artist *                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔍 Search or type name...                    │  │
│  │ ─────────────────────────────────────────  │  │
│  │ ○ Kinn Timo                                  │  │
│  │ ○ Artist Y                                   │  │
│  │ ○ Sam Wilson                                 │  │
│  │ ─────────────────────────────────────────  │  │
│  │ ✚ Create new artist                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Role *                                             │
│  ┌──────────────────────────────────────────────┐  │
│  │ Producer                               ▼     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Scope                                              │
│  ◉ Track-level (this track only)                   │
│  ○ Release-level (all tracks)                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Add Credit                                  │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Real-World Release Scenarios

### Scenario 1: Original Release

**Artist:** Kinn Timo
**Role:** Primary Artist

```
Lua (Single)
├─ Track 1 · Lua
│  ├─ 🎤 Kinn Timo       → Primary Artist
│  ├─ 🎛 Kinn Timo       → Producer
│  └─ 🎚 Sam Wilson      → Mix Engineer
├─ Track 2 · Pulse
│  ├─ 🎤 Kinn Timo       → Primary Artist
│  └─ 🎛 Kinn Timo       → Producer
```

**Model:** Release-level Primary Artist applies to all tracks unless
overridden per track. Kinn Timo is credited on every track.

### Scenario 2: Remix Release

**Original Artist:** Melt 2000
**Remixer:** Kinn Timo

```
Melt 2000 — Lua (Kinn Timo Remix)
├─ Track 1 · Lua (Kinn Timo Remix)
│  ├─ 🎤 Melt 2000       → Original Artist
│  ├─ 🔄 Kinn Timo       → Remixer
│  └─ 🎛 Kinn Timo       → Producer
```

**Model:** The original artist retains credit as "Original Artist." The
remixer gets both "Remixer" and any production credits. The DSP sees:
`ddex:Artist = Melt 2000`, `ddex:Remixer = Kinn Timo`.

### Scenario 3: Cover Release

**Original Artist:** Brenda Fassie
**Cover Performer:** Artist X

```
Artist X — Vulindlela (Cover)
├─ Track 1 · Vulindlela (Cover)
│  ├─ 🎤 Artist X        → Primary Artist (Cover Performer)
│  ├─ ✍  Brenda Fassie   → Original Writer
│  ├─ 🎛 Artist Y        → Producer
│  └─ 🎚 Mix Engineer    → Mix Engineer
```

**Model:** The cover performer is the Primary Artist. The original writer
is credited as Writer/Composer (not Primary Artist). The DSP sees:
`ddex:Artist = Artist X`, `ddex:Writer = Brenda Fassie`. Publishing
royalties flow to Brenda Fassie's PRO — this is handled in Sprint 013+.

### Scenario 4: Compilation

**Various Artists**

```
Summer Vibes 2026 (Compilation)
├─ Track 1 · Sunshine
│  ├─ 🎤 Artist A       → Primary Artist
│  └─ 🎛 Producer A     → Producer
├─ Track 2 · Ocean Drive
│  ├─ 🎤 Artist B       → Primary Artist
│  └─ 🎛 Producer B     → Producer
├─ Track 3 · Midnight
│  ├─ 🎤 Artist C       → Primary Artist
│  └─ 🎛 Producer C     → Producer
```

**Model:** No release-level Primary Artist — each track has its own
Primary Artist. Compilation releases cannot have a release-level artist.
The DSP sees: `ddex:IsCompilation = true`, per-track `ddex:Artist`.

---

## Credit Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| At least one Primary Artist per track | Critical | Every track must have a primary artist (release-level or track-level) |
| No duplicate credits (artist + role + track) | Warning | Same person cannot hold the same role on the same track twice |
| Compilation requires per-track Primary Artist | Critical | Cannot set release-level artist on a compilation |
| Writer/Composer requires IPI | Warning | For PRO registration (Sprint 013+) |
| Remixer requires Original Artist | Warning | Remix releases should credit the original artist |

---

## Export to DDEX

The "Export to DDEX" button generates an XML file compliant with the DDEX
ERN (Electronic Release Notification) standard:

```xml
<ResourceList>
  <SoundRecording>
    <SoundRecordingId>
      <ISRC>USABC2500001</ISRC>
    </SoundRecordingId>
    <DisplayArtist>
      <PartyName>
        <FullName>Kinn Timo</FullName>
      </PartyName>
    </DisplayArtist>
    <ResourceContributor>
      <PartyName>
        <FullName>Kinn Timo</FullName>
      </PartyName>
      <ResourceContributorRole>Producer</ResourceContributorRole>
    </ResourceContributor>
  </SoundRecording>
</ResourceList>
```

---

## Deferred to Sprint 013+

The following domains attach to the credits model but are NOT built yet:

| Domain | Why Deferred | Attachment Point |
|--------|-------------|-----------------|
| Royalties | Complex multi-party calculation | Credit → RoyaltySplit (per contributor) |
| Publishing Splits | PRO registration dependency | Credit → PublishingShare (per writer) |
| Contracts | Legal document management | Credit → Contract (per contributor) |
| IPI Numbers | PRO registration dependency | Credit → IPI (on artist/contributor level) |
| PRO Registration | Requires publisher agreements | Credit → PRORegistration (per track) |
| Mechanical Royalties | Licensing infrastructure | Credit → MechanicalLicense (per track) |

### Attachment Design

Each deferred domain attaches to the existing credit model via a foreign
key, never by modifying the credit structure:

```typescript
// Sprint 012 (now)
interface Credit {
  id: string;
  trackId: string;
  artistId: string;
  role: ContributorRole;
  scope: 'release' | 'track';
}

// Sprint 013+ (future — additive only)
interface RoyaltySplit {
  creditId: string;       // FK to Credit — no schema change needed
  percentage: number;     // e.g., 50.0
  type: 'mechanical' | 'performance' | 'sync';
}

interface PublishingShare {
  creditId: string;       // FK to Credit
  writerIpi: string;      // IPI from PRO database
  publisherIpi: string;
  sharePercentage: number;
}
```

This ensures Sprint 012 can ship credits without any migration debt. The
credit model supports all four release scenarios (Original, Remix, Cover,
Compilation) with the same schema.
