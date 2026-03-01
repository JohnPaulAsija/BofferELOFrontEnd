# Planned Change: POST /users/me/register

## Background

The frontend registration flow currently makes two sequential API calls after
a successful `supabase.auth.signUp()`:

1. `POST /users/me/setup` — sets username and records terms acceptance
2. `PATCH /users/me/preferences` — sets optional profile fields (gender,
   preferred_game, preferred_weapon, preferred_shield)

These are two round-trips that can fail independently. If the preferences call
fails after setup succeeds, the user is in a partially-configured state with no
recovery path on the registration screen.

## Requested Change

Add a new endpoint:

```
POST /users/me/register
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

This single endpoint replaces both `POST /users/me/setup` and
`PATCH /users/me/preferences` for the registration flow. It should handle
both operations atomically — either the full registration succeeds or nothing
is written.

## Request Body

```json
{
  "username": "string (required, min 3 chars)",
  "accept_terms": true,
  "gender": "string | null (optional)",
  "preferred_game": "string | null (optional)",
  "preferred_weapon": "string | null (optional)",
  "preferred_shield": "string | null (optional)"
}
```

All preference fields are optional and nullable. If omitted entirely they
should be treated the same as `null` (no preference stored).

## Response

**201 Created** on success. Body can mirror the existing setup response, or
return the full profile — frontend doesn't strictly need a body but it's
useful for debugging.

Standard error responses for:
- `400` — missing/invalid required fields (username too short, accept_terms
  not true, etc.)
- `409` — username already taken
- `401` — invalid or missing JWT
- `422` — validation errors (unrecognized gender/game/weapon/shield values if
  the backend validates against an allow-list)

## Behaviour Requirements

1. **Atomic** — username setup and preference writes must be in the same DB
   transaction. If preferences fail, the profile row must not be created/updated.
2. **Idempotency** — if the user's profile already exists and is fully set up,
   return a clear error (`409` or `400`) rather than silently overwriting.
   The existing `/users/me/setup` endpoint presumably already enforces one-time
   setup; this endpoint should do the same.
3. **Validation** — enforce the same username rules as the existing setup
   endpoint (min length, allowed characters, uniqueness).
4. **Terms** — `accept_terms` must be `true`. Reject with `400` if it is
   `false` or missing.
5. **Preference values** — if the backend validates preference values against
   an allow-list (same source as `GET /options`), apply the same validation
   here. Unknown values should return `422`.

## Existing Endpoints

The existing `POST /users/me/setup` and `PATCH /users/me/preferences` endpoints
do **not** need to be removed — other flows or admin tooling may use them.
This new endpoint is additive.

## Frontend Impact

Once this endpoint exists, `app/register.tsx` will replace:

```ts
await setupUserFromAPI(session.access_token, username.trim());

if (gender || preferredGame || preferredWeapon || preferredShield) {
  await updatePreferencesFromAPI(session.access_token, {
    gender,
    preferred_game: preferredGame,
    preferred_weapon: preferredWeapon,
    preferred_shield: preferredShield,
  });
}
```

with a single call to a new `registerUserFromAPI` function that hits
`POST /users/me/register` with all fields in one payload.
