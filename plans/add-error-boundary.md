# Plan: Add Error Boundary (Issue #7)

## Problem

No `ErrorBoundary` component exists in the app. An unhandled JavaScript exception thrown during rendering in any component will crash the entire app with a white screen and no recovery path.

## Approach

Create a class-based `ErrorBoundary` component (React error boundaries must be class components — there is no hook equivalent) and wrap `<RootLayoutInner />` in `app/_layout.tsx` with it.

### Steps

1. **Create `components/ErrorBoundary.tsx`** — A class component that:
   - Implements `getDerivedStateFromError` to catch render errors
   - Renders a user-friendly fallback screen with:
     - An error message ("Something went wrong")
     - A "Try Again" button that resets the error state (clears `hasError`) so the tree re-renders
   - Uses theme colors from props (since class components can't use hooks, pass `isDark` as a prop or use a default fallback)
   - Keeps it simple — no error reporting service, just a recovery UI

```tsx
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
      // Use a static fallback since we can't use hooks in a class component.
      // Dark mode detection isn't critical here — this is a crash screen.
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
```

2. **Wrap `RootLayoutInner` in `app/_layout.tsx`:**

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <RootLayoutInner />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

The boundary is placed **inside** `ThemeProvider`/`AuthProvider` so that if those providers throw, the app still crashes (which is correct — there's no meaningful fallback without auth/theme context). But any error in the actual screen tree is caught.

## Files Changed

| File | Change |
|---|---|
| `components/ErrorBoundary.tsx` | **New file** — class-based error boundary component |
| `app/_layout.tsx` | Import `ErrorBoundary`, wrap `<RootLayoutInner />` |

## Design Decisions

- **Class component**: Required by React — `getDerivedStateFromError` and `componentDidCatch` only work in class components.
- **Light mode fallback**: The fallback screen uses light theme by default since it can't access the `useTheme` hook. This is acceptable for a crash recovery screen.
- **Placement inside providers**: Errors in `ThemeProvider` or `AuthProvider` won't be caught, but those are thin wrappers unlikely to throw. Putting the boundary outside them would mean the fallback screen can't use theme context at all.
- **No error reporting**: Kept minimal. `componentDidCatch` logs to console. An external service (Sentry, etc.) can be added later.

## Risk

Low. Adding an error boundary is purely additive — it doesn't affect normal rendering and only activates on unhandled exceptions.
