# Plan: Add useEffect Cleanup / AbortController on Async Fetches (Issue #6)

## Problem

Five components fire async API requests inside `useEffect` without cleanup. If the user navigates away before the request completes, `setState` is called on an unmounted component. While React no longer warns about this, it still causes unnecessary work and can produce stale-state bugs (e.g., setting data from a previous screen's request).

### Affected Files

| File | useEffect(s) | API call(s) |
|---|---|---|
| `components/Leaderboard.tsx` | 1 | `getLeaderboardFromAPI()` |
| `components/RecentMatches.tsx` | 1 | `getRecentMatchesFromAPI()` |
| `components/UserProfile.tsx` | 4 | `getUserProfileFromAPI`, `getOptionsFromAPI`, `getMyMatchesFromAPI`, `getUserMatchesFromAPI` |
| `app/record-match.tsx` | 1 | `getUsersListFromAPI()` |
| `app/match/[id].tsx` | 1 | `getMatchDetailFromAPI()` |

## Approach

Use a simple `isCancelled` boolean flag pattern in each `useEffect`. This is the lightest approach and doesn't require modifying the API layer. An `AbortController` would be ideal for actually cancelling in-flight requests, but the current API functions in `lib/apiInteractions.ts` use plain `fetch` without accepting a `signal` — retrofitting that is a larger change that can be done separately.

### Pattern

```tsx
useEffect(() => {
  let cancelled = false;

  someApiCall()
    .then((data) => {
      if (!cancelled) setData(data);
    })
    .catch((err) => {
      if (!cancelled) handleError(err);
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => { cancelled = true; };
}, [deps]);
```

### Steps

1. **`components/Leaderboard.tsx`** — Wrap the single `useEffect` with `cancelled` flag guarding `setLeaderboard` and `setLeaderboardLoading`.

2. **`components/RecentMatches.tsx`** — Same pattern guarding `setMatches` and `setLoading`.

3. **`components/UserProfile.tsx`** — Apply to all 4 `useEffect` blocks:
   - Profile fetch (line 141): guard `setProfile`, `setError`, `setLoading`
   - Options fetch (line 151): guard `setOptions`
   - My matches fetch (line 159): guard `setMyMatches`, `setMatchesLoading`
   - User matches fetch (line 169): guard `setUserMatches`, `setUserMatchesLoading`

4. **`app/record-match.tsx`** — Wrap the `useEffect` (line 45) guarding `setUsers`, `setErrorModal`, `setUsersLoading`.

5. **`app/match/[id].tsx`** — Wrap the `useEffect` (line 39) guarding `setMatch`, `setError`, `setLoading`.

## Files Changed

| File | Change |
|---|---|
| `components/Leaderboard.tsx` | Add `cancelled` flag + cleanup return |
| `components/RecentMatches.tsx` | Add `cancelled` flag + cleanup return |
| `components/UserProfile.tsx` | Add `cancelled` flag + cleanup return to 4 effects |
| `app/record-match.tsx` | Add `cancelled` flag + cleanup return |
| `app/match/[id].tsx` | Add `cancelled` flag + cleanup return |

## Risk

Low. This is a purely additive change — adding a guard that prevents stale `setState` calls. No logic or behavior changes for the happy path where the component stays mounted.

## Future Enhancement

A follow-up could pass `AbortController.signal` into `fetch` calls in `lib/apiInteractions.ts` to actually cancel the network request, not just ignore the result. That would be a separate plan touching the API layer.
