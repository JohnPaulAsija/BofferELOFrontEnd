# Plan: Issue 14 — Non-null Assertions in `app/match/[id].tsx`

## Problem

Two non-null assertions (`!`) are used in `app/match/[id].tsx`:

- **Line 173:** `match.confirmedByName!` — passed as `value` to `<InfoRow>`
- **Line 190:** `match.rejectedByName!` — passed as `value` to `<InfoRow>`

The `MatchDetail` type in `lib/types.ts` declares both as `string | null`, so TypeScript correctly flags them as potentially null. The assertions silence the compiler without providing a safe fallback, meaning if the backend ever returns a confirmed/rejected match without a name, the app would render `"null"` as a string or crash.

The assertions are already inside guards (`status === 'confirmed' && match.confirmedAt` and `status === 'rejected' && match.rejectedAt`), but TypeScript cannot infer that the presence of `confirmedAt` guarantees `confirmedByName` is non-null.

---

## Fix

Replace both `!` assertions with `?? 'Unknown'` fallbacks:

```tsx
// before (line 173)
value={match.confirmedByName!}

// after
value={match.confirmedByName ?? 'Unknown'}
```

```tsx
// before (line 190)
value={match.rejectedByName!}

// after
value={match.rejectedByName ?? 'Unknown'}
```

`'Unknown'` is the appropriate fallback — it's the same convention already used elsewhere in the app and communicates clearly to users when the data is missing.

---

## Files Touched

- `app/match/[id].tsx` — two one-word changes (lines 173 and 190)
