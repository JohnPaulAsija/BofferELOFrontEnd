# Plan: Decompose UserProfile Component (Issue #11)

## Problem

`components/UserProfile.tsx` (510 lines) has **14 `useState` hooks**, **4 `useEffect` blocks**, and **3 handler functions** inside a single component. It manages four distinct concerns simultaneously:

1. **Profile data fetching** — load user profile, handle loading/error states
2. **Preferences editing** — toggle edit mode, manage 4 draft fields, fetch options list, save via API
3. **Own-profile match history** — fetch authenticated user's matches, tabbed confirmed/pending UI
4. **Other-user match history** — fetch public match history, render via `MatchList`

This makes the component hard to reason about, test in isolation, and modify without risk of side effects.

## Current State Inventory

### useState hooks (14)
| Hook | Concern |
|---|---|
| `profile` | Profile fetch |
| `loading` | Profile fetch |
| `error` | Profile fetch |
| `isEditing` | Preferences edit |
| `saving` | Preferences edit |
| `options` | Preferences edit |
| `draftGender` | Preferences edit |
| `draftGame` | Preferences edit |
| `draftWeapon` | Preferences edit |
| `draftShield` | Preferences edit |
| `modal` | Preferences edit (error modal) |
| `myMatches` | Own match history |
| `matchesLoading` | Own match history |
| `activeTab` | Own match history |
| `userMatches` | Other-user match history |
| `userMatchesLoading` | Other-user match history |

### useEffect blocks (4)
1. **Line 141** — Fetch profile by `userId`
2. **Line 151** — Fetch options (if own profile)
3. **Line 159** — Fetch own matches (if own profile + session)
4. **Line 169** — Fetch other-user matches (if not own profile)

### Handler functions (3)
- `openEdit()` — populate draft fields from profile
- `cancelEdit()` — reset editing state
- `saveEdit()` — POST preferences to API, update local profile state

## Approach: Extract Two Subcomponents

Extract the two heaviest concerns into standalone components. The parent retains only profile fetching and the top-level layout.

### New Component 1: `ProfilePreferences`

**File:** `components/ProfilePreferences.tsx`

**Owns:**
- `isEditing`, `saving`, `options`, `draftGender`, `draftGame`, `draftWeapon`, `draftShield`, `modal` (8 useState hooks)
- 1 useEffect (fetch options)
- `openEdit()`, `cancelEdit()`, `saveEdit()` handlers

**Props:**
```ts
type ProfilePreferencesProps = {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
};
```

- `profile` — read-only view of the current profile (for displaying preference values and populating draft fields)
- `isOwnProfile` — controls whether the Edit button appears
- `onProfileUpdate` — callback so the parent can update its `profile` state after a successful save (keeps profile as single source of truth in the parent)

**Contains:**
- The `ChipPicker` helper (move from parent — it's only used here)
- The `InfoRow` helper (move from parent — only used here for preference display)
- The "PREFERENCES" section header with Edit button
- The edit form (ChipPicker grid + Save/Cancel buttons)
- The read-only preference rows
- The `ErrorModal` for save failures

**Gets session from `useAuth()` directly** (already a context — no need to prop-drill).

### New Component 2: `MyMatchHistory`

**File:** `components/MyMatchHistory.tsx`

**Owns:**
- `myMatches`, `matchesLoading`, `activeTab` (3 useState hooks)
- 1 useEffect (fetch own matches)

**Props:**
```ts
type MyMatchHistoryProps = {
  userId: string;
};
```

**Gets session from `useAuth()` directly.**

**Contains:**
- The tabbed card UI (confirmed/pending tabs)
- The match row rendering with win/loss badge, opponent, ELO change, timestamp
- The `timeAgo` utility (already duplicated in `MatchList.tsx` — see cleanup note below)

### What Stays in `UserProfileComponent`

After extraction, the parent component retains:

**State (3 useState + 2 context hooks):**
- `profile`, `loading`, `error`
- `userMatches`, `userMatchesLoading`

**Effects (2 useEffect):**
- Fetch profile by `userId`
- Fetch other-user matches (if not own profile)

**Render structure:**
```tsx
<>
  {/* Header: username */}
  {/* Stat boxes row */}
  <ProfilePreferences profile={profile} isOwnProfile={isOwnProfile} onProfileUpdate={...} />

  {/* Other user: public match history via MatchList */}
  {!isOwnProfile && <MatchList ... matches={userMatches} ... />}

  {/* Own profile: tabbed match history */}
  {isOwnProfile && <MyMatchHistory userId={userId} />}
</>
```

The `StatBox` helper stays in `UserProfile.tsx` since it's only used in the stats row rendered by the parent.

## Step-by-Step Implementation

### Step 1: Create `components/ProfilePreferences.tsx`

1. Create the file with the `ProfilePreferencesProps` type.
2. Move `ChipPicker` and `InfoRow` helper components from `UserProfile.tsx` into this file.
3. Move the 8 useState hooks (`isEditing`, `saving`, `options`, `draftGender`, `draftGame`, `draftWeapon`, `draftShield`, `modal`).
4. Move the options-fetching useEffect.
5. Move `openEdit()`, `cancelEdit()`, `saveEdit()` — adapt `saveEdit` to call `onProfileUpdate` instead of `setProfile` directly.
6. Move the JSX for the preferences section (lines 277-360 of current file) and the `ErrorModal` for save failures.

### Step 2: Create `components/MyMatchHistory.tsx`

1. Create the file with the `MyMatchHistoryProps` type.
2. Move `timeAgo` into this file (it's a local copy; `MatchList.tsx` has its own).
3. Move the 3 useState hooks (`myMatches`, `matchesLoading`, `activeTab`).
4. Move the my-matches-fetching useEffect.
5. Move the tabbed match history JSX (lines 376-506 of current file).

### Step 3: Simplify `UserProfileComponent`

1. Remove all moved state, effects, handlers, and helper components.
2. Import `ProfilePreferences` and `MyMatchHistory`.
3. Wire up `onProfileUpdate` callback:
   ```ts
   const handleProfileUpdate = (updates: Partial<UserProfile>) => {
     setProfile((prev) => prev ? { ...prev, ...updates } : prev);
   };
   ```
4. Replace the preferences JSX block with `<ProfilePreferences>`.
5. Replace the own-profile match history block with `<MyMatchHistory>`.
6. Verify the other-user `<MatchList>` usage is unchanged.

### Step 4: Verify `app/user/[id].tsx` is unchanged

The route file imports and renders `<UserProfileComponent userId={id} isOwnProfile={isOwnProfile} />` — its interface doesn't change.

## Result

### Before
| Metric | `UserProfileComponent` |
|---|---|
| useState hooks | 14 |
| useEffect blocks | 4 |
| Handler functions | 3 |
| Helper components | 4 (StatBox, InfoRow, ChipPicker, timeAgo) |
| Lines | ~510 |

### After
| Metric | `UserProfileComponent` | `ProfilePreferences` | `MyMatchHistory` |
|---|---|---|---|
| useState hooks | 5 | 8 | 3 |
| useEffect blocks | 2 | 1 | 1 |
| Handler functions | 1 (handleProfileUpdate) | 3 | 0 |
| Helper components | 1 (StatBox) | 2 (ChipPicker, InfoRow) | 1 (timeAgo) |
| Lines (est.) | ~130 | ~200 | ~160 |

Each component now has a **single clear responsibility** and can be understood, modified, and tested independently.

## Files Changed

| File | Change |
|---|---|
| `components/ProfilePreferences.tsx` | **New** — preferences display + edit form |
| `components/MyMatchHistory.tsx` | **New** — tabbed own-profile match history |
| `components/UserProfile.tsx` | **Simplified** — remove moved code, import new components |

## Risk

Low-medium. This is a structural refactor with no behavior changes. The main risk is wiring the `onProfileUpdate` callback incorrectly, causing the profile card to not reflect saved preferences. Manual testing of the edit-save flow on own profile is the key verification step.

## Out of Scope

- **Extracting `timeAgo` to a shared utility** — it's duplicated in `MatchList.tsx` and `MyMatchHistory.tsx`. Worth doing but separate from this refactor.
- **Consolidating with `useReducer`** — after extraction, no single component has enough interrelated state to justify `useReducer`. The 4 draft fields in `ProfilePreferences` are the closest candidate but they're independent and simple.
- **Extracting `StatBox` to its own file** — it's small and only used by the parent. Not worth a separate file.
