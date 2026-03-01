import React, { useState, useEffect } from 'react';
import { getRecentMatchesFromAPI, Match } from '@/lib/apiInteractions';
import MatchList from '@/components/MatchList';

export default function RecentMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentMatchesFromAPI()
      .then((data) => { if (!cancelled) setMatches(data); })
      .catch((err) => { if (!cancelled) console.error('[RecentMatches] Failed to load matches:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
