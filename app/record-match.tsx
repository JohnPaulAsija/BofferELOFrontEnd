import React from 'react';
import { View, Text } from 'react-native';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function RecordMatchScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={[BofferEloStyles.stackContent, { flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 }}>
        ⚔️ Match Reporting
      </Text>
      <Text style={{ fontSize: 16, color: colors.text.secondary }}>
        Match reporting is coming soon
      </Text>
    </View>
  );
}
