import React from 'react';
import { ScrollView } from 'react-native';
import Leaderboard from '@/components/Leaderboard';
import NewsWidget from '@/components/NewsWidget';
import RecentMatches from '@/components/RecentMatches';
import { useTheme } from '@/contexts/ThemeContext';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <ScrollView
        style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <NewsWidget />
        <Leaderboard />
        <RecentMatches />
      </ScrollView>
  );
}
