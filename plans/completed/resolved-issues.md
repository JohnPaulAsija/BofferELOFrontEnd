# Resolved Issues from Code Review

Issues below have been fixed and removed from `plans/code-review.md`.

---

### 1. `.env` committed to git (was Critical)
**Resolution:** The `.env` was already in `.gitignore` and not tracked by git. Added `.env.example` with placeholder values for developer onboarding. Added HTTPS validation at runtime in both `lib/supabase.ts` and `lib/apiInteractions.ts`.

### 3. Account enumeration via error messages (was Critical)
**Resolution:** Replaced raw Supabase error messages with generic alternatives:
- `components/Auth.tsx` — now shows "Invalid email or password. Please try again."
- `app/register.tsx` — now shows "Unable to create account. The email may already be in use, or the password does not meet requirements."

### 4. Loading state not reset on early return (was Critical)
**Resolution:** Added explicit `setLoading(false)` in `app/register.tsx` before `showInfo()` on the email-verification early-return path, so the submit button re-enables immediately.

### 16. No HTTPS enforcement at runtime (was Low)
**Resolution:** Added `startsWith('https://')` checks in both `lib/supabase.ts` and `lib/apiInteractions.ts`. App now throws at startup if env vars use HTTP.

### 10. `catch (err: any)` in `app/register.tsx` (partial — was Medium)
**Resolution:** Changed `catch (err: any)` to `catch (err: unknown)` with proper `instanceof Error` narrowing in `app/register.tsx:169`. Other instances in `AppHeader.tsx`, `record-match.tsx`, and `UserProfile.tsx` remain unfixed.

### 7. No Error Boundary (was Medium)
**Resolution:** Created `components/ErrorBoundary.tsx` (class-based) and wrapped `<RootLayoutInner />` in `app/_layout.tsx`. Unhandled render exceptions now show a recovery screen with a "Try Again" button instead of a white screen crash.

### 11. `UserProfile` component is overloaded (was Medium)
**Resolution:** Decomposed `UserProfile.tsx` (510 lines, 14 useState hooks) into three focused components: `UserProfile.tsx` (profile fetch + layout), `ProfilePreferences.tsx` (preferences display/edit), and `MyMatchHistory.tsx` (tabbed match history). Each component now has a single responsibility. The `catch (err: any)` at the old line 210 was also eliminated in the process (issue 10 partial).

### 5. Module-level side effect in `components/Auth.tsx` (was Medium)
**Resolution:** `AppState.addEventListener` was removed entirely from `Auth.tsx`. The component is now a clean React function component with no module-level side effects, listeners, or global subscriptions.

### 6. No `useEffect` cleanup on async fetches (was Medium)
**Resolution:** All five affected components now use a `cancelled` boolean flag with a cleanup return in `useEffect`. State setters are guarded by `if (!cancelled)`, preventing `setState` calls on unmounted components. Fixed in:
- `components/Leaderboard.tsx`
- `components/RecentMatches.tsx`
- `components/UserProfile.tsx`
- `app/record-match.tsx`
- `app/match/[id].tsx`
