# Plan: Admin User Management

## Context
SuperAdmins need a user management section in the admin panel to change usernames, change emails, and delete users. The admin panel (`app/admin.tsx`) already loads a user list via `getUsersListFromAPI` and renders match management. This plan adds a new `AdminUserManager` component wired into the existing admin screen.

Admin email changes are **immediate** (no confirmation email sent) — the UI must warn about this. Admin cannot delete the system sentinel user (`00000000-0000-0000-0000-000000000002`) or the bootstrap superAdmin (server returns 400).

---

## Reuse

| Item | Path |
|---|---|
| `UserListEntry` type | `lib/apiInteractions.ts` |
| `ConfirmModal` | `components/ui/confirm-modal.tsx` |
| `ErrorModal` + `useErrorModal` | `components/ui/error-modal.tsx`, `hooks/useErrorModal.ts` |
| `Input` | `components/ui/input.tsx` |
| `useAuth` → `session`, `isSuperAdmin` | `contexts/AuthContext.tsx` |
| `getThemeColors`, `Spacing`, `Typography`, `BorderRadius` | `constants/theme.ts` |
| Existing `users` state in `admin.tsx` | `app/admin.tsx` |

---

## Step 1 — Admin API functions (`lib/apiInteractions.ts`)

Add three functions:

```ts
adminChangeUsernameFromAPI(jwt: string, userId: string, username: string): Promise<{ username: string }>
// PATCH /users/{userId}/username
// Error map: 403 → "Insufficient permissions", 404 → "User not found", 409 → "Username already taken", 422 → "Invalid username"

adminChangeEmailFromAPI(jwt: string, userId: string, email: string): Promise<{ email: string }>
// PATCH /users/{userId}/email — immediate, no confirmation email
// Error map: 403 → "Insufficient permissions", 404 → "User not found", 422 → "Invalid email address"

adminDeleteUserFromAPI(jwt: string, userId: string): Promise<{ deleted: string }>
// DELETE /users/{userId}
// Error map: 400 → "Cannot delete a system account", 403 → "Insufficient permissions", 404 → "User not found", 422 → "Invalid user ID"
```

---

## Step 2 — New component (`components/AdminUserManager.tsx`)

Props:
```ts
{
  users: UserListEntry[];
  onUserDeleted: (userId: string) => void;
}
```

**Layout:**
- Search/filter `Input` at the top — filters user rows by substring match on `username`
- Flat list of user rows, each showing: `username` + `[Edit]` toggle button
- Tapping Edit expands an inline panel for that user with:
  - **Username**: `Input` pre-filled with current username + Save button → calls `adminChangeUsernameFromAPI`; 409 → inline error "Username already taken"
  - **Email**: `Input` + Save button → calls `adminChangeEmailFromAPI`; warning text: "Applied immediately — no confirmation email sent"; success → show updated email inline
  - **Delete**: "Delete User" button (destructive red) → `ConfirmModal` with message "Delete user `<username>`? This cannot be undone." → on confirm calls `adminDeleteUserFromAPI`; success → `onUserDeleted(userId)` removes the row
- Only one user's panel expanded at a time (expanding another collapses the previous)
- All errors via `useErrorModal`

**Component state:**
```ts
const [filter, setFilter] = useState('');
const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
const [draftUsername, setDraftUsername] = useState('');
const [draftEmail, setDraftEmail] = useState('');
const [usernameError, setUsernameError] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserListEntry | null>(null);
```

---

## Step 3 — Wire into admin screen (`app/admin.tsx`)

- Add `isSuperAdmin` to the `useAuth()` destructure (already exported from AuthContext)
- Import `AdminUserManager`
- Render a "User Management" section below the existing content, only when `isSuperAdmin`:
  ```tsx
  {isSuperAdmin && (
    <AdminUserManager
      users={users}
      onUserDeleted={(userId) => setUsers(prev => prev.filter(u => u.id !== userId))}
    />
  )}
  ```
- Admins (role 2) see the admin panel for match management but NOT the user management section

---

## Files changed

| File | Change |
|---|---|
| `lib/apiInteractions.ts` | Add `adminChangeUsernameFromAPI`, `adminChangeEmailFromAPI`, `adminDeleteUserFromAPI` |
| `components/AdminUserManager.tsx` | New component |
| `app/admin.tsx` | Import + render AdminUserManager for superAdmin |

---

## Verification

1. Log in as superAdmin → admin panel shows "User Management" section below match management.
2. Log in as admin (role 2) → admin panel visible but no User Management section.
3. Type in search filter → user list filters by username substring.
4. Expand a user → change username to a taken name → inline error "Username already taken".
5. Change username to a valid unique name → success → row updates with new name.
6. Change email → warning note visible → success → email displayed inline.
7. Delete a non-sentinel user → confirm modal → success → row removed from list.
8. Attempt to delete the sentinel user → 400 → error modal "Cannot delete a system account".
