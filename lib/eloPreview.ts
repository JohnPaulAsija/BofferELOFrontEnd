import { kFactor } from '../constants/elo';

export function calculateEloDelta(winnerElo: number, loserElo: number): number {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.max(1, Math.round(kFactor * (1 - expected)));
}
