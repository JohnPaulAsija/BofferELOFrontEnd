import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getMyMatchesFromAPI, MyMatchesResponse, UserMatch } from '@/lib/apiInteractions';
import { getThemeColors, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

type MyMatchHistoryProps = {
  userId: string;
};

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MyMatchHistory({ userId }: MyMatchHistoryProps) {
  const [myMatches, setMyMatches] = useState<MyMatchesResponse | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'confirmed' | 'unconfirmed'>('confirmed');

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      let cancelled = false;
      setMatchesLoading(true);
      getMyMatchesFromAPI(session.access_token)
        .then((data) => { if (!cancelled) setMyMatches(data); })
        .catch((err) => { if (!cancelled) console.error('[MyMatchHistory] Failed to load matches:', err); })
        .finally(() => { if (!cancelled) setMatchesLoading(false); });
      return () => { cancelled = true; };
    }
  }, [session]);

  return (
    <View style={{
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 12,
      backgroundColor: colors.background.secondary,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      marginTop: 16,
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.primary }}>
        {(['confirmed', 'unconfirmed'] as const).map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'confirmed' ? 'Confirmed' : 'Pending';
          const count = myMatches ? myMatches[tab].length : null;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: active ? colors.brand.amber : 'transparent',
              }}
            >
              <Text style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semibold,
                color: active ? colors.brand.amber : colors.text.tertiary,
              }}>
                {label}{count !== null ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab content */}
      <View style={{ padding: 12 }}>
        {matchesLoading && (
          <ActivityIndicator size="small" color={colors.brand.amber} style={{ marginVertical: 24 }} />
        )}

        {!matchesLoading && myMatches && (() => {
          const list: UserMatch[] = myMatches[activeTab];
          if (list.length === 0) {
            return (
              <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingVertical: 24 }}>
                {activeTab === 'confirmed' ? 'No confirmed matches yet.' : 'No pending matches.'}
              </Text>
            );
          }
          return list.map((match) => {
            const isWinner = match.winnerId === userId;
            const opponent = isWinner ? match.loserName : match.winnerName;
            const timestamp = activeTab === 'confirmed' && match.confirmedAt
              ? timeAgo(match.confirmedAt)
              : match.reportedAt
                ? timeAgo(match.reportedAt)
                : null;
            return (
              <Pressable
                key={match.id}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}
              >
                {({ pressed }) => (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: colors.border.primary,
                    backgroundColor: colors.background.primary,
                    opacity: pressed ? 0.7 : 1,
                  }}>
                    {/* Result badge */}
                    <View style={{
                      width: 36,
                      height: 22,
                      borderRadius: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isWinner ? '#4ade8022' : colors.brand.red + '22',
                      marginRight: 10,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isWinner ? '#4ade80' : colors.brand.red,
                      }}>
                        {isWinner ? 'WIN' : 'LOSS'}
                      </Text>
                    </View>

                    {/* Opponent */}
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                      vs {opponent}
                    </Text>

                    {/* ELO change */}
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isWinner ? '#4ade80' : colors.brand.red,
                      marginRight: 10,
                    }}>
                      {isWinner ? `+${match.eloChange}` : `-${match.eloChange}`}
                    </Text>

                    {/* Timestamp */}
                    {timestamp && (
                      <Text style={{ fontSize: 12, color: colors.text.tertiary, minWidth: 56, textAlign: 'right' }}>
                        {timestamp}
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            );
          });
        })()}
      </View>
    </View>
  );
}
