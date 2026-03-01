import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { getThemeColors } from '@/constants/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const colors = getThemeColors(false);
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background.primary }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginBottom: 24 }}>
            The app ran into an unexpected error. Please try again.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: colors.brand.amber, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
