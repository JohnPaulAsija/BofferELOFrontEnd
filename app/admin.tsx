import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';
import {
  confirmMatchesFromAPI,
  rejectMatchesFromAPI,
  getPendingMatchesFromAPI,
  getUsersListFromAPI,
  PendingMatch,
  UserListEntry,
  BatchMatchResponse,
} from '@/lib/apiInteractions';
import PendingMatchList from '@/components/PendingMatchList';
import AdminReportMatch from '@/components/AdminReportMatch';

function buildBatchErrorMessage(
  response: BatchMatchResponse,
  action: 'confirm' | 'reject'
): string | null {
  if (response.failed === 0) return null;
  const errorItems = response.results.filter((r) => r.status === 'error');
  if (errorItems.length === 1) {
    return `Failed to ${action} match: ${errorItems[0].error}`;
  }
  const grouped: Record<string, number> = {};
  for (const item of errorItems) {
    const msg = item.error ?? 'Unknown error';
    grouped[msg] = (grouped[msg] ?? 0) + 1;
  }
  const lines = Object.entries(grouped).map(
    ([msg, count]) => `${count} match${count > 1 ? 'es' : ''}: ${msg}`
  );
  return `Failed to ${action} ${response.failed} match${response.failed > 1 ? 'es' : ''}:\n${lines.join('\n')}`;
}

export default function AdminScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [deniedModal, setDeniedModal] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [users, setUsers] = useState<UserListEntry[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

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
    try {
      const response = await confirmMatchesFromAPI(session!.access_token, ids);
      const succeededIds = response.results
        .filter((r) => r.status === 'confirmed')
        .map((r) => r.match_id);
      setPendingMatches((prev) => prev.filter((m) => !succeededIds.includes(m.id)));
      const errorMsg = buildBatchErrorMessage(response, 'confirm');
      if (errorMsg) setActionError(errorMsg);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm matches.');
    }
  };

  const handleRejectSelected = async (ids: string[]) => {
    try {
      const response = await rejectMatchesFromAPI(session!.access_token, ids);
      const succeededIds = response.results
        .filter((r) => r.status === 'rejected')
        .map((r) => r.match_id);
      setPendingMatches((prev) => prev.filter((m) => !succeededIds.includes(m.id)));
      const errorMsg = buildBatchErrorMessage(response, 'reject');
      if (errorMsg) setActionError(errorMsg);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject matches.');
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
        visible={!!actionError}
        title="Error"
        message={actionError ?? ''}
        onDismiss={() => setActionError(null)}
        variant="error"
      />
      <PendingMatchList
        matches={pendingMatches}
        loading={matchesLoading}
        onConfirmSelected={handleConfirmSelected}
        onRejectSelected={handleRejectSelected}
      />
    </ScrollView>
  );
}
