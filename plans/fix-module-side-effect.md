# Plan: Fix Module-Level Side Effect in Auth.tsx (Issue #5)

## Problem

`components/Auth.tsx` lines 11-17 register an `AppState.addEventListener` at **module load time** (outside any component or hook). This causes:

1. The listener is **never cleaned up** — it persists for the app's lifetime even if the Auth component is never rendered.
2. If the module is re-evaluated (e.g., Fast Refresh during development), **duplicate listeners accumulate**, calling `startAutoRefresh`/`stopAutoRefresh` multiple times per state change.

```ts
// Current — runs at import time
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

## Approach

The auto-refresh logic is **not specific to the Auth screen** — it should run whenever the app is active, regardless of which screen is mounted. The correct home for this is the root layout (`app/_layout.tsx`), wrapped in a `useEffect` with cleanup.

### Steps

1. **Remove** lines 11-17 from `components/Auth.tsx` (the `AppState.addEventListener` block) and remove the `AppState` import if no longer needed.

2. **Add a `useEffect`** in `RootLayoutInner` (`app/_layout.tsx`) that:
   - Subscribes to `AppState.addEventListener('change', handler)`
   - Calls `startAutoRefresh()` when state becomes `"active"`
   - Calls `stopAutoRefresh()` when state becomes inactive
   - Returns a cleanup function that removes the listener via the subscription object

```tsx
// In RootLayoutInner
useEffect(() => {
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
  return () => subscription.remove();
}, []);
```

3. Add necessary imports to `_layout.tsx`: `AppState` from `react-native`, `useEffect` from `react`, `supabase` from `@/lib/supabase`.

## Files Changed

| File | Change |
|---|---|
| `components/Auth.tsx` | Remove lines 11-17 and unused `AppState` import |
| `app/_layout.tsx` | Add `useEffect` with `AppState` listener + cleanup in `RootLayoutInner` |

## Risk

Low. This is a straightforward relocation of existing logic into the proper lifecycle. No behavior change — the auto-refresh toggle works exactly the same, just with proper cleanup and no duplication.
