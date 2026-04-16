# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BofferElo is a React Native / Expo app for tracking ELO ratings in boffer combat (LARP-style foam weapon fighting). It communicates with a separate FastAPI backend and uses Supabase for authentication and session storage.

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (scan QR with Expo Go, or press w/a/i for web/android/ios)
npm run android      # Start with Android emulator
npm run ios          # Start with iOS simulator
npm run web          # Start web version
npm run lint         # Run ESLint via expo lint
npm test             # Run Jest test suite
```

## Architecture

### Routing
Uses **Expo Router** (file-based routing). All screens live in `app/`. The root layout (`app/_layout.tsx`) defines a Stack navigator with two routes:
- `(tabs)` — main tab group (not yet built)
- `auth` — the sign-in/sign-up screen

### Authentication
- Supabase auth is initialized in `lib/supabase.ts` using environment variables `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Session is persisted via `expo-sqlite/localStorage` (not AsyncStorage)
- `components/Auth.tsx` handles sign-in and sign-up with email/password
- `app/auth.tsx` is the route that renders the Auth component

### Backend API
The app talks to a separate FastAPI backend (default: `http://127.0.0.1:8000`). The base URL is stored in `API_URL` in `.env` but is currently hardcoded in `lib/apiInteractions.ts`. All authenticated calls must send a Supabase JWT as `Authorization: Bearer <jwt>`.

**Role system** (`role_id` in profiles table):
- `1` = user — can only report/confirm matches they participate in
- `2` = admin — can report/confirm any match
- `3` = superAdmin — full access including admin endpoints

**Key API patterns:**
- `GET /users/top` — leaderboard (public, cached 60s)
- `GET /matches` — recent confirmed matches (public, cached 60s)
- `POST /matches` — report a match (authenticated; rate-limited for users)
- `POST /matches/{id}/confirm` — confirm a pending match (the reporting user cannot confirm their own report)
- Full API reference: `Documentation/FRONTEND_API.md`

### Theming
All colors, spacing, typography, border radii, shadows, and pre-built StyleSheet styles are exported from `constants/theme.ts`. Use `BofferEloColors` for colors and `BofferEloStyles` for common component styles. Do not inline raw hex values or magic numbers — reference the theme constants.

### Testing
- Jest with the `jest-expo` preset; component tests use `@testing-library/react-native` (v13+ built-in matchers — do not add `@testing-library/jest-native`, it's deprecated)
- Test files: `**/__tests__/**/*.test.{ts,tsx,js}` colocated with the code they cover (e.g. `components/__tests__/themed-text.test.tsx`)
- Components that consume context should be rendered via a `renderWithProviders` helper — see `components/__tests__/themed-text.test.tsx` for the pattern
- Mock Supabase and the backend API (`jest.mock('@/lib/supabase', ...)`); don't make real network calls from tests

### Environment Variables
All Expo public env vars must be prefixed with `EXPO_PUBLIC_` to be accessible in the app bundle. The `.env` file at the project root is the source of truth.

### Plans
Implementation plans live in the top-level `plans/` folder. Completed plans are moved to `plans/completed/`.

### Git
Do not run any git commands. The user handles all git operations (commits, staging, branching, etc.).

### Platform-specific behavior
The app targets iOS, Android, and web. Use `Platform.OS` checks where behavior must differ (e.g., header safe-area padding for iOS is already handled in `BofferEloStyles.headerInner`). The "Record Match" button in the header is hidden on mobile (`Platform.OS !== 'ios' && Platform.OS !== 'android'`).
