# ELO Preview Minimum Change Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the ELO preview always shows a minimum change of ±1, never 0.

**Architecture:** `calculateEloDelta` in `lib/eloPreview.ts` uses `Math.round`, which floors to 0 when the winner vastly outranks the loser (e.g., winner=1800 vs loser=1000 gives a raw delta of 0.396 → rounds to 0). The fix is a one-line change: wrap the result in `Math.max(1, ...)`. Tests are added using `jest-expo`, the standard test runner for Expo projects.

**Tech Stack:** TypeScript, Jest via `jest-expo`

---

### Task 1: Set up Jest

**Files:**
- Modify: `package.json`

**Background:** This project has no test infrastructure yet. `jest-expo` is the official preset for Expo projects — it handles transforms, module resolution, and React Native mocks automatically.

**Step 1: Install jest-expo**

```bash
npm install --save-dev jest-expo jest @types/jest
```

**Step 2: Add jest config to `package.json`**

In the `"scripts"` section, add:
```json
"test": "jest"
```

After the `"devDependencies"` closing brace (or as a top-level key alongside `"scripts"`), add:
```json
"jest": {
  "preset": "jest-expo",
  "testPathPattern": "lib/__tests__"
}
```

The full addition looks like this — it goes at the top level of `package.json`:
```json
"jest": {
  "preset": "jest-expo",
  "testPathPattern": "lib/__tests__"
}
```

**Step 3: Verify jest runs (no tests yet)**

```bash
npm test -- --passWithNoTests
```

Expected: exits 0, prints "No tests found" or similar.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jest-expo test infrastructure"
```

---

### Task 2: Write the failing test

**Files:**
- Create: `lib/__tests__/eloPreview.test.ts`

**Background:** When the winner is 800+ ELO points above the loser, the raw ELO delta (`kFactor * (1 - expected)`) drops below 0.5, causing `Math.round` to produce 0. With kFactor=40, this happens at a ~759 point gap (e.g., winner=1800 vs loser=1000: delta = 40 × 0.0099 ≈ 0.396 → rounds to 0).

**Step 1: Create the test file**

```typescript
// lib/__tests__/eloPreview.test.ts
import { calculateEloDelta } from '../eloPreview';

describe('calculateEloDelta', () => {
  it('returns the expected delta for equally-rated players', () => {
    // Equal ELO → expected = 0.5 → delta = kFactor * 0.5 = 20
    expect(calculateEloDelta(1000, 1000)).toBe(20);
  });

  it('returns a larger delta when the winner is the underdog', () => {
    // Underdog winner → delta > 20
    expect(calculateEloDelta(1000, 1500)).toBeGreaterThan(20);
  });

  it('returns a smaller delta when the winner is heavily favored', () => {
    // Heavy favorite winner → delta < 20, but still >= 1
    expect(calculateEloDelta(1500, 1000)).toBeLessThan(20);
    expect(calculateEloDelta(1500, 1000)).toBeGreaterThanOrEqual(1);
  });

  it('returns at least 1 even when the winner vastly outranks the loser', () => {
    // winner=1800, loser=1000: raw delta ≈ 0.396 → currently rounds to 0
    expect(calculateEloDelta(1800, 1000)).toBeGreaterThanOrEqual(1);
  });

  it('returns at least 1 for extreme ELO gaps', () => {
    expect(calculateEloDelta(3000, 100)).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — the last two tests fail with `Expected: >= 1, Received: 0`.

**Step 3: Commit the failing tests**

```bash
git add lib/__tests__/eloPreview.test.ts
git commit -m "test: add failing tests for ELO minimum-change floor"
```

---

### Task 3: Implement the fix

**Files:**
- Modify: `lib/eloPreview.ts`

**Current code (`lib/eloPreview.ts`):**
```typescript
import { kFactor } from '../constants/elo';

export function calculateEloDelta(winnerElo: number, loserElo: number): number {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(kFactor * (1 - expected));
}
```

**Step 1: Apply the fix**

Change the return statement to floor at 1:
```typescript
import { kFactor } from '../constants/elo';

export function calculateEloDelta(winnerElo: number, loserElo: number): number {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.max(1, Math.round(kFactor * (1 - expected)));
}
```

**Step 2: Run tests to verify they pass**

```bash
npm test
```

Expected: All 5 tests PASS.

**Step 3: Commit**

```bash
git add lib/eloPreview.ts
git commit -m "fix: floor ELO preview delta at 1 to prevent showing 0 change"
```

---

## Notes

- `calculateEloDelta` returns the **magnitude** of the delta. The sign is applied by the caller in `app/record-match.tsx` line 88: `* (outcome === 'win' ? 1 : -1)`. The `Math.max(1, ...)` only affects the magnitude, so losses correctly become `-1` at minimum.
- The UI at `app/record-match.tsx:231` displays `eloPreview` with a `+` prefix for positive values. No UI changes are needed.
- No backend changes are needed — this only affects the client-side preview estimate.
