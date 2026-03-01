# Bug: TypeScript Errors from Expo Router Typed Routes

## Description

`npx tsc --noEmit` reports errors wherever `router.push` is called with a template literal path like `` `/match/${match.id}` ``. Expo Router's strict typed routes system doesn't recognize these as valid routes.

## Errors

```
components/MatchList.tsx(126,62): error TS2345: Argument of type '`/match/${string}`' is not assignable to parameter of type 'RelativePathString | ExternalPathString | "/admin" | `/admin?${string}` | ...'

components/MyMatchHistory.tsx(112,44): error TS2345: Argument of type '`/match/${string}`' is not assignable to parameter of type 'RelativePathString | ExternalPathString | "/admin" | `/admin?${string}` | ...'
```

## Root Cause

Expo Router generates typed route definitions (likely in `.expo/types/`) based on the file-based routing structure. The route `app/match/[id].tsx` should produce a valid typed path pattern like `` `/match/${string}` ``, but the generated types don't match what `router.push()` expects when called with a template literal.

This likely means either:
1. The generated route types are stale and need to be regenerated
2. Expo Router's type generation doesn't produce a pattern that accepts `` `/match/${string}` `` — a cast to `any` or `as RelativePathString` may be needed

## Affected Files

- `components/MatchList.tsx:126` — `router.push(`/match/${match.id}`)`
- `components/MyMatchHistory.tsx:112` — same pattern (moved from `components/UserProfile.tsx:444` during issue #11 refactor)

## Possible Fix

1. Try regenerating typed routes: `npx expo customize tsconfig.json` or restart the dev server, which regenerates `.expo/types/`.
2. If the types still don't match, use Expo Router's `href` object form:
   ```ts
   router.push({ pathname: '/match/[id]', params: { id: match.id } })
   ```
   This is the type-safe way to navigate to dynamic routes and should satisfy the type checker.
