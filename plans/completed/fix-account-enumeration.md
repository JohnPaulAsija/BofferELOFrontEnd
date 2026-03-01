# Plan: Prevent Account Enumeration via Error Messages

## Problem
Both `components/Auth.tsx` and `app/register.tsx` display raw Supabase error messages to the user. Supabase returns different messages for "user not found" vs "invalid password" vs "user already registered", allowing an attacker to determine which email addresses have accounts.

### Current code

**`components/Auth.tsx:36-37`**
```typescript
if (error) {
  showError("Sign In Failed", error.message);  // raw Supabase message
}
```

**`app/register.tsx:142-143`**
```typescript
if (signUpError) {
  showError("Sign Up Failed", signUpError.message);  // raw Supabase message
}
```

## Changes

### 1. Use generic message for sign-in errors (`components/Auth.tsx`)
Replace line 37:
```typescript
// Before
showError("Sign In Failed", error.message);

// After
showError("Sign In Failed", "Invalid email or password. Please try again.");
```

This hides whether the email exists or the password was wrong.

### 2. Use generic message for sign-up auth errors (`app/register.tsx`)
Replace line 143:
```typescript
// Before
showError("Sign Up Failed", signUpError.message);

// After
showError("Sign Up Failed", "Unable to create account. The email may already be in use, or the password does not meet requirements.");
```

This covers both "already registered" and other auth-layer errors without revealing which case it is.

### 3. Sanitize catch-block error in register.tsx
Replace line 170 (`catch (err: any)`) to avoid leaking backend details:
```typescript
// Before
} catch (err: any) {
  showError("Registration Failed", err.message || "An unexpected error occurred.");
}

// After
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  showError("Registration Failed", message);
}
```

This also fixes the `any` type usage (issue #10 from the review).

## Files to Change
- Edit: `components/Auth.tsx` (line 37)
- Edit: `app/register.tsx` (lines 143, 169-170)
