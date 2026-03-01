import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';
import { getPendingMatchesFromAPI, PendingMatch } from '@/lib/apiInteractions';
import PendingMatchList from '@/components/PendingMatchList';

export default function AdminScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [deniedModal, setDeniedModal] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

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
    getPendingMatchesFromAPI(session.access_token)
      .then((data) => { if (!cancelled) setPendingMatches(data.pending_matches); })
      .catch((err) => { if (!cancelled) console.error('[AdminScreen] Failed to load pending matches:', err); })
      .finally(() => { if (!cancelled) setMatchesLoading(false); });

    return () => { cancelled = true; };
  }, [loading, session, isAdmin]);

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
      <PendingMatchList
        matches={pendingMatches}
        loading={matchesLoading}
      />
    </ScrollView>
  );
}
