# Plan: Delete Account

## Context
Users need to be able to permanently delete their own account from their profile page. Match history is preserved — all match FKs are reassigned to a `[deleted]` sentinel profile. SuperAdmins can delete any user from the admin panel. The backend supports `DELETE /users/me` and `DELETE /users/{userId}`.

---

## Reuse

| Item | Path |
|---|---|
| `useAuth` → `session`, `signOut` | `contexts/AuthContext.tsx` |
| `useErrorModal` → `showError` | `hooks/useErrorModal.ts` |
| `ErrorModal` | `components/ui/error-modal.tsx` |
| `Input` | `components/ui/input.tsx` |
| `useRouter` → `router.replace('/auth')` | `expo-router` |
| `getThemeColors`, `Spacing`, `Typography`, `BorderRadius` | `constants/theme.ts` |

---

## Step 1 — API function (`lib/apiInteractions.ts`)

Add one function:

```ts
deleteAccountFromAPI(jwt: string): Promise<{ deleted: string }>
// DELETE /users/me
// Error map: 429 → "Too many requests — try again in a minute"
```

---

## Step 2 — Own-profile UI (`components/UserProfile.tsx`)

Add a "DANGER ZONE" section below the Account section, rendered only when `isOwnProfile`. Red-bordered card.

**Delete Account flow:**
- "Delete Account" button in destructive red style
- Clicking it expands an inline confirm panel (not a modal):
  - Explanatory text: "This is permanent. Your match history will be preserved under a [deleted] account."
  - `Input` with placeholder "Type your username to confirm"
  - "Delete Account" button — disabled until typed value matches `profile.username` exactly
  - "Cancel" link to collapse the panel and reset state
- On confirm: call `deleteAccountFromAPI`
  - Success → call `signOut()`, then `router.replace('/auth')`
  - 429/other → `showError` modal
- The JWT is immediately invalid after deletion — no further authenticated requests

**State additions:**
```ts
const [showDeletePanel, setShowDeletePanel] = useState(false);
const [deleteText, setDeleteText] = useState('');
const [deletePending, setDeletePending] = useState(false);
```

**Note:** This plan assumes `useErrorModal`, `useAuth`, and `useRouter` are already wired into `UserProfileComponent` (done by the username change plan). If implementing standalone, those hooks must also be added.

---

## Files changed

| File | Change |
|---|---|
| `lib/apiInteractions.ts` | Add `deleteAccountFromAPI` |
| `components/UserProfile.tsx` | Add Danger Zone section with delete + type-to-confirm (isOwnProfile only) |

---

## Verification

1. Go to own profile → "DANGER ZONE" section visible with red border.
2. Click "Delete Account" → inline panel expands with input and disabled delete button.
3. Type wrong text → delete button stays disabled.
4. Type exact username → delete button enables → click → account deleted → session cleared → redirected to `/auth`.
5. Attempt any authenticated request after deletion → 401 (JWT invalid).
6. Rapid delete attempts → 429 → error modal with cooldown message.
7. "Cancel" collapses the panel and clears the typed text.
