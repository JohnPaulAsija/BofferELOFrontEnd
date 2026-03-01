# Plan: Ensure .env Security

## Status: Partially resolved

The `.gitignore` already excludes `.env` and `git ls-files` confirms it is **not tracked**. The original review flagged this as high severity, but it is lower risk than initially assessed.

## Remaining Work

### 1. Add `.env.example` for developer onboarding
Create a `.env.example` with placeholder values so new developers know which variables are required without exposing real credentials.

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
EXPO_PUBLIC_API_URL=https://your-api.run.app
```

### 2. Add runtime validation for env vars
In `lib/supabase.ts` and `lib/apiInteractions.ts`, validate that required env vars are present and use HTTPS at startup. Currently, missing vars silently produce `undefined` URLs.

**`lib/supabase.ts`** — add after the existing const declarations:
```typescript
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTPS');
}
```

**`lib/apiInteractions.ts`** — add after the `API_URL` declaration:
```typescript
if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}
if (!API_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS');
}
```

## Files to Change
- Create: `.env.example`
- Edit: `lib/supabase.ts` (add validation)
- Edit: `lib/apiInteractions.ts` (add validation)
