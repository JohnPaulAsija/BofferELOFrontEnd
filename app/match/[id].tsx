import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View
      style={[
        BofferEloStyles.stackContent,
        { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
        Match Detail
      </Text>
      <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
        Match ID: {id}
      </Text>
      <Text style={{ fontSize: 13, color: colors.text.tertiary, marginTop: 16 }}>
        (Coming soon)
      </Text>
    </View>
  );
}
