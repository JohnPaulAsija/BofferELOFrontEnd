# Plan: Change Email Address

## Context
Users need to be able to request an email change from their own profile page. The backend sends a confirmation email — the change only takes effect when the user clicks the link. SuperAdmins can change any user's email immediately (no confirmation) via the admin panel. The backend supports `PATCH /users/me/email` and `PATCH /users/{userId}/email`.

---

## Reuse

| Item | Path |
|---|---|
| `useAuth` → `session` (for `session.user.email`) | `contexts/AuthContext.tsx` |
| `useErrorModal` → `showError`, `showInfo` | `hooks/useErrorModal.ts` |
| `ErrorModal` | `components/ui/error-modal.tsx` |
| `Input` | `components/ui/input.tsx` |
| `getThemeColors`, `Spacing`, `Typography`, `BorderRadius` | `constants/theme.ts` |
| Inline-edit pattern (Edit/Save/Cancel) | `components/ProfilePreferences.tsx` |

---

## Step 1 — API function (`lib/apiInteractions.ts`)

Add one function:

```ts
changeEmailFromAPI(jwt: string, email: string): Promise<{ message: string }>
// PATCH /users/me/email — returns { message } to display verbatim
// Error map: 422 → "Invalid email address", 429 → "Too many requests — try again in a minute"
```

---

## Step 2 — Own-profile UI (`components/UserProfile.tsx`)

Add an email subsection within the "ACCOUNT" section (below username, rendered only when `isOwnProfile`).

**Email subsection:**
- Display current email from `session.user.email` (via `useAuth()`) as a label + value row
- "Edit" button opens inline `Input` (email keyboard type) + Save/Cancel buttons
- On save: call `changeEmailFromAPI`
  - Success → call `showInfo` with the returned `message` string verbatim (e.g. "Confirmation email sent to new@example.com"). The displayed email does NOT change — the session email remains until the user confirms via the email link.
  - 422 → show inline error text "Invalid email address"
  - 429/other → `showError` modal

**State additions:**
```ts
const [editingEmail, setEditingEmail] = useState(false);
const [draftEmail, setDraftEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);
const [savingEmail, setSavingEmail] = useState(false);
```

**Note:** This plan assumes the username change plan has already been implemented (the ACCOUNT section and `useErrorModal`/`useAuth` hooks already added to `UserProfileComponent`). If implementing standalone, those hooks must also be added.

---

## Files changed

| File | Change |
|---|---|
| `lib/apiInteractions.ts` | Add `changeEmailFromAPI` |
| `components/UserProfile.tsx` | Add email inline edit row in Account section (isOwnProfile only) |

---

## Verification

1. Go to own profile → ACCOUNT section shows current email address.
2. Click Edit → input appears → enter invalid format → submit → inline error "Invalid email address".
3. Enter valid email → submit → info modal displays the API's confirmation message verbatim; displayed email unchanged.
4. Rapid submissions → 429 → error modal with cooldown message.
5. User's session remains valid after requesting the change — no re-auth required.
