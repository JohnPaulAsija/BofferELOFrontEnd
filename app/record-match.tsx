import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';
import { useErrorModal } from '@/hooks/useErrorModal';
import {
  getUsersListFromAPI,
  reportMatchFromAPI,
  UserListEntry,
  ReportMatchResponse,
} from '@/lib/apiInteractions';

type Outcome = 'win' | 'loss' | null;

export default function RecordMatchScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading } = useAuth();
  const router = useRouter();

  const [authModal, setAuthModal] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<UserListEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { modal: errorModal, showError, hideModal: hideErrorModal } = useErrorModal();
  const [successResult, setSuccessResult] = useState<ReportMatchResponse | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setAuthModal(true);
      return;
    }
    let cancelled = false;
    const jwt = session.access_token;
    setUsersLoading(true);
    getUsersListFromAPI(jwt)
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch(() => {
        if (!cancelled)
          showError('Error', 'Could not load players. Please try again.');
      })
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, [loading, session]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const canSubmit = outcome !== null && selectedOpponent !== null && !submitting;

  const handleSubmit = async () => {
    if (!session || !outcome || !selectedOpponent) return;
    setSubmitting(true);
    try {
      const myId = session.user.id;
      const winnerId = outcome === 'win' ? myId : selectedOpponent.id;
      const loserId = outcome === 'win' ? selectedOpponent.id : myId;
      const result = await reportMatchFromAPI(session.access_token, winnerId, loserId);
      setSuccessResult(result);
    } catch (err: unknown) {
      showError(
        'Failed to Report Match',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDismiss = () => {
    setSuccessResult(null);
    router.replace('/');
  };

  const s = styles(isDark, colors);

  return (
    <View style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}>
      <ErrorModal
        visible={authModal}
        title="Sign In Required"
        message="You need to be signed in to report a match."
        variant="info"
        onDismiss={() => {
          setAuthModal(false);
          router.replace('/auth');
        }}
      />
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        variant="error"
        onDismiss={hideErrorModal}
      />
      <ErrorModal
        visible={successResult !== null}
        title="Match Reported!"
        message={
          successResult
            ? `${successResult.winner_username} defeated ${successResult.loser_username} (+${successResult.elo_change} ELO). The match is pending confirmation.`
            : ''
        }
        variant="info"
        onDismiss={handleSuccessDismiss}
      />

      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Report a Match</Text>

        {/* Outcome selector */}
        <Text style={s.sectionLabel}>Your result</Text>
        <View style={s.outcomeRow}>
          <TouchableOpacity
            style={[s.outcomeButton, outcome === 'win' && s.outcomeButtonActive, s.outcomeWin]}
            onPress={() => setOutcome('win')}
            activeOpacity={0.8}
          >
            <Text style={[s.outcomeIcon]}>⚔️</Text>
            <Text style={[s.outcomeLabel, outcome === 'win' && s.outcomeLabelActive]}>I Won</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.outcomeButton, outcome === 'loss' && s.outcomeButtonActiveLoss, s.outcomeLoss]}
            onPress={() => setOutcome('loss')}
            activeOpacity={0.8}
          >
            <Text style={s.outcomeIcon}>🛡️</Text>
            <Text style={[s.outcomeLabel, outcome === 'loss' && s.outcomeLabelActive]}>I Lost</Text>
          </TouchableOpacity>
        </View>

        {/* Opponent selector */}
        <Text style={s.sectionLabel}>Opponent</Text>
        {selectedOpponent ? (
          <View style={s.selectedOpponent}>
            <Text style={s.selectedOpponentName}>{selectedOpponent.username}</Text>
            <TouchableOpacity onPress={() => setSelectedOpponent(null)}>
              <Text style={s.clearButton}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.searchWrapper}>
              <TextInput
                style={s.searchInput}
                placeholder="Search players..."
                placeholderTextColor={colors.text.tertiary}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
            {usersLoading ? (
              <ActivityIndicator color={colors.brand.amber} style={{ marginTop: 16 }} />
            ) : (
              <View style={s.userList}>
                {filteredUsers.length === 0 ? (
                  <Text style={s.emptyText}>No players found</Text>
                ) : (
                  filteredUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={s.userRow}
                      onPress={() => setSelectedOpponent(user)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.userName}>{user.username}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitButton, !canSubmit && s.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.submitLabel}>Submit Match</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = (isDark: boolean, colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 48,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    outcomeRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 28,
    },
    outcomeButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border.primary,
      backgroundColor: colors.background.secondary,
    },
    outcomeWin: {},
    outcomeLoss: {},
    outcomeButtonActive: {
      borderColor: colors.brand.amber,
      backgroundColor: isDark ? colors.brand.amberDark + '33' : colors.brand.amberDark,
    },
    outcomeButtonActiveLoss: {
      borderColor: colors.brand.red,
      backgroundColor: isDark ? colors.brand.redDark + '33' : colors.brand.redDark,
    },
    outcomeIcon: {
      fontSize: 28,
      marginBottom: 6,
    },
    outcomeLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    outcomeLabelActive: {
      color: colors.text.primary,
    },
    selectedOpponent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background.secondary,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.brand.amber,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 28,
    },
    selectedOpponentName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    clearButton: {
      fontSize: 14,
      color: colors.brand.amber,
      fontWeight: '600',
    },
    searchWrapper: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    searchInput: {
      height: 44,
      fontSize: 15,
      color: colors.text.primary,
    },
    userList: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 28,
    },
    userRow: {
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.secondary,
      backgroundColor: colors.background.secondary,
    },
    userName: {
      fontSize: 15,
      color: colors.text.primary,
    },
    emptyText: {
      textAlign: 'center',
      padding: 20,
      color: colors.text.tertiary,
      backgroundColor: colors.background.secondary,
    },
    submitButton: {
      backgroundColor: colors.brand.amber,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitLabel: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
