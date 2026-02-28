import React from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { ThemedText } from '../themed-text'
import { getThemeColors } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

interface InputProps {
  label?: string
  onChangeText: (text: string) => void
  value: string
  placeholder?: string
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  secureTextEntry?: boolean
}

export function Input({
  label,
  onChangeText,
  value,
  placeholder,
  autoCapitalize = 'sentences',
  secureTextEntry = false,
}: InputProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <View style={[styles.inputWrapper, {
        borderColor: colors.border.primary,
        backgroundColor: colors.background.secondary,
      }]}>
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          onChangeText={onChangeText}
          value={value}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    height: 48,
    fontSize: 16,
  },
})
