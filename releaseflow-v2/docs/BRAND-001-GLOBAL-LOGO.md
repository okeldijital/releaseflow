# BRAND-001 — Global ReleaseFlow Logo Adoption

**Status:** Implemented  
**Priority:** Branding consistency  

## Canonical asset

```
apps/web/public/icons/ReleaseFlow-Logo.svg
```

Public URL: `/icons/ReleaseFlow-Logo.svg`

- Single source of truth  
- No duplicate copies in the repo  
- Do not recolour, crop, add effects, or recreate in code  

## Component

`components/branding/releaseflow-logo.tsx` → `ReleaseFlowLogo`

- Renders the official SVG  
- Configurable `width` (height follows 1:1 aspect)  
- Optional `priority` for LCP/auth  
- Used instead of ad-hoc `<img>` / stylised “R” marks  

Onboarding top bar: `components/branding/onboarding-brand-bar.tsx`

## Adoption

| Surface | Treatment |
|---------|-----------|
| Auth layout | Logo 112px, no orange badge |
| Sidebar (desktop) | Logo 112px expanded / 32px collapsed; no text wordmark (asset includes brand) |
| Collaborator Home | Logo **88px** above greeting (understated) |
| Onboarding steps | Fixed top bar via `OnboardingBrandBar` |
| Invite / org select | Centered logo |
| Favicon metadata | SVG preferred + existing PNG PWA icons |
| Offline page | 88px logo |
| Email templates | Absolute URL to same asset when `NEXT_PUBLIC_APP_URL` set |

## Mobile Home layout

```
ReleaseFlow Logo   (~88px)
Good morning
Nkululeko
────────────────
Today's Summary
```

Greeting remains the primary focus. No badge, shadow, or animation on the logo.

## Rules

1. Import `ReleaseFlowLogo` — do not paste SVG paths or badge marks.  
2. Reference only `/icons/ReleaseFlow-Logo.svg`.  
3. PWA maskable/png icons remain for install shells (platform requirement); brand mark for UI is the SVG.  
