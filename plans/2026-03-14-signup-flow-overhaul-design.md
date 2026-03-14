# Signup Flow Overhaul — Design

**Date:** 2026-03-14
**Status:** Approved

## Context

The backend has removed `POST /users/me/setup`. Profile creation is now handled by a Supabase `handle_new_user` database trigger that fires immediately when `signUp()` completes, using data passed in `options.data`. There is no post-signup setup step.

## What Changes

### `lib/apiInteractions.ts`
- **Delete** `setupUserFromAPI` — the endpoint it calls (`POST /users/me/setup`) no longer exists (returns 404).
- `updatePreferencesFromAPI` is unchanged and remains (used by the profile preferences screen post-signup).

### `app/register.tsx` — `handleRegister()`

**Before:**
```
signUp(email, password)
  → setupUserFromAPI(token, username)        // POST /users/me/setup — REMOVED
  → updatePreferencesFromAPI(token, prefs)   // PATCH /users/me/preferences
```

**After:**
```
signUp(email, password, options: {
  data: { username, gender, preferredGame, preferredWeapon, preferredShield }
})
// Trigger populates profile immediately — no further API calls needed
```

Key names in `options.data` must match exactly (camelCase for preferences):
- `username` — required; profile will be incomplete without it
- `gender` — optional
- `preferredGame` — optional
- `preferredWeapon` — optional
- `preferredShield` — optional

### Imports in `app/register.tsx`
- Remove `setupUserFromAPI` from the import line (function is deleted).
- Remove `updatePreferencesFromAPI` from the import line (no longer called at signup).

## What Does Not Change

- All validation logic (email, password, username format/length, T&C checkbox) is unchanged.
- The T&C checkbox remains as a UX gate — `termsAcceptedAt` is set automatically by the trigger to the signup timestamp, so no separate API call is needed.
- Error handling: `signUp()` failure (including trigger failure from null username or duplicate) surfaces as a Supabase-level error and is caught by the existing error handler.
- The unverified-email path (no session returned) is unchanged.
- `updatePreferencesFromAPI` stays in `apiInteractions.ts` for use by the profile preferences screen.

## Decision: No Fallback `updatePreferencesFromAPI` Call

Approach B (calling `updatePreferencesFromAPI` after signup as a redundant write) was rejected. The DB trigger is authoritative and runs synchronously at signup time. A double-write adds latency and complexity with no benefit.
