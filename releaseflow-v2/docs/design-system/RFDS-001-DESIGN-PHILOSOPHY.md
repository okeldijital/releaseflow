# RFDS-001 — Design Philosophy

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Core Statement

**ReleaseFlow is an Operations Center, not a dashboard.**

A dashboard presents data for the user to interpret. An Operations Center presents conclusions for the user to act upon.

Every interface in ReleaseFlow exists to answer four questions, in order:

1. **What is happening?**
2. **Why does it matter?**
3. **What should I do next?**
4. **What evidence supports that recommendation?**

Everything else is secondary.

---

## What This Document Defines

RFDS-001 establishes the *constitution* of the product. It is not a style guide, a component spec, or a pattern library. It defines:

- How ReleaseFlow communicates
- How it organizes information
- How it prioritizes user attention
- How it presents operational state

Every subsequent design decision, blueprint, page, and component shall inherit from this document.

---

## Designer's Brief

ReleaseFlow is built for people who run music operations. The person using ReleaseFlow is not a casual visitor. They are a Release Manager, an A&R lead, a Label operations director, a Contributor juggling three projects. They are accountable for outcomes. They are time-pressured. They need answers, not screens.

The interface must:

- Tell them what is happening
- Tell them what requires their attention
- Tell them what to do about it
- Show them the evidence supporting that recommendation

If the user has to scroll, click, or interpret to find any of these, the interface has failed.

---

## The Four Questions

### 1. What is happening?

The hero of every page answers this. A single line — or at most three — that says what the system is seeing right now.

Not: "5 active releases, 2 blocked, 0 overdue, 1 critical, 0 over budget, 0 shipped this month."

But: "One release requires immediate attention. Health is critical across the organisation."

### 2. Why does it matter?

The system must explain, not just display. "Critical" is a state. "Critical because no readiness checks have passed and the Operations stage has not been completed" is a reason.

### 3. What should I do next?

The interface must always have a recommended action. Not "here are your options." But "do this now." Ordered by priority. Maximum three.

### 4. What evidence supports that recommendation?

A release table, an activity feed, metrics — these are not the headline. They are the proof. They follow the conclusion, not precede it.

---

## Anti-Principles

ReleaseFlow is NOT:

- A project management tool
- A CRM
- An ERP
- A ticketing system
- A file manager
- A analytics dashboard
- An admin panel

ReleaseFlow IS a music release operations platform. Every screen, every term, every interaction should reinforce that identity.

If a feature does not help someone operate a music release, it does not belong.
