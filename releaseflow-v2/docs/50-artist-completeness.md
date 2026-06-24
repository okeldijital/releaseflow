# TASK-2402 — Artist Completeness

## Concept

A visual score showing how complete an artist profile is. Displayed on
the artist card (catalog), the artist overview tab, and the press kit
preview. Drives editorial decisions — DSPs and press prefer complete
artist profiles.

Five factors: Bio, Photo, Social Links, Genres, Country.

---

## Visual

### Artist Card

```
┌──────────────────────────────────────────────┐
│  ┌──────┐                                    │
│  │ 🎤    │  Kinn Timo         80% complete   │
│  │      │  Afro Tech · South Africa          │
│  └──────┘  ████████████████████████████░░     │
│                                              │
│  Missing: Press photo                        │
└──────────────────────────────────────────────┘
```

### Artist Overview

```
┌─ Profile Completeness ───────────────────────────────────────┐
│                                                               │
│  ████████████████████████████████░░  80% complete             │
│                                                               │
│  ✓ Bio                 │ Comprehensive bio with history     │
│  ✓ Photo               │ Artist photo uploaded (800×800)    │
│  ✕ Press photo         │ No high-res press photo            │
│  ✓ Genres              │ Afro Tech, Deep House, Amapiano    │
│  ✓ Country             │ South Africa                        │
│  ✓ Social links        │ 2 of 6 linked                      │
│     ◐ Instagram        │ instagram.com/kinntimo  ✓          │
│     ◐ Spotify          │ spotify.com/artist/...   ✓          │
│     ○ TikTok           │ —                        ✕          │
│     ○ YouTube          │ —                        ✕          │
│     ○ Twitter/X        │ —                        ✕          │
│     ○ Apple Music      │ —                        ✕          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Complete Your Profile                               │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Scoring

Total = 100%. Social links contribute a smaller weighting (10%)
since they are supplementary to the core profile.

| Factor | Weight | Criteria |
|--------|--------|----------|
| Bio | 20% | Bio is non-empty and ≥100 characters |
| Photo | 20% | Primary photo uploaded |
| Press Photo | 20% | High-res press photo uploaded |
| Genres | 15% | At least 1 genre selected |
| Country | 15% | Country selected |
| Social Links | 10% | At least 2 of 6 platforms linked |

Social links are scored as a group: 2 or more = full 10%, fewer = 0%.
This ensures a blank Instagram link doesn't prevent a high score but
artists with active social presence get a small completeness bump.

### Grading

| Score | Label | Visual |
|-------|-------|--------|
| 100% | Complete | 🟢 Green bar, full |
| 80-99% | Nearly Complete | 🟢 Green bar |
| 40-79% | In Progress | 🟡 Amber bar |
| 0-39% | Incomplete | 🔴 Red bar |

---

## Display Locations

| Location | Shows |
|----------|-------|
| Artist card (catalog) | Progress bar + "87% complete" + missing items (first 2) |
| Artist overview (tab) | Full breakdown with all factors + social links |
| Press kit preview | Score only (not breakdown) |
| Release contributor listing | "Kinn Timo — 85% complete" next to name |
| Dashboard (admin) | "3 artists need attention" notification |

---

## Action from Completeness

The "Complete Your Profile" button at the bottom links to a guided
completion flow:

```
┌──────────────────────────────────────────────────┐
│  Complete Your Profile — Kinn Timo                │
│                                                    │
│  1. ✕ Upload press photo                          │
│     ┌──────────────────────────────────────────┐  │
│     │  Drop or click to upload (3000×3000px)   │  │
│     └──────────────────────────────────────────┘  │
│     [Skip for now]                                 │
│                                                    │
│  2. ○ Add social links                             │
│     Instagram: [           ]                       │
│     TikTok:    [           ]                       │
│     YouTube:   [           ]                       │
│     Twitter/X: [           ]                       │
│     Apple:     [           ]                       │
│     [Skip for now]                                 │
│                                                    │
│  3/5 remaining · ~2 minutes                        │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Save & Continue                             │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface ArtistCompleteness {
  artistId: string;
  overall: number;              // 0–100
  factors: {
    bio: {
      weight: number;           // 20
      score: boolean;           // true if bio ≥ 100 chars
      value: string;            // Truncated bio for display
    };
    photo: {
      weight: number;           // 20
      score: boolean;           // true if primary photo exists
      url?: string;
    };
    pressPhoto: {
      weight: number;           // 20
      score: boolean;           // true if press photo exists
      url?: string;
    };
    genres: {
      weight: number;           // 15
      score: boolean;           // true if at least 1 genre set
      values: string[];         // "Afro Tech", "Deep House"
    };
    country: {
      weight: number;           // 15
      score: boolean;           // true if country set
      value?: string;           // "South Africa"
    };
    socialLinks: {
      weight: number;           // 10
      score: boolean;           // true if ≥ 2 platforms linked
      linked: number;           // Count of linked platforms
      total: number;            // 6 total platforms
      platforms: {
        platform: string;
        exists: boolean;
        url?: string;
      }[];
    };
  };
  missingItems: string[];       // ["Press photo"]
  computedAt: Timestamp;
}
```
