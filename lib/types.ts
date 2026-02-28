export type LeaderboardEntry = {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

export type Match = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  confirmedAt: string;
};

export type UserProfile = {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  gender: string | null;
  preferredGame: string | null;
  preferredWeapon: string | null;
  preferredShield: string | null;
};
