import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getMyMatchesFromAPI, confirmMatchesFromAPI, rejectMatchesFromAPI, MyMatchesResponse, UserMatch } from '@/lib/apiInteractions';
import { getThemeColors, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOptions } from '@/contexts/OptionsContext';
import { ErrorModal } from '@/components/ui/error-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';

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
  const [actionLoading, setActionLoading] = useState<Record<string, 'confirming' | 'rejecting'>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ matchId: string; action: 'confirm' | 'reject' } | null>(null);

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session } = useAuth();
  const router = useRouter();
  const { options, getRuleSetName } = useOptions();
  const [ruleSetFilter, setRuleSetFilter] = useState<string | null>(null);

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

  const handleConfirmMatch = async (matchId: string) => {
    if (!session) return;
    setActionLoading((prev) => ({ ...prev, [matchId]: 'confirming' }));
    try {
      const response = await confirmMatchesFromAPI(session.access_token, [matchId]);
      if (response.succeeded > 0) {
        setMyMatches((prev) => prev ? {
          ...prev,
          unconfirmed: prev.unconfirmed.filter((m) => m.id !== matchId),
        } : prev);
      } else {
        const errItem = response.results.find((r) => r.status === 'error');
        setActionError(errItem?.error ?? 'Failed to confirm match.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm match.');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    if (!session) return;
    setActionLoading((prev) => ({ ...prev, [matchId]: 'rejecting' }));
    try {
      const response = await rejectMatchesFromAPI(session.access_token, [matchId]);
      if (response.succeeded > 0) {
        setMyMatches((prev) => prev ? {
          ...prev,
          unconfirmed: prev.unconfirmed.filter((m) => m.id !== matchId),
        } : prev);
      } else {
        const errItem = response.results.find((r) => r.status === 'error');
        setActionError(errItem?.error ?? 'Failed to reject match.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject match.');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  };

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
      <ErrorModal
        visible={!!actionError}
        title="Error"
        message={actionError ?? ''}
        onDismiss={() => setActionError(null)}
        variant="error"
      />
      {pendingAction && (
        <ConfirmModal
          visible={true}
          action={pendingAction.action}
          matchCount={1}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const { matchId, action } = pendingAction;
            setPendingAction(null);
            if (action === 'confirm') handleConfirmMatch(matchId);
            else handleRejectMatch(matchId);
          }}
        />
      )}
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

      {/* Ruleset filter */}
      {options && options.rule_sets.length > 1 && (
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 6,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}>
          <Pressable
            onPress={() => setRuleSetFilter(null)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: ruleSetFilter === null ? colors.brand.amber + '22' : 'transparent',
              borderWidth: 1,
              borderColor: ruleSetFilter === null ? colors.brand.amber : colors.border.primary,
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: ruleSetFilter === null ? '700' : '400',
              color: ruleSetFilter === null ? colors.brand.amber : colors.text.tertiary,
            }}>
              All
            </Text>
          </Pressable>
          {options.rule_sets.map((rs) => (
            <Pressable
              key={rs.id}
              onPress={() => setRuleSetFilter(rs.id)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: ruleSetFilter === rs.id ? colors.brand.amber + '22' : 'transparent',
                borderWidth: 1,
                borderColor: ruleSetFilter === rs.id ? colors.brand.amber : colors.border.primary,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: ruleSetFilter === rs.id ? '700' : '400',
                color: ruleSetFilter === rs.id ? colors.brand.amber : colors.text.tertiary,
              }}>
                {rs.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Column headers */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
      }}>
        <View style={{ width: 46 }} />
        <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary }}>
          OPPONENT
        </Text>
        <Text style={{ width: 80, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
          RULESET
        </Text>
        <Text style={{ width: 52, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
          ELO
        </Text>
        <Text style={{ width: 56, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'right' }}>
          WHEN
        </Text>
      </View>

      {/* Tab content */}
      <View style={{ padding: 12 }}>
        {matchesLoading && (
          <ActivityIndicator size="small" color={colors.brand.amber} style={{ marginVertical: 24 }} />
        )}

        {!matchesLoading && myMatches && (() => {
          const list: UserMatch[] = myMatches[activeTab].filter((m) =>
            !ruleSetFilter || m.ruleSetId === ruleSetFilter
          );
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

                    {/* Ruleset */}
                    <Text numberOfLines={1} style={{ width: 80, fontSize: 11, color: colors.text.tertiary, textAlign: 'center' }}>
                      {match.ruleSetId ? getRuleSetName(match.ruleSetId) : '—'}
                    </Text>

                    {/* ELO change */}
                    <Text style={{
                      width: 52,
                      fontSize: 13,
                      fontWeight: '700',
                      color: isWinner ? '#4ade80' : colors.brand.red,
                      textAlign: 'center',
                    }}>
                      {isWinner ? `+${match.eloChange}` : `-${match.eloChange}`}
                    </Text>

                    {/* Timestamp */}
                    {timestamp && (
                      <Text style={{ fontSize: 12, color: colors.text.tertiary, width: 56, textAlign: 'right' }}>
                        {timestamp}
                      </Text>
                    )}

                    {/* Confirm/Reject buttons for pending matches */}
                    {activeTab === 'unconfirmed' && (
                      <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
                        {match.reporterId !== userId && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); setPendingAction({ matchId: match.id, action: 'confirm' }); }}
                            disabled={!!actionLoading[match.id]}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 6,
                              backgroundColor: actionLoading[match.id] ? colors.border.secondary : colors.brand.green,
                              opacity: actionLoading[match.id] ? 0.6 : 1,
                            }}
                          >
                            {actionLoading[match.id] === 'confirming' ? (
                              <ActivityIndicator size="small" color={colors.text.white} />
                            ) : (
                              <Text style={{ color: colors.text.white, fontSize: 12, fontWeight: '700' }}>Confirm</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation(); setPendingAction({ matchId: match.id, action: 'reject' }); }}
                          disabled={!!actionLoading[match.id]}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                            backgroundColor: actionLoading[match.id] ? colors.border.secondary : colors.brand.red,
                            opacity: actionLoading[match.id] ? 0.6 : 1,
                          }}
                        >
                          {actionLoading[match.id] === 'rejecting' ? (
                            <ActivityIndicator size="small" color={colors.text.white} />
                          ) : (
                            <Text style={{ color: colors.text.white, fontSize: 12, fontWeight: '700' }}>Reject</Text>
                          )}
                        </TouchableOpacity>
                      </View>
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
