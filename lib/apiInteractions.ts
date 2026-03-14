import { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet } from '@/lib/types';

export type { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet };

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL environment variable. Please add it to your .env file.');
}

if (!API_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS');
}

export const getLeaderboardFromAPI = async (): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`${API_URL}/users/top`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getLeaderboardFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.leaderboard as LeaderboardEntry[];
};

export const getRecentMatchesFromAPI = async (): Promise<Match[]> => {
  const response = await fetch(`${API_URL}/matches`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getRecentMatchesFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.matches as Match[];
};

export type MeResponse = {
  id: string;
  email: string;
  username: string;
  role_id: number;
};

export const getMeFromAPI = async (jwt: string): Promise<MeResponse> => {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getMeFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.user as MeResponse;
};

export const getOptionsFromAPI = async (): Promise<OptionsResponse> => {
  const response = await fetch(`${API_URL}/options`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getOptionsFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};

export const updatePreferencesFromAPI = async (
  jwt: string,
  prefs: { gender: string | null; preferred_game: string | null; preferred_weapon: string | null; preferred_shield: string | null }
): Promise<void> => {
  const response = await fetch(`${API_URL}/users/me/preferences`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Invalid preference value. Please check your selections.',
    };
    throw new Error(messages[response.status] ?? 'Failed to save preferences. Please try again.');
  }
};

export const getUserMatchesFromAPI = async (
  userId: string,
  limit = 100
): Promise<{ matches: Match[]; next_cursor: string | null }> => {
  const response = await fetch(`${API_URL}/users/${userId}/matches?limit=${limit}`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getUserMatchesFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};

export const getMyMatchesFromAPI = async (jwt: string): Promise<MyMatchesResponse> => {
  const response = await fetch(`${API_URL}/users/me/matches`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getMyMatchesFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};

export const getUserProfileFromAPI = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/users/${userId}`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getUserProfileFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.user as UserProfile;
};

export type UserListEntry = {
  id: string;
  username: string;
};

export const getUsersListFromAPI = async (jwt: string): Promise<UserListEntry[]> => {
  const response = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getUsersListFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.users as UserListEntry[];
};

export const adminChangeUsernameFromAPI = async (
  jwt: string,
  userId: string,
  username: string
): Promise<{ username: string }> => {
  const response = await fetch(`${API_URL}/users/${userId}/username`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      403: 'Insufficient permissions',
      404: 'User not found',
      409: 'Username already taken',
      422: 'Invalid username',
    };
    throw new Error(messages[response.status] ?? 'Failed to change username.');
  }
  const data = await response.json();
  return data.user;
};

export const adminChangeEmailFromAPI = async (
  jwt: string,
  userId: string,
  email: string
): Promise<{ email: string }> => {
  const response = await fetch(`${API_URL}/users/${userId}/email`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      403: 'Insufficient permissions',
      404: 'User not found',
      422: 'Invalid email address',
    };
    throw new Error(messages[response.status] ?? 'Failed to change email.');
  }
  const data = await response.json();
  return data.user;
};

export const adminDeleteUserFromAPI = async (
  jwt: string,
  userId: string
): Promise<{ deleted: string }> => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Cannot delete a system account',
      403: 'Insufficient permissions',
      404: 'User not found',
      422: 'Invalid user ID',
    };
    throw new Error(messages[response.status] ?? 'Failed to delete user.');
  }
  return response.json();
};

export type ReportMatchResponse = {
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
  ruleSetId: string | null;
};

export const getMatchDetailFromAPI = async (matchId: string): Promise<MatchDetail> => {
  const response = await fetch(`${API_URL}/matches/${matchId}`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getMatchDetailFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.match as MatchDetail;
};

export const getPendingMatchesFromAPI = async (
  jwt: string,
  cursor?: string
): Promise<{ pending_matches: PendingMatch[]; next_cursor: string | null }> => {
  const url = cursor
    ? `${API_URL}/admin/matches/pending?before=${encodeURIComponent(cursor)}`
    : `${API_URL}/admin/matches/pending`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getPendingMatchesFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};

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

export const confirmMatchesFromAPI = async (
  jwt: string,
  matchIds: string[]
): Promise<BatchMatchResponse> => {
  const response = await fetch(`${API_URL}/matches/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ match_ids: matchIds }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Your session has expired. Please sign in again.',
      404: 'User profile not found.',
      422: 'Invalid request.',
      429: 'Too many requests. Please wait before trying again.',
    };
    throw new Error(messages[response.status] ?? 'Failed to confirm matches. Please try again.');
  }
  return response.json();
};

// TODO: Add GET /version endpoint to the FastAPI backend.
// Expected response shape: { frontend_version: string, backend_version: string, api_version: string }
export type VersionResponse = {
  version: string;
};

export const changeUsernameFromAPI = async (
  jwt: string,
  username: string
): Promise<{ username: string }> => {
  const response = await fetch(`${API_URL}/users/me/username`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      409: 'Username already taken',
      422: 'Invalid username format',
      429: 'Too many requests — try again in a minute',
    };
    throw new Error(messages[response.status] ?? 'Failed to change username.');
  }
  const data = await response.json();
  return data.user;
};

export const changeEmailFromAPI = async (
  jwt: string,
  email: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/users/me/email`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      422: 'Invalid email address',
      429: 'Too many requests — try again in a minute',
    };
    throw new Error(messages[response.status] ?? 'Failed to change email.');
  }
  return response.json();
};

export const deleteAccountFromAPI = async (
  jwt: string
): Promise<{ deleted: string }> => {
  const response = await fetch(`${API_URL}/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      429: 'Too many requests — try again in a minute',
    };
    throw new Error(messages[response.status] ?? 'Failed to delete account.');
  }
  return response.json();
};

export const getBackendVersionFromAPI = async (): Promise<VersionResponse> => {
  const response = await fetch(`${API_URL}/version`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error('[getBackendVersionFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};

export const rejectMatchesFromAPI = async (
  jwt: string,
  matchIds: string[]
): Promise<BatchMatchResponse> => {
  const response = await fetch(`${API_URL}/matches/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ match_ids: matchIds }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Your session has expired. Please sign in again.',
      404: 'User profile not found.',
      422: 'Invalid request.',
      429: 'Too many requests. Please wait before trying again.',
    };
    throw new Error(messages[response.status] ?? 'Failed to reject matches. Please try again.');
  }
  return response.json();
};
