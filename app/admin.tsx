import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';

export default function AdminScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [deniedModal, setDeniedModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/auth');
      return;
    }
    if (!isAdmin) {
      setDeniedModal(true);
    }
  }, [loading, session, isAdmin]);

  return (
    <View style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
      <ErrorModal
        visible={deniedModal}
        title="Access Denied"
        message="You don't have permission to view the admin panel."
        onDismiss={() => {
          setDeniedModal(false);
          router.replace('/');
        }}
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 }}>
        Admin Panel
      </Text>
      <Text style={{ fontSize: 16, color: colors.text.secondary }}>
        Admin panel coming soon
      </Text>
    </View>
  );
}
