# Plan: Bottom Tab Navigator for Mobile

## Context

BofferElo currently renders a single global `AppHeader` above a `Stack` navigator in `app/_layout.tsx`. All navigation is header-based. On mobile devices (native and mobile web) this is inadequate: the header is crowded, and key actions like Record Match and My Profile are either hidden or buried.

This plan introduces a three-tab bottom navigation bar that appears exclusively on compact viewports (`width < 600`), matching the existing `isCompact` pattern already used in `Leaderboard` and `MatchList`. On wider viewports the current header layout is preserved unchanged.

---

## Design Decisions Summary

1. Three bottom tabs on compact: **Home** (⚔️), **Record Match** (➕), **My Profile** (👤).
2. Bottom tab bar shown only when `isCompact`. On `!isCompact`, no tab bar appears.
3. On `isCompact`, the `AppHeader` slims to Logo + hamburger only.
4. Hamburger menu contains: About, Theme Toggle, Sign Out/Sign In, Admin Panel (superAdmin only).
5. Record Match tab is always visible on mobile regardless of auth state; unauthenticated users are redirected to `/auth` on tap.
6. My Profile tab when unauthenticated shows a prompt to sign in rather than navigating to a user profile URL.
7. The three tab screens are Home, RecordMatch, and Profile. All other routes remain Stack screens.
8. Content screens (the actual page JSX) are untouched — only navigation chrome changes.

---

## Routing Architecture

### Current structure (flat Stack)

```
app/
  _layout.tsx            ← Stack root; renders AppHeader above Stack
  index.tsx              ← Home
  record-match.tsx       ← Record Match
  user/[id].tsx          ← User Profile (dynamic)
  admin.tsx
  about.tsx
  auth.tsx
  match/[id].tsx
  forgot-password.tsx
  reset-password.tsx
  register.tsx
```

### Target structure

```
app/
  _layout.tsx                    ← Stack root; passes isCompact to AppHeader
  (tabs)/
    _layout.tsx                  ← Tabs layout with conditional tab bar
    index.tsx                    ← Home tab (moves from app/index.tsx)
    record-match.tsx             ← Record Match tab (moves from app/record-match.tsx)
    profile.tsx                  ← My Profile tab (new thin wrapper)
  user/[id].tsx                  ← Remains as Stack screen (used for other-user profiles and deep links)
  admin.tsx
  about.tsx
  auth.tsx
  match/[id].tsx
  forgot-password.tsx
  reset-password.tsx
  register.tsx
```

### Key routing decisions

- `app/index.tsx` moves to `app/(tabs)/index.tsx`. Expo Router maps the root `/` to `(tabs)/index` automatically when `(tabs)` is a group — no redirect needed.
- `app/record-match.tsx` moves to `app/(tabs)/record-match.tsx`. The `/record-match` URL is preserved.
- `app/(tabs)/profile.tsx` is a new file. On compact it is the My Profile tab. It renders the user's own profile by reading `session.user.id` from `useAuth()`. When not logged in it renders a sign-in prompt.
- `app/user/[id].tsx` stays as a Stack screen. When users tap another player's name anywhere in the app, they navigate to `/user/[id]` as before, which pushes onto the Stack above the tabs.
- The Stack screen named `(tabs)` already exists in `_layout.tsx` at line 57. No new Stack.Screen entry is needed for the group.

---

## Implementation Steps

### Step 1 — Create `hooks/useIsCompact.ts`

Trivial custom hook to avoid duplicating the breakpoint logic across files:

```typescript
import { useWindowDimensions } from 'react-native';
export function useIsCompact(): boolean {
  const { width } = useWindowDimensions();
  return width < 600;
}
```

Use this in `AppHeader`, `app/(tabs)/_layout.tsx`, and each tab screen's scroll padding. The existing usages in `Leaderboard` and `MatchList` can be migrated in a follow-up — do not change them in this PR to keep the diff focused.

### Step 2 — Move content screens into `(tabs)/`

Create the `(tabs)` directory. Move:

- `app/index.tsx` → `app/(tabs)/index.tsx` (no content changes)
- `app/record-match.tsx` → `app/(tabs)/record-match.tsx` (no content changes yet)

Verify all `@/` alias imports inside these files remain valid — the `@` alias points to the repo root, not to `app/`, so imports are unaffected by the move.

Remove the now-redundant `Stack.Screen` entry from `app/_layout.tsx`:
- Remove `<Stack.Screen name="record-match" .../>` (now under `(tabs)`)
- The `(tabs)` Stack.Screen entry at line 57 already covers the group

### Step 3 — Create `app/(tabs)/_layout.tsx`

This is the critical file. It conditionally shows or hides the tab bar based on `isCompact`.

```
function TabsLayout() {
  const isCompact = useIsCompact();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isCompact
          ? {
              backgroundColor: colors.background.secondary,
              borderTopColor: colors.border.primary,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 4,
            }
          : { display: 'none' },
        tabBarActiveTintColor: colors.brand.amber,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚔️</Text> }}
      />
      <Tabs.Screen
        name="record-match"
        options={{ title: 'Record', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'My Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      />
    </Tabs>
  );
}
```

`tabBarStyle: { display: 'none' }` is the recommended approach for conditionally hiding the tab bar without changing the routing structure. On `!isCompact`, the tab bar is invisible and all three routes remain accessible — the desktop header handles navigation as before.

### Step 4 — Create `app/(tabs)/profile.tsx`

A thin wrapper for the My Profile tab.

- If `session` is null: render a centered "Sign in to view your profile" prompt with a button calling `router.push('/auth')`. Style with `BofferEloStyles.stackContent`, amber button, and theme colors.
- If `session` is present: render `UserProfileComponent` passing `userId={session.user.id}` and `isOwnProfile={true}`, wrapped in a `ScrollView` identical to the existing `app/user/[id].tsx` pattern.
- Do NOT use `router.replace('/user/...')` — keep the user on the profile tab so the tab bar stays visible. Other users' profiles continue to navigate to `/user/[id]` as Stack screens.

### Step 5 — Refactor `AppHeader.tsx` for compact mode

Add `isCompact` detection (via `useIsCompact()` hook):

On `isCompact`, render:
- Logo section (unchanged)
- Hamburger button on the far right (replaces the entire `headerRight` section and the standalone Admin Panel button)

On `!isCompact`, render the current full header unchanged. Replace the `Platform.OS !== 'ios' && Platform.OS !== 'android'` guard on the Record Match button with `!isCompact`.

**Hamburger button:** `Pressable` with "☰" text icon (consistent with existing emoji icon pattern), styled as `BofferEloStyles.iconButton`. Controls `menuOpen` state.

**Hamburger menu items (in order):**
1. Theme toggle: "☀ Light" / "☾ Dark" — calls `toggleTheme()`, menu stays open
2. About: navigates to `/about`, closes menu
3. Admin Panel: shown only when `isSuperAdmin` — navigates to `/admin`, closes menu
4. Sign Out (when `session` is set): `await signOut()`, close menu
5. Sign In (when `session` is null): navigates to `/auth`, closes menu

**Menu implementation:** Use React Native `Modal` with `transparent={true}` and `animationType="fade"`. A full-screen transparent `Pressable` behind the menu acts as a dismiss backdrop. The menu panel is positioned top-right, below the header. Add a `useEffect` that closes `menuOpen` when `isCompact` changes to `false`.

**Menu panel styles:**
- `position: 'absolute'`, `top: ~70` (approximate header height), `right: Spacing.lg`
- `backgroundColor: colors.background.secondary`
- `borderWidth: 1, borderColor: colors.border.primary`
- `borderRadius: BorderRadius.lg`
- `minWidth: 180`
- Shadow via `Shadows.xl`

Each menu item: `Pressable` with `paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md`, border separator between items.

### Step 6 — Fix bottom padding for tab bar clearance

The bottom tab bar is 60px tall. Scrollable content on tab screens must not be obscured. Do not add hardcoded `paddingBottom` to `BofferEloStyles.stackContent` (would affect desktop). Instead, in each tab screen's `ScrollView contentContainerStyle`:

- `app/(tabs)/index.tsx`: change `paddingBottom: 32` → `paddingBottom: isCompact ? 76 : 32`
- `app/(tabs)/record-match.tsx`: make bottom padding dynamic
- `app/(tabs)/profile.tsx`: set from the start

Non-tab Stack screens (`about.tsx`, `admin.tsx`, `user/[id].tsx`, `match/[id].tsx`) do not need changes — they have no tab bar.

---

## File Change Summary

| File | Action | Notes |
|------|--------|-------|
| `app/(tabs)/index.tsx` | Move from `app/index.tsx` | Add `isCompact` bottom padding |
| `app/(tabs)/record-match.tsx` | Move from `app/record-match.tsx` | Add `isCompact` bottom padding |
| `app/(tabs)/profile.tsx` | Create new | My Profile tab screen |
| `app/(tabs)/_layout.tsx` | Create new | Tabs layout, conditional tab bar |
| `app/_layout.tsx` | Modify | Remove `record-match` Stack.Screen entry |
| `components/AppHeader.tsx` | Modify | Add `isCompact` + hamburger for secondary nav |
| `hooks/useIsCompact.ts` | Create new | Shared `width < 600` hook |

Total new files: 3 (`(tabs)/_layout.tsx`, `(tabs)/profile.tsx`, `hooks/useIsCompact.ts`)
Total moved files: 2 (`index.tsx`, `record-match.tsx`)
Total modified files: 2 (`_layout.tsx`, `AppHeader.tsx`)

---

## Edge Cases

### Deep links on mobile

Deep links like `/record-match` or `/` resolve to the tab screens correctly — Expo Router maps URLs to file paths and the `(tabs)` group is transparent in the URL. A deep link to `/user/abc123` correctly opens the Stack screen, pushing above the tabs.

### Back navigation from Stack screens on mobile

When navigating from a tab to a Stack screen (e.g., tapping a player name opens `/user/[id]`), the Stack provides a back gesture/button. The bottom tab bar is NOT shown on Stack screens (only within the `(tabs)` group) — correct behavior.

### Auth state changes while on a tab

If the user signs out while on My Profile, `session` becomes `null` and `profile.tsx` reactively renders the sign-in prompt — no redirect needed. If the user signs out while on Record Match, the existing `useEffect` auth guard already handles it.

### Tab bar and safe area on iPhone

React Navigation's `Tabs` handles bottom safe area automatically when `react-native-safe-area-context` is installed (included via Expo). If `paddingBottom: 8` causes issues, adjust to `paddingBottom: Platform.OS === 'ios' ? 0 : 8` and let React Navigation handle the iPhone bottom inset.

### Hamburger menu position (iOS safe area)

The hamburger dropdown's `top` offset should account for the iOS safe area. Alternatively, use a `Modal` component which renders over safe areas naturally — recommended approach.

### Viewport resize (web mobile browser)

`isCompact` is derived from `useWindowDimensions()` (reactive), so the tab bar and hamburger appear/disappear automatically as the window is resized across 600px. The `useEffect` in `AppHeader` closes `menuOpen` when switching to desktop layout.

### Tab persistence

Expo Router's `Tabs` keeps each tab screen mounted when switching tabs. Record Match state (selected opponent, outcome) persists across tab switches — acceptable. Reset-on-tab-press behavior can be added in a future iteration.

### Admin Panel on mobile

Admin Panel link in the hamburger menu only appears for `isSuperAdmin`. The `/admin` route pushes as a Stack screen above the tabs with a back button. No changes to `admin.tsx` needed.

---

## Recommended Implementation Order

1. Create `hooks/useIsCompact.ts` — trivial, unblocks everything.
2. Move `app/index.tsx` → `app/(tabs)/index.tsx` and `app/record-match.tsx` → `app/(tabs)/record-match.tsx`. Verify app still boots and routes work.
3. Create `app/(tabs)/_layout.tsx` with conditional `tabBarStyle`. Add a placeholder for `profile` tab.
4. Create `app/(tabs)/profile.tsx` as the full implementation.
5. Update `app/_layout.tsx` to remove the redundant `record-match` Stack.Screen.
6. Update `AppHeader.tsx` — add `isCompact` detection, slim header on compact, hamburger with modal menu.
7. Fix scroll padding in the three tab screens for bottom tab bar clearance.
8. Test: native iOS/Android via Expo Go, web at narrow width, web at wide width, sign-in/sign-out flows, deep links.

---

## Critical Reference Files

- `app/_layout.tsx` — Root Stack config; needs `record-match` entry removed; confirms `(tabs)` entry exists
- `components/AppHeader.tsx` — Core component requiring isCompact/hamburger refactor
- `constants/theme.ts` — Source of all color tokens, spacing, and shadow values for tab bar and hamburger
- `app/user/[id].tsx` — Pattern to follow for `app/(tabs)/profile.tsx` (UserProfileComponent usage and ScrollView structure)
- `app/record-match.tsx` — Moves into tabs group; auth redirect logic must remain functional
- `components/ui/confirm-modal.tsx` — Pattern for Modal + backdrop + absorb-tap implementation
