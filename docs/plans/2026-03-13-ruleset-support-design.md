# Design: Add Ruleset (`ruleSetId`) Support

**Date:** 2026-03-13
**Status:** Approved

## Problem

The backend API now includes `ruleSetId` on all match responses and requires `rule_set_id` when reporting matches via `POST /matches`. The `GET /options` endpoint returns available rulesets. The frontend does not handle any of this — types are missing the field, the report-match flow doesn't send it, and no UI displays it.

## Goals

1. Update all match-related TypeScript types to include `ruleSetId`
2. Send `rule_set_id` when reporting matches
3. Add a ruleset picker to both the user and admin report-match flows
4. Display the ruleset name everywhere matches are shown
5. Resolve `ruleSetId` (UUID) to a human-readable name via a shared React Context
6. Allow users to filter match lists by ruleset

## Non-Goals

- Allowing users to set a "preferred ruleset" preference
- Admin CRUD for rulesets (managed server-side)

---

## Design

### Layer 1: Types

**`lib/types.ts`** — Add `ruleSetId: string | null` to these existing types:
- `Match`
- `MatchDetail`
- `PendingMatch`
- `UserMatch`

Add a new `RuleSet` type:
```ts
export interface RuleSet {
  id: string;
  name: string;
}
```

**`lib/apiInteractions.ts`** — these types are defined here, not in `types.ts`:
- Add `ruleSetId: string | null` to `ReportMatchResponse`
- Add `ruleSetId: string | null` to the `match` object shape inside `BatchMatchResultItem` (in `types.ts`)
- Move `OptionsResponse` to `lib/types.ts` for consistency with other shared types, and add `rule_sets: RuleSet[]` to it
- Update the re-export in `apiInteractions.ts` to include `OptionsResponse` and `RuleSet`

### Layer 2: API (`lib/apiInteractions.ts`)

Update `reportMatchFromAPI()`:
- Add `rule_set_id: string` as a required parameter
- Include `rule_set_id` in the POST body: `{ winner_id, loser_id, rule_set_id }`
- Add `422` to the error message map: `'Please select a ruleset.'` (API returns 422 for missing/invalid `rule_set_id`)

No other API function changes needed — the type updates handle deserialization.

### Layer 3: OptionsContext (`contexts/OptionsContext.tsx`)

Create a new React Context provider:
- Fetches `GET /options` via `getOptionsFromAPI()` on mount
- Exposes:
  - `options: OptionsResponse | null` — the full options response
  - `getRuleSetName(id: string | null): string` — resolves UUID to name, returns `"Unknown"` for null/missing IDs
  - `loading: boolean`
- Wrap the app in `<OptionsProvider>` in `app/_layout.tsx`

### Layer 4: Record Match (`app/record-match.tsx`)

- Consume `OptionsContext` to access `options.rule_sets`
- Add a dropdown picker after opponent selection, before the ELO preview section
- Selection is required — the submit button remains disabled until a ruleset is chosen
- If only one ruleset exists, auto-select it but still display it
- Pass the selected ruleset ID to `reportMatchFromAPI(jwt, winnerId, loserId, ruleSetId)`

### Layer 5: Admin Report Match (`components/AdminReportMatch.tsx`)

- Consume `OptionsContext` for rulesets
- Add the same dropdown picker as record-match
- Required before submission
- Pass `rule_set_id` to `reportMatchFromAPI()`

### Layer 6: Match Display

All display components consume `OptionsContext` via `getRuleSetName()`:

- **`MatchList.tsx`** — show ruleset name as a label on each match card
- **`PendingMatchList.tsx`** — show ruleset name alongside reporter info
- **`MyMatchHistory.tsx`** — show ruleset name on each match entry
- **`match/[id].tsx`** — show "Ruleset: {name}" in the metadata section

Styling should follow existing theme constants (`BofferEloColors`, `BofferEloStyles`).

### Layer 7: Ruleset Filtering

All three match list components gain a ruleset filter dropdown alongside the existing text search:

- **`MatchList.tsx`** — add a dropdown in the title/search row (next to the existing search input). Options: "All Rulesets" (default) plus one entry per ruleset from `OptionsContext`. When a ruleset is selected, the `filtered` array is additionally filtered by `match.ruleSetId === selectedRuleSetId`. The text search and ruleset filter compose together (both must match).

- **`PendingMatchList.tsx`** — same dropdown in the title/search row, between the search input and the confirm/reject buttons. Same filtering logic — composes with the existing text search.

- **`MyMatchHistory.tsx`** — add a dropdown below the tab bar, above the match entries. Filters both the confirmed and unconfirmed tabs independently (filter state resets when switching tabs, or persists — TBD, simplest is to persist).

**Filter behavior:**
- Default selection: "All Rulesets" (no filtering)
- Matches with `ruleSetId: null` (legacy) are included in "All Rulesets" but excluded when any specific ruleset is selected
- The dropdown uses the same styling as other inputs in the component (border, radius, colors from theme)
- Filter is client-side only — no API changes needed since all matches are already loaded

### Layer 8: Refactor Existing Options Consumers

Two files currently fetch `GET /options` independently via `getOptionsFromAPI()`. Refactor them to consume `OptionsContext` instead, eliminating duplicate fetches:

- **`components/ProfilePreferences.tsx`** — currently calls `getOptionsFromAPI()` on mount to populate gender/game/weapon/shield pickers. Replace with `useOptions()` from context. Remove the local `options` state and loading logic.

- **`app/register.tsx`** — currently calls `getOptionsFromAPI()` on mount for the same pickers during registration. Same refactor — consume context, remove local fetch.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/types.ts` | Add `ruleSetId` to match types, add `RuleSet`, move `OptionsResponse` here and add `rule_sets` |
| `lib/apiInteractions.ts` | Add `rule_set_id` param and 422 error to `reportMatchFromAPI()`, add `ruleSetId` to `ReportMatchResponse`, update `OptionsResponse` import |
| `contexts/OptionsContext.tsx` | **New file** — React Context for options/rulesets |
| `app/_layout.tsx` | Wrap app in `<OptionsProvider>` |
| `app/record-match.tsx` | Add ruleset picker, pass to API call |
| `components/AdminReportMatch.tsx` | Add ruleset picker, pass to API call |
| `components/MatchList.tsx` | Display ruleset name, add ruleset filter dropdown |
| `components/PendingMatchList.tsx` | Display ruleset name, add ruleset filter dropdown |
| `components/MyMatchHistory.tsx` | Display ruleset name, add ruleset filter dropdown |
| `app/match/[id].tsx` | Display ruleset name in metadata |
| `components/ProfilePreferences.tsx` | Replace local `getOptionsFromAPI()` fetch with `useOptions()` context |
| `app/register.tsx` | Replace local `getOptionsFromAPI()` fetch with `useOptions()` context |

## Risks

- **Options endpoint unavailable**: If `GET /options` fails, the ruleset picker will be empty and match reporting will be blocked. The context should handle loading/error states gracefully.
- **Null ruleSetId on old matches**: Matches created before this feature have `ruleSetId: null`. Display should handle this gracefully (e.g., show nothing or "N/A").
