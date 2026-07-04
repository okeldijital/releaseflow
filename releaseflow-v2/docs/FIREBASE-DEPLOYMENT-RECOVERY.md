# Firebase Deployment Recovery — ST-HF-005

**Date:** 2026-06-28
**Status:** Root cause identified, configuration fixed, CLI not installed

---

## Root Cause

**`firebase.json` was missing from the project root.** Without this file, the Firebase CLI has no instruction to deploy Firestore indexes. The `firestore.indexes.json` file with all 36 composite indexes was orphaned — correctly constructed but never referenced by any deployment configuration.

---

## Phase 1 — `firebase.json` Inspection

**Before**: File did not exist.

**After**: Created with:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## Phase 2 — `firestore.indexes.json` Verification

✅ File exists at project root (`/Users/m2krproduction/releaseflow/releaseflow-v2/firestore.indexes.json`).

✅ Contains 36 composite indexes.

✅ Valid JSON — passes `python3 -m json.tool` validation.

```bash
python3 -m json.tool firestore.indexes.json > /dev/null && echo "VALID" || echo "INVALID"
# → VALID
```

---

## Phase 3 — Active Project

Firebase project ID is configured via environment variable:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

No `.firebaserc` file exists. The project must be set manually or with:

```bash
firebase use --add
```

---

## Phase 4 — Deployment

Firebase CLI is **not installed** on this machine. Install with:

```bash
npm install -g firebase-tools
```

Then authenticate and deploy:

```bash
firebase login
firebase use --add   # Select the correct project
firebase deploy --only firestore:indexes
```

---

## Phase 5 — Determination

| Question | Answer |
|----------|--------|
| Did Firebase ignore the indexes file? | No — the file was never referenced because `firebase.json` didn't exist |
| Did Firebase reject it? | No — never submitted |
| Did Firebase deploy it? | No — never deployed |
| Did Firebase deploy to another project? | No — no project configured |
| Did validation fail? | No — file is valid JSON |

---

## Required Steps to Deploy

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Select project
firebase use --add

# 4. Deploy indexes
firebase deploy --only firestore:indexes

# 5. Verify in Firebase Console
# Open Firestore → Indexes → Composite tab
# All 36 indexes should be listed as "Building" or "Enabled"
```

**Estimated index build time**: 2–10 minutes depending on collection size.

---

## Verification

| Check | Result |
|-------|--------|
| `firebase.json` exists | ✅ Created |
| `firestore.indexes.json` exists | ✅ 36 indexes |
| `firestore.indexes.json` valid JSON | ✅ |
| TypeScript | ✅ 6/6 |
| Build | ✅ 1/1 |
| Tests | ✅ 327 passed |
| Application code changes | ✅ 0 |
