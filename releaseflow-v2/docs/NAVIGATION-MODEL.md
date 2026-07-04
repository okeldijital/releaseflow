# Navigation Model — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Navigation Architecture

```
Application Shell
│
├── Sidebar (persistent)
│   ├── Operations
│   │   ├── Home (Operations Center)
│   │   ├── Releases
│   │   └── Work
│   │
│   ├── Resources
│   │   ├── Artists
│   │   ├── Assets
│   │   └── People
│   │
│   └── System
│       └── Administration
│
└── Topbar
    ├── Breadcrumbs
    ├── Global Search
    ├── Notifications
    ├── Command Palette (⌘K)
    └── Organization Switcher
```

---

## Screen Purposes

### Operations Center (`/dashboard`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To answer "what requires attention?" across all releases |
| Who uses it? | Owner, Admin, Release Manager |
| What decision should be made here? | Which release needs action next? |
| What should never appear here? | Per-release task details, file uploads, editing forms |

**Five-second question**: "Is anything on fire?"

---

### Release List (`/releases`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To navigate to a specific release |
| Who uses it? | All roles |
| What decision should be made here? | Which release do I work on? |
| What should never appear here? | Stage details, task lists, readiness breakdowns |

---

### Release Workspace (`/releases/[id]`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To understand and advance a single release |
| Who uses it? | Release Manager, Artist, Contributor |
| What decision should be made here? | Is this release healthy? What blocks shipping? What happened? What's next? |
| What should never appear here? | Other releases' data, global org settings |

**Five-second questions**: "Is this healthy? What blocks shipping?"

---

### Artist List (`/artists`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To navigate to a specific artist |
| Who uses it? | All roles |
| What decision should be made here? | Which artist's catalog do I manage? |

---

### Artist Workspace (`/artists/[id]`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To manage an artist's profile, catalog, and relationships |
| Who uses it? | Release Manager, Artist |
| What decision should be made here? | Which releases matter? Which collaborations exist? What needs attention? |
| What should never appear here? | Workflow stage advancement, task assignment |

---

### Assets (`/assets`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To browse and manage files across all releases |
| Who uses it? | Release Manager |
| What decision should be made here? | What files exist? What's missing? |

---

### Rights Holders (`/rights-holders`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To manage publishers, labels, and PROs |
| Who uses it? | Release Manager, Admin |
| What decision should be made here? | Who owns what? Are splits correct? |

---

### Work (`/work`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To show assigned tasks and reviews |
| Who uses it? | Contributor |
| What decision should be made here? | What do I work on next? |
| What should never appear here? | Org-level metrics, release creation |

---

### People (`/people`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To manage team members and roles |
| Who uses it? | Admin, Owner |
| What decision should be made here? | Who has access? What are they working on? |

---

### Administration (`/administration`)

| Question | Answer |
|----------|--------|
| Why does it exist? | To configure organization settings and monitor system health |
| Who uses it? | Admin, Owner |
| What decision should be made here? | Is the system healthy? Are permissions correct? |
| What should never appear here? | Release or artist CRUD |

---

## Navigation Rules

1. **No dead ends**: Every screen provides at least one clear next action.
2. **No circular navigation**: Users move forward through operations, not in loops.
3. **No hidden screens**: Every screen is reachable from the sidebar.
4. **Breadcrumbs always visible**: Users always know where they are.
5. **Command Palette**: Every screen is reachable via ⌘K.
6. **Back works**: Browser back navigates correctly through the hierarchy.
