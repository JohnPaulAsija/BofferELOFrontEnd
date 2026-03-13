# Implementation Plan: Hamburger Menu for Mobile Header Navigation

## Overview

On compact viewports (`width < 600`), the `AppHeader` currently renders all nav buttons in a row, which overflows on small screens. The `Record Match` button is entirely hidden on native platforms via a `Platform.OS` guard. This plan replaces all per-button mobile visibility logic with a single hamburger button that opens a full-screen modal drawer containing all navigation actions, while keeping the desktop header completely unchanged.

---

## Problem Summary

1. All nav buttons are unconditionally rendered on `isCompact` viewports, causing overflow.
2. `Record Match` is hidden on `Platform.OS === 'ios' || 'android'` — a native-only guard that misses mobile web. The button must be accessible on all compact viewports and is the primary mobile use case.
3. The `Platform.OS` guard is semantically wrong for this feature: the correct split is screen width, not platform.

---

## Architecture Decision: React Native `Modal` Component

Use React Native's built-in `Modal` component (with `transparent={true}` and `animationType="slide"`) for the hamburger menu overlay. This is the same pattern already used by `confirm-modal.tsx` and `error-modal.tsx` in `components/ui/`. Reasons:

- Already proven in the codebase — no new dependencies.
- `transparent` backdrop allows a darkened overlay behind the menu panel.
- `animationType="slide"` from the bottom gives a native drawer feel.
- `onRequestClose` prop handles Android back button automatically.
- Works identically on iOS, Android, and web via React Native Web.
- Avoids complexity of `Animated` API for a simple show/hide.

Do NOT use a side-sliding animated `View` positioned with `position: absolute` — this would require manual animation logic, z-index management against the header's `zIndex: 50`, and manual backdrop handling. The `Modal` component handles all of this more reliably.

**Menu animation direction:** Slide up from the bottom. This matches mobile UX conventions (bottom sheets) and is more natural for thumb reach than a left/right drawer on a narrow screen.

---

## Files to Create

### 1. `components/HamburgerMenu.tsx` — New component

Self-contained component that renders the hamburger button and owns the open/close state of the modal. Takes no props — accesses all needed context internally via `useAuth()`, `useTheme()`, and `useRouter()`.

**Internal structure:**

```
HamburgerMenu
  ├── [state] isOpen: boolean
  ├── HamburgerButton (Pressable with "☰" icon, opens modal)
  └── Modal (transparent, animationType="slide", visible={isOpen})
        ├── Backdrop Pressable (full-screen, onPress closes menu)
        └── Menu Panel (View, slides up from bottom)
              ├── Header Row
              │     ├── "BofferElo" wordmark (non-tappable, decorative)
              │     └── Close Button (Pressable with "✕", closes modal)
              ├── Divider
              ├── Menu Items (vertical list of Pressable rows)
              │     ├── Record Match (always shown — primary action, styled as primary button)
              │     ├── My Profile (session only)
              │     ├── About (always)
              │     ├── [Divider]
              │     ├── Admin Panel (isSuperAdmin only)
              │     ├── [Divider]
              │     ├── Theme Toggle (always)
              │     └── Sign In / Sign Out (conditional on session)
              └── Bottom safe-area padding
```

**Menu item behavior:** Each menu item `Pressable` calls `router.push('/target')` (or the appropriate action for theme/signout), then immediately calls `setIsOpen(false)` to close the menu before navigation completes. This prevents the open menu from being visible during the screen transition.

**Menu panel dimensions:**
- Panel: `position: 'absolute', bottom: 0, left: 0, right: 0`
- `maxHeight`: 80% of screen height (`useWindowDimensions().height * 0.8`)
- `borderTopLeftRadius` and `borderTopRightRadius`: `BorderRadius.lg` (12) from theme
- Background: `colors.background.secondary` (matches the header's background)
- Top border: `colors.border.primary` (1px, top only) to visually separate from backdrop

**Backdrop:** `flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'`
The backdrop `Pressable` fills the screen. The menu panel must call `event.stopPropagation()` — or use the absorb-tap pattern from `confirm-modal.tsx` (`onPress={() => {}}` on inner card).

**Accessibility:**
- Hamburger button: `accessibilityLabel="Open navigation menu"`, `accessibilityRole="button"`
- Close button: `accessibilityLabel="Close navigation menu"`, `accessibilityRole="button"`
- Modal: `accessibilityViewIsModal={true}`
- Each menu item: explicit `accessibilityLabel` and `accessibilityRole="button"`

**Icons:** Use text-based characters consistent with existing icon components in `AppHeader.tsx`:
- Hamburger trigger: "☰" at `Typography.fontSize.xl` (20)
- Close button: "✕"

**Record Match styling:** Full-width primary button (`styles.primaryButton` colors, `colors.brand.red` background, white text, `Swords` icon). First item in the list, most prominent. This is the primary mobile use case.

**Theme toggle row:** Show `isDark ? '☀ Switch to Light' : '☾ Switch to Dark'`. Call `toggleTheme()` and leave the menu open — the visual feedback is immediate.

**Sign Out behavior:** `await signOut()` then `setIsOpen(false)` then navigate to `'/'`. Await before closing to ensure session is cleared.

**Logged-out state:** Show Record Match, About, Theme toggle, Sign In. Hide My Profile, Admin Panel, Sign Out.

**SuperAdmin items:** `Admin Panel` appears only when `isSuperAdmin === true`. Place it between a divider above theme/signout.

---

## Files to Modify

### 2. `components/AppHeader.tsx` — Modify existing

**Changes required:**

a. Add `useWindowDimensions` import from `react-native`.

b. Add `HamburgerMenu` import from `./HamburgerMenu`.

c. Derive `isCompact` at the top of the component:
   ```
   const { width } = useWindowDimensions();
   const isCompact = width < 600;
   ```

d. When `isCompact`: render only `<HamburgerMenu />` in place of the entire right section block (including Admin Panel button).
   When `!isCompact`: render existing markup unchanged.

e. Remove `Platform` import if no longer used directly in this file after removing the `Platform.OS` guard from Record Match.

**Resulting compact header layout:**
```
[Logo Section]          [HamburgerMenu ☰]
```
`headerInner` already uses `justifyContent: 'space-between'` — no layout changes needed.

---

## Styles (inside `HamburgerMenu.tsx`)

Use a local `StyleSheet.create({})`, referencing `Spacing`, `BorderRadius`, `Typography` from `constants/theme.ts`. Do not add to `BofferEloStyles` — this component is self-contained.

Key style objects:
- `hamburgerButton`: match header button look — `padding: Spacing.sm, borderRadius: BorderRadius.md`
- `backdrop`: `flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'`
- `menuPanel`: `position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, borderTopWidth: 1, paddingBottom: Spacing.xl`
- `menuHeader`: `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingBottom: Spacing.lg`
- `menuDivider`: `height: 1, marginHorizontal: Spacing.xl, marginVertical: Spacing.sm`
- `menuItem`: `flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, minHeight: 52`
- `menuItemPrimary`: extends `menuItem` with `backgroundColor: colors.brand.red, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.md, marginBottom: Spacing.sm`
- `menuItemText`: `fontSize: Typography.fontSize.md (16), fontWeight: Typography.fontWeight.medium`
- `menuItemTextPrimary`: `color: colors.text.white, fontWeight: Typography.fontWeight.semibold`

Dynamic color values must be applied inline: `style={[styles.staticStyle, { backgroundColor: colors.background.secondary }]}`

---

## Implementation Order

**Step 1: Create `components/HamburgerMenu.tsx`**
- Build modal open/close with backdrop + panel layout first, without menu items.
- Verify modal opens/closes and dark mode applies correctly.
- Add all menu items and their navigation/action handlers.
- Verify all items work: navigation, theme toggle, sign out, sign in, admin panel conditional.
- Verify accessibility labels on all interactive elements.

**Step 2: Modify `components/AppHeader.tsx`**
- Add `useWindowDimensions` and `isCompact` derivation.
- Add `HamburgerMenu` import.
- Gate right-section buttons on `!isCompact`.
- Gate Admin Panel button on `!isCompact`.
- Remove `Platform` import if no longer directly used.
- Test at viewport widths: 320, 375, 500 (hamburger) and 600, 768, 1024 (desktop header).

**Step 3: Verify the Record Match fix**
- Confirm Record Match appears in hamburger for `isCompact` viewports.
- Confirm old `Platform.OS` guard is removed.
- Manually test on iOS/Android simulator: open hamburger → tap Record Match → confirm navigation.

**Step 4: Edge case testing**
- Logged out: only Record Match, About, Theme, Sign In appear.
- Regular user: Record Match, My Profile, About, Theme, Sign Out appear; no Admin Panel.
- SuperAdmin: Admin Panel appears between dividers.
- Theme toggle: menu stays open after toggling.
- Sign out: menu closes, user lands on home.
- Back button (Android): `onRequestClose` closes menu.
- Backdrop tap: menu closes.
- Landscape rotation on narrow phone: `isCompact` re-evaluates reactively.
- Desktop width: hamburger never shown.
- Resize browser across 600px breakpoint: live transition works.

---

## Edge Cases and Potential Issues

**`zIndex` conflict:** React Native `Modal` renders in a separate host view layer above all app content. No z-index manipulation needed.

**iOS safe area / notch:** Use `Spacing.xl` (24) as fixed bottom padding in the menu panel to clear the home indicator. For production-grade handling, `useSafeAreaInsets()` from `react-native-safe-area-context` would be ideal but is out of scope.

**`useWindowDimensions` re-renders:** Intentional — header reactively switches layouts. Re-render is lightweight.

**Menu open during route change:** Acceptable edge case — explicit navigation via menu items closes the menu.

**`signOut` is async:** Always `await signOut()` before closing the menu.

**Press feedback:** Use `({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]` for standard items; `opacity: 0.85` for the primary Record Match button.

---

## What Does NOT Change

- `app/_layout.tsx` — no changes needed.
- All screen files (`app/*.tsx`) — content screens untouched.
- `constants/theme.ts` — no new theme entries needed.
- `contexts/AuthContext.tsx` and `contexts/ThemeContext.tsx` — no changes.
- Desktop header markup — `!isCompact` branch rendered verbatim as today.
- `BofferEloStyles.headerContainer` and `headerInner` — no layout changes.

---

## Critical Reference Files

- `components/AppHeader.tsx` — file to modify
- `components/ui/confirm-modal.tsx` — pattern to follow for Modal + backdrop + absorb-tap
- `constants/theme.ts` — source of all Spacing, BorderRadius, Typography, getThemeColors
- `contexts/AuthContext.tsx` — confirms `useAuth()` shape: `session`, `signOut`, `isSuperAdmin`
- `contexts/ThemeContext.tsx` — confirms `useTheme()` shape: `isDark`, `toggleTheme`
