# RFDS-003 — Operational Narrative

**Status:** Active
**Version:** 1.0

---

## Purpose

The interface should summarise, not narrate database values. Every sentence must be a conclusion, not a fact.

The user comes to ReleaseFlow to make decisions. The interface should support those decisions, not require interpretation.

---

## Core Principle

```
Database value:  "readiness: 15%, blocked: true, days_until_deadline: 7"
Interface:      "This release is at risk. No readiness checks have passed.
                 Immediate review is recommended."
```

The system has already done the interpretation. The user receives the conclusion.

---

## Narrative Patterns

### Pattern: State Status

The system tells the user what is happening.

| Database | Interface |
|----------|-----------|
| "status: 'critical', readiness: 15%" | "This release is at risk." |
| "status: 'healthy', readiness: 100%" | "This release is ready to ship." |
| "status: 'in_progress', stage: 'mastering'" | "The Mastering stage is in progress." |

### Pattern: Cause

The system explains why.

| Database | Interface |
|----------|-----------|
| "blocking_deps: 2, completed: 0" | "Two blocking dependencies remain unaddressed." |
| "requirements: 0/5 approved" | "No requirements have been approved." |
| "deadline: 2026-07-06, today: 2026-06-29" | "Seven days remain until the release date." |

### Pattern: Action

The system recommends the next step.

| Database | Interface |
|----------|-----------|
| "action_id: 'review', urgency: 'now'" | "Review release status and resolve blockers." |
| "action_id: 'complete', dependency: 'X'" | "Complete the requirement for dependency X." |
| "action_id: 'approve', target: 'release'" | "Approve release for distribution." |

### Pattern: Quantification

The system reports numbers when they matter.

| Context | Interface |
|---------|-----------|
| Many at risk | "3 releases require attention." |
| Many ready | "5 releases are ready to ship." |
| Few overdue | "1 deadline is overdue." |

Avoid:
- "0 of 5 readiness checks passed" — narrates a fraction
- "15% of completeness" — narrates a percentage

Prefer:
- "3 of 5 readiness checks have not passed." — states a count and implies a fraction
- "Readiness is critical." — states a conclusion

---

## Length Rules

| Tier | Max Length | Why |
|------|-----------|-----|
| Tier 1 (Hero briefing) | 3 lines | The user needs the headline, not an essay |
| Tier 2 (Assessment) | Per-cell: 1 word or short phrase | Grid cells are scannable |
| Tier 3 (Action) | 1 sentence | One action per line |
| Tier 4 (Evidence) | No limit | Tables, lists, tables |
| Tier 5 (Context) | Per-item: 1 phrase | Quick reference |
| Tier 6 (History) | 1 sentence per event | Chronological log |
| Tier 7 (Metadata) | N/A | Inline values |

---

## Voice Rules

### 1. No database language

| Database Term | Interface Language |
|---------------|---------------------|
| "readiness: 15%" | "Readiness is critical." |
| "blocking_deps: 2" | "Two blocking dependencies." |
| "health: 'critical'" | "Health: Critical" |
| "stage: 'mastering'" | "Mastering stage" |
| "workflow_id: 'wf_123'" | "Workflow" (if visible) or hidden |

### 2. Conclusions, not descriptions

| Description | Conclusion |
|-------------|------------|
| "The release has 0 out of 5 readiness checks passed." | "No readiness checks have passed." |
| "The release is currently in the Operations stage." | "The release is in the Operations stage." |
| "The blocking dependency is 2 days overdue." | "Two days overdue." |

### 3. Use "not" for absence

| Positive | Negative (better) |
|---------|-------------------|
| "All 5 checks have passed." | (not needed) |
| "3 checks have passed." | "2 checks have not passed." (when relevant) |

### 4. Recommend, don't command

| Imperative | Recommendation (better) |
|-----------|------------------------|
| "Review the release!" | "Review the release." |
| "Approve now!" | "Approve for distribution." |
| "Fix the blocker!" | "Resolve the blocking dependency." |

### 5. Use "no" and "zero" sparingly

"No" appears only when it matters. "Zero" never appears in user-facing text.

| Overuse | Calibrated |
|---------|-----------|
| "No data to display." | (empty state explains better) |
| "No items found." | "Nothing here yet." |
| "No errors detected." | "All systems normal." |
