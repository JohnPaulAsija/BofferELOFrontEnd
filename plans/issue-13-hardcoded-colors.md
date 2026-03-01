# Plan: Issue 13 — Hardcoded Colors in `app/match/[id].tsx`

## Problem

`app/match/[id].tsx` hardcodes several hex values that bypass the theme system:

| Location | Hardcoded value | Used for |
|----------|----------------|----------|
| `statusConfig.confirmed.color` | `'#22c55e'` | confirmed status badge text/dot |
| `statusConfig.confirmed.bg` (dark) | `'#14532d33'` | confirmed badge background, dark mode |
| `statusConfig.confirmed.bg` (light) | `'#dcfce7'` | confirmed badge background, light mode |
| `statusConfig.pending.bg` (dark) | `'#78350f33'` | pending badge background, dark mode |
| `statusConfig.pending.bg` (light) | `'#fef3c7'` | pending badge background, light mode |
| `statusConfig.rejected.bg` (dark) | `'#7f1d1d33'` | rejected badge background, dark mode |
| `statusConfig.rejected.bg` (light) | `'#fee2e2'` | rejected badge background, light mode |
| `styles.playerRole.color` | `'#22c55e'` | "WINNER" label color |
| `styles.eloChangeBadge.color` | `'#22c55e'` | ELO change badge color |
| `styles.eloWinner.color` | `'#22c55e'` | winner ELO text color |

The pending and rejected bg values happen to match existing `brand.amberDark` and a red equivalent, but are still inlined rather than referenced from the theme.

**Note:** `app/record-match.tsx` also hardcodes `'#78350f33'`/`'#fef3c7'` and `'#7f1d1d33'`/`'#fee2e2'` in the same pattern. Fix those at the same time once the tokens exist.

---

## Approach

Extend the theme with three new color tokens, then replace every hardcoded value with a theme reference.

---

## Step 1: Extend `constants/theme.ts`

Add `green`, `greenDark`, and `redDark` to both color objects. Follow the same pattern already used by `amberDark` — in dark mode the token is the dark shade, in light mode it's the light tint:

**`BofferEloColorsDark.brand`** (add):
```ts
green:     '#22c55e',  // Green 500 — confirmed status foreground
greenDark: '#14532d',  // Green 900 — confirmed bg tint (dark mode)
redDark:   '#7f1d1d',  // Red 900   — rejected bg tint (dark mode)
```

**`BofferEloColorsLight.brand`** (add):
```ts
green:     '#22c55e',  // Green 500 — confirmed status foreground (same, sufficient contrast)
greenDark: '#dcfce7',  // Green 100 — confirmed bg tint (light mode)
redDark:   '#fee2e2',  // Red 100   — rejected bg tint (light mode)
```

---

## Step 2: Replace hardcoded values in `app/match/[id].tsx`

**`statusConfig` object:**
```ts
// before
confirmed: { label: 'Confirmed', color: '#22c55e', bg: isDark ? '#14532d33' : '#dcfce7' },
pending:   { label: 'Pending',   color: colors.brand.amber, bg: isDark ? '#78350f33' : '#fef3c7' },
rejected:  { label: 'Rejected',  color: colors.brand.red,   bg: isDark ? '#7f1d1d33' : '#fee2e2' },

// after
confirmed: { label: 'Confirmed', color: colors.brand.green, bg: isDark ? colors.brand.greenDark + '33' : colors.brand.greenDark },
pending:   { label: 'Pending',   color: colors.brand.amber, bg: isDark ? colors.brand.amberDark + '33' : colors.brand.amberDark },
rejected:  { label: 'Rejected',  color: colors.brand.red,   bg: isDark ? colors.brand.redDark  + '33' : colors.brand.redDark  },
```

**`styles` function** — three color replacements:
- `playerRole`: `color: '#22c55e'` → `color: colors.brand.green`
- `eloChangeBadge`: `color: '#22c55e'` → `color: colors.brand.green`
- `eloWinner`: `color: '#22c55e'` → `color: colors.brand.green`

**`app/record-match.tsx`** — two bg replacements in `StyleSheet`:
- `outcomeButtonActive.backgroundColor`: `isDark ? '#78350f33' : '#fef3c7'` → `isDark ? colors.brand.amberDark + '33' : colors.brand.amberDark`
- `outcomeButtonActiveLoss.backgroundColor`: `isDark ? '#7f1d1d33' : '#fee2e2'` → `isDark ? colors.brand.redDark + '33' : colors.brand.redDark`

---

## Files Touched

- `constants/theme.ts` — add `green`, `greenDark`, `redDark` to both dark and light color objects
- `app/match/[id].tsx` — replace 10 hardcoded color values
- `app/record-match.tsx` — replace 2 hardcoded bg values (same token family)
