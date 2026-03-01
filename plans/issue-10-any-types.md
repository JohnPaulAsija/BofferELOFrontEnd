# Plan: Issue 10 — Eliminate Remaining `any` Types

## Problem

Two locations still use `: any` despite `strict: true` in tsconfig:

1. `components/AppHeader.tsx` lines 9–12 — four local icon components typed as `{ style }: any`
2. `app/record-match.tsx:79` — `catch (err: any)` in `handleSubmit`

## Fixes

### 1. `components/AppHeader.tsx` — icon prop types

The four components (`Sword`, `Swords`, `LogIn`, `LogOut`) each accept a `style` prop passed to a `<Text>` element. The correct type is `StyleProp<TextStyle>` from `react-native`.

```ts
// before
const Sword = ({ style }: any) => <Text style={[{ fontSize: 24 }, style]}>⚔️</Text>;

// after
import { StyleProp, TextStyle } from 'react-native';

const Sword = ({ style }: { style?: StyleProp<TextStyle> }) => ...
```

Apply the same change to `Swords`, `LogIn`, and `LogOut`. `StyleProp<TextStyle>` should be optional (`?`) since none of the call sites are required to pass it.

`StyleProp` and `TextStyle` are already available from the existing `react-native` import — just add them to the named imports.

### 2. `app/record-match.tsx:79` — catch block

```ts
// before
} catch (err: any) {
  setErrorModal({
    visible: true,
    title: 'Failed to Report Match',
    message: err.message || 'Something went wrong. Please try again.',
  });
}

// after
} catch (err: unknown) {
  setErrorModal({
    visible: true,
    title: 'Failed to Report Match',
    message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
  });
}
```

The `|| 'fallback'` short-circuit on `any` is replaced by an explicit `instanceof Error` check, which is what TypeScript strict mode requires.

## Files Touched

- `components/AppHeader.tsx` — add `StyleProp`, `TextStyle` to react-native imports; update 4 component prop types
- `app/record-match.tsx` — change one catch block
