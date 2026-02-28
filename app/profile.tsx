import React from 'react';
import { ScrollView } from 'react-native';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileComponent from '@/components/UserProfile';

export default function ProfileScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session } = useAuth();

  return (
    <ScrollView
      style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {session && <UserProfileComponent userId={session.user.id} />}
    </ScrollView>
  );
}
