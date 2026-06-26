# Deployment Guide — ReleaseFlow RC1

## Infrastructure Overview

| Component | Provider | Purpose |
|---|---|---|
| Web App | Vercel | Next.js App Router hosting |
| Database | Firebase Firestore | Domain data (organizations, releases, workflows) |
| Storage | Cloudinary | Media assets (audio, artwork, documents) |
| Auth | Firebase Auth | User authentication and sessions |
| Functions | Firebase Cloud Functions | Background processing (alerts, notifications) |

---

## Environment Variables

### Required Variables

#### Firebase
| Variable | Description | Secret? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | No |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin SDK client email | Yes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK private key | Yes |

#### Cloudinary
| Variable | Description | Secret? |
|---|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Cloudinary API key | No |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset name | No |

---

## Vercel Deployment

### First Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Environment Variables on Vercel

Set all environment variables in Vercel dashboard → Project → Settings → Environment Variables. Mark production secrets as sensitive.

### Build Settings

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Install Command | `pnpm install` |
| Root Directory | `releaseflow-v2/apps/web` |

### Domains

| Environment | Domain |
|---|---|
| Production | `app.releaseflow.io` |
| Staging | `staging.releaseflow.io` |
| Preview | `*.vercel.app` |

---

## Firebase Setup

### Firestore

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Select Firestore in Native mode
3. Apply security rules from `releaseflow-v2/firestore.rules`

### Firestore Indexes

Create the following composite indexes:

```
collection: releases
  fields: organizationId ASC, createdAt DESC

collection: releases
  fields: status ASC, targetReleaseDate ASC

collection: tasks
  fields: assigneeId ASC, status ASC, priority DESC

collection: tasks
  fields: stageId ASC, createdAt ASC

collection: campaigns
  fields: releaseId ASC, createdAt DESC

collection: notifications
  fields: userId ASC, read ASC, archived ASC, createdAt DESC

collection: operational_alerts
  fields: releaseId ASC, resolved ASC, priority DESC

collection: dependencies
  fields: releaseId ASC, createdAt ASC

collection: artists
  fields: name ASC

collection: release_budgets
  fields: releaseId ASC, createdAt DESC

collection: cost_items
  fields: releaseId ASC, createdAt DESC

collection: deliverables
  fields: releaseId ASC, createdAt DESC
```

### Firebase Auth

Enable sign-in methods:
- Email / Password
- Google (optional)

### Storage Rules

```firebase
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Post-Deployment Verification

1. Visit `https://app.releaseflow.io` and confirm landing page loads
2. Verify sign-up flow creates a user in Firebase Auth
3. Verify onboarding creates an organization in Firestore
4. Verify release creation generates workflow stages
5. Confirm Cloudinary uploads succeed
6. Run `pnpm test` from root and confirm 250+ passing tests

---

## Rollback Procedure

```bash
# Revert to previous production deployment
vercel rollback

# Or deploy a specific commit
git checkout <commit-hash>
vercel --prod
```
