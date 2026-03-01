import React, { useState, useEffect } from 'react';
import { getRecentMatchesFromAPI, Match } from '@/lib/apiInteractions';
import MatchList from '@/components/MatchList';

export default function RecentMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentMatchesFromAPI()
      .then(setMatches)
      .catch((err) => console.error('[RecentMatches] Failed to load matches:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MatchList
      title="Recent Matches"
      matches={matches}
      loading={loading}
      searchable
      style={{ marginTop: 16 }}
    />
  );
}
