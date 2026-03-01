# Plan: Issue 8 — Map API Errors to User-Friendly Messages

## Problem

`lib/apiInteractions.ts` throws errors using raw backend `detail` strings (e.g. `"Username already taken"`, `"Rate limit exceeded for role user"`). Callers like `app/register.tsx` and `app/record-match.tsx` display `err.message` directly, leaking backend implementation details into the UI.

Three functions currently propagate raw `detail`:
- `setupUserFromAPI` — called by `app/register.tsx`
- `reportMatchFromAPI` — called by `app/record-match.tsx`
- `updatePreferencesFromAPI` — called by `components/ProfilePreferences.tsx`

## Approach

Map errors to friendly messages inside `apiInteractions.ts` at the point where the error is constructed, keyed on HTTP status code. Callers don't need to change — they already use `err.message` or a generic fallback.

No new types or classes needed; the existing `new Error(message)` pattern is fine.

## Changes

### `lib/apiInteractions.ts`

Replace the `(data as any).detail || \`HTTP ${response.status}\`` pattern in the three affected functions with status-based friendly messages:

**`setupUserFromAPI`** (POST `/users/me/setup`):
| Status | Message |
|--------|---------|
| 409    | `"That username is already taken. Please choose a different one."` |
| 400    | `"Invalid username. Please use only letters, numbers, and underscores (3–30 characters)."` |
| default | `"Account setup failed. Please try again."` |

**`reportMatchFromAPI`** (POST `/matches`):
| Status | Message |
|--------|---------|
| 409    | `"This match has already been reported."` |
| 429    | `"You've reported too many matches recently. Please wait before reporting another."` |
| 400    | `"Invalid match data. Please check your selection and try again."` |
| default | `"Failed to report match. Please try again."` |

**`updatePreferencesFromAPI`** (PATCH `/users/me/preferences`):
| Status | Message |
|--------|---------|
| 400    | `"Invalid preference value. Please check your selections."` |
| default | `"Failed to save preferences. Please try again."` |

The `(data as any).detail` reads can be removed entirely once messages are status-keyed. The `await response.json().catch(() => ({}))` calls that exist only to read `detail` can also be removed.

## Files Touched

- `lib/apiInteractions.ts` — only the three error-construction blocks in `setupUserFromAPI`, `reportMatchFromAPI`, and `updatePreferencesFromAPI`

No changes to callers needed — they already display `err.message`.
