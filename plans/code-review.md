# Code Review — BofferElo React Native / Expo App

## Critical / High Severity

### 2. Missing input validation on registration (`app/register.tsx`)
- **No email format validation** — only checks if non-empty
- **No password strength requirements** — no minimum length, no complexity
- **Insufficient username validation** — only checks length >= 3, no character restrictions

---

## Medium Severity

### 5. Module-level side effect in `components/Auth.tsx`
The `AppState.addEventListener` call at lines 11-17 runs at **module load time**, not inside a component. This means:
- The listener is never cleaned up
- It accumulates duplicate listeners if the module is re-evaluated
- Should be moved into a `useEffect` with a cleanup return

### 6. No `useEffect` cleanup / AbortController on async fetches
Five+ components fire async requests in `useEffect` without cleanup. If the user navigates away mid-request, `setState` is called on an unmounted component. Affected files:
- `components/Leaderboard.tsx`
- `components/RecentMatches.tsx`
- `components/UserProfile.tsx`
- `app/record-match.tsx`
- `app/match/[id].tsx`

**Note:** The React Compiler (enabled in `app.json`) may mitigate some re-render issues, but it does not handle async cleanup.

### 7. No Error Boundary
No `ErrorBoundary` component exists. An unhandled exception in any component will crash the entire app with a white screen. Wrap `<RootLayoutInner />` in `app/_layout.tsx` with one.

### 8. Backend error messages displayed directly to users
`lib/apiInteractions.ts` throws errors with raw backend `detail` messages, and screens like `register.tsx` and `record-match.tsx` display them verbatim. This leaks implementation details. Map API errors to user-friendly messages.

### 9. Console logging in production
Every function in `lib/apiInteractions.ts` has `console.error(...)` calls that will run in production builds, leaking API structure info in browser devtools (web target).

### 10. `any` type usage despite `strict: true` in tsconfig
Several places use `: any` defeating TypeScript's safety:
- `components/AppHeader.tsx` — icon component props (`{ style }: any`)
- `app/record-match.tsx:76` — `catch (err: any)`
- `components/UserProfile.tsx:210` — `catch (err: any)`

Replace with `unknown` and narrow via `err instanceof Error`. (`app/register.tsx:169` was already fixed.)

### 11. `UserProfile` component is overloaded
`components/UserProfile.tsx` has 12+ `useState` hooks and 4+ `useEffect` blocks. This is a sign it should be decomposed into smaller components (e.g., `ProfileEditForm`, `MatchHistory`) or consolidated with `useReducer`.

---

## Low Severity

### 12. Accessibility gaps
- Emoji icons in `AppHeader.tsx` (sword, login/logout arrows) lack `accessibilityLabel`
- `TextInput` heights of 32pt in `Leaderboard.tsx` and `MatchList.tsx` are below the 44pt minimum touch target guideline

### 13. Hardcoded colors bypassing theme
`app/match/[id].tsx:74` has hardcoded `#22c55e`, `#14532d33`, `#dcfce7`, etc. instead of using `BofferEloColors` from the theme system.

### 14. Non-null assertion instead of safe fallback
`app/match/[id].tsx:169` uses `match.confirmedByName!` — should be `match.confirmedByName ?? 'Unknown'`.

### 15. Inconsistent error modal state shape
`app/register.tsx` uses `{ variant, onAfterDismiss }` in its modal state while `components/UserProfile.tsx` uses a simpler shape. A shared `useErrorModal` hook would standardize this.

---

## What's Done Well

- Supabase auth configuration is solid — `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, proper session cleanup in `AuthContext`
- Role-based access control is correctly implemented with safe fallback to non-admin on errors
- Theme system is well-structured with proper dark/light mode support
- TypeScript strict mode is enabled, path aliases are clean
- React Compiler experiment is enabled for automatic memoization
- File-based routing with Expo Router is used correctly
- API interaction layer is cleanly separated in `lib/apiInteractions.ts`
