# Signup Flow Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the deleted `POST /users/me/setup` endpoint call from signup and pass all profile data directly through `supabase.auth.signUp()` options.data so the DB trigger can handle profile creation.

**Architecture:** Two files change. `lib/apiInteractions.ts` loses `setupUserFromAPI` (deleted). `app/register.tsx` loses the two post-signup API calls and instead passes username + preferences in `options.data` to `signUp()`. No other files are affected.

**Tech Stack:** React Native / Expo, TypeScript, Supabase JS client (`@supabase/supabase-js`)

---

### Task 1: Delete `setupUserFromAPI` from `lib/apiInteractions.ts`

**Files:**
- Modify: `lib/apiInteractions.ts:67-80`

**Step 1: Delete the function**

Remove lines 67–80 entirely (the `setupUserFromAPI` export):

```ts
// DELETE THIS BLOCK:
export const setupUserFromAPI = async (jwt: string, username: string): Promise<void> => {
  const response = await fetch(`${API_URL}/users/me/setup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, accept_terms: true }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      409: 'That username is already taken. Please choose a different one.',
      400: 'Invalid username. Please use only letters, numbers, and underscores (3–30 characters).',
    };
    throw new Error(messages[response.status] ?? 'Account setup failed. Please try again.');
  }
};
```

After deletion, `updatePreferencesFromAPI` (line 82) immediately follows `getMeFromAPI` / `getOptionsFromAPI` — no gap needed.

**Step 2: Verify no other file imports `setupUserFromAPI`**

Run:
```bash
grep -r "setupUserFromAPI" .
```
Expected: zero matches (only `app/register.tsx` used it, and we'll fix that next).

---

### Task 2: Update `handleRegister()` in `app/register.tsx`

**Files:**
- Modify: `app/register.tsx:13-16` (imports)
- Modify: `app/register.tsx:131-163` (`handleRegister` try block)

**Step 1: Fix the import line**

Current (lines 13–16):
```ts
import {
  setupUserFromAPI,
  updatePreferencesFromAPI,
} from "@/lib/apiInteractions";
```

Replace with: *(nothing — remove the entire import block, it is no longer needed)*

**Step 2: Update `supabase.auth.signUp()` call and remove post-signup API calls**

Current try block (lines 130–169):
```ts
setLoading(true);
try {
  const {
    data: { session },
    error: signUpError,
  } = await supabase.auth.signUp({ email: trimmedEmail, password });

  if (signUpError) {
    showError("Sign Up Failed", "Unable to create account. The email may already be in use, or the password does not meet requirements.");
    setLoading(false);
    return;
  }

  if (!session) {
    setLoading(false);
    showInfo(
      "Verify Your Email",
      "Please check your inbox and verify your email address before signing in.",
      () => router.replace("/auth")
    );
    return;
  }

  await setupUserFromAPI(session.access_token, trimmedUsername);

  if (gender || preferredGame || preferredWeapon || preferredShield) {
    await updatePreferencesFromAPI(session.access_token, {
      gender,
      preferred_game: preferredGame,
      preferred_weapon: preferredWeapon,
      preferred_shield: preferredShield,
    });
  }

  router.replace("/");
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  showError("Registration Failed", message);
} finally {
  setLoading(false);
}
```

Replace with:
```ts
setLoading(true);
try {
  const {
    data: { session },
    error: signUpError,
  } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: {
        username: trimmedUsername,
        ...(gender && { gender }),
        ...(preferredGame && { preferredGame }),
        ...(preferredWeapon && { preferredWeapon }),
        ...(preferredShield && { preferredShield }),
      },
    },
  });

  if (signUpError) {
    showError("Sign Up Failed", "Unable to create account. The email may already be in use, or the password does not meet requirements.");
    setLoading(false);
    return;
  }

  if (!session) {
    setLoading(false);
    showInfo(
      "Verify Your Email",
      "Please check your inbox and verify your email address before signing in.",
      () => router.replace("/auth")
    );
    return;
  }

  router.replace("/");
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  showError("Registration Failed", message);
} finally {
  setLoading(false);
}
```

**Step 3: Verify no remaining references to removed functions**

Run:
```bash
grep -r "setupUserFromAPI\|updatePreferencesFromAPI" app/
```
Expected: zero matches in `app/`.

---

### Task 3: Verify TypeScript compiles clean

**Step 1: Run the TypeScript compiler**

```bash
npx tsc --noEmit
```
Expected: no errors. If you see `Cannot find name 'setupUserFromAPI'` or similar, you missed a reference — grep for it and remove.

**Step 2: Run lint**

```bash
npm run lint
```
Expected: no new errors introduced.
