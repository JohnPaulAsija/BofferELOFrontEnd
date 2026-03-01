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

export type MatchDetail = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  confirmedAt: string | null;
  confirmedById: string | null;
  confirmedByName: string | null;
  rejectedAt: string | null;
  rejectedById: string | null;
  rejectedByName: string | null;
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

export type UserMatch = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  confirmedAt: string | null;
  reportedAt?: string;
};

export type MyMatchesResponse = {
  confirmed: UserMatch[];
  unconfirmed: UserMatch[];
};

export type PendingMatch = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  confirmedAt: null;
};
