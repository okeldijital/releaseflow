# RFDS-001 — Design Tenets

**Status:** Active
**Version:** 1.0

---

## Purpose

These are the evaluation questions for every design decision. When a design choice is proposed, these questions must be asked. If any answer is "no" or "I don't know," the choice must be reconsidered.

---

## The Seven Tenets

### 1. Does this reduce cognitive effort?

The interface should feel easy to use. The user should not need to think about the interface to operate it.

If a design choice makes the user stop and consider how the interface works, the choice has failed.

### 2. Does this improve operational clarity?

The user should always know what is happening, what requires attention, and what to do next. If a design choice obscures any of these, it fails.

### 3. Does this reduce visual competition?

Every element on a screen competes for the user's attention. Visual hierarchy is a finite resource. Adding a prominent element requires removing or reducing another.

If a new element draws more attention than the conclusion it's meant to support, the hierarchy is broken.

### 4. Does this strengthen hierarchy?

Hierarchy is not a default. It must be designed. Every element should know its place relative to every other.

If a new element does not strengthen the page's hierarchy, it is decoration.

### 5. Does this improve scan speed?

A user should be able to find the answer to any of the four questions within 3 seconds. Scan speed is a measurable quality.

If a new element slows the user's ability to find what they need, the design has failed.

### 6. Does it respect the PDS?

The PDS defines the token vocabulary, spacing system, color semantics, and component contracts. No RFDS-compliant design may violate PDS tokens.

### 7. Would removing it make the interface worse?

This is the simplest and most important question. If you can remove an element and the interface is unchanged or improved, the element should not exist.

---

## How to Apply These Tenets

### In a Design Review

For every proposed change, ask each of the seven questions. The change passes only if all seven are "yes" (or the change is rejected with documented justification).

### In a Blueprint

Every section and component in a page blueprint must justify its presence by referencing one or more of these tenets.

### In Implementation

When a design decision is unclear, these tenets provide the criteria. The answer emerges from applying the tenets.

---

## Anti-Patterns Detected by These Tenets

| Anti-Pattern | Which Tenet Catches It |
|-------------|-------------------------|
| Adding a dashboard widget "for context" | #7 (removing it makes nothing worse) |
| Coloring a button red "to make it pop" | #3 (increases visual competition) |
| Showing all 5 metrics at the same size | #4 (no hierarchy) |
| Auto-playing a notification banner | #1 (increases cognitive effort) |
| Using a custom colour "for brand" | #6 (violates PDS) |
| Adding a 6th tab to a workspace | #5 (slows scan speed) |

---

## Relationship to the Principles

The tenets operationalise the principles.

| Tenet | Operationalises |
|-------|-----------------|
| 1. Cognitive effort | Principle 4 (Quiet interfaces) |
| 2. Operational clarity | Principle 1 (Operational clarity) |
| 3. Visual competition | Principle 5 (Information hierarchy) |
| 4. Hierarchy | Principle 5 (Information hierarchy) |
| 5. Scan speed | Principle 6 (Progressive disclosure) |
| 6. PDS respect | Governance hierarchy |
| 7. Remove if no effect | Principle 4 (Quiet interfaces) + 7 (Functional beauty) |
