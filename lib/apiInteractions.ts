import { LeaderboardEntry, Match, MatchDetail, UserProfile } from '@/lib/types';

export type { LeaderboardEntry, Match, MatchDetail, UserProfile };

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL environment variable. Please add it to your .env file.');
}

export const getLeaderboardFromAPI = async (): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`${API_URL}/users/top`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    console.error('[getLeaderboardFromAPI] Request failed:', err.message);
    throw err;
  }
  const data = await response.json();
  return data.leaderboard as LeaderboardEntry[];
};

export const getRecentMatchesFromAPI = async (): Promise<Match[]> => {
  const response = await fetch(`${API_URL}/matches`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    console.error('[getRecentMatchesFromAPI] Request failed:', err.message);
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
    console.error('[getMeFromAPI] Request failed:', err.message);
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
    console.error('[getOptionsFromAPI] Request failed:', err.message);
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
    const data = await response.json().catch(() => ({}));
    const err = new Error((data as any).detail || `HTTP ${response.status}`);
    console.error('[setupUserFromAPI] Request failed:', err.message);
    throw err;
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
    const data = await response.json().catch(() => ({}));
    const err = new Error((data as any).detail || `HTTP ${response.status}`);
    console.error('[updatePreferencesFromAPI] Request failed:', err.message);
    throw err;
  }
};

export const getUserProfileFromAPI = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/users/${userId}`);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    console.error('[getUserProfileFromAPI] Request failed:', err.message);
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
    console.error('[getUsersListFromAPI] Request failed:', err.message);
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
    console.error('[getMatchDetailFromAPI] Request failed:', err.message);
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
    const data = await response.json().catch(() => ({}));
    const err = new Error((data as any).detail || `HTTP ${response.status}`);
    console.error('[reportMatchFromAPI] Request failed:', err.message);
    throw err;
  }
  return response.json();
};
