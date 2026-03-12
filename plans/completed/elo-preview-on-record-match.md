# Plan: ELO Preview on Record Match Page (Option 3)

## Goal

Show the projected ELO change to the user on the record-match screen after they have selected both an outcome and an opponent, before they hit Submit.

## Assumptions / Prerequisites

- The backend's K-factor is known and stable. It is defined in `constants/elo.ts` as `kFactor`.
- `getUserProfileFromAPI` (`GET /users/{userId}`) is public — no JWT required. This is already the case in the codebase (`lib/apiInteractions.ts:113`).
- The logged-in user's current ELO is not yet available in the record-match screen. It must be fetched.

---

## ELO Formula

Standard ELO formula using a configurable K-factor:

```
E_winner = 1 / (1 + 10 ^ ((loser_elo - winner_elo) / 400))
delta     = round(K * (1 - E_winner))
```

- Winner gains `+delta`
- Loser loses `-delta`

This will be implemented in a small utility function.

---

## Changes Required

### 1. New utility: `lib/eloPreview.ts`

Create a pure function that takes both players' ELOs and returns the projected delta. Import `kFactor` from `constants/elo.ts`.

```typescript
import { kFactor } from '../constants/elo';

export function calculateEloDelta(winnerElo: number, loserElo: number): number {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(kFactor * (1 - expected));
}
```

---

### 3. `lib/apiInteractions.ts`

No new endpoints needed. The existing `getUserProfileFromAPI(userId)` already returns `UserProfile` which includes `elo`. No changes required to this file.

---

### 4. `app/record-match.tsx`

#### New state

```typescript
const [myElo, setMyElo] = useState<number | null>(null);
const [opponentElo, setOpponentElo] = useState<number | null>(null);
const [eloLoading, setEloLoading] = useState(false);
```

#### Fetch current user's ELO

In the existing `useEffect` (after auth check), alongside the user list fetch, also fetch the logged-in user's profile:

```typescript
getUserProfileFromAPI(session.user.id).then(p => setMyElo(p.elo));
```

These two fetches can run in parallel with `Promise.all` or just independently.

#### Fetch opponent's ELO on selection

When `selectedOpponent` changes to a non-null value, fetch their profile:

```typescript
useEffect(() => {
  if (!selectedOpponent) {
    setOpponentElo(null);
    return;
  }
  setEloLoading(true);
  getUserProfileFromAPI(selectedOpponent.id)
    .then(p => setOpponentElo(p.elo))
    .catch(() => setOpponentElo(null))
    .finally(() => setEloLoading(false));
}, [selectedOpponent]);
```

#### Derive preview values

Compute inline from state — no extra state needed:

```typescript
const eloPreview: number | null =
  outcome !== null && myElo !== null && opponentElo !== null
    ? calculateEloDelta(
        outcome === 'win' ? myElo : opponentElo,
        outcome === 'win' ? opponentElo : myElo
      ) * (outcome === 'win' ? 1 : -1)
    : null;
```

`eloPreview` is positive for a win, negative for a loss.

#### UI: ELO preview banner

Render between the opponent selector and the submit button. Only shown when `eloPreview !== null`:

```
┌─────────────────────────────────────────┐
│  Projected ELO change                   │
│  +12  (1000 → 1012)                     │  ← win example
└─────────────────────────────────────────┘
```

- Color: amber for positive delta, red for negative
- Show a small spinner (`eloLoading`) while the opponent profile is being fetched
- Include a note: "Estimate only — actual change calculated at submission"

---

## Data Flow Summary

```
page load
  ├── getUsersListFromAPI(jwt)      → users list
  └── getUserProfileFromAPI(myId)  → myElo

opponent selected
  └── getUserProfileFromAPI(opponentId) → opponentElo

outcome + opponent both set
  └── calculateEloDelta(winnerElo, loserElo) → eloPreview (displayed inline)

submit
  └── reportMatchFromAPI(jwt, winnerId, loserId) → actual elo_change (success modal)
```

---

## Files Changed

| File | Change |
|------|--------|
| `constants/elo.ts` | Add `export` to `kFactor` declaration |
| `lib/eloPreview.ts` | New — ELO delta utility function (imports `kFactor`) |
| `app/record-match.tsx` | Fetch both ELOs, compute preview, render banner |

No backend changes required.

---

## Risks / Notes

- If the backend uses a different K-factor than what's in `constants/elo.ts`, the preview will be slightly off. The disclaimer note in the UI covers this.
- The opponent profile fetch adds a small network round-trip on selection. It uses the public `GET /users/{id}` endpoint so no JWT is required and it should be fast.
- If the opponent profile fetch fails, `eloPreview` stays `null` and no banner is shown — a safe fallback.
