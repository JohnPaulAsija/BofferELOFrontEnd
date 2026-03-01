# Plan: Issue 15 — Standardize Error Modal State with `useErrorModal`

## Problem

Four components manage their own inline error modal state with slightly different shapes:

| File | State shape |
|------|-------------|
| `app/register.tsx` | `{ visible, title, message, variant, onAfterDismiss? }` + `showError()`, `showInfo()`, `hideModal()` helpers |
| `components/ProfilePreferences.tsx` | `{ visible, title, message }` — no `variant`, no `onAfterDismiss` |
| `app/record-match.tsx` | `{ visible, title, message }` for `errorModal` — `variant` passed inline to `<ErrorModal>` |
| `components/Auth.tsx` | `{ visible, title, message }` — no `variant`, no `onAfterDismiss` |

`register.tsx` is the most complete version; the others are cut-down copies. Any new consumer would need to pick a shape or invent another one.

---

## Approach

Extract the modal state and helper functions into a `hooks/useErrorModal.ts` hook that all consumers can share. The hook uses the full `register.tsx` shape so no capability is lost.

---

## Step 1: Create `hooks/useErrorModal.ts`

```ts
import { useState } from 'react';

type ModalState = {
  visible: boolean;
  title: string;
  message: string;
  variant: 'error' | 'info';
  onAfterDismiss?: () => void;
};

const HIDDEN: ModalState = { visible: false, title: '', message: '', variant: 'error' };

export function useErrorModal() {
  const [modal, setModal] = useState<ModalState>(HIDDEN);

  function showError(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'error', onAfterDismiss });
  }

  function showInfo(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: 'info', onAfterDismiss });
  }

  function hideModal() {
    const afterDismiss = modal.onAfterDismiss;
    setModal(prev => ({ ...prev, visible: false, onAfterDismiss: undefined }));
    afterDismiss?.();
  }

  return { modal, showError, showInfo, hideModal };
}
```

---

## Step 2: Update consumers

### `app/register.tsx`
- Remove the inline `modal` state and the three helper functions (`showError`, `showInfo`, `hideModal`)
- Replace with `const { modal, showError, showInfo, hideModal } = useErrorModal();`
- No changes to the JSX — prop names match exactly

### `components/ProfilePreferences.tsx`
- Remove the inline `modal` state and the `setModal(...)` calls
- Replace with `const { modal, showError, hideModal } = useErrorModal();`
- Update the `catch` block: `setModal({ visible: true, title: 'Save Failed', message: ... })` → `showError('Save Failed', ...)`
- Update `<ErrorModal onDismiss>`: replace the inline setter with `hideModal`
- Also fix the `catch (err: any)` to `catch (err: unknown)` with `instanceof Error` narrowing (overlaps with issue 10)

### `app/record-match.tsx`
- Remove the inline `errorModal` state
- Replace with `const { modal: errorModal, showError, hideModal: hideErrorModal } = useErrorModal();`
- Update the `catch` block in `handleSubmit`: `setErrorModal({ visible: true, ... })` → `showError('Failed to Report Match', ...)`
- Update `<ErrorModal onDismiss>`: `setErrorModal({ ...errorModal, visible: false })` → `hideErrorModal()`
- The `authModal` boolean state is separate and unrelated — leave it unchanged

### `components/Auth.tsx`
- Remove the inline `modal` state
- Replace with `const { modal, showError, hideModal } = useErrorModal();`
- Update `showError(...)` call — already named `showError`, but currently it's a local function that sets state. Replace the local function with the hook's `showError`.
- Update `<ErrorModal onDismiss>`: replace inline setter with `hideModal`

---

## Files Touched

- `hooks/useErrorModal.ts` — new file
- `app/register.tsx` — swap inline state/helpers for hook
- `components/ProfilePreferences.tsx` — swap inline state for hook
- `app/record-match.tsx` — swap `errorModal` state for hook
- `components/Auth.tsx` — swap inline state for hook
