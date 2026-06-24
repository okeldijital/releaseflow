# TASK-2401 — Artist Workspace

## Concept

The Artist is a first-class entity. Not just a contributor credit on a
release — an artist has a profile, a catalog, credits, assets, campaigns,
and a press kit. The Artist Workspace manages all of this in one place.

---

## Routes

```
/artists                         → Artist catalog (list/filter/search)
/artists/new                     → Create new artist
/artists/[id]                    → Artist workspace (redirects to /overview)
/artists/[id]/overview           → Profile + stats
/artists/[id]/releases           → Discography / catalog
/artists/[id]/credits            → Credit tree per release
/artists/[id]/assets             → Artist photos, logos, press assets
/artists/[id]/campaigns          → Campaigns featuring this artist
/artists/[id]/press-kit          → Downloadable EPK / one-sheet
```

---

## Artist Catalog

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Artists                                                + New Artist     │
│                                                                           │
│  🔍 Search artists...        [Genre ▼]  [Status ▼]  [Country ▼]          │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  ┌──────┐                                                             ││
│  │  │ 🎤    │  Kinn Timo                         85% complete            ││
│  │  │      │  Afro Tech · South Africa                                   ││
│  │  │      │  3 releases · 12 tracks                                     ││
│  │  └──────┘                                                             ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ┌──────┐                                                             ││
│  │  │ 🎤    │  Artist X                          60% complete            ││
│  │  │      │  Alternative R&B · United States                            ││
│  │  │      │  1 release · 4 tracks                                       ││
│  │  └──────┘                                                             ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  ┌──────┐                                                             ││
│  │  │ 🎤    │  Melt 2000                         45% complete            ││
│  │  │      │  Electronic · United Kingdom                                ││
│  │  │      │  2 releases · 6 tracks                                       ││
│  │  └──────┘                                                             ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  Showing 3 of 12 artists                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tab Bar

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Artists    Kinn Timo                          🟢 Active              │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │●Overview │ │○Releases │ │○Credits│ │ ○Assets  │ │○Campaigns│ │○Press││
│  │          │ │  (3)     │ │ (12)   │ │  (8)     │ │  (2)     │ │Kit   ││
│  └──────────┘ └──────────┘ └────────┘ └──────────┘ └──────────┘ └──────┘│
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ┌───────────────────────────────────┐  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │                                   │  │  3   │ │  12  │ │  2   │      │
│  │      [Artist photo · 800×800]     │  │Releas│ │Tracks│ │Campgn│      │
│  │                                   │  └──────┘ └──────┘ └──────┘      │
│  └───────────────────────────────────┘                                    │
│                                                                           │
│  ─── Profile ──────────────────────────────────────────────────────────  │
│                                                                           │
│  Name: Kinn Timo                                                         │
│  Genres: Afro Tech, Deep House, Amapiano                                 │
│  Country: South Africa                                                    │
│  Bio: Kinn Timo is a South African producer and artist blending Afro     │
│       Tech with deep house influences. Known for intricate percussion    │
│       and melodic basslines, his debut EP "Lua" reached #1 on the        │
│       Afro House charts in 2025.                                          │
│                                                                           │
│  ─── Social Links ──────────────────────────────────────────────────────  │
│                                                                           │
│  ◐ Instagram  ·  instagram.com/kinntimo                                  │
│  ◐ Spotify    ·  spotify.com/artist/1a2b3c                               │
│  ○ TikTok     ·  —                                                        │
│  ○ YouTube    ·  —                                                        │
│  ○ Twitter/X  ·  —                                                        │
│  ○ Apple Music·  —                                                        │
│                                                                           │
│  ─── Profile Completeness ───────────────────────────────────────────    │
│                                                                           │
│  ██████████████████████████████░░░░░  85%                                │
│  Missing: Press photo, Instagram link                                    │
│                                                                           │
│  ─── Recent Activity ─────────────────────────────────────────────────   │
│                                                                           │
│  🔵 "Lua" released · Oct 01, 2026                                        │
│  📁 Press photo uploaded · Sep 20, 2026                                  │
│  👤 Added as Primary Artist on "Lua" · Aug 01, 2026                      │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Metadata Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Stage name or legal name |
| Display Name | Text | No | If different from legal name |
| Bio | Text area | No | Up to 2000 chars, Markdown |
| Genres | Multi-select | No | Up to 3, from DSP taxonomy |
| Country | Select | No | ISO 3166-1 |
| Status | Select | Yes | Active / Inactive / Hiatus |
| Photo | Image | No | Square, recommended 800×800 |
| Press Photo | Image | No | High-res for media use |

---

## Tab 2: Releases

```
┌─ Releases ───────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Title             │ Type   │ Role          │ Date      │       │ │
│  │────────────────────┼────────┼───────────────┼───────────│       │ │
│  │  Lua               │ Single │ Primary Artist│ Oct 2026  │  [→]  │ │
│  │  Midnight Sessions│ Single │ Producer      │ Oct 2026  │  [→]  │ │
│  │  Summer EP        │ EP     │ Producer      │ Aug 2026  │  [→]  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ✚ Add to release                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

Each row shows what role the artist played on that release. Clicking
the arrow navigates to the release detail.

---

## Tab 3: Credits

The Credits tab shows a tree view of all credits across all releases,
grouped by release then by track. Full design in TASK-2403.

---

## Tab 4: Assets

```
┌─ Assets ───────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ [Photo]  │  │ [Press]  │  │ [Logo]   │  │ [Banner] │           │
│  │ Artist   │  │ Press    │  │ Logo     │  │ Banner   │           │
│  │ photo    │  │ photo    │  │ PNG/SVG  │  │ 1500×500 │           │
│  │ 800×800  │  │ 3000×3000│  │          │  │          │           │
│  │ v1 · JPG│  │ v1 · JPG│  │ v1 · SVG│  │ —        │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  + Upload Asset                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

Artist assets are global (not tied to a release). Used in press kits,
campaigns, and DSP artist profiles.

---

## Tab 5: Campaigns

```
┌─ Campaigns ────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Midnight Sessions campaign                 🟢 On Track        │ │
│  │  Release: Oct 01, 2026 · Role: Producer                       │ │
│  │  ┌──────────────────────────────────────────────────────┐     │ │
│  │  │  Open Campaign                                       │     │ │
│  │  └──────────────────────────────────────────────────────┘     │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │  Summer EP campaign                         ✓ Complete        │ │
│  │  Release: Aug 20, 2026 · Role: Producer                      │ │
│  │  ┌──────────────────────────────────────────────────────┐     │ │
│  │  │  View Report                                        │     │ │
│  │  └──────────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tab 6: Press Kit

```
┌─ Press Kit ────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │                      │  │                               │  │   │
│  │  │   [Press Photo]      │  │  Kinn Timo                    │  │   │
│  │  │                      │  │  Afro Tech · South Africa     │  │   │
│  │  │   [Download]         │  │  3 releases · 12 tracks       │  │   │
│  │  └──────────────────────┘  │                               │  │   │
│  │                            └──────────────────────────────┘  │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Bio                                                          │   │
│  │  ──────────────────────────────────────────────────────       │   │
│  │  Kinn Timo is a South African producer and artist blending    │   │
│  │  Afro Tech with deep house influences...                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Social Links                                                  │   │
│  │  ──────────────────────────────────────────────────────       │   │
│  │  Instagram: instagram.com/kinntimo                             │   │
│  │  Spotify: spotify.com/artist/1a2b3c                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Discography                                                   │   │
│  │  ──────────────────────────────────────────────────────       │   │
│  │  Lua (Single) · 2026                                          │   │
│  │  Midnight Sessions (Single) · 2026 — Producer                 │   │
│  │  Summer EP · 2026 — Producer                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Download Press Kit (PDF)                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

The press kit auto-generates from the artist profile. Clicking "Download
Press Kit (PDF)" compiles a one-sheet with bio, photo, social links, and
discography into a downloadable PDF.

---

## New Artist

```
┌──────────────────────────────────────────────────┐
│  + New Artist                                 [×] │
│                                                    │
│  Artist name *                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Luis Santos                                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Display name *                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Kinn Timo                                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Primary genre                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Afro Tech                            ▼      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Country                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │  South Africa                         ▼      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Create Artist                               │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface Artist {
  id: string;
  orgId: string;
  name: string;                  // Legal name
  displayName: string;           // Stage name
  slug: string;                  // URL-safe name
  bio?: string;                  // Markdown, up to 2000 chars
  genres: string[];              // Up to 3, from DSP taxonomy
  country?: string;              // ISO 3166-1
  status: 'active' | 'inactive' | 'hiatus';
  photo?: ArtistAsset;           // 800×800 primary photo
  pressPhoto?: ArtistAsset;      // 3000×3000 high-res
  socialLinks: ArtistSocialLink[];
  assets: ArtistAsset[];         // Logos, banners, additional photos
  completeness: number;          // 0–100, per TASK-2402
  releaseCount: number;          // Denormalized
  trackCount: number;            // Denormalized
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ArtistSocialLink {
  platform: 'instagram' | 'spotify' | 'tiktok' | 'youtube' | 'twitter' | 'apple_music' | 'soundcloud' | 'website';
  url: string;
}

interface ArtistAsset {
  id: string;
  artistId: string;
  type: 'photo' | 'press_photo' | 'logo' | 'banner';
  url: string;
  version: number;
  dimensions?: { width: number; height: number };
  format: string;
  sizeBytes: number;
  uploadedAt: Timestamp;
}
```
