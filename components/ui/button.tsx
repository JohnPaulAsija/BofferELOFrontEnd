import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { getThemeColors } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
}

export function Button({ title, onPress, disabled = false, loading = false }: ButtonProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.brand.amber },
        disabled && { backgroundColor: colors.border.secondary, opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text.white} />
      ) : (
        <Text style={[styles.buttonText, { color: colors.text.white }]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
