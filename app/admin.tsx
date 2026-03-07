import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';
import {
  confirmMatchFromAPI,
  getPendingMatchesFromAPI,
  getUsersListFromAPI,
  PendingMatch,
  UserListEntry,
} from '@/lib/apiInteractions';
import PendingMatchList from '@/components/PendingMatchList';
import AdminReportMatch from '@/components/AdminReportMatch';

export default function AdminScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [deniedModal, setDeniedModal] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const loadPendingMatches = useCallback((jwt: string) => {
    setMatchesLoading(true);
    getPendingMatchesFromAPI(jwt)
      .then((data) => setPendingMatches(data.pending_matches))
      .catch((err) => console.error('[AdminScreen] Failed to load pending matches:', err))
      .finally(() => setMatchesLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/auth');
      return;
    }
    if (!isAdmin) {
      setDeniedModal(true);
      return;
    }

    let cancelled = false;
    const jwt = session.access_token;

    getPendingMatchesFromAPI(jwt)
      .then((data) => { if (!cancelled) setPendingMatches(data.pending_matches); })
      .catch((err) => { if (!cancelled) console.error('[AdminScreen] Failed to load pending matches:', err); })
      .finally(() => { if (!cancelled) setMatchesLoading(false); });

    getUsersListFromAPI(jwt)
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => { if (!cancelled) console.error('[AdminScreen] Failed to load users:', err); });

    return () => { cancelled = true; };
  }, [loading, session, isAdmin]);

  const handleConfirmSelected = async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map((id) => confirmMatchFromAPI(session!.access_token, id))
    );
    const succeeded = ids.filter((_, i) => results[i].status === 'fulfilled');
    const failed = results.length - succeeded.length;
    setPendingMatches((prev) => prev.filter((m) => !succeeded.includes(m.id)));
    if (failed > 0) {
      setConfirmError(`${failed} match${failed > 1 ? 'es' : ''} failed to confirm.`);
    }
  };

  return (
    <ScrollView
      style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <ErrorModal
        visible={deniedModal}
        title="Access Denied"
        message="You don't have permission to view the admin panel."
        onDismiss={() => {
          setDeniedModal(false);
          router.replace('/');
        }}
      />
      {session && (
        <AdminReportMatch
          jwt={session.access_token}
          users={users}
          onMatchReported={() => loadPendingMatches(session.access_token)}
        />
      )}
      <ErrorModal
        visible={!!confirmError}
        title="Confirm Error"
        message={confirmError ?? ''}
        onDismiss={() => setConfirmError(null)}
        variant="error"
      />
      <PendingMatchList
        matches={pendingMatches}
        loading={matchesLoading}
        onConfirmSelected={handleConfirmSelected}
      />
    </ScrollView>
  );
}
