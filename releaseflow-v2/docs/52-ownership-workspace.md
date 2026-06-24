# TASK-2601 — Ownership Workspace

## Concept

A release-scoped workspace that defines who owns what. Four tabs covering
the four categories of music rights: Master, Publishing, Mechanical, and
Neighbouring. Each tab shows the ownership breakdown for the release —
whether at the release level, track level, or both.

This is designed for Sprint 013+ but the UX is specified now so the
credit model (TASK-2403) can accommodate it without migration.

---

## Tab Bar

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ownership · Lua · Kinn Timo                                             │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │●Master   │ │○Publishing│ │○Mechanical│ │○Neighbouring│                 │
│  │Rights    │ │ Rights   │ │ Rights   │ │ Rights     │                    │
│  │ ✓ Clear  │ │ ⚠ 80%   │ │ ✕ Missing│ │ ✕ Missing  │                    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Master Rights

Who owns the sound recording (℗).

```
┌─ Master Rights ──────────────────────────────────────────────────────┐
│                                                                        │
│  The master recording is the original sound recording — the actual    │
│  audio file. Master rights govern who controls reproduction,           │
│  distribution, and licensing of the recording itself.                  │
│                                                                        │
│  ─── Release-Level ────────────────────────────────────────────────   │
│                                                                        │
│  Ⓟ 2026 Acme Records                                                   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Owner                     │ Share  │ Role          │ Status   │  │
│  │────────────────────────────┼────────┼───────────────┼──────────│  │
│  │  Acme Records              │  100%  │ Label         │ ✓ Active │  │
│  │  contact: legal@acme.com   │        │               │          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ─── Per-Track Overrides ──────────────────────────────────────────   │
│                                                                        │
│  All tracks inherit the release-level master owner unless overridden.  │
│  No overrides configured.                                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  + Add override                                               │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
│  ─── Status ───────────────────────────────────────────────────────   │
│                                                                        │
│  ✓ Master rights are clear. 100% share accounted for.                 │
│  Single owner: no conflicts.                                           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Master Rights Fields

| Field | Description |
|-------|-------------|
| Owner | Entity that owns the master (label, artist, or third party) |
| Share | Percentage of ownership |
| Role | Label / Artist / Investor / Third Party |
| Contract Ref | Link to supporting contract |
| Territory | Where this ownership applies (default: Worldwide) |
| Active From/Until | Date range (Until = null for perpetual) |

---

## Tab 2: Publishing Rights

Who owns the composition — the underlying musical work. This is separate
from the master recording. Writers and publishers split publishing rights.

```
┌─ Publishing Rights ──────────────────────────────────────────────────┐
│                                                                        │
│  The composition (musical work) is the underlying melody, lyrics,     │
│  and arrangement. Publishing rights govern who collects royalties     │
│  when the composition is performed, streamed, or reproduced.          │
│                                                                        │
│  ─── Track 1: Lua ─────────────────────────────────────────────────   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Writer / Publisher      │ PRO    │ IPI      │ Share │ Status  │  │
│  │──────────────────────────┼────────┼──────────┼───────┼─────────│  │
│  │  Kinn Timo               │ SAMRO  │ 001234..│ 50%   │ ✓ Reg   │  │
│  │  — Writer's share        │        │          │       │         │  │
│  │  ────────────────────────┼────────┼──────────┼───────┼─────────│  │
│  │  Acme Publishing         │ SAMRO  │ 005678..│ 25%   │ ✓ Reg   │  │
│  │  — Publisher share       │        │          │       │         │  │
│  │  ────────────────────────┼────────┼──────────┼───────┼─────────│  │
│  │  Artist Y                │ ASCAP  │ —       │ 25%   │ ⚠ No IPI│  │
│  │  — Co-writer             │        │          │       │         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Total: 100%  ✓  |  PRO registered: 2/3  |  IPI complete: 2/3        │
│                                                                        │
│  ─── Track 2: Pulse ────────────────────────────────────────────────   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Writer / Publisher      │ PRO    │ IPI      │ Share │ Status  │  │
│  │──────────────────────────┼────────┼──────────┼───────┼─────────│  │
│  │  Kinn Timo               │ SAMRO  │ 001234..│ 75%   │ ✓ Reg   │  │
│  │  Acme Publishing         │ SAMRO  │ 005678..│ 25%   │ ✓ Reg   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Total: 100%  ✓                                                       │
│                                                                        │
│  ─── Summary ───────────────────────────────────────────────────────   │
│                                                                        │
│  ████████████████████████████████░░░  90% complete                     │
│  2 of 2 tracks have 100% splits · 1 missing IPI                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Publishing Fields

| Field | Description |
|-------|-------------|
| Writer/Publisher | Name of the rights holder |
| Type | Writer (personal share) / Publisher (company share) |
| PRO | Performance Rights Organisation (ASCAP, BMI, PRS, SAMRO, etc.) |
| IPI | Interested Party Information number (from PRO) |
| Share | Percentage of the composition (0–100) |
| Status | Registered with PRO / Pending / Not Registered |

---

## Tab 3: Mechanical Rights

The right to reproduce the composition on physical or digital formats.
Mechanical licenses are required when someone covers, remixes, or
samples a composition owned by someone else.

```
┌─ Mechanical Rights ──────────────────────────────────────────────────┐
│                                                                        │
│  Mechanical rights govern the reproduction of a composition in        │
│  physical (CD, vinyl) or digital (streaming, download) formats.       │
│  A mechanical license is required when the release contains a cover,  │
│  sample, or interpolation of a third-party composition.                │
│                                                                        │
│  ─── Licenses Required ────────────────────────────────────────────   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Track             │ Type     │ Original Owner │ License│ Status│  │
│  │────────────────────┼──────────┼────────────────┼────────┼───────│  │
│  │  1. Lua            │ Original │ Kinn Timo      │ —      │ —    │  │
│  │                    │          │                │        │       │  │
│  │  2. Pulse           │ Original │ Kinn Timo      │ —      │ —    │  │
│  │                    │          │                │        │       │  │
│  │  3. Eclipse         │ Sample   │ Melt 2000      │ Y      │ ○ Pnd │  │
│  │     Contains sample │          │ "Neon Nights"  │        │       │  │
│  │     from "Neon      │          │                │        │       │  │
│  │     Nights"         │          │                │        │       │  │
│  │                    │          │                │        │       │  │
│  │  4. Horizon (Remix)│ Remix    │ Melt 2000      │ Y      │ ○ Pnd │  │
│  │     Remix of Melt   │          │                │        │       │  │
│  │     2000 original    │          │                │        │       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ⚠ 2 mechanical licenses required. 0 secured.                         │
│                                                                        │
│  ─── License Details — Track 3: Eclipse ─────────────────────────────  │
│                                                                        │
│  Composition: Neon Nights                                              │
│  Original rights holder: Melt 2000 / Melodic Publishing                │
│  License type: Sample clearance                                        │
│  Territory: Worldwide                                                   │
│  Rate: 50% of publishing share in derivative work                      │
│  Status: ○ Pending · Request sent Aug 15, no response                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  + Add License    ⚙ Manage                                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

### Mechanical Rights Fields

| Field | Description |
|-------|-------------|
| Track | Which track the license applies to |
| Type | Original (no license needed) / Sample / Cover / Remix / Interpolation |
| Original Composition | Title and owner of the original work |
| License Required | Yes / No |
| License Status | Secured / Pending / Rejected / Not Required |
| Territory | Where the license applies |
| Rate | Agreed royalty rate or split |
| Contract Ref | Link to license agreement |

---

## Tab 4: Neighbouring Rights

Performance rights for the sound recording itself (not the composition).
These are collected by organisations like PPL (UK), SoundExchange (US),
SAMPRA (South Africa), GVL (Germany).

```
┌─ Neighbouring Rights ──────────────────────────────────────────────┐
│                                                                      │
│  Neighbouring (related) rights apply to the sound recording when    │
│  it is performed publicly or broadcast. They are distinct from      │
│  publishing performance royalties which go to the composition owner.│
│                                                                      │
│  ─── Registration ───────────────────────────────────────────────   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Organisation        │ Territory    │ Status     │ Ref #     │  │
│  │──────────────────────┼──────────────┼────────────┼───────────│  │
│  │  SAMPRA              │ South Africa │ ◐ Pending  │ —         │  │
│  │  PPL                 │ UK           │ ◐ Pending  │ —         │  │
│  │  SoundExchange       │ USA          │ ◐ Pending  │ —         │  │
│  │  GVL                 │ Germany      │ ◐ Pending  │ —         │  │
│  │  PPCA                │ Australia    │ —          │ —         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ─── Performer Shares ───────────────────────────────────────────   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Performer             │ Role          │ Share │ Status      │  │
│  │────────────────────────┼───────────────┼───────┼─────────────│  │
│  │  Kinn Timo             │ Primary Artist│ 60%   │ ✓ Claimed   │  │
│  │  Kinn Timo             │ Producer      │ 20%   │ ✓ Claimed   │  │
│  │  Sam Wilson            │ Mix Engineer  │ 10%   │ ○ Unclaimed │  │
│  │  Artist Y              │ Co-Producer   │ 10%   │ ○ Unclaimed │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Total: 100%  ✓  |  2 of 4 performers claimed their share           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  + Register with CMO    ⚙ Manage Shares                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Neighbouring Rights Fields

| Field | Description |
|-------|-------------|
| CMO | Collective Management Organisation (PPL, SoundExchange, etc.) |
| Territory | Country/region the CMO covers |
| Status | Registered / Pending / Not Registered |
| Reference # | CMO-issued registration number |
| Performer | Name of the performer |
| Share | Percentage of neighbouring rights revenue |
| Claim Status | Claimed / Unclaimed |

---

## Data Model

```typescript
interface OwnershipWorkspace {
  releaseId: string;
  masterRights: MasterRights;
  publishingRights: PublishingRights;
  mechanicalRights: MechanicalRights;
  neighbouringRights: NeighbouringRights;
}

interface MasterRights {
  copyright: string;             // "℗ 2026 Acme Records"
  owners: MasterOwner[];
  trackOverrides: TrackMasterOverride[];  // Empty if all tracks inherit
  status: 'clear' | 'partial' | 'conflict' | 'missing';
}

interface MasterOwner {
  entityId: string;              // FK to Organization or Artist
  entityName: string;
  role: 'label' | 'artist' | 'investor' | 'third_party';
  share: number;                 // 0–100
  territory: string[];           // ISO 3166-1, ["worldwide"] = all
  contractRef?: string;
}

interface PublishingRights {
  tracks: TrackPublishing[];
  completion: number;            // % of tracks with 100% splits
}

interface TrackPublishing {
  trackId: string;
  shares: PublishingShare[];
  total: number;                 // Must equal 100
}

interface PublishingShare {
  holderName: string;
  type: 'writer' | 'publisher';
  pro: string;                   // "SAMRO", "ASCAP", etc.
  ipi?: string;                  // IPI number
  share: number;
  status: 'registered' | 'pending' | 'missing_ipi';
}

interface MechanicalRights {
  tracks: TrackMechanical[];
  pendingCount: number;
}

interface TrackMechanical {
  trackId: string;
  type: 'original' | 'sample' | 'cover' | 'remix' | 'interpolation';
  originalComposition?: string;
  originalOwner?: string;
  licenseRequired: boolean;
  licenseStatus?: 'secured' | 'pending' | 'rejected';
  territory?: string[];
  rate?: string;
  contractRef?: string;
}

interface NeighbouringRights {
  cmos: CMORegistration[];
  performerShares: PerformerShare[];
}

interface CMORegistration {
  id: string;
  name: string;                  // "SAMPRA", "PPL", etc.
  territory: string;
  status: 'registered' | 'pending' | 'not_registered';
  referenceNumber?: string;
}

interface PerformerShare {
  performerId: string;
  performerName: string;
  role: string;
  share: number;                 // 0–100
  claimStatus: 'claimed' | 'unclaimed';
}
```
