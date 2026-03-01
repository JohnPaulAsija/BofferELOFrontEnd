# Plan: Issue 9 — Guard Console Logging in Production

## Problem

Every function in `lib/apiInteractions.ts` calls `console.error(...)` unconditionally. In production web builds these messages appear in browser devtools, exposing API endpoint structure and internal error details.

There are 11 `console.error` calls in the file, one per API function.

## Approach

Wrap each `console.error` call in a `__DEV__` guard. Expo and React Native define `__DEV__` as a global boolean — `true` in development (Metro bundler) and `false` in production builds. The bundler statically eliminates the dead branch in production, so there is zero runtime cost.

This is the idiomatic React Native solution and requires no new utilities or dependencies.

## Change

### `lib/apiInteractions.ts`

Replace every bare `console.error(...)` call:

```ts
// before
console.error('[getFooFromAPI] Request failed:', err.message);

// after
if (__DEV__) console.error('[getFooFromAPI] Request failed:', err.message);
```

Apply to all 11 occurrences:
- `getLeaderboardFromAPI` (line 19)
- `getRecentMatchesFromAPI` (line 30)
- `getMeFromAPI` (line 50)
- `getOptionsFromAPI` (line 67)
- `setupUserFromAPI` (line 83)
- `updatePreferencesFromAPI` (line 100)
- `getUserMatchesFromAPI` (line 112)
- `getMyMatchesFromAPI` (line 124)
- `getUserProfileFromAPI` (line 134)
- `getUsersListFromAPI` (line 152)
- `getMatchDetailFromAPI` (line 172)
- `reportMatchFromAPI` (line 192)

**Note:** If issue 8 is implemented first, `setupUserFromAPI`, `updatePreferencesFromAPI`, and `reportMatchFromAPI` will have their `console.error` calls removed as part of that cleanup. Apply this plan to whatever remains.

## Files Touched

- `lib/apiInteractions.ts` only
