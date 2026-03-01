# Plan: Fix Loading State Not Reset on Email Verification Path

## Problem
In `app/register.tsx`, when a user signs up and Supabase requires email verification (no session returned), the `showInfo()` modal is displayed but `setLoading(false)` is never called before the early `return`. The `finally` block does run, but only after the `return` — however the real issue is the UX flow:

Looking more carefully at the code (lines 148-154):
```typescript
if (!session) {
  showInfo(
    "Verify Your Email",
    "Please check your inbox and verify your email address before signing in.",
    () => router.replace("/auth")
  );
  return;   // returns from the async function, finally block DOES run
}
```

The `finally` block at line 171-173 **does** execute after this return (that's how `try/finally` works), so `setLoading(false)` is called. However, there is a subtle timing issue: the `onAfterDismiss` callback navigates to `/auth` via `router.replace`, which unmounts the component. If the user dismisses the modal quickly, `setLoading(false)` may fire on an unmounted component.

The real fix needed is ensuring the flow is clean and doesn't depend on `finally` for the early-return path.

## Change

Move `setLoading(false)` to before the `showInfo` call on the early-return path, making the intent explicit rather than relying on `finally`:

**`app/register.tsx` lines 148-155:**
```typescript
// Before
if (!session) {
  showInfo(
    "Verify Your Email",
    "Please check your inbox and verify your email address before signing in.",
    () => router.replace("/auth")
  );
  return;
}

// After
if (!session) {
  setLoading(false);
  showInfo(
    "Verify Your Email",
    "Please check your inbox and verify your email address before signing in.",
    () => router.replace("/auth")
  );
  return;
}
```

The `finally` block still runs as a safety net, and calling `setLoading(false)` twice is harmless (same value).

## Files to Change
- Edit: `app/register.tsx` (add `setLoading(false)` before `showInfo` at line 148)
