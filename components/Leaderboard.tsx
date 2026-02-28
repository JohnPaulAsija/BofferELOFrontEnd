import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { getLeaderboardFromAPI, LeaderboardEntry } from '@/lib/apiInteractions';
import { BofferEloColors } from '@/constants/theme';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    getLeaderboardFromAPI()
      .then(setLeaderboard)
      .catch((err) => console.error('[Leaderboard] Failed to load leaderboard:', err))
      .finally(() => setLeaderboardLoading(false));
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BofferEloColors.background.primary }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text style={{
        fontSize: 22,
        fontWeight: '700',
        color: BofferEloColors.text.primary,
        marginBottom: 12,
      }}>
        {'🏆 '}
        <Text style={{ color: BofferEloColors.brand.amber }}>Leaderboard</Text>
      </Text>

      {leaderboardLoading && (
        <ActivityIndicator size="large" color={BofferEloColors.brand.amber} style={{ marginTop: 32 }} />
      )}

      {!leaderboardLoading && leaderboard.map((entry, index) => {
        const isTop3 = index < 3;
        const rankColor = index === 0
          ? '#FFD700'
          : index === 1
          ? '#C0C0C0'
          : index === 2
          ? '#CD7F32'
          : BofferEloColors.text.secondary;

        return (
          <View
            key={entry.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: BofferEloColors.background.secondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: isTop3 ? BofferEloColors.brand.amber + '55' : BofferEloColors.border.primary,
            }}
          >
            {/* Rank */}
            <Text style={{
              width: 32,
              fontWeight: '700',
              fontSize: 15,
              color: rankColor,
            }}>
              #{index + 1}
            </Text>

            {/* Username */}
            <Text style={{
              flex: 1,
              fontSize: 15,
              fontWeight: '500',
              color: BofferEloColors.text.primary,
            }}>
              {entry.username}
            </Text>

            {/* W / L */}
            <Text style={{
              fontSize: 13,
              color: BofferEloColors.text.secondary,
              marginRight: 16,
            }}>
              {entry.wins}W / {entry.losses}L
            </Text>

            {/* ELO */}
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: BofferEloColors.brand.amber,
              minWidth: 44,
              textAlign: 'right',
            }}>
              {entry.elo}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
