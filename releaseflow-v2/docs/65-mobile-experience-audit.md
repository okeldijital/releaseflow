# TASK-3004 — Mobile Experience Audit

## Premise

ReleaseFlow is desktop-first, but contributors (Producers, Mix Engineers,
Designers, Artists) often work on mobile — checking tasks, approving
mixes, or viewing feedback while away from their desk. Every page must
degrade gracefully, even if not optimized.

---

## Mobile Support by Page

### ✅ Good — Explicit Mobile Spec

| Page | Doc | Mobile Behavior |
|------|-----|----------------|
| Dashboard | 6 | Bottom tab bar replaces sidebar (<640px). Stat cards stack vertically. |
| Release Workspace (all tabs) | 12 | Tabs scroll horizontally. Content stacks. |
| Workflow Board | 28 | Single-column swipe view. Dot indicator for position. |
| Stage Detail | 29 | Full-screen panel. "Back to Workflow" at top. |
| Task Board | 31 | Stacked lists grouped by status. Swipe between columns. |
| Contributor Home | 42 | Task cards stack vertically. Color-coded left border. |
| Resource Planning | 57 | Groups collapse. Contributor cards stack. |
| Split Editor | 53 | Bar view collapses to list. Party rows stack. |
| Notification Center | 41 | (Implied — slide-out panel works on mobile) |
| Promo Calendar | 47 | (Compact view designed for release workspace embed) |
| Requirements Workspace | 38 | Accordion groups. Requirement rows stack. |

### ⚠ Partial — Mobile Behavior Implied but Not Explicit

| Page | Doc | What's Missing |
|------|-----|---------------|
| Sign In / Sign Up / Forgot Password | 6 | Auth cards are responsive by nature but no explicit mobile spec. Add: "Touch targets minimum 44px. Full-width inputs on mobile. Logo centered." |
| Onboarding Wizard (all steps) | 7 | Card layout works on mobile but step indicator and progress bar behavior not defined for narrow screens. |
| Releases List | 21 | Table → card conversion not specified. Pagination on mobile? |
| Release Creation Modal | 11 | Modal on mobile — full-screen? Bottom sheet? Not specified. |
| Artist Workspace | 49 | 6 tabs — how do they work on mobile? Scroll? Dropdown? |
| Artist Completeness | 50 | Progress bar + checklist — degrades naturally but not reviewed. |
| Credits Manager | 51 | Tree view — how does indentation work on narrow screens? |
| Campaign Workspace | 46 | 4 tabs + schedule timeline — no mobile spec. |
| Budget Workspace | 55 | 5 tabs + cost table — no mobile spec. |
| Cost Tracking | 56 | Filter tabs + cost list — no mobile spec. |
| Executive Dashboard | 60 | Designed for full viewport — no mobile spec. Shrinking to 375px will break the layout. |
| Operations Center | 59 | 4 sections + alerts — no mobile spec. |
| Delivery Checklist | 45 | Checklist rows — works naturally on mobile but no explicit spec. |
| Distrib Workspace | 43 | 5 tabs + metadata table — no mobile spec. |

### ❌ Missing — No Mobile Consideration

| Page | Doc | Issue |
|------|-----|-------|
| DSP Readiness Report | 44 | Report layout with columns and per-DSP table. Narrow screen will break. |
| Review Panel | 35 | Audio player + 3 decision buttons — no mobile spec for the review experience. |
| Approval Queue | 40 | Approver's dashboard card layout — no mobile spec. |
| Ownership Workspace | 52 | 4 tabs + dense tables — no mobile spec. |
| Rights Readiness | 54 | Verification rules panel — no mobile spec. |
| Alert UX | 61 | Alert card actions — touch targets not defined for "Resolve" / "Acknowledge" buttons. |
| Promotion Calendar | 47 | Timeline with 5 phases + milestone cards — full layout breaks on mobile. |
| Resource Planning Board | 57 | 4 role groups with assignment cards — horizontal scroll vs stack not defined at all breakpoints. |

---

## Breakpoint Support

| Breakpoint | Docs That Define It | Docs That Don't |
|------------|--------------------|--------------------|
| ≥1280px (Desktop) | 10, 28, 31 | Most docs assume this |
| 1024–1279px (Small desktop) | 28, 31 | 34, 43, 44, 45, 46, 52, 55 |
| 768–1023px (Tablet) | 28, 31 | 34, 43, 44, 45, 46, 52, 55 |
| <768px (Phone) | 6, 12, 28, 31, 38, 42, 57 | 34, 43, 44, 45, 46, 47, 49, 51, 52, 55, 59, 60 |

---

## Critical Mobile Gaps

### 1. Review Panel on Phone (doc 35)

The review panel is the most important mobile experience for A&R and
Artist — they approve mixes on their phone while listening. The current
spec is desktop-only (overlay panel + waveform player).

**What's missing:**
- Full-screen review mode on mobile
- Audio player controls large enough for one-hand use
- Swipe-left to reject, swipe-right to approve (gesture-based decisions)
- "Next in queue" button to move through pending reviews without returning to the list

### 2. Executive Dashboard on Phone (doc 60)

The dashboard uses a fixed full-viewport layout. At 375px, the Release
Pulse matrix (6 columns × N rows) will overflow.

**What's missing:**
- Stacked card layout replacing the matrix
- One release per card with 6 color dots inline
- Attention banner collapses to top 1 item with "2 more" indicator

### 3. DSP Readiness Report on Phone (doc 44)

The report is designed as a wide table with per-DSP columns.

**What's missing:**
- Critical issues listed first, per-DSP summary as collapsible sections
- "Fix Now" buttons full-width for thumb reach
- Summary result badge prominent at top

### 4. Campaign Workspace Tabs (doc 46)

4 tabs + schedule + channels + assets — no mobile navigation spec.

**What's missing:**
- Tab overflow: horizontal scroll or dropdown
- Schedule timeline collapses to milestone list
- Channel cards stack vertically

### 5. Budget Workspace (doc 55)

5 tabs with dense tables and forecast data.

**What's missing:**
- Budget overview cards stack
- Cost list becomes feed with swipe actions
- Forecast becomes simple list with variance badges

---

## Touch Target Compliance

Design system (doc 10) defines button sizes (S: 32px, M: 40px, L: 48px).
On mobile, minimum touch target is 44×44px (WCAG 2.1). This means:

| Button Size | Mobile Safe? |
|-------------|-------------|
| S (32px) | ❌ Below minimum |
| M (40px) | ⚠ Close to minimum |
| L (48px) | ✅ Safe |

**Recommendation:** On mobile (<768px), all action buttons render at
minimum M (40px) size with extra touch padding to reach 44px. Table row
actions (32px) become icon-only but with 44px touch targets via padding.

---

## Navigation on Mobile

| Current Spec | Doc | Mobile Implementation |
|-------------|-----|----------------------|
| Sidebar (org-level) | 19 | Bottom tab bar with 5 tabs (Dash, Rel, Tasks, Cal, More) |
| Release-level nav | 12 | Collapses to tab-scroll header |
| Workspace tabs | Various (26 pages) | **No consistent pattern defined** |

**Recommendation:** Standardize workspace tab navigation on mobile:
- ≤4 tabs: Bottom tab bar within the workspace
- 5+ tabs: Horizontal scroll with "More" overflow dropdown
- Deep pages (Stage Detail, Task Detail): Full-screen with "← Back" header

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Explicit mobile spec | 11 |
| ⚠ Mobile implied, not explicit | 14 |
| ❌ No mobile consideration | 8 |

**61% of pages lack explicit mobile behavior.** While many degrade
naturally (forms, lists), 8 pages will break catastrophically on mobile
(Executive Dashboard, DSP Report, Campaign Workspace, Budget Workspace,
Ownership Workspace, Rights Readiness, the Review Panel, and the Approval
Queue).

### Top 3 Priorities

1. **Review Panel mobile** — A&R on phone is a core use case
2. **Executive Dashboard mobile** — Owner checking status from phone
3. **Standardize workspace tab mobile pattern** — fixes 26 pages at once
