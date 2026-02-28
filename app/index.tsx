import React from 'react';
import { View } from 'react-native';
import AppHeader from '@/components/AppHeader';
import Leaderboard from '@/components/Leaderboard';
import { useTheme } from '@/contexts/ThemeContext';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}>
      <AppHeader />
      <Leaderboard />
    </View>
  );
}
