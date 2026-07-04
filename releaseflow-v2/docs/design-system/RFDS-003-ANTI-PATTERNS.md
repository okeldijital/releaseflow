# RFDS-003 — Anti-Patterns

**Status:** Active
**Version:** 1.0

---

## Purpose

This document explicitly prohibits patterns that violate the RFDS information architecture. Every anti-pattern includes:

- Why it is harmful
- Concrete examples
- The acceptable alternative

When a pattern appears in a specification, it will be rejected at review.

---

## 1. Dashboard-First Layouts

**Why harmful**: A dashboard-first layout presents data before purpose. The user must interpret the data to find what matters.

**Example** (anti-pattern):

```
Hero
↓
4 KPI cards (Active, Blocked, Overdue, Shipped)
↓
Activity feed
↓
Release table
```

**Acceptable alternative**:

```
Hero (briefing) ← states the answer
↓
Assessment ← explains if it matters
↓
Actions ← states what to do
↓
Metrics (inline)
↓
Evidence (table)
```

---

## 2. Metric-First Layouts

**Why harmful**: Metrics are evidence, not the answer. When the first thing the user sees is a number, they have to figure out why it matters.

**Example** (anti-pattern):

```
[42%]
↓
This release is at risk.
```

**Acceptable alternative**:

```
This release is at risk.
[42%]
```

The conclusion first, then the supporting number.

---

## 3. Equal Visual Weighting

**Why harmful**: When two elements share visual weight, the eye cannot decide which is the focal point. The page becomes undifferentiated.

**Example** (anti-pattern):

```
Same-size cards for: Briefing, Health, Stage, Deadline
```

**Acceptable alternative**:

```
Large heading (briefing, dominant)
↓ 24px
Small label + value grid (assessment, quiet)
↓ 16px
Text list (actions, focused)
```

Typography creates hierarchy. Equal weight is a design failure.

---

## 4. Duplicate Information

**Why harmful**: When the same information appears in two places, the user must verify which is current. Trust erodes.

**Example** (anti-pattern):

```
Health: Critical (in hero)
Health: Critical (in assessment)
```

**Acceptable alternative**: Each piece of information appears in exactly one tier. Tier 2 (Assessment) summarizes Tier 1 (Situation). They don't repeat — they explain.

---

## 5. Repeated Status Indicators

**Why harmful**: Status appears as: badge, pill, text, icon, color, dot. When repeated, the user cannot tell which one is current.

**Example** (anti-pattern):

```
Critical | Critical | Critical
   red      dot     pill
```

**Acceptable alternative**: Status appears once, in the most prominent position, in its most readable form. One indicator, not five.

---

## 6. Evidence Before Conclusion

**Why harmful**: Showing data before the user knows what it means is data dumping. The user sees numbers, doesn't know what to do.

**Example** (anti-pattern):

```
Readiness: 15%
Deliverables: 0 of 3
Tasks: 0 of 7
Requirements: 0 of 5
```

**Acceptable alternative**:

```
This release is at risk.
Immediate review recommended.

(after action: Evidence section with full table)
```

---

## 7. Database Language Exposed to Users

**Why harmful**: Users are not the database. They shouldn't need to know the field names, status codes, or query patterns.

**Example** (anti-pattern):

```
readiness_pct: 15
release_workflow.status: 'critical'
blocking_deps: 2
```

**Acceptable alternative**: The system translates the data into a conclusion.

```
Readiness is at 15%. Health is critical. Two blocking
dependencies remain unresolved.
```

---

## 8. Multiple Competing CTAs

**Why harmful**: When the user sees three primary buttons, they must decide which to click. The interface should not require that decision.

**Example** (anti-pattern):

```
[Approve] [Review] [Escalate] [Mark Ready] [Publish]
```

**Acceptable alternative**: One primary action, clearly dominant. Secondary actions as text links, visually quiet.

```
Approve for distribution     [primary]

Review release status
Mark ready
Escalate to A&R
```

---

## 9. More Than One Dominant Decision

**Why harmful**: The eye cannot rest when two elements demand attention. The page becomes a battlefield.

**Example** (anti-pattern):

```
Hero briefing (LARGE, dominant)
↓
PRIMARY CTA (huge button)
↓
CRITICAL ALERT (red, large)
↓
PRIMARY CTA 2 (huge button)
```

**Acceptable alternative**: One dominant element. All other elements are quieter.

---

## Enforcement

Any specification, implementation, or code review that introduces an anti-pattern will be rejected. The pattern must be redesigned before approval.

When a designer's intent is unclear, the test is:

> Would a first-time user, given only this screen, understand what is happening and what to do within 3 seconds?

If the answer is no, the design is using one of the anti-patterns above.
