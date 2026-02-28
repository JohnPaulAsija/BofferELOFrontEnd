import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { getLeaderboardFromAPI, LeaderboardEntry } from '@/lib/apiInteractions';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    getLeaderboardFromAPI()
      .then(setLeaderboard)
      .catch((err) => console.error('[Leaderboard] Failed to load leaderboard:', err))
      .finally(() => setLeaderboardLoading(false));
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text style={{
        fontSize: 22,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 12,
      }}>
        {'🏆 '}
        <Text style={{ color: colors.brand.amber }}>Leaderboard</Text>
      </Text>

      {leaderboardLoading && (
        <ActivityIndicator size="large" color={colors.brand.amber} style={{ marginTop: 32 }} />
      )}

      {!leaderboardLoading && leaderboard.map((entry, index) => {
        const isTop3 = index < 3;
        const rankColor = RANK_COLORS[index] ?? colors.text.secondary;

        return (
          <View
            key={entry.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background.secondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: isTop3 ? colors.brand.amber + '55' : colors.border.primary,
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
              color: colors.text.primary,
            }}>
              {entry.username}
            </Text>

            {/* W / L */}
            <Text style={{
              fontSize: 13,
              color: colors.text.secondary,
              marginRight: 16,
            }}>
              {entry.wins}W / {entry.losses}L
            </Text>

            {/* ELO */}
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.brand.amber,
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
