import React from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { ThemedText } from '../themed-text'

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
  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    height: 48,
    fontSize: 16,
    color: '#000',
  },
})
