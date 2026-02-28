const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type LeaderboardEntry = {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

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
