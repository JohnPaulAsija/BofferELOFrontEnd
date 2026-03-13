# Ruleset (`ruleSetId`) Support — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `ruleSetId` support across the entire frontend — types, API calls, context, pickers, display, and filtering.

**Architecture:** A new `OptionsContext` provides the ruleset list (and all other options) app-wide. Match types gain `ruleSetId`. Report-match flows send `rule_set_id`. All match list components display and filter by ruleset. Existing options consumers (`register.tsx`, `ProfilePreferences.tsx`) are refactored to use the context.

**Tech Stack:** React Native / Expo, TypeScript, React Context API

**Design doc:** `docs/plans/2026-03-13-ruleset-support-design.md`

---

### Task 1: Update Types

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/apiInteractions.ts`

**Step 1: Add `RuleSet` type and `ruleSetId` to match types in `lib/types.ts`**

Add `RuleSet` interface after `LeaderboardEntry`, add `ruleSetId: string | null` to `Match`, `MatchDetail`, `PendingMatch`, `UserMatch`, and inside `BatchMatchResultItem.match`. Move `OptionsResponse` here from `apiInteractions.ts` and add `rule_sets`.

```ts
// After LeaderboardEntry (line 7)
export interface RuleSet {
  id: string;
  name: string;
}

// In Match — add after eloChange
ruleSetId: string | null;

// In MatchDetail — add after rejectedByName
ruleSetId: string | null;

// In UserMatch — add after reporterId
ruleSetId: string | null;

// In PendingMatch — add after confirmedAt
ruleSetId: string | null;

// In BatchMatchResultItem.match — add after eloChange
ruleSetId?: string | null;

// Move OptionsResponse here from apiInteractions.ts, updated:
export type OptionsResponse = {
  genders: string[];
  games: string[];
  weapons: string[];
  shields: string[];
  rule_sets: RuleSet[];
};
```

**Step 2: Update `lib/apiInteractions.ts`**

- Remove the local `OptionsResponse` type definition (lines 57-62)
- Add `OptionsResponse` and `RuleSet` to the import from `@/lib/types` (line 1)
- Add `OptionsResponse` and `RuleSet` to the re-export (line 3)
- Add `ruleSetId: string | null` to `ReportMatchResponse` (after `confirmedAt`)
- Update `reportMatchFromAPI` signature to accept `rule_set_id: string`
- Include `rule_set_id` in the POST body
- Add `422` to the error messages map: `'Please select a valid ruleset.'`

```ts
// Line 1 — update import
import { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet } from '@/lib/types';

// Line 3 — update re-export
export type { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet };

// Remove lines 57-62 (old OptionsResponse definition)

// In ReportMatchResponse — add after confirmedAt
ruleSetId: string | null;

// Update reportMatchFromAPI signature and body
export const reportMatchFromAPI = async (
  jwt: string,
  winner_id: string,
  loser_id: string,
  rule_set_id: string
): Promise<ReportMatchResponse> => {
  const response = await fetch(`${API_URL}/matches`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner_id, loser_id, rule_set_id }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      409: 'This match has already been reported.',
      422: 'Please select a valid ruleset.',
      429: "You've reported too many matches recently. Please wait before reporting another.",
      400: 'Invalid match data. Please check your selection and try again.',
    };
    throw new Error(messages[response.status] ?? 'Failed to report match. Please try again.');
  }
  const data = await response.json();
  return data.match as ReportMatchResponse;
};
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors (callers of `reportMatchFromAPI` will error — that's expected, we fix them in later tasks)

**Step 4: Commit**

```bash
git add lib/types.ts lib/apiInteractions.ts
git commit -m "feat: add ruleSetId to match types and reportMatchFromAPI"
```

---

### Task 2: Create OptionsContext

**Files:**
- Create: `contexts/OptionsContext.tsx`
- Modify: `app/_layout.tsx`

**Step 1: Create `contexts/OptionsContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getOptionsFromAPI, OptionsResponse } from '@/lib/apiInteractions';

type OptionsContextType = {
  options: OptionsResponse | null;
  loading: boolean;
  getRuleSetName: (id: string | null) => string;
};

const OptionsContext = createContext<OptionsContextType>({
  options: null,
  loading: true,
  getRuleSetName: () => 'Unknown',
});

export function OptionsProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOptionsFromAPI()
      .then((data) => { if (!cancelled) setOptions(data); })
      .catch((err) => { if (__DEV__) console.error('[OptionsProvider] Failed to load options:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const getRuleSetName = useCallback((id: string | null): string => {
    if (!id || !options) return 'Unknown';
    const found = options.rule_sets.find((rs) => rs.id === id);
    return found?.name ?? 'Unknown';
  }, [options]);

  return (
    <OptionsContext.Provider value={{ options, loading, getRuleSetName }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  return useContext(OptionsContext);
}
```

**Step 2: Wrap the app in `<OptionsProvider>` in `app/_layout.tsx`**

Add import at top:
```ts
import { OptionsProvider } from "@/contexts/OptionsContext";
```

Wrap inside `RootLayout` — add `<OptionsProvider>` inside `<AuthProvider>`:
```tsx
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OptionsProvider>
          <ErrorBoundary>
            <RootLayoutInner />
          </ErrorBoundary>
        </OptionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass (ignoring pre-existing `reportMatchFromAPI` caller errors)

**Step 4: Commit**

```bash
git add contexts/OptionsContext.tsx app/_layout.tsx
git commit -m "feat: add OptionsContext for app-wide options/ruleset access"
```

---

### Task 3: Add Ruleset Picker to Record Match

**Files:**
- Modify: `app/record-match.tsx`

**Step 1: Add ruleset picker and update API call**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Add state and context consumption inside `RecordMatchScreen`:
```ts
const { options } = useOptions();
const [selectedRuleSetId, setSelectedRuleSetId] = useState<string | null>(null);
```

Auto-select if only one ruleset:
```ts
useEffect(() => {
  if (options && options.rule_sets.length === 1) {
    setSelectedRuleSetId(options.rule_sets[0].id);
  }
}, [options]);
```

Update `canSubmit`:
```ts
const canSubmit = outcome !== null && selectedOpponent !== null && selectedRuleSetId !== null && !submitting;
```

Update `handleSubmit` to pass `selectedRuleSetId`:
```ts
const result = await reportMatchFromAPI(session.access_token, winnerId, loserId, selectedRuleSetId!);
```

Add the ruleset picker UI between the opponent section and the ELO preview. Place it after the closing `</>` of the opponent selector (line 220) and before the ELO preview block (line 223):

```tsx
{/* Ruleset picker */}
<Text style={s.sectionLabel}>Ruleset</Text>
{options && options.rule_sets.length > 0 ? (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
    {options.rule_sets.map((rs) => (
      <TouchableOpacity
        key={rs.id}
        style={[
          {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: selectedRuleSetId === rs.id ? colors.brand.amber : colors.border.primary,
            backgroundColor: selectedRuleSetId === rs.id
              ? (isDark ? colors.brand.amberDark + '33' : colors.brand.amberDark)
              : colors.background.secondary,
          },
        ]}
        onPress={() => setSelectedRuleSetId(rs.id)}
        activeOpacity={0.8}
      >
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: selectedRuleSetId === rs.id ? colors.text.primary : colors.text.secondary,
        }}>
          {rs.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
) : (
  <Text style={{ color: colors.text.tertiary, marginBottom: 28 }}>Loading rulesets...</Text>
)}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add app/record-match.tsx
git commit -m "feat: add ruleset picker to record-match screen"
```

---

### Task 4: Add Ruleset Picker to Admin Report Match

**Files:**
- Modify: `components/AdminReportMatch.tsx`

**Step 1: Add ruleset picker and update API call**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `AdminReportMatch`, add:
```ts
const { options } = useOptions();
const [selectedRuleSetId, setSelectedRuleSetId] = useState<string | null>(null);
```

Auto-select if only one ruleset:
```ts
useEffect(() => {
  if (options && options.rule_sets.length === 1) {
    setSelectedRuleSetId(options.rule_sets[0].id);
  }
}, [options]);
```

Add `useEffect` to imports (line 1):
```ts
import React, { useState, useEffect } from 'react';
```

Update `canSubmit`:
```ts
const canSubmit = selectedWinner !== null && selectedLoser !== null && selectedRuleSetId !== null && !submitting;
```

Update `handleSubmit`:
```ts
const result = await reportMatchFromAPI(jwt, selectedWinner.id, selectedLoser.id, selectedRuleSetId!);
```

Reset ruleset in `handleSuccessDismiss`:
```ts
setSelectedRuleSetId(options && options.rule_sets.length === 1 ? options.rule_sets[0].id : null);
```

Add ruleset picker UI after the Loser section and before the submit button (after line 174, before line 176):

```tsx
{/* Ruleset */}
<Text style={[s.label, { marginTop: 16 }]}>Ruleset</Text>
{options && options.rule_sets.length > 0 ? (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
    {options.rule_sets.map((rs) => (
      <TouchableOpacity
        key={rs.id}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: selectedRuleSetId === rs.id ? colors.brand.amber : colors.border.primary,
          backgroundColor: selectedRuleSetId === rs.id
            ? (isDark ? colors.brand.amberDark + '33' : colors.brand.amberDark)
            : colors.background.tertiary,
        }}
        onPress={() => setSelectedRuleSetId(rs.id)}
        activeOpacity={0.7}
      >
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: selectedRuleSetId === rs.id ? colors.text.primary : colors.text.secondary,
        }}>
          {rs.name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
) : (
  <Text style={{ color: colors.text.tertiary, fontSize: 13, marginBottom: 4 }}>Loading rulesets...</Text>
)}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add components/AdminReportMatch.tsx
git commit -m "feat: add ruleset picker to admin report match"
```

---

### Task 5: Display Ruleset in Match Detail Page

**Files:**
- Modify: `app/match/[id].tsx`

**Step 1: Add ruleset display to metadata section**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `MatchDetailScreen`, add:
```ts
const { getRuleSetName } = useOptions();
```

Add a ruleset `InfoRow` in the "Match Info" card, after the "Reported at" row (after line 166, before the `{status === 'confirmed'` block):

```tsx
{match.ruleSetId && (
  <>
    <View style={s.divider} />
    <InfoRow
      label="Ruleset"
      value={getRuleSetName(match.ruleSetId)}
      colors={colors}
      isDark={isDark}
    />
  </>
)}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add app/match/[id].tsx
git commit -m "feat: display ruleset name on match detail page"
```

---

### Task 6: Display Ruleset and Add Filter to MatchList

**Files:**
- Modify: `components/MatchList.tsx`

**Step 1: Add ruleset display and filter dropdown**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `MatchList`, add:
```ts
const { options, getRuleSetName } = useOptions();
const [ruleSetFilter, setRuleSetFilter] = useState<string | null>(null);
```

Update the `filtered` logic to compose text search with ruleset filter:
```ts
const filtered = matches.filter((m) => {
  if (searchable && search) {
    const q = search.toLowerCase();
    if (!m.winnerName.toLowerCase().includes(q) && !m.loserName.toLowerCase().includes(q)) {
      return false;
    }
  }
  if (ruleSetFilter && m.ruleSetId !== ruleSetFilter) {
    return false;
  }
  return true;
});
```

Add a ruleset filter dropdown in the title/search row, after the search `TextInput` (inside the header `View`, after the `{searchable && (...)}` block). Only show if there are rulesets available:

```tsx
{options && options.rule_sets.length > 1 && (
  <View style={{
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 6,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
  }}>
    <Pressable
      onPress={() => setRuleSetFilter(null)}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        backgroundColor: ruleSetFilter === null ? colors.brand.amber + '22' : 'transparent',
      }}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: ruleSetFilter === null ? '700' : '400',
        color: ruleSetFilter === null ? colors.brand.amber : colors.text.tertiary,
      }}>
        All
      </Text>
    </Pressable>
    {options.rule_sets.map((rs) => (
      <Pressable
        key={rs.id}
        onPress={() => setRuleSetFilter(rs.id)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 10,
          minHeight: 44,
          justifyContent: 'center',
          backgroundColor: ruleSetFilter === rs.id ? colors.brand.amber + '22' : 'transparent',
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: ruleSetFilter === rs.id ? '700' : '400',
          color: ruleSetFilter === rs.id ? colors.brand.amber : colors.text.tertiary,
        }}>
          {rs.name}
        </Text>
      </Pressable>
    ))}
  </View>
)}
```

Add ruleset name display on each match card. Inside the match `Pressable` render, add a small label after the existing row content. After the `WHEN` text (or after `eloChange` on compact), add below the main row:

```tsx
{match.ruleSetId && (
  <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2, textAlign: 'center' }}>
    {getRuleSetName(match.ruleSetId)}
  </Text>
)}
```

Add `Pressable` to imports (already imported via `react-native`).

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add components/MatchList.tsx
git commit -m "feat: display ruleset and add filter to MatchList"
```

---

### Task 7: Display Ruleset and Add Filter to PendingMatchList

**Files:**
- Modify: `components/PendingMatchList.tsx`

**Step 1: Add ruleset display and filter**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `PendingMatchList`, add:
```ts
const { options, getRuleSetName } = useOptions();
const [ruleSetFilter, setRuleSetFilter] = useState<string | null>(null);
```

Update the `filtered` logic:
```ts
const filtered = matches.filter((m) => {
  const q = search.toLowerCase();
  if (q && !m.winnerName.toLowerCase().includes(q) && !m.loserName.toLowerCase().includes(q) && !m.reporterName.toLowerCase().includes(q)) {
    return false;
  }
  if (ruleSetFilter && m.ruleSetId !== ruleSetFilter) {
    return false;
  }
  return true;
});
```

Add the same segmented filter buttons in the title/search row, between the search input and the confirm/reject buttons. Use the same pattern as Task 6 but inside the existing header row:

```tsx
{options && options.rule_sets.length > 1 && (
  <View style={{
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 6,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
  }}>
    <Pressable
      onPress={() => setRuleSetFilter(null)}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        backgroundColor: ruleSetFilter === null ? colors.brand.amber + '22' : 'transparent',
      }}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: ruleSetFilter === null ? '700' : '400',
        color: ruleSetFilter === null ? colors.brand.amber : colors.text.tertiary,
      }}>
        All
      </Text>
    </Pressable>
    {options.rule_sets.map((rs) => (
      <Pressable
        key={rs.id}
        onPress={() => setRuleSetFilter(rs.id)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 10,
          minHeight: 44,
          justifyContent: 'center',
          backgroundColor: ruleSetFilter === rs.id ? colors.brand.amber + '22' : 'transparent',
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: ruleSetFilter === rs.id ? '700' : '400',
          color: ruleSetFilter === rs.id ? colors.brand.amber : colors.text.tertiary,
        }}>
          {rs.name}
        </Text>
      </Pressable>
    ))}
  </View>
)}
```

Add ruleset name in each match card, after the "Reported by" text:
```tsx
<Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 4, paddingHorizontal: 4 }}>
  Reported by {match.reporterName}{match.ruleSetId ? ` · ${getRuleSetName(match.ruleSetId)}` : ''}
</Text>
```

This replaces the existing "Reported by" line (line 300-302).

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add components/PendingMatchList.tsx
git commit -m "feat: display ruleset and add filter to PendingMatchList"
```

---

### Task 8: Display Ruleset and Add Filter to MyMatchHistory

**Files:**
- Modify: `components/MyMatchHistory.tsx`

**Step 1: Add ruleset display and filter**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `MyMatchHistory`, add:
```ts
const { options, getRuleSetName } = useOptions();
const [ruleSetFilter, setRuleSetFilter] = useState<string | null>(null);
```

Add a filter bar between the tab bar and the tab content (after the tab bar `View` closing tag on line 162, before the tab content `View` on line 165):

```tsx
{/* Ruleset filter */}
{options && options.rule_sets.length > 1 && (
  <View style={{
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  }}>
    <Pressable
      onPress={() => setRuleSetFilter(null)}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: ruleSetFilter === null ? colors.brand.amber + '22' : 'transparent',
        borderWidth: 1,
        borderColor: ruleSetFilter === null ? colors.brand.amber : colors.border.primary,
      }}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: ruleSetFilter === null ? '700' : '400',
        color: ruleSetFilter === null ? colors.brand.amber : colors.text.tertiary,
      }}>
        All
      </Text>
    </Pressable>
    {options.rule_sets.map((rs) => (
      <Pressable
        key={rs.id}
        onPress={() => setRuleSetFilter(rs.id)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: ruleSetFilter === rs.id ? colors.brand.amber + '22' : 'transparent',
          borderWidth: 1,
          borderColor: ruleSetFilter === rs.id ? colors.brand.amber : colors.border.primary,
        }}
      >
        <Text style={{
          fontSize: 12,
          fontWeight: ruleSetFilter === rs.id ? '700' : '400',
          color: ruleSetFilter === rs.id ? colors.brand.amber : colors.text.tertiary,
        }}>
          {rs.name}
        </Text>
      </Pressable>
    ))}
  </View>
)}
```

Add `Pressable` to the imports from `react-native` (line 2 — it's not currently imported).

Filter the list before rendering. Update the rendering logic inside the tab content — wrap the list with filtering. In the section starting at line 171 (`const list: UserMatch[] = myMatches[activeTab];`), update to:

```ts
const list: UserMatch[] = myMatches[activeTab].filter((m) =>
  !ruleSetFilter || m.ruleSetId === ruleSetFilter
);
```

Add ruleset name in each match entry, after the opponent name text. Inside the match row, after the "vs {opponent}" text (line 225), add:

```tsx
{match.ruleSetId && (
  <Text style={{ fontSize: 11, color: colors.text.tertiary, marginLeft: 6 }}>
    {getRuleSetName(match.ruleSetId)}
  </Text>
)}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add components/MyMatchHistory.tsx
git commit -m "feat: display ruleset and add filter to MyMatchHistory"
```

---

### Task 9: Refactor ProfilePreferences to Use OptionsContext

**Files:**
- Modify: `components/ProfilePreferences.tsx`

**Step 1: Replace local options fetch with context**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `ProfilePreferences`, replace the local options state and fetch:

Remove:
```ts
const [options, setOptions] = useState<OptionsResponse | null>(null);
```
and the `useEffect` that fetches options (lines 97-105).

Replace with:
```ts
const { options } = useOptions();
```

Remove `OptionsResponse` from the import on line 3 (it's no longer needed locally):
```ts
import { updatePreferencesFromAPI, UserProfile } from '@/lib/apiInteractions';
```

Also remove `getOptionsFromAPI` from the import since it's no longer called here.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add components/ProfilePreferences.tsx
git commit -m "refactor: use OptionsContext in ProfilePreferences"
```

---

### Task 10: Refactor Register Screen to Use OptionsContext

**Files:**
- Modify: `app/register.tsx`

**Step 1: Replace local options fetch with context**

Add import:
```ts
import { useOptions } from '@/contexts/OptionsContext';
```

Inside `RegisterScreen`, replace the local options state and fetch:

Remove:
```ts
const [options, setOptions] = useState<OptionsResponse | null>(null);
```
and the `useEffect` that fetches options (lines 97-103).

Replace with:
```ts
const { options } = useOptions();
```

Update imports from `@/lib/apiInteractions` — remove `getOptionsFromAPI` and `OptionsResponse`:
```ts
import {
  setupUserFromAPI,
  updatePreferencesFromAPI,
} from "@/lib/apiInteractions";
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Pass

**Step 3: Commit**

```bash
git add app/register.tsx
git commit -m "refactor: use OptionsContext in register screen"
```

---

### Task 11: Final Verification

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Start dev server and smoke test**

Run: `npx expo start --web`
Expected: App loads without crashes. Verify:
- Home page loads leaderboard and recent matches
- Match cards show ruleset name (if data has ruleSetId)
- Filter buttons appear if multiple rulesets exist
- Record Match screen shows ruleset picker
- Admin page shows ruleset picker in report match
- Match detail page shows ruleset in metadata
- Register page still loads options for profile section
- Profile preferences edit still works

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "feat: complete ruleset support across frontend"
```
