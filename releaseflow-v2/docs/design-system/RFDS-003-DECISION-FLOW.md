# RFDS-003 — Decision Flow

**Status:** Active
**Version:** 1.0

---

## Purpose

Every operational page exists to answer operational questions. This document defines the six questions, their order, and which tier answers each.

A page that cannot answer these is not a page.

---

## The Six Questions

| # | Question | Answered By | Tier |
|---|----------|-------------|------|
| 1 | What is happening? | Situation | Tier 1 |
| 2 | Should I care? | Assessment | Tier 2 |
| 3 | What should I do? | Decision | Tier 3 |
| 4 | Why? | Evidence | Tier 4 |
| 5 | What else should I know? | Context | Tier 5 |
| 6 | What happened previously? | History | Tier 6 |

---

## Question 1: What is happening?

The Situation tier answers this.

| Element | How |
|---------|-----|
| Page identity | H1 (date or name) at 40px, medium weight, tight leading |
| Operational headline | Briefing sentence, plain language, max 3 lines |
| Primary status | Health pill or status badge inline with briefing |

**Example** (Operations Center):

```
MONDAY, JUNE 29, 2026

1 release requires immediate attention.
Health is critical across the organisation.
Review is recommended.
```

**Test**: Can the user answer "what is happening" in under 1 second?

---

## Question 2: Should I care?

The Assessment tier answers this.

| Element | How |
|---------|-----|
| Health | Percentage, state name, visual indicator |
| Readiness | Same format as health |
| Current stage | Stage name from workflow |
| Deadline | Relative date ("7 days", "3 days overdue") |

**Layout**: Two-column grid, 640px max width. Each cell pairs a label with a value.

**Test**: Can the user tell whether they need to act in under 3 seconds?

---

## Question 3: What should I do?

The Decision tier answers this.

| Element | How |
|---------|-----|
| Action | One sentence in present tense |
| Priority | NOW timestamp right-aligned |
| Limit | Maximum 3 actions |

**Format**:

```
Immediate Actions

Review advertising budget and resolve           NOW
Complete readiness checklist for blocked work      NOW
Address 3 upcoming deadlines before shipment        NOW
```

**Test**: Does the user know exactly what to do without scrolling?

---

## Question 4: Why?

The Evidence tier answers this.

| Element | How |
|---------|-----|
| Metrics | Inline, supporting the decision |
| Tables | Show the data behind the decision |
| Counts | Numbers that justify urgency |

**Rule**: Evidence appears AFTER the decision, not before. The user already knows what to do. The evidence confirms why.

**Test**: Can the user verify the decision with the evidence shown?

---

## Question 5: What else should I know?

The Context tier answers this.

| Element | How |
|---------|-----|
| Context rail | Health Ring, Readiness, Dependencies |
| Tabs | Other aspects of the record |
| Related items | Links to other entities |

**Position**: Right side of canvas or below evidence. Never in the main flow.

**Test**: Does the user have access to related context without leaving the page?

---

## Question 6: What happened previously?

The History tier answers this.

| Element | How |
|---------|-----|
| Activity feed | Chronological events |
| Audit log | Timestamped actions |
| Version history | State changes |

**Position**: Bottom of page. Quiet. Lower contrast.

**Test**: Can the user verify what happened without leaving the page?

---

## Reading Order Per Page

### Operations Center

```
Q1 What is happening?      → Tier 1 Hero (640px)
Q2 Should I care?           → Tier 2 Assessment (2-col grid, 640px)
Q3 What should I do?         → Tier 3 Actions (list, 640px)
Q4 Why?                       → Tier 4 Metrics + Table (640–1120px)
Q5 What else?                 → Tier 4 Attention (640px)
Q6 What happened?             → Tier 6 Activity (640px)
```

### Release Workspace

```
Q1 What is happening?      → Tier 1 Hero (960px + context rail)
Q2 Should I care?           → Tier 2 Health Ring (in context rail)
Q3 What should I do?         → Tier 3 Advance Stage (primary action)
Q4 Why?                       → Tier 4 Tab content
Q5 What else?                 → Tier 4 Other tabs
Q6 What happened?             → Tier 6 Activity (within tab)
```

### Artist Workspace

```
Q1 What is happening?      → Tier 1 Hero (960px + context rail)
Q2 Should I care?           → Tier 2 Profile completeness
Q3 What should I do?         → Tier 3 Add Release
Q4 Why?                       → Tier 4 Releases list
Q5 What else?                 → Tier 4 Credits, Press Kit
Q6 What happened?             → Tier 6 Activity
```

### Work Page (Task-First)

```
Q1 What is happening?      → Tier 1 Greeting (context)
Q2 Should I care?           → Tier 2 Workload summary
Q3 What should I do?         → Tier 3 Tasks, Reviews
Q4 Why?                       → Tier 4 (in tasks)
Q5 What else?                 → Tier 4 Recent work
Q6 What happened?             → Tier 6 Activity
```

---

## Question Coverage Validation

Every page must explicitly list which questions it answers and which tier answers each.

| Question | Tier | Page Answers? |
|----------|------|---------------|
| Q1 What is happening? | 1 | Required |
| Q2 Should I care? | 2 | Required |
| Q3 What should I do? | 3 | Required (unless no action available) |
| Q4 Why? | 4 | Required (if data supports decision) |
| Q5 What else? | 5 | Optional (context rail if applicable) |
| Q6 What happened? | 6 | Optional (history if applicable) |

If a page cannot answer Q1–Q3, it is not a page. It is a data view.

---

## Decision Flow Anti-Patterns

| Anti-Pattern | Result |
|-------------|--------|
| Q4 before Q3 | Evidence without recommendation is a data dump |
| Q6 before Q3 | History before decision is noise |
| No Q1 | User has no orientation |
| No Q2 | User cannot assess urgency |
| No Q3 | Page is informational, not actionable |
| Q5 in main flow | Context competes with decision |
| Q7 (metadata) in primary | Metadata never competes with operational info |
