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

## Non-Goals

- Adding ruleset filtering or sorting to match lists
- Allowing users to set a "preferred ruleset" preference
- Admin CRUD for rulesets (managed server-side)

---

## Design

### Layer 1: Types (`lib/types.ts`)

Add `ruleSetId: string | null` to these existing types:
- `Match`
- `MatchDetail`
- `PendingMatch`
- `UserMatch`
- `ReportMatchResponse`
- The `match` object shape inside `BatchMatchResultItem`

Add a new `RuleSet` type:
```ts
export interface RuleSet {
  id: string;
  name: string;
}
```

Update `OptionsResponse` to include:
```ts
rule_sets: RuleSet[];
```

### Layer 2: API (`lib/apiInteractions.ts`)

Update `reportMatchFromAPI()`:
- Add `rule_set_id: string` as a required parameter
- Include `rule_set_id` in the POST body: `{ winner_id, loser_id, rule_set_id }`

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

---

## Files Changed

| File | Change |
|------|--------|
| `lib/types.ts` | Add `ruleSetId` to match types, add `RuleSet`, update `OptionsResponse` |
| `lib/apiInteractions.ts` | Add `rule_set_id` param to `reportMatchFromAPI()` |
| `contexts/OptionsContext.tsx` | **New file** — React Context for options/rulesets |
| `app/_layout.tsx` | Wrap app in `<OptionsProvider>` |
| `app/record-match.tsx` | Add ruleset picker, pass to API call |
| `components/AdminReportMatch.tsx` | Add ruleset picker, pass to API call |
| `components/MatchList.tsx` | Display ruleset name |
| `components/PendingMatchList.tsx` | Display ruleset name |
| `components/MyMatchHistory.tsx` | Display ruleset name |
| `app/match/[id].tsx` | Display ruleset name in metadata |

## Risks

- **Options endpoint unavailable**: If `GET /options` fails, the ruleset picker will be empty and match reporting will be blocked. The context should handle loading/error states gracefully.
- **Null ruleSetId on old matches**: Matches created before this feature have `ruleSetId: null`. Display should handle this gracefully (e.g., show nothing or "N/A").
