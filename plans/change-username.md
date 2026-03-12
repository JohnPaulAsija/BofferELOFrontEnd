# Plan: Change Username

## Context
Users need to be able to change their username from their own profile page. SuperAdmins need to change any user's username from the admin panel. The backend supports `PATCH /users/me/username` and `PATCH /users/{userId}/username`.

---

## Reuse

| Item | Path |
|---|---|
| `useAuth` → `session` | `contexts/AuthContext.tsx` |
| `useErrorModal` → `showError` | `hooks/useErrorModal.ts` |
| `ErrorModal` | `components/ui/error-modal.tsx` |
| `Input` | `components/ui/input.tsx` |
| `getThemeColors`, `Spacing`, `Typography`, `BorderRadius` | `constants/theme.ts` |
| Inline-edit pattern (Edit/Save/Cancel) | `components/ProfilePreferences.tsx` |

---

## Step 1 — API function (`lib/apiInteractions.ts`)

Add one function:

```ts
changeUsernameFromAPI(jwt: string, username: string): Promise<{ username: string }>
// PATCH /users/me/username
// Error map: 409 → "Username already taken", 422 → "Invalid username format", 429 → "Too many requests — try again in a minute"
```

---

## Step 2 — Own-profile UI (`components/UserProfile.tsx`)

Add an "ACCOUNT" section below `ProfilePreferences`, rendered only when `isOwnProfile`. Use the same inline-edit pattern as `ProfilePreferences` (display row → Edit button → Input + Save/Cancel).

**Username subsection:**
- Display current username as a label + value row
- "Edit" button opens inline `Input` pre-filled with current username + Save/Cancel buttons
- Client validation before submit: trim whitespace, then check 3–24 chars, `[a-zA-Z0-9_-]`
- On save: call `changeUsernameFromAPI`
  - Success → update local `profile` state via `setProfile(prev => prev ? { ...prev, username: newUsername } : prev)`
  - 409 → show inline error text "Username already taken" (below the input, not a modal)
  - 429/other → `showError` modal

**State additions:**
```ts
const [editingUsername, setEditingUsername] = useState(false);
const [draftUsername, setDraftUsername] = useState('');
const [usernameError, setUsernameError] = useState<string | null>(null);
const [savingUsername, setSavingUsername] = useState(false);
```

Add `useErrorModal` hook to `UserProfileComponent` and render `ErrorModal` at the top of the JSX.

---

## Files changed

| File | Change |
|---|---|
| `lib/apiInteractions.ts` | Add `changeUsernameFromAPI` |
| `components/UserProfile.tsx` | Add Account section with username inline edit (isOwnProfile only) |

---

## Verification

1. Go to own profile → "ACCOUNT" section visible with current username displayed.
2. Click Edit → input appears pre-filled → change to a taken name → submit → inline error "Username already taken".
3. Change to a valid unique name → submit → success → displayed username updates.
4. Rapid submissions → 429 → error modal with cooldown message.
5. Client validation: empty / 2-char / 25-char / special chars → blocked before API call.
