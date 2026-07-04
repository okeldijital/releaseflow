# RFDS-001 — Compliance Checklist

**Status:** Active
**Version:** 1.0

---

## Purpose

Every UI task must pass this checklist before it is considered complete. The checklist is the single source of truth for acceptance.

A task that fails any item is incomplete, regardless of how it looks.

---

## PDS Compliance

- [ ] All typography uses PDS-defined sizes and weights
- [ ] All colors are PDS semantic tokens (text-900, text-400, primary-500, etc.)
- [ ] All spacing follows the 8-point grid (4, 8, 12, 16, 24, 32, 48, 64, 96)
- [ ] All shadows use PDS elevation tokens
- [ ] All motion uses PDS timing tokens (100, 150, 200, 300ms)
- [ ] All radii use PDS radius tokens
- [ ] No arbitrary values used

## RFDS Compliance

- [ ] Governance declaration present at top of specification
- [ ] PDS, RFDS, and blueprint references included
- [ ] No subjective language used
- [ ] All requirements observable, measurable, testable
- [ ] Page composition follows the attention model
- [ ] Hero / Assessment / Action / Evidence / History hierarchy present where applicable
- [ ] 840px max-width applied for editorial pages
- [ ] No decorative borders, shadows, or ornaments
- [ ] Quiet interfaces principle respected
- [ ] All sections answer exactly one operational question

## Accessibility Compliance

- [ ] Color contrast: 4.5:1 minimum for body, 3:1 for large text
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all focusable elements
- [ ] ARIA labels on all interactive controls
- [ ] Heading hierarchy correct (single H1, descending levels)
- [ ] Touch targets minimum 44px
- [ ] Screen reader tested
- [ ] Skip link present
- [ ] Focus trapping for modals
- [ ] prefers-reduced-motion respected

## Responsive Compliance

- [ ] Desktop layout (≥1024px) verified
- [ ] Laptop layout (768-1023px) verified
- [ ] Tablet layout (640-767px) verified
- [ ] Mobile layout (<640px) verified
- [ ] No horizontal scrolling
- [ ] No content clipping
- [ ] No overlap
- [ ] Touch interactions on mobile
- [ ] Hover states don't appear on touch

## Typography Compliance

- [ ] Single H1 per page
- [ ] H1 at 40px medium weight tight leading
- [ ] Body text at 14-15px normal weight
- [ ] Section headers at 10-12px medium uppercase tracking-widest
- [ ] Line length 65-80 characters for reading text
- [ ] Tabular numbers for numeric data
- [ ] No font-size overrides below 11px (except timestamps)

## Attention Hierarchy Compliance

- [ ] Every section has a documented priority (10-100)
- [ ] No two adjacent sections share the same priority
- [ ] Hero is always priority 100
- [ ] Immediate action is always priority 90
- [ ] Assessment is priority 80
- [ ] Supporting evidence is priority 70
- [ ] Activity/history is priority 10
- [ ] No element exceeds its assigned priority level

## Dark Mode Compliance

- [ ] All surfaces use PDS dark-mode tokens
- [ ] Text contrast maintained in dark mode (≥ 4.5:1)
- [ ] No pure black or pure white backgrounds
- [ ] Color meaning preserved across modes

## Light Mode Compliance

- [ ] Warm neutral palette (never pure grey)
- [ ] No harsh contrast boundaries
- [ ] Surfaces use PDS surface tokens

## Motion Compliance

- [ ] Transitions use 100/150/200/300ms from PDS
- [ ] Easing uses standard/enter/exit
- [ ] prefers-reduced-motion collapses motion
- [ ] No decorative animation
- [ ] Loading states show clear progress

## Interaction Compliance

- [ ] Hover, focus, active states documented
- [ ] Pressed state uses 0.98 scale
- [ ] Loading state shows spinner or skeleton
- [ ] Error state provides recovery action
- [ ] Empty state provides next-step guidance
- [ ] No interaction requires hover to discover (mobile)

---

## Review Process

1. Author completes the task
2. Reviewer runs through the checklist
3. Any unchecked item triggers a fix
4. When all items pass, the task is approved
5. The checklist is included in the task deliverable

---

## Failure Mode

If a task is approved with unchecked items, those items become **P1 bugs** in the next sprint. No exceptions.
