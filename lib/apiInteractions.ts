import { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet } from '@/lib/types';

export type { LeaderboardEntry, Match, MatchDetail, UserProfile, UserMatch, MyMatchesResponse, PendingMatch, BatchMatchResponse, OptionsResponse, RuleSet };

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL environment variable. Please add it to your .env file.');
}

if (!API_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS');
}

// --- Internal helpers ---

function authHeaders(jwt: string, json = true): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${jwt}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function fetchPublic<T>(url: string, fnName: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    if (__DEV__) console.error(`[${fnName}] Request failed:`, err.message);
    throw err;
  }
  return response.json() as Promise<T>;
}

async function fetchWithErrors<T>(
  url: string,
  options: RequestInit,
  errorMessages: Record<number, string>,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(errorMessages[response.status] ?? fallbackMessage);
  }
  // Guard against 204 No Content (empty body)
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

// --- API functions ---

export const getLeaderboardFromAPI = async (): Promise<LeaderboardEntry[]> => {
  const data = await fetchPublic<{ leaderboard: LeaderboardEntry[] }>(`${API_URL}/users/top`, 'getLeaderboardFromAPI');
  return data.leaderboard;
};

export const getRecentMatchesFromAPI = async (): Promise<Match[]> => {
  const data = await fetchPublic<{ matches: Match[] }>(`${API_URL}/matches`, 'getRecentMatchesFromAPI');
  return data.matches;
};

export type MeResponse = {
  id: string;
  email: string;
  username: string;
  role_id: number;
};

export const getMeFromAPI = async (jwt: string): Promise<MeResponse> => {
  const data = await fetchPublic<{ user: MeResponse }>(`${API_URL}/users/me`, 'getMeFromAPI', { headers: authHeaders(jwt, false) });
  return data.user;
};

export const getOptionsFromAPI = (): Promise<OptionsResponse> =>
  fetchPublic<OptionsResponse>(`${API_URL}/options`, 'getOptionsFromAPI');

export const updatePreferencesFromAPI = async (
  jwt: string,
  prefs: { gender: string | null; preferred_game: string | null; preferred_weapon: string | null; preferred_shield: string | null },
): Promise<void> => {
  await fetchWithErrors<unknown>(
    `${API_URL}/users/me/preferences`,
    { method: 'PATCH', headers: authHeaders(jwt), body: JSON.stringify(prefs) },
    { 400: 'Invalid preference value. Please check your selections.' },
    'Failed to save preferences. Please try again.',
  );
};

export const getUserMatchesFromAPI = (
  userId: string,
  limit = 100,
): Promise<{ matches: Match[]; next_cursor: string | null }> =>
  fetchPublic(`${API_URL}/users/${userId}/matches?limit=${limit}`, 'getUserMatchesFromAPI');

export const getMyMatchesFromAPI = (jwt: string): Promise<MyMatchesResponse> =>
  fetchPublic<MyMatchesResponse>(`${API_URL}/users/me/matches`, 'getMyMatchesFromAPI', { headers: authHeaders(jwt, false) });

export const getUserProfileFromAPI = async (userId: string): Promise<UserProfile> => {
  const data = await fetchPublic<{ user: UserProfile }>(`${API_URL}/users/${userId}`, 'getUserProfileFromAPI');
  return data.user;
};

export type UserListEntry = {
  id: string;
  username: string;
};

export const getUsersListFromAPI = async (jwt: string): Promise<UserListEntry[]> => {
  const data = await fetchPublic<{ users: UserListEntry[] }>(`${API_URL}/users`, 'getUsersListFromAPI', { headers: authHeaders(jwt, false) });
  return data.users;
};

export const adminChangeUsernameFromAPI = async (
  jwt: string,
  userId: string,
  username: string,
): Promise<{ username: string }> => {
  const data = await fetchWithErrors<{ user: { username: string } }>(
    `${API_URL}/users/${userId}/username`,
    { method: 'PATCH', headers: authHeaders(jwt), body: JSON.stringify({ username }) },
    { 403: 'Insufficient permissions', 404: 'User not found', 409: 'Username already taken', 422: 'Invalid username' },
    'Failed to change username.',
  );
  return data.user;
};

export const adminChangeEmailFromAPI = async (
  jwt: string,
  userId: string,
  email: string,
): Promise<{ email: string }> => {
  const data = await fetchWithErrors<{ user: { email: string } }>(
    `${API_URL}/users/${userId}/email`,
    { method: 'PATCH', headers: authHeaders(jwt), body: JSON.stringify({ email }) },
    { 403: 'Insufficient permissions', 404: 'User not found', 422: 'Invalid email address' },
    'Failed to change email.',
  );
  return data.user;
};

export const adminDeleteUserFromAPI = (
  jwt: string,
  userId: string,
): Promise<{ deleted: string }> =>
  fetchWithErrors(
    `${API_URL}/users/${userId}`,
    { method: 'DELETE', headers: authHeaders(jwt, false) },
    { 400: 'Cannot delete a system account', 403: 'Insufficient permissions', 404: 'User not found', 422: 'Invalid user ID' },
    'Failed to delete user.',
  );

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
  const data = await fetchPublic<{ match: MatchDetail }>(`${API_URL}/matches/${matchId}`, 'getMatchDetailFromAPI');
  return data.match;
};

export const getPendingMatchesFromAPI = (
  jwt: string,
  cursor?: string,
): Promise<{ pending_matches: PendingMatch[]; next_cursor: string | null }> => {
  const url = cursor
    ? `${API_URL}/admin/matches/pending?before=${encodeURIComponent(cursor)}`
    : `${API_URL}/admin/matches/pending`;
  return fetchPublic(url, 'getPendingMatchesFromAPI', { headers: authHeaders(jwt, false) });
};

export const reportMatchFromAPI = async (
  jwt: string,
  winner_id: string,
  loser_id: string,
  rule_set_id: string,
): Promise<ReportMatchResponse> => {
  const data = await fetchWithErrors<{ match: ReportMatchResponse }>(
    `${API_URL}/matches`,
    { method: 'POST', headers: authHeaders(jwt), body: JSON.stringify({ winner_id, loser_id, rule_set_id }) },
    { 409: 'This match has already been reported.', 422: 'Please select a valid ruleset.', 429: "You've reported too many matches recently. Please wait before reporting another.", 400: 'Invalid match data. Please check your selection and try again.' },
    'Failed to report match. Please try again.',
  );
  return data.match;
};

export const confirmMatchesFromAPI = (
  jwt: string,
  matchIds: string[],
): Promise<BatchMatchResponse> =>
  fetchWithErrors(
    `${API_URL}/matches/confirm`,
    { method: 'POST', headers: authHeaders(jwt), body: JSON.stringify({ match_ids: matchIds }) },
    { 401: 'Your session has expired. Please sign in again.', 404: 'User profile not found.', 422: 'Invalid request.', 429: 'Too many requests. Please wait before trying again.' },
    'Failed to confirm matches. Please try again.',
  );

// TODO: Add GET /version endpoint to the FastAPI backend.
// Expected response shape: { frontend_version: string, backend_version: string, api_version: string }
export type VersionResponse = {
  version: string;
};

export const changeUsernameFromAPI = async (
  jwt: string,
  username: string,
): Promise<{ username: string }> => {
  const data = await fetchWithErrors<{ user: { username: string } }>(
    `${API_URL}/users/me/username`,
    { method: 'PATCH', headers: authHeaders(jwt), body: JSON.stringify({ username }) },
    { 409: 'Username already taken', 422: 'Invalid username format', 429: 'Too many requests — try again in a minute' },
    'Failed to change username.',
  );
  return data.user;
};

export const changeEmailFromAPI = (
  jwt: string,
  email: string,
): Promise<{ message: string }> =>
  fetchWithErrors(
    `${API_URL}/users/me/email`,
    { method: 'PATCH', headers: authHeaders(jwt), body: JSON.stringify({ email }) },
    { 422: 'Invalid email address', 429: 'Too many requests — try again in a minute' },
    'Failed to change email.',
  );

export const deleteAccountFromAPI = (
  jwt: string,
): Promise<{ deleted: string }> =>
  fetchWithErrors(
    `${API_URL}/users/me`,
    { method: 'DELETE', headers: authHeaders(jwt, false) },
    { 429: 'Too many requests — try again in a minute' },
    'Failed to delete account.',
  );

export const getBackendVersionFromAPI = (): Promise<VersionResponse> =>
  fetchPublic<VersionResponse>(`${API_URL}/version`, 'getBackendVersionFromAPI');

export const rejectMatchesFromAPI = (
  jwt: string,
  matchIds: string[],
): Promise<BatchMatchResponse> =>
  fetchWithErrors(
    `${API_URL}/matches/reject`,
    { method: 'POST', headers: authHeaders(jwt), body: JSON.stringify({ match_ids: matchIds }) },
    { 401: 'Your session has expired. Please sign in again.', 404: 'User profile not found.', 422: 'Invalid request.', 429: 'Too many requests. Please wait before trying again.' },
    'Failed to reject matches. Please try again.',
  );
