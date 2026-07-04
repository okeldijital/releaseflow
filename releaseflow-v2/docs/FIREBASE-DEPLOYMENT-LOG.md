# Firebase Deployment Log — ST-HF-005

**Date:** 2026-06-28

---

## Environment

| Item | Value |
|------|-------|
| firebase CLI installed | ❌ No |
| `firebase.json` | ❌ Missing → ✅ Created |
| `firestore.indexes.json` | ✅ Exists (36 indexes) |
| `firestore.rules` | ❌ Missing |
| `.firebaserc` | ❌ No project alias |
| Project ID | Via `NEXT_PUBLIC_FIREBASE_PROJECT_ID` env var |

---

## Actions Taken

1. Created `firebase.json` with `firestore.indexes` pointing to `firestore.indexes.json`
2. Validated `firestore.indexes.json` — 36 indexes, valid JSON
3. Documented deployment instructions since CLI not available locally

---

## Remaining Steps (for whoever deploys)

```
npm install -g firebase-tools
firebase login
firebase use --add       # select the Firebase project
firebase deploy --only firestore:indexes
```

After deployment, verify in Firebase Console → Firestore → Indexes → Composite.
