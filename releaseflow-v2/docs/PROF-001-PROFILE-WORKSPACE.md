# PROF-001 — Mobile Profile Workspace Redesign

**Status:** Implemented  
**Priority:** P1  
**Applies to:** All mobile users (Collaborator / Manager / Admin) — same workspace; elevated admin tools remain under Administration  

## Objective

Transform Profile into a **self-service account workspace** that answers:

1. Who am I?  
2. How do I manage my account?  
3. How do I control my experience?  

## Navigation order

1. **Profile header** — avatar (80px), name, email, role · org, Edit Profile  
2. **Edit profile** — display name + photo (email read-only)  
3. **Security** — change password / reset email  
4. **Notifications** — channels + grouped categories  
5. **Account information** — email, organisation, platform role (read-only)  
6. **Preferences** — theme (future-ready), offline storage, install app  
7. **Sign out**  

## Propagation

| Field | Written to |
|-------|------------|
| Display name | Firebase Auth `displayName`, `users/{uid}`, `people/{personId}` when linked |
| Photo | Auth `photoURL`, `users/{uid}.avatarUrl`, `people/{personId}.avatarUrl` |

New comments / activity / notifications use the live Auth display name and photo where the UI reads `user`. Person-linked assignment UI refreshes when person docs reload or subscribe.

## Security

- Email/password accounts: reauthenticate with current password → `updatePassword`  
- Fallback: send password reset email (same path as UAT-006)  
- OAuth-only: explain provider-managed password; optional reset email if email present  

## Files

| Path | Role |
|------|------|
| `app/(app)/profile/page.tsx` | Workspace UI |
| `lib/profile-service.ts` | Orchestration |
| `lib/user-profile-repository.ts` | `updateUserProfile` |
| `components/profile/profile-security-panel.tsx` | Password UX |
| `components/profile/notification-preferences-panel.tsx` | Grouped prefs |
| `components/profile/ProfileAvatarUploader.tsx` | Photo UX |
| `packages/ui` Avatar `2xl` | Header size |

## Acceptance

- [x] Change display name  
- [x] Upload / replace / remove photo  
- [x] Change password (password accounts) + reset email  
- [x] Notification preferences (grouped)  
- [x] Account info separated from editable settings  
- [x] Clear hierarchy / purpose per section  
