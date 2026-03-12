# Fix: Low Contrast Label Text (text.tertiary)

## Issue

`colors.text.tertiary` is used as a readable label/header color throughout the app but its light mode value (`#94a3b8`, Slate 400) fails WCAG AA contrast against the light background (`#f8fafc`, Slate 50) at ~2.28:1 — well below the 4.5:1 minimum for normal text. The dark mode value (`#64748b`, Slate 500) also fails at ~4.05:1.

## Affected Uses

All of the following use `colors.text.tertiary` for readable structural text and share the same contrast failure:

- `components/Leaderboard.tsx` — 5 column header labels (11px bold)
- `components/MatchList.tsx` — 5 column headers + match row data (11px bold)
- `components/PendingMatchList.tsx` — 5 column headers + row data (11px bold)
- `components/ProfilePreferences.tsx` — field labels (13px bold)
- `components/UserProfile.tsx` — StatBox labels ("ELO", "WINS", etc., 11px bold)
- `app/register.tsx` — section titles
- `app/about.tsx` — version labels, footer
- `components/Auth.tsx` — "or" divider text
- `components/AdminReportMatch.tsx`, `app/record-match.tsx` — `placeholderTextColor` (WCAG 2.1 requires 4.5:1 for placeholders too)

## Fix

Update `text.tertiary` in `constants/theme.ts` for both themes:

| Theme | Current | Proposed | Ratio on bg | Result |
|-------|---------|----------|-------------|--------|
| Light (`BofferEloColorsLight`) | `#94a3b8` (Slate 400) | `#475569` (Slate 600) | ~7.2:1 | ✅ AAA |
| Dark (`BofferEloColorsDark`) | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | ~7.5:1 | ✅ AAA |

## Files Touched

- `constants/theme.ts` — update `text.tertiary` in `BofferEloColorsLight` and `BofferEloColorsDark`

## Notes

- Do not change any callsites — the token is correct, the value is wrong.
- All color values must come from `constants/theme.ts` — do not inline raw hex values.
