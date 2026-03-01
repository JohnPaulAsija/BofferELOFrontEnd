import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getMatchDetailFromAPI, MatchDetail } from '@/lib/apiInteractions';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type MatchStatus = 'confirmed' | 'rejected' | 'pending';

function getStatus(match: MatchDetail): MatchStatus {
  if (match.confirmedAt) return 'confirmed';
  if (match.rejectedAt) return 'rejected';
  return 'pending';
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getMatchDetailFromAPI(id)
      .then((data) => { if (!cancelled) setMatch(data); })
      .catch((err: Error) => {
        if (!cancelled) {
          if (err.message.includes('404')) {
            setError('Match not found.');
          } else {
            setError('Failed to load match. Please try again.');
          }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const s = styles(isDark, colors);

  if (loading) {
    return (
      <View style={[BofferEloStyles.stackContent, s.centered]}>
        <ActivityIndicator size="large" color={colors.brand.amber} />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={[BofferEloStyles.stackContent, s.centered]}>
        <Text style={s.errorText}>{error ?? 'Something went wrong.'}</Text>
      </View>
    );
  }

  const status = getStatus(match);

  const statusConfig = {
    confirmed: { label: 'Confirmed', color: '#22c55e', bg: isDark ? '#14532d33' : '#dcfce7' },
    pending:   { label: 'Pending',   color: colors.brand.amber, bg: isDark ? '#78350f33' : '#fef3c7' },
    rejected:  { label: 'Rejected',  color: colors.brand.red,   bg: isDark ? '#7f1d1d33' : '#fee2e2' },
  }[status];

  const winnerEloAfter = match.winnerEloBefore + match.eloChange;
  const loserEloAfter  = match.loserEloBefore  - match.eloChange;

  return (
    <ScrollView
      style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}
      contentContainerStyle={s.container}
    >
      {/* Status badge */}
      <View style={[s.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color }]}>
        <View style={[s.statusDot, { backgroundColor: statusConfig.color }]} />
        <Text style={[s.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
      </View>

      {/* Match result card */}
      <View style={s.card}>
        <View style={s.matchupRow}>
          {/* Winner */}
          <TouchableOpacity style={s.playerCol} onPress={() => router.push(`/user/${match.winnerId}`)}>
            <Text style={s.playerRole}>WINNER</Text>
            <Text style={s.playerName} numberOfLines={2}>{match.winnerName}</Text>
          </TouchableOpacity>

          {/* ELO change */}
          <View style={s.eloChangeCol}>
            <Text style={s.vsText}>VS</Text>
            {status === 'confirmed' && (
              <Text style={s.eloChangeBadge}>+{match.eloChange}</Text>
            )}
          </View>

          {/* Loser */}
          <TouchableOpacity style={[s.playerCol, s.playerColRight]} onPress={() => router.push(`/user/${match.loserId}`)}>
            <Text style={[s.playerRole, s.loserRole]}>LOSER</Text>
            <Text style={[s.playerName, s.loserName]} numberOfLines={2}>{match.loserName}</Text>
          </TouchableOpacity>
        </View>

        {/* ELO breakdown (only meaningful when confirmed) */}
        {status === 'confirmed' && (
          <View style={s.eloBreakdown}>
            <View style={s.eloBreakdownRow}>
              <Text style={s.eloBreakdownLabel}>ELO before</Text>
              <View style={s.eloBreakdownValues}>
                <Text style={s.eloWinner}>{match.winnerEloBefore} → {winnerEloAfter}</Text>
                <Text style={s.eloBreakdownSep}>/</Text>
                <Text style={s.eloLoser}>{match.loserEloBefore} → {loserEloAfter}</Text>
              </View>
            </View>
          </View>
        )}

        {status !== 'confirmed' && (
          <View style={s.eloBreakdown}>
            <View style={s.eloBreakdownRow}>
              <Text style={s.eloBreakdownLabel}>ELO at time of report</Text>
              <View style={s.eloBreakdownValues}>
                <Text style={s.eloWinner}>{match.winnerEloBefore}</Text>
                <Text style={s.eloBreakdownSep}>/</Text>
                <Text style={s.eloLoser}>{match.loserEloBefore}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Match metadata */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Match Info</Text>

        <InfoRow
          label="Reported by"
          value={match.reporterName}
          onPress={() => router.push(`/user/${match.reporterId}`)}
          colors={colors}
          isDark={isDark}
        />
        <InfoRow
          label="Reported at"
          value={formatDate(match.reportedAt)}
          colors={colors}
          isDark={isDark}
        />

        {status === 'confirmed' && match.confirmedAt && (
          <>
            <View style={s.divider} />
            <InfoRow
              label="Confirmed by"
              value={match.confirmedByName!}
              onPress={() => router.push(`/user/${match.confirmedById}`)}
              colors={colors}
              isDark={isDark}
            />
            <InfoRow
              label="Confirmed at"
              value={formatDate(match.confirmedAt)}
              colors={colors}
              isDark={isDark}
            />
          </>
        )}

        {status === 'rejected' && match.rejectedAt && (
          <>
            <View style={s.divider} />
            <InfoRow
              label="Rejected by"
              value={match.rejectedByName!}
              onPress={() => router.push(`/user/${match.rejectedById}`)}
              colors={colors}
              isDark={isDark}
            />
            <InfoRow
              label="Rejected at"
              value={formatDate(match.rejectedAt)}
              colors={colors}
              isDark={isDark}
            />
          </>
        )}
      </View>

      {/* Match ID */}
      <Text style={s.matchId}>ID: {match.id}</Text>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  onPress,
  colors,
  isDark,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  colors: ReturnType<typeof getThemeColors>;
  isDark: boolean;
}) {
  const s = styles(isDark, colors);
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={[s.infoValue, s.infoValueLink]}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={s.infoValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = (isDark: boolean, colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      backgroundColor: colors.background.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: colors.text.secondary,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    container: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 4,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.primary,
      padding: 16,
    },
    matchupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    playerCol: {
      flex: 1,
      alignItems: 'flex-start',
    },
    playerColRight: {
      alignItems: 'flex-end',
    },
    playerRole: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#22c55e',
      marginBottom: 4,
    },
    loserRole: {
      color: colors.brand.red,
    },
    playerName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text.primary,
      textDecorationLine: 'underline',
    },
    loserName: {
      textAlign: 'right',
    },
    eloChangeCol: {
      alignItems: 'center',
      gap: 4,
    },
    vsText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.tertiary,
      letterSpacing: 1,
    },
    eloChangeBadge: {
      fontSize: 14,
      fontWeight: '700',
      color: '#22c55e',
    },
    eloBreakdown: {
      borderTopWidth: 1,
      borderTopColor: colors.border.primary,
      paddingTop: 12,
    },
    eloBreakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    eloBreakdownLabel: {
      fontSize: 12,
      color: colors.text.tertiary,
      fontWeight: '500',
    },
    eloBreakdownValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eloWinner: {
      fontSize: 13,
      color: '#22c55e',
      fontWeight: '600',
    },
    eloLoser: {
      fontSize: 13,
      color: colors.brand.red,
      fontWeight: '600',
    },
    eloBreakdownSep: {
      fontSize: 13,
      color: colors.text.tertiary,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text.primary,
      fontWeight: '500',
      textAlign: 'right',
      flex: 1,
    },
    infoValueLink: {
      color: colors.brand.amber,
      textDecorationLine: 'underline',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.primary,
      marginVertical: 8,
    },
    matchId: {
      fontSize: 11,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: 4,
    },
  });
