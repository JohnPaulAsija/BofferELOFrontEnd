# Plan: Issue 12 — Accessibility Gaps

## Problem

Two categories of accessibility issues:

1. **Missing `accessibilityLabel` on icon-only buttons** — The `Sword`, `Swords`, `LogIn`, and `LogOut` emoji components in `AppHeader.tsx` have no text alternative. Screen readers encounter them inside `Pressable` elements that also lack `accessibilityLabel`, so they announce nothing meaningful.

2. **`TextInput` touch targets below 44pt minimum** — The search inputs in `Leaderboard.tsx` (line 63) and `MatchList.tsx` (line 81) have `height: 32`, which is below Apple's and Google's recommended 44pt minimum touch target size.

---

## Fix 1: `accessibilityLabel` on header buttons (`components/AppHeader.tsx`)

Add `accessibilityLabel` and `accessibilityRole="button"` to the five `Pressable` elements in `AppHeader` that currently have no text label:

| Pressable | `accessibilityLabel` |
|-----------|---------------------|
| Logo (navigate home) | `"BofferElo — go to home"` |
| Record Match | `"Record a match"` |
| My Profile | `"My profile"` |
| Theme toggle (dark) | `"Switch to light mode"` |
| Theme toggle (light) | `"Switch to dark mode"` |
| Sign Out | `"Sign out"` |
| Sign In | `"Sign in"` |

The theme toggle label is dynamic — use a ternary: `isDark ? 'Switch to light mode' : 'Switch to dark mode'`.

The icon sub-components (`Sword`, `Swords`, `LogIn`, `LogOut`) render `<Text>` with emoji. Add `accessibilityElementsHidden={true}` (iOS) / `importantForAccessibility="no"` (Android) to hide them from the accessibility tree since the parent `Pressable` carries the label. The cross-platform way is to set `accessible={false}` on each icon `<Text>`.

---

## Fix 2: Touch target height in search inputs

### `components/Leaderboard.tsx` (line 63)
### `components/MatchList.tsx` (line 81)

Both inputs use `height: 32`. Change to `height: 44` (the platform minimum). The visual size of the input will grow slightly; verify it still fits within the title row layout. If the row looks cramped at 44pt, use `minHeight: 44` so the input expands to meet the target without forcing a fixed height that breaks layout.

---

## Files Touched

- `components/AppHeader.tsx` — add `accessibilityLabel` / `accessibilityRole` to Pressables; add `accessible={false}` to icon Text elements
- `components/Leaderboard.tsx` — change search input height to 44
- `components/MatchList.tsx` — change search input height to 44
