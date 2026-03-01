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
