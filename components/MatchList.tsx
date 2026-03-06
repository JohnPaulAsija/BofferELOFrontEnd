import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, Pressable, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Match } from '@/lib/apiInteractions';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

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

type Props = {
  title: string;
  icon?: string;
  matches: Match[];
  loading: boolean;
  searchable?: boolean;
  style?: ViewStyle;
  emptyText?: string;
};

export default function MatchList({
  title,
  icon = '⚔️',
  matches,
  loading,
  searchable = false,
  style,
  emptyText = 'No matches yet.',
}: Props) {
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  const filtered = searchable
    ? matches.filter((m) => {
        const q = search.toLowerCase();
        return m.winnerName.toLowerCase().includes(q) || m.loserName.toLowerCase().includes(q);
      })
    : matches;

  return (
    <View style={[{
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.background.secondary,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center' as const,
    }, style]}>
      {/* Title / search row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
        paddingBottom: 12,
        marginBottom: 12,
      }}>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.text.primary }}>
          {icon + ' '}
          <Text style={{ color: colors.brand.amber }}>{title}</Text>
        </Text>
        {searchable && (
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
        )}
      </View>

      {/* Column headers */}
      {!loading && filtered.length > 0 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 6,
          marginBottom: 4,
        }}>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            WINNER
          </Text>
          <Text style={{ width: 28, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
          </Text>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            LOSER
          </Text>
          <Text style={{ width: 64, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            ELO SWING
          </Text>
          <Text style={{ width: 56, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'right' }}>
            WHEN
          </Text>
        </View>
      )}

      {loading && (
        <ActivityIndicator size="large" color={colors.brand.amber} style={{ marginTop: 32 }} />
      )}

      {!loading && filtered.map((match) => (
        <Pressable key={match.id} onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}>
          {({ pressed }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.background.secondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: colors.border.primary,
              opacity: pressed ? 0.7 : 1,
            }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text.primary, textAlign: 'center' }}>
                {match.winnerName}
              </Text>
              <Text style={{ width: 28, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
                vs
              </Text>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text.secondary, textAlign: 'center' }}>
                {match.loserName}
              </Text>
              <Text style={{ width: 64, fontSize: 13, fontWeight: '700', color: colors.brand.amber, textAlign: 'center' }}>
                +{match.eloChange}
              </Text>
              <Text style={{ width: 56, fontSize: 12, color: colors.text.tertiary, textAlign: 'right' }}>
                {timeAgo(match.confirmedAt)}
              </Text>
            </View>
          )}
        </Pressable>
      ))}

      {!loading && filtered.length === 0 && (
        <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingVertical: 24 }}>
          {searchable && search ? 'No matches found.' : emptyText}
        </Text>
      )}
    </View>
  );
}
