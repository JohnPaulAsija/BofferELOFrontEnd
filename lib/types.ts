export type LeaderboardEntry = {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

export interface RuleSet {
  id: string;
  name: string;
}

export type Match = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  ruleSetId: string | null;
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
  ruleSetId: string | null;
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
  reporterId?: string;
  ruleSetId: string | null;
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
  ruleSetId: string | null;
};

export type BatchMatchResultItem = {
  match_id: string;
  status: 'confirmed' | 'rejected' | 'error';
  match?: {
    id: string;
    confirmedAt?: string;
    confirmedById?: string;
    confirmedByName?: string;
    rejectedAt?: string;
    rejectedById?: string;
    rejectedByName?: string;
    eloChange?: number;
    ruleSetId?: string | null;
  };
  error?: string;
};

export type BatchMatchResponse = {
  results: BatchMatchResultItem[];
  succeeded: number;
  failed: number;
};

export type OptionsResponse = {
  genders: string[];
  games: string[];
  weapons: string[];
  shields: string[];
  rule_sets: RuleSet[];
};
