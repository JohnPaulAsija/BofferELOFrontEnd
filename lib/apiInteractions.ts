import { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse } from '@/lib/types';

export type { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse };

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

export type OptionsResponse = {
  genders: string[];
  games: string[];
  weapons: string[];
  shields: string[];
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

export const setupUserFromAPI = async (jwt: string, username: string): Promise<void> => {
  const response = await fetch(`${API_URL}/users/me/setup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, accept_terms: true }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      409: 'That username is already taken. Please choose a different one.',
      400: 'Invalid username. Please use only letters, numbers, and underscores (3–30 characters).',
    };
    throw new Error(messages[response.status] ?? 'Account setup failed. Please try again.');
  }
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

export type ReportMatchResponse = {
  id: string;
  winner_id: string;
  winner_username: string;
  loser_id: string;
  loser_username: string;
  elo_change: number;
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

export const reportMatchFromAPI = async (
  jwt: string,
  winner_id: string,
  loser_id: string
): Promise<ReportMatchResponse> => {
  const response = await fetch(`${API_URL}/matches`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner_id, loser_id }),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      409: 'This match has already been reported.',
      429: "You've reported too many matches recently. Please wait before reporting another.",
      400: 'Invalid match data. Please check your selection and try again.',
    };
    throw new Error(messages[response.status] ?? 'Failed to report match. Please try again.');
  }
  return response.json();
};
