# RFC-003 — Screenshot Evidence

**Date:** 2026-06-29

---

Note: Screenshots cannot be captured in this environment.

---

## Releases (Canonical Reference)

**Code reference**: `releases/page.tsx`

- [ ] Title: "Releases" at Display 28px
- [ ] Subtitle: "N release(s)"
- [ ] Primary CTA: "New Release" button, top-right
- [ ] Table: Release name, type, status, date
- [ ] Empty state: "No releases yet" + Create Release CTA
- [ ] Data: `useReleases()` hook
- [ ] 0 Firestore imports

---

## Artists

**Code reference**: `artists/page.tsx`

- [ ] Title: "Artists" at Display 28px
- [ ] Subtitle: "N artist(s)"
- [ ] Primary CTA: "New Artist" button, top-right
- [ ] Table with avatar column (DD-003 noted)
- [ ] Empty state: "No artists yet" + New Artist CTA
- [ ] Data: `useArtists()` hook
- [ ] 0 Firestore imports

---

## Assets

**Code reference**: `assets/page.tsx`

- [ ] Title: "Assets" at Display 28px
- [ ] Subtitle: descriptive text (DD-006 noted)
- [ ] Primary CTA: "Upload" button
- [ ] No operational list (DD-001 noted)
- [ ] Empty state: Upload prompt
- [ ] 0 Firestore imports

---

## Rights Holders

**Code reference**: `rights-holders/page.tsx`

- [ ] Title: "Rights Holders" at Display 28px
- [ ] Primary CTA: "Add Holder" button, top-right
- [ ] Card list (DD-002 noted)
- [ ] Empty state: "No rights holders yet" + Add CTA
- [ ] Data: `useRightsHolders()` hook
- [ ] 0 Firestore imports
