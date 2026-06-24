# TASK-3002 — UX Friction Report

## Methodology

Every user action was traced through the existing specs. At each step,
the following questions were asked:

1. Does the user know what to click?
2. Is the path obvious, or are there multiple valid interpretations?
3. How many clicks does it take?
4. Does the user lose context during the action?
5. Is there feedback (visual change, toast, transition)?

Friction points are categorized by severity:
- **Blocking:** User cannot complete the task without guessing.
- **High:** User hesitates >5 seconds or takes a wrong path first.
- **Medium:** User takes extra clicks or loses context.
- **Low:** Minor annoyance or cosmetic issue.

---

## Friction 1: Where Do I Click to Advance the Release Status?

**Severity:** Blocking
**Context:** A PM wants to move the release from DRAFT to PLANNING.
**Docs:** 16 (status model), 12 (release workspace)

| What the PM sees | What they need to do |
|-----------------|---------------------|
| A status badge on the release header showing "DRAFT" | Click something to advance |

The status badge is defined (doc 12, line 52: "A persistent status badge is displayed in the release header"). But nowhere in any doc is the badge defined as interactive. Is it a dropdown? A button? Does clicking it show allowed transitions?

**Result:** The PM hesitates. They try clicking the badge — nothing happens if it's not built as interactive. They look for a "Begin Planning" button on the Overview tab — it's not there. They check the Settings tab — not there. They check the Workflow tab — not there. The transition is defined in the status model but has NO UI element in any spec.

**Fix:** Add a status action dropdown to the release header (doc 12). The badge is the trigger. Clicking shows available transitions for the current state.

---

## Friction 2: Three Workspaces Show the Same Data Differently

**Severity:** High
**Context:** A PM wants to know if the release is complete enough to distribute.
**Docs:** 38 (Requirements), 34 (Deliverables), 43 (Distribution)

| Workspace | What it shows | When to use it |
|-----------|---------------|---------------|
| Requirements (38) | Template-defined must-haves | "What does the template require?" |
| Deliverables (34) | Files uploaded and their status | "What has been delivered?" |
| Distribution (43) | DSP-specific field completeness | "What does Spotify need?" |

A PM checking "is this ready?" encounters three different views that all touch on completeness but organize data differently. The Requirements tab says "Cover art: Met ✓ (satisfied by cover-art-v3)." The Deliverable tab says "Cover Art: Granted ✓, v3." The Distribution tab says "Artwork: ✓ Passed." Three different vocabularies for the same underlying fact.

**Result:** The PM learns to check all three. This takes 3 clicks and cognitive overhead per check. Over 5 releases, that's 15 context switches.

**Fix:** The Distribution Workspace (doc 43) should be the single source of truth for "is this release distributable?" Requirements and Deliverables become sub-views accessible from within Distribution, not separate workspaces.

---

## Friction 3: A&R Reviews 5 Tracks One at a Time

**Severity:** High
**Context:** A&R reviews the Mixing stage for an EP with 5 tracks.
**Docs:** 35 (Review), 40 (Approval UX)

Doc 35 shows a review panel with ONE audio file and a waveform. For an EP with 5 tracks, the reviewer must listen to 5 files. The doc shows "Track 1, Track 2..." with per-track Listen buttons, but the decision (Approve/Reject/Request Changes) applies to the ENTIRE stage, not per track.

**Result:**
- If Track 3 needs changes but tracks 1, 2, 4, 5 are fine, the reviewer must reject the ENTIRE stage or request changes on everything. The Mix Engineer gets feedback on 2 tracks but sees a blanket "Changes Requested" on the stage.
- The reviewer cannot say "Tracks 1, 2, 4, 5 = Approved. Track 3 = Revise." Without per-track decisions.

**Fix:** Per-track approval within a stage review. Each track gets its own micro-decision (✓ / 🔄 / ✕). The stage only advances when all tracks are approved. A partial rejection only reverts the specific track's task.

---

## Friction 4: The Mechanical License Black Hole

**Severity:** Blocking
**Context:** Track 3 contains a sample. The license is "Pending." The PM needs it resolved.
**Docs:** 52 (Ownership), 54 (Readiness)

Doc 52 shows mechanical rights with a status field ("Pending"). Doc 54 shows that pending licenses block Rights Readiness. But there is no workflow for what happens between "Pending" and "Secured."

The PM's actions are all off-platform:
1. Find Melodic Publishing's contact info (not in ReleaseFlow)
2. Send email (Gmail / Outlook)
3. Wait
4. Follow up manually
5. Receive approval (email)
6. Return to ReleaseFlow
7. Manually update status to "Secured"

**Result:** The release is blocked by a process that ReleaseFlow cannot assist with. The PM must context-switch to email, remember to follow up, and manually update status. If the PM forgets, the license stays "Pending" forever and the release cannot ship.

**Fix:** At minimum, add a "Follow Up" button that logs the PM's action and sets a reminder. At maximum, integrate with rights management platforms. V1 can use the simple version: a "Contacted on [date]" note + "Remind me in [N] days" scheduler.

---

## Friction 5: No "Submit to DSPs" Pipeline

**Severity:** Blocking
**Context:** All checks pass. The PM clicks "Submit" on the Distribution Workspace.
**Docs:** 43 (Distribution), 44 (DSP Readiness)

Doc 43 shows a "Submit to all 4 DSPs" button. What happens after clicking? No spec defines:
- A confirmation dialog ("Submit Lua – The Fading Light to Spotify, Apple Music, Amazon, Tidal?")
- A loading/progress state
- Per-DSP submission status (Submitted / Processing / Approved / Rejected)
- A failure state ("Spotify rejected: artwork text too close to edge")
- A success state ("All 4 DSPs accepted. Release live in 24-48 hours.")

**Result:** The PM hesitates before clicking — they don't know what happens next. Is it instant? Does it take hours? Can they undo it? The button feels like a cliff.

**Fix:** Full submission pipeline spec:
1. Confirmation dialog with per-DSP summary
2. Submission progress (spinner → per-DSP status updates)
3. DSP response handling (accepted, rejected with reason, pending review)
4. Post-submission status dashboard in Distribution Workspace

---

## Friction 6: "Who Is Sam?"

**Severity:** Medium
**Context:** Multiple people share the same first name across the org.
**Docs:** All docs use first-name-only references.

Throughout the docs, people are referenced as "Sam," "Alex," "Taylor," "Anna." In a real org, there may be two Sams (Sam Wilson, Mix Engineer and Sam A&R). The notification "Sam approved your Mastering stage" is ambiguous.

Doc 41 (Notifications) shows "Sam Wilson approved Mastering" with a full name. But doc 35 (Review) shows "Submitted by Sam Wilson · 2 hours ago" — name only, no role. The PM needs to know WHO did what, not just the name.

**Result:** If two Sams exist in the org, the PM hesitates: "Which Sam approved this? The A&R or the Mix Engineer?" They need to click through to verify.

**Fix:** All user references in notifications, activity feeds, and review panels must include role: "Sam Wilson (A&R)" or "Sam Wilson (Mix Engineer)." This is a global pattern, not per-doc.

---

## Friction 7: Contributor Home vs Generic Dashboard — Which Does a Role See?

**Severity:** Medium
**Context:** A Producer logs in. Do they see the Contributor Home (doc 42) or the generic dashboard (doc 6)?

Doc 33 (Contributor Experience) says technical roles get a task-first layout. Doc 42 (Contributor Home) defines the specific page with Assigned/Pending/Feedback sections. But no doc specifies the ROUTING rule: who gets redirected to which page on login?

**Result:** If a Producer logs in and sees the generic dashboard with org stats and a sidebar, they're confused — "Where are my tasks?" They must navigate to find their work.

**Fix:** A single routing rule document (or section in doc 33) that maps role → landing page:
- Owner/Admin/PM → Dashboard (doc 6)
- A&R → Dashboard with approval queue prioritised
- Artist → Contributor Home scoped to their releases
- Producer/Engineer/Designer → Contributor Home (doc 42)
- Marketing/PR → Marketing Hub
- Viewer → Dashboard (read-only)

---

## Friction 8: Status Transition Is Implicit, Not Guided

**Severity:** High
**Context:** All tasks in Planning are DONE. The stage should advance automatically.

Doc 5 (State Machine) says a stage advances to COMPLETED when all tasks are DONE. Doc 28 (Workflow Board) implies auto-advance. But what happens in the UI?

**The PM's experience:**
1. Last task is marked DONE
2. ?
3. The Planning column should now show COMPLETED and Production should show ACTIVE

Is there a transition animation? A toast? Does the PM see the columns update in real time? Or does the PM need to refresh?

**Result:** The PM marks the last task DONE and... nothing visible happens. They wait. They refresh. The columns update. The PM learns to expect a delay but doesn't trust that auto-advance worked.

**Fix:** When the last task in a stage transitions to DONE, show a brief animation on the Workflow Board: the completed stage column fades to green, a checkmark appears, and the next stage column pulses blue (Active). No page refresh needed. Firestore real-time listeners drive the transition.

---

## Friction 9: The "I Don't Know Where That Lives" Problem

**Severity:** High
**Context:** A PM needs to change the release date. Where is it?

Possible locations:
- Release Overview tab (doc 14)
- Release Settings tab (doc 12)
- Distribution Workspace → Metadata tab (doc 43)
- Release Creation flow (doc 11 — but that's a creation wizard, not an editor)

Doc 13 (Metadata Model) defines the field. Doc 43 (Distribution) shows it in the Metadata table. Doc 12 (Settings) says "metadata overrides" but doesn't list which fields. Doc 14 (Overview) doesn't show the release date at all.

**Result:** The PM checks 3 tabs before finding the release date field. They remember for next time, but each new PM repeats this discovery process.

**Fix:** A single, canonical location for release metadata editing. The Distribution Workspace → Metadata tab (doc 43) is the logical home since it's where DSP fields are managed. The Release Settings tab links to it. The Overview tab shows the date as a read-only stat focused on the deadline.

---

## Friction 10: No "What Did I Miss?" Summary

**Severity:** Medium
**Context:** A PM returns after a 4-day weekend. 3 releases advanced. 2 tasks were completed by others. 1 approval was granted. 1 budget overage occurred.

The PM opens the Operations Center (doc 59). It shows current state — alerts, blocked work, deadlines. But it doesn't show what CHANGED. The PM must manually compare mental state from 4 days ago with current state.

**Result:** The PM spends 10 minutes clicking through 3 releases to understand what happened while they were away. They miss the budget overage until the alert escalates.

**Fix:** "Since [date]" summary section at the top of the Operations Center showing: tasks completed while away, stages advanced, approvals decided, new alerts. This is a simple diff between `lastSessionAt` and `now`.

---

## Friction 11: Comment Input Is Inconsistent

**Severity:** Low
**Context:** The user wants to add a note.

Comments appear in 4 docs with different specs:
- Doc 29 (Stage Detail): "Write a comment..." + @mentions + Enter to send
- Doc 32 (Task Detail): "Write a comment..." + @mentions + Enter to send
- Doc 35 (Review): No comment input shown (review feedback is a separate dialog)
- Doc 42 (Contributor Home): No comment input in the feedback section (read-only)

**Result:** The user learns that @mentions work in Stage Detail and Task Detail but not in other contexts. They try @mentioning someone in a review feedback dialog — does it work? Unclear.

**Fix:** A shared `CommentInput` component with consistent behavior: multi-line, @mentions, Enter=send, Shift+Enter=newline, Markdown rendering. Used everywhere comments appear.

---

## Summary

| # | Friction | Severity | Affected Docs |
|---|----------|----------|--------------|
| 1 | Status transition UI missing | Blocking | 16, 12 |
| 2 | Three overlapping completeness views | High | 38, 34, 43 |
| 3 | No per-track approval in stage review | High | 35, 40 |
| 4 | Mechanical license black hole | Blocking | 52, 54 |
| 5 | No DSP submission pipeline | Blocking | 43, 44 |
| 6 | Ambiguous names without roles | Medium | 35, 41 |
| 7 | No role → landing page routing rule | Medium | 33, 42, 6 |
| 8 | Implicit stage auto-advance with no UI feedback | High | 5, 28 |
| 9 | "Where does that live?" — no canonical field locations | High | 13, 43, 12, 14 |
| 10 | No "what changed while I was away" view | Medium | 59 |
| 11 | Inconsistent comment input behavior | Low | 29, 32, 35, 42 |

### Top 5 Immediate Fixes

1. Status action dropdown on release header (fixes F1 — Blocking)
2. DSP submission confirmation + status pipeline (fixes F5 — Blocking)
3. License follow-up workflow (fixes F4 — Blocking)
4. Consolidate completeness into Distribution Workspace (fixes F2 + F9)
5. Per-track approval within stage review (fixes F3)
