import React from 'react';
import { View, StyleSheet } from 'react-native';
import Auth from '@/components/Auth';
import { BofferEloColors } from '@/constants/theme';

export default function AuthPage() {
  return (
    <View style={styles.container}>
      <Auth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BofferEloColors.background.primary,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
