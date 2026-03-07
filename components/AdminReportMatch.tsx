import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorModal } from '@/components/ui/error-modal';
import { useErrorModal } from '@/hooks/useErrorModal';
import { UserListEntry, reportMatchFromAPI } from '@/lib/apiInteractions';

interface Props {
  jwt: string;
  users: UserListEntry[];
  onMatchReported: () => void;
}

interface PlayerPickerProps {
  query: string;
  onQueryChange: (v: string) => void;
  users: UserListEntry[];
  onSelect: (u: UserListEntry) => void;
  colors: ReturnType<typeof getThemeColors>;
  s: ReturnType<typeof styles>;
}

function PlayerPicker({ query, onQueryChange, users, onSelect, colors, s }: PlayerPickerProps) {
  const visible = users.slice(0, 5);
  return (
    <>
      <View style={s.searchWrapper}>
        <TextInput
          style={s.searchInput}
          placeholder="Search players..."
          placeholderTextColor={colors.text.tertiary}
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
        />
      </View>
      <View style={s.userList}>
        {visible.length === 0 ? (
          <Text style={s.emptyText}>No players found</Text>
        ) : (
          visible.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={s.userRow}
              onPress={() => onSelect(user)}
              activeOpacity={0.7}
            >
              <Text style={s.userName}>{user.username}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
}

export default function AdminReportMatch({ jwt, users, onMatchReported }: Props) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [winnerQuery, setWinnerQuery] = useState('');
  const [loserQuery, setLoserQuery] = useState('');
  const [selectedWinner, setSelectedWinner] = useState<UserListEntry | null>(null);
  const [selectedLoser, setSelectedLoser] = useState<UserListEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { modal, showError, hideModal } = useErrorModal();

  const filteredWinners = users.filter(
    (u) =>
      u.username.toLowerCase().includes(winnerQuery.toLowerCase()) &&
      u.id !== selectedLoser?.id
  );
  const filteredLosers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(loserQuery.toLowerCase()) &&
      u.id !== selectedWinner?.id
  );

  const canSubmit = selectedWinner !== null && selectedLoser !== null && !submitting;

  const handleSubmit = async () => {
    if (!selectedWinner || !selectedLoser) return;
    setSubmitting(true);
    try {
      const result = await reportMatchFromAPI(jwt, selectedWinner.id, selectedLoser.id);
      setSuccessMessage(
        `${result.winnerName} defeated ${result.loserName} (+${result.eloChange} ELO). The match is pending confirmation.`
      );
    } catch (err: unknown) {
      showError(
        'Failed to Report Match',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDismiss = () => {
    setSuccessMessage('');
    setSelectedWinner(null);
    setSelectedLoser(null);
    setWinnerQuery('');
    setLoserQuery('');
    onMatchReported();
  };

  const s = styles(isDark, colors);

  return (
    <View style={s.card}>
      <ErrorModal
        visible={!!successMessage}
        title="Match Reported!"
        message={successMessage}
        variant="info"
        onDismiss={handleSuccessDismiss}
      />
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant="error"
        onDismiss={hideModal}
      />

      <Text style={s.cardTitle}>Report Match</Text>

      <Text style={s.label}>Winner</Text>
      {selectedWinner ? (
        <View style={s.selected}>
          <Text style={s.selectedName}>{selectedWinner.username}</Text>
          <TouchableOpacity onPress={() => setSelectedWinner(null)}>
            <Text style={s.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PlayerPicker
          query={winnerQuery}
          onQueryChange={setWinnerQuery}
          users={filteredWinners}
          onSelect={setSelectedWinner}
          colors={colors}
          s={s}
        />
      )}

      <Text style={[s.label, { marginTop: 16 }]}>Loser</Text>
      {selectedLoser ? (
        <View style={s.selected}>
          <Text style={s.selectedName}>{selectedLoser.username}</Text>
          <TouchableOpacity onPress={() => setSelectedLoser(null)}>
            <Text style={s.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PlayerPicker
          query={loserQuery}
          onQueryChange={setLoserQuery}
          users={filteredLosers}
          onSelect={setSelectedLoser}
          colors={colors}
          s={s}
        />
      )}

      <TouchableOpacity
        style={[s.submitButton, !canSubmit && s.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitLabel}>Report Match</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = (isDark: boolean, colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.primary,
      padding: 16,
      marginBottom: 20,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    selected: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background.tertiary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.brand.amber,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 4,
    },
    selectedName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },
    changeBtn: {
      fontSize: 13,
      color: colors.brand.amber,
      fontWeight: '600',
    },
    searchWrapper: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      backgroundColor: colors.background.tertiary,
      paddingHorizontal: 12,
      marginBottom: 4,
    },
    searchInput: {
      height: 40,
      fontSize: 14,
      color: colors.text.primary,
    },
    userList: {
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 4,
    },
    userRow: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.secondary,
      backgroundColor: colors.background.tertiary,
    },
    userName: {
      fontSize: 14,
      color: colors.text.primary,
    },
    emptyText: {
      textAlign: 'center',
      padding: 16,
      color: colors.text.tertiary,
      fontSize: 13,
      backgroundColor: colors.background.tertiary,
    },
    submitButton: {
      backgroundColor: colors.brand.amber,
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitLabel: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
