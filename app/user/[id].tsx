import React from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import UserProfileComponent from '@/components/UserProfile';

export default function WarriorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <ScrollView
      style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {id && <UserProfileComponent userId={id} />}
    </ScrollView>
  );
}
