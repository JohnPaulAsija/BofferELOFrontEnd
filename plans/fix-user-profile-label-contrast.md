# Fix: Low Contrast Label Text on User Profile Page

## Issue

The label text on the user profile page has insufficient contrast, making it difficult to read — particularly for users with visual impairments or in bright lighting conditions.

## Steps

1. Identify which color token is used for label text on the user profile page.
2. Compare the foreground/background contrast ratio against the WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).
3. Update the color value in `constants/theme.ts` or the relevant component to use a higher-contrast alternative.
4. Verify the fix across light and dark themes if applicable.

## Notes

- All color values must come from `constants/theme.ts` — do not inline raw hex values.
- Cross-check against the existing accessibility work in `plans/completed/issue-12-accessibility.md` for prior context.
