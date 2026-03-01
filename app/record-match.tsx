import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';

export default function RecordMatchScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setAuthModal(true);
    }
  }, [loading, session]);

  return (
    <View style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
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
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 }}>
        ⚔️ Match Reporting
      </Text>
      <Text style={{ fontSize: 16, color: colors.text.secondary }}>
        Match reporting is coming soon
      </Text>
    </View>
  );
}
