import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getLeaderboardFromAPI, LeaderboardEntry } from '@/lib/apiInteractions';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getLeaderboardFromAPI()
      .then((data) => { if (!cancelled) setLeaderboard(data); })
      .catch((err) => { if (!cancelled) console.error('[Leaderboard] Failed to load leaderboard:', err); })
      .finally(() => { if (!cancelled) setLeaderboardLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
      <View style={{
        borderWidth: 1,
        borderColor: colors.border.primary,
        borderRadius: 12,
        padding: 16,
        backgroundColor: colors.background.secondary,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}>
      {/* Title */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
        paddingBottom: 12,
        marginBottom: 12,
      }}>
        <Text style={{
          flex: 1,
          fontSize: 22,
          fontWeight: '700',
          color: colors.text.primary,
        }}>
          {'🏆 '}
          <Text style={{ color: colors.brand.amber }}>Leaderboard</Text>
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search warrior..."
          placeholderTextColor={colors.text.tertiary}
          style={{
            minHeight: 44,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: colors.border.primary,
            borderRadius: 6,
            fontSize: 13,
            color: colors.text.primary,
            backgroundColor: colors.background.primary,
            minWidth: 160,
          }}
        />
      </View>

      {/* Column headers */}
      {!leaderboardLoading && leaderboard.length > 0 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 6,
          marginBottom: 4,
        }}>
          <Text style={{ width: 52, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            RANK
          </Text>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            WARRIOR
          </Text>
          <Text style={{ width: 56, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center', marginRight: 16 }}>
            ELO
          </Text>
          <Text style={{ width: 60, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center', marginRight: 16 }}>
            W/L
          </Text>
          <Text style={{ width: 64, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            WIN RATE
          </Text>
        </View>
      )}

      {leaderboardLoading && (
        <ActivityIndicator size="large" color={colors.brand.amber} style={{ marginTop: 32 }} />
      )}

      {!leaderboardLoading && leaderboard
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.username.toLowerCase().includes(search.toLowerCase()))
        .map(({ entry, index }) => {
        const isTop3 = index < 3;
        const rankColor = RANK_COLORS[index] ?? colors.text.secondary;

        const totalGames = entry.wins + entry.losses;
        const winRate = totalGames > 0 ? Math.round((entry.wins / totalGames) * 100) : 0;

        return (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/user/${entry.id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.background.tertiary : colors.background.secondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: isTop3 ? colors.brand.amber + '55' : colors.border.primary,
            })}
          >
            {/* Rank */}
            <Text style={{
              width: 52,
              fontWeight: '700',
              fontSize: 15,
              color: rankColor,
              textAlign: 'center',
            }}>
              #{index + 1}
            </Text>

            {/* Warrior */}
            <Text style={{
              flex: 1,
              fontSize: 15,
              fontWeight: '700',
              color: colors.text.primary,
              textAlign: 'center',
            }}>
              {entry.username}
            </Text>

            {/* ELO */}
            <Text style={{
              width: 56,
              fontSize: 15,
              fontWeight: '700',
              color: colors.brand.amber,
              textAlign: 'center',
              marginRight: 16,
            }}>
              {entry.elo}
            </Text>

            {/* W/L */}
            <Text style={{
              width: 60,
              fontSize: 13,
              color: colors.text.secondary,
              textAlign: 'center',
              marginRight: 16,
            }}>
              {entry.wins}W/{entry.losses}L
            </Text>

            {/* Win Rate */}
            <Text style={{
              width: 64,
              fontSize: 13,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {winRate}%
            </Text>
          </Pressable>
        );
        })}
      </View>
  );
}
