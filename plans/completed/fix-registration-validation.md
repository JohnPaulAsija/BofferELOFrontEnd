# Plan: Add Input Validation to Registration

## Problem
`app/register.tsx` `handleRegister()` (lines 117-133) has minimal validation:
- Email: only checks non-empty (no format check)
- Password: only checks non-empty and matches confirm (no strength rules)
- Username: only checks length >= 3 (no character restrictions)

## Changes

### 1. Add validation constants
Add a small set of regex patterns and rules at the top of `app/register.tsx`, after imports:

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 24;
```

### 2. Update `handleRegister()` validation block
Replace lines 117-133 with expanded checks, in this order:

```typescript
async function handleRegister() {
  const trimmedEmail = email.trim();
  const trimmedUsername = username.trim();

  if (!trimmedEmail || !password || !confirmPassword || !trimmedUsername) {
    showError("Missing Fields", "Please fill in all required fields.");
    return;
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    showError("Invalid Email", "Please enter a valid email address.");
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    showError("Password Too Short", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }
  if (password !== confirmPassword) {
    showError("Password Mismatch", "Passwords do not match.");
    return;
  }
  if (trimmedUsername.length < 3 || trimmedUsername.length > MAX_USERNAME_LENGTH) {
    showError("Invalid Username", `Username must be between 3 and ${MAX_USERNAME_LENGTH} characters.`);
    return;
  }
  if (!USERNAME_REGEX.test(trimmedUsername)) {
    showError("Invalid Username", "Username can only contain letters, numbers, underscores, and dashes.");
    return;
  }
  if (!termsAccepted) {
    showError("Terms Required", "You must accept the Terms & Conditions to continue.");
    return;
  }

  // ... rest of function unchanged, but use trimmedEmail and trimmedUsername
```

### 3. Use trimmed values in API calls
Replace `email.trim()` and `username.trim()` in the API calls (lines 140, 157) with the local `trimmedEmail` and `trimmedUsername` already computed above.

## Files to Change
- Edit: `app/register.tsx`
