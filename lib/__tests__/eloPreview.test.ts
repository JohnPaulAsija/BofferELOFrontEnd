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
