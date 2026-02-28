import React from 'react';
import { View } from 'react-native';
import Auth from '@/components/Auth';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthPage() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background.primary,
      justifyContent: 'center',
      paddingHorizontal: 20,
    }}>
      <Auth />
    </View>
  );
}
