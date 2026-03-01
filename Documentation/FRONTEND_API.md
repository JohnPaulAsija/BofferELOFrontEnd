# Backend API Reference (Frontend Supplement)

This document describes the REST API exposed by the boffer combat ELO backend.
It is intended as a supplement to a frontend project's CLAUDE.md.

Base URL (local dev): `http://localhost:8000`
Base URL (Docker / Cloud Run): set by the `CORS_ORIGINS` env var on the server; use the Cloud Run service URL as your base URL from the client.

---

## Authentication

All authenticated endpoints require a Supabase JWT in the `Authorization` header.
**Never put tokens in URLs or request bodies.**

```
Authorization: Bearer <supabase_jwt>
```

Error codes returned by authenticated endpoints:
- `401` — token missing, invalid, expired, or `Authorization` header not in `Bearer <token>` format
- `403` — valid token but insufficient role (e.g. non-superAdmin hitting admin routes)
- `404` — valid token but no profile row found for that user
- `422` — `Authorization` header not provided at all
- `429` — rate limit exceeded (write endpoints only; see per-endpoint details below)

---

## Public Endpoints

### `GET /`
Simple liveness check.

**Response**
```json
{ "message": "Hello from API!" }
```

---

### `GET /health`
Health check — verifies both the server and Supabase DB connection are alive.

**Response (200 — success)**
```json
{ "status": "ok", "db": "ok" }
```

**Response (503 — DB unreachable)**
```json
{ "status": "error", "db": "unreachable" }
```

Returns HTTP 200 if both the server and Supabase connection are healthy. Returns HTTP 503 if the database is unreachable.

---

### `GET /users/top`
Returns the top 100 players sorted by ELO descending. No `Authorization` header required.

**Response (200)**
```json
{
  "leaderboard": [
    {
      "id":       "<uuid>",
      "username": "<string>",
      "elo":      1032,
      "wins":     7,
      "losses":   3
    }
  ]
}
```

- Sorted by `elo` descending (highest first)
- Maximum 100 entries
- Only includes users who have completed setup via `POST /users/me/setup` — users who signed up but have not yet set a username are excluded
- No email, role, or other PII returned
- Response is cached server-side for **60 seconds** — the leaderboard may be up to 60 s stale after a match is confirmed

---

### `GET /matches`
Returns the 100 most recently confirmed matches. No `Authorization` header required.

**Response (200)**
```json
{
  "matches": [
    {
      "id":              "<uuid>",
      "winnerId":        "<uuid>",
      "winnerName":      "<string>",
      "loserId":         "<uuid>",
      "loserName":       "<string>",
      "winnerEloBefore": 1000,
      "loserEloBefore":  984,
      "eloChange":       16,
      "confirmedAt":     "<iso timestamp>"
    }
  ]
}
```

- Sorted by `confirmedAt` descending (most recently confirmed first)
- Maximum 100 entries
- Only confirmed matches are included — pending and rejected matches are excluded
- Internal fields (`reporterId`, `confirmedById`, `rejectedAt`, etc.) are not returned
- Response is cached server-side for **60 seconds** — cleared immediately when a match is confirmed, so freshness is near-instant in practice

---

### `GET /options`
Returns valid values for all four preference fields. Use this to populate dropdown pickers in the UI. No `Authorization` header required.

**Response (200)**
```json
{
  "genders":  ["Male", "Female", "Other"],
  "games":    ["Hearthlight", "Dagorhir"],
  "weapons":  ["One Handed Sword", "Two Handed Sword", "One Handed Spear", "Two Handed Spear", "Bow", "Javelin"],
  "shields":  ["None", "Back", "Hand (grip)", "Hand (strap)", "Arm", "Shoulder"]
}
```

- Response is cached server-side for **60 seconds**
- Values are stored in database lookup tables and can be changed without a code deploy

---

### `GET /matches/{match_id}`
Returns full details for a single match by ID. Works for any match state (pending, confirmed, or rejected). No `Authorization` header required.

**Path parameters**
- `match_id` — UUID of the match

**Response (200)**
```json
{
  "match": {
    "id":              "<uuid>",
    "winnerId":        "<uuid>",
    "winnerName":      "<string>",
    "loserId":         "<uuid>",
    "loserName":       "<string>",
    "winnerEloBefore": 1000,
    "loserEloBefore":  984,
    "eloChange":       16,
    "reporterId":      "<uuid>",
    "reporterName":    "<string>",
    "reportedAt":      "<iso timestamp>",
    "confirmedAt":     "<iso timestamp> | null",
    "confirmedById":   "<uuid> | null",
    "confirmedByName": "<string> | null",
    "rejectedAt":      "<iso timestamp> | null",
    "rejectedById":    "<uuid> | null",
    "rejectedByName":  "<string> | null"
  }
}
```

**Error codes**

| Code | Condition |
|------|-----------|
| 404 | No match found with that ID |
| 422 | `match_id` is not a valid UUID |

---

### `GET /users/{user_id}/matches`
Returns confirmed match history for any player, sorted by `confirmedAt` descending. Uses cursor-based pagination. No `Authorization` header required.

**Path parameters**
- `user_id` — UUID of the player

**Query parameters**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | int | 20 | 100 | Matches per page |
| `before` | string | — | — | ISO 8601 cursor; return matches confirmed before this timestamp |

On the first page, omit `before`. On subsequent pages, pass the `next_cursor` from the previous response as `before`.

**Response (200)**
```json
{
  "matches": [
    {
      "id":              "<uuid>",
      "winnerId":        "<uuid>",
      "winnerName":      "<string>",
      "loserId":         "<uuid>",
      "loserName":       "<string>",
      "winnerEloBefore": 1000,
      "loserEloBefore":  984,
      "eloChange":       16,
      "confirmedAt":     "<iso timestamp>"
    }
  ],
  "next_cursor": "<iso timestamp> | null"
}
```

- `next_cursor` is `null` when there are no more pages
- A user with no confirmed matches returns `{ "matches": [], "next_cursor": null }` — not a 404
- Reporter, confirmer, and rejecter details are omitted (same fields as `GET /matches`)

**Error codes**

| Code | Condition |
|------|-----------|
| 404 | No user profile found with that ID |
| 422 | `user_id` is not a valid UUID, or `limit` is out of range (< 1 or > 100) |

---

### `GET /users/{user_id}`
Returns public profile stats for any player. No `Authorization` header required.

**Path parameters**
- `user_id` — UUID of the player

**Response (200)**
```json
{
  "user": {
    "id":              "<uuid>",
    "username":        "<string>",
    "elo":             1000,
    "wins":            15,
    "losses":          8,
    "gender":          "<string | null>",
    "preferredGame":   "<string | null>",
    "preferredWeapon": "<string | null>",
    "preferredShield": "<string | null>"
  }
}
```

- The four preference fields are `null` for users who have not set them
- `email`, `role_id`, and `termsAcceptedAt` are excluded — this is a public-facing shape only

**Error codes**

| Code | Condition |
|------|-----------|
| 404 | No profile found with that user ID |
| 422 | `user_id` is not a valid UUID |

---

## Authenticated Endpoints

### `GET /users`
Returns a list of all users except the authenticated user. Intended for populating the winner/loser picker when reporting a match.

**Headers**
```
Authorization: Bearer <jwt>
```

**Response (200)**
```json
{
  "users": [
    { "id": "<uuid>", "username": "<string>" }
  ]
}
```

- Results are sorted alphabetically by `username`
- The authenticated user is excluded (you cannot report a match against yourself)
- Only includes users who have completed setup via `POST /users/me/setup` — users who have not yet set a username are excluded
- Only `id` and `username` are returned — no ELO, role, or email data

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 422 | Missing `Authorization` header |

---

### `GET /users/me`
Returns the authenticated user's identity and role.

**Headers**
```
Authorization: Bearer <jwt>
```

**Response (200)**
```json
{
  "user": {
    "id":       "<uuid>",
    "email":    "<string>",
    "username": "<string>",
    "role_id":  1
  }
}
```

- `role_id` values: `1` = user, `2` = admin, `3` = superAdmin
- `email` may be `null` if not set on the Supabase auth account

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 404 | No profile row found for the authenticated user |
| 422 | Missing `Authorization` header |

---

### `GET /users/me/matches`
Returns all non-rejected matches for the authenticated user, split into two sorted lists.

**Headers**
```
Authorization: Bearer <jwt>
```

**Response (200)**
```json
{
  "confirmed": [
    {
      "confirmedAt": "<iso timestamp>",
      "winnerId": "<uuid>",
      "loserId":  "<uuid>"
      /* ...other Matches columns */
    }
  ],
  "unconfirmed": [
    {
      "confirmedAt": null,
      "winnerId": "<uuid>",
      "loserId":  "<uuid>"
      /* ...other Matches columns */
    }
  ]
}
```

- `confirmed` — matches where `confirmedAt` is not null, sorted by `confirmedAt` DESC, maximum 100 entries
- `unconfirmed` — matches where `confirmedAt` is null, sorted by `reportedAt` DESC, maximum 100 entries
- Rejected matches (`rejectedAt` is not null) are excluded from both lists

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 422 | Missing `Authorization` header |

---

### `GET /users/me/matches/unconfirmed`
Returns pending (unconfirmed) matches for the authenticated user — i.e. matches
where `confirmedAt` is NULL, `rejectedAt` is NULL, and the user is either the winner or loser.

**Headers**
```
Authorization: Bearer <jwt>
```

**Response**
```json
{
  "unconfirmed_matches": [
    {
      "winnerId": "<uuid>",
      "loserId":  "<uuid>",
      "confirmedAt": null
      /* ...other Matches columns */
    }
  ]
}
```

---

### `POST /users/me/setup`
Accept Terms & Conditions and set a username. Called once after signup. The endpoint is idempotent — re-submitting preserves the original `terms_accepted_at` timestamp.

**Headers**
```
Authorization: Bearer <jwt>
```

**Request body**
```json
{
  "username":     "my_username",
  "accept_terms": true
}
```

- `username` — 3–24 characters, letters/numbers/underscores/dashes only (`[a-zA-Z0-9_-]`), must be unique; leading/trailing whitespace is trimmed before validation
- `accept_terms` — must be `true`

**Response (200)**
```json
{
  "id":                "<uuid>",
  "username":          "my_username",
  "terms_accepted_at": "<iso timestamp>"
}
```

**Error codes**

| Code | Condition |
|------|-----------|
| 400 | `accept_terms` is `false` |
| 401 | Invalid or expired JWT |
| 409 | Username already taken |
| 422 | Missing `Authorization` header, malformed request body, or username fails validation (length or character rules) |

---

### `PATCH /users/me/preferences`
Update the authenticated user's preference fields. Sending `null` for a field clears it. All four fields are always written, so send the full desired state each time.

**Headers**
```
Authorization: Bearer <jwt>
```

**Request body**
```json
{
  "gender":           "Male",
  "preferred_game":   "Dagorhir",
  "preferred_weapon": "Two Handed Sword",
  "preferred_shield": "None"
}
```

All fields are optional and default to `null`. Valid values come from `GET /options`.

**Response (200)**
```json
{
  "gender":           "Male",
  "preferred_game":   "Dagorhir",
  "preferred_weapon": "Two Handed Sword",
  "preferred_shield": "None"
}
```

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 422 | Missing `Authorization` header, malformed body, or invalid preference value not in lookup table |

---

### `PATCH /users/{user_id}/preferences`
Update any user's preference fields. **superAdmin only** (`role_id = 3`).

**Headers**
```
Authorization: Bearer <superAdmin_jwt>
```

**Path parameters**
- `user_id` — UUID of the target user

**Request/response body** — same as `PATCH /users/me/preferences`

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 403 | Caller is not a superAdmin |
| 404 | Target user not found |
| 422 | Missing `Authorization` header, `user_id` is not a valid UUID, or invalid preference value |

---

### `POST /matches`
Reports a match between two players. Creates a pending match row (`confirmedAt = null`) with a pre-calculated ELO delta. The match must be confirmed by the other participant (or an admin) before ELO ratings are updated.

**Headers**
```
Authorization: Bearer <jwt>
```

**Request body**
```json
{
  "winner_id": "<uuid>",
  "loser_id":  "<uuid>"
}
```

**Response (201)**
```json
{
  "match": {
    "id":              "<uuid>",
    "winnerId":        "<uuid>",
    "winnerName":      "<string>",
    "loserId":         "<uuid>",
    "loserName":       "<string>",
    "winnerEloBefore": 1000,
    "loserEloBefore":  1000,
    "eloChange":       16,
    "reporterId":      "<uuid>",
    "reporterName":    "<string>",
    "reportedAt":      "<iso timestamp>",
    "confirmedAt":     null
  }
}
```

**Authorization rules**

| Role | Can report? |
|------|-------------|
| superAdmin | Any two users |
| admin | Any two users |
| user | Only if they are `winner_id` or `loser_id` |

**Error codes**

| Code | Condition |
|------|-----------|
| 400 | `winner_id` and `loser_id` are the same user |
| 401 | Invalid or expired JWT, or malformed `Authorization` header |
| 403 | Regular user not a participant in the match |
| 404 | Reporter, winner, or loser profile not found |
| 422 | Missing `Authorization` header or malformed request body |
| 429 | Rate limit exceeded (10 requests/minute per user; admins/superAdmins exempt) |

---

### `POST /matches/{match_id}/confirm`
Confirms a pending match and atomically applies the pre-calculated ELO delta to both players' `elo`, `wins`, and `losses` in the `profiles` table. The confirmation and all profile updates are executed in a single database transaction — no partial ELO state is possible.

**Headers**
```
Authorization: Bearer <jwt>
```

**Path parameters**
- `match_id` — UUID of the match to confirm

**Response (200)**
```json
{
  "match": {
    "id": "<uuid>",
    "confirmedAt":     "<iso timestamp>",
    "confirmedById":   "<uuid>",
    "confirmedByName": "<string>",
    "eloChange":       16
    /* ...other Matches columns */
  }
}
```

**Authorization rules**

| Role | Can confirm? |
|------|-------------|
| superAdmin | Any unconfirmed match |
| admin | Any unconfirmed match |
| user | Only if participant (`winnerId` or `loserId`) **and** not the `reporterId` |

**Error codes**

| Code | Condition |
|------|-----------|
| 400 | Match is already confirmed |
| 400 | Match has been rejected |
| 401 | Invalid or expired JWT, or malformed `Authorization` header |
| 403 | Not authorized to confirm this match |
| 404 | Match not found or user profile not found |
| 422 | Missing `Authorization` header, or `match_id` is not a valid UUID |
| 429 | Rate limit exceeded (20 requests/minute per user; admins/superAdmins exempt) |

---

### `POST /matches/{match_id}/reject`
Rejects a pending match. A rejected match can never be confirmed and has no effect on ELO or win/loss counts.

**Headers**
```
Authorization: Bearer <jwt>
```

**Path parameters**
- `match_id` — UUID of the match to reject

**Response (200)**
```json
{
  "match": {
    "id": "<uuid>",
    "rejectedAt":     "<iso timestamp>",
    "rejectedById":   "<uuid>",
    "rejectedByName": "<string>"
    /* ...other Matches columns */
  }
}
```

**Authorization rules**

| Role | Can reject? |
|------|-------------|
| superAdmin | Any unconfirmed, unrejected match |
| admin | Any unconfirmed, unrejected match |
| user | If participant (`winnerId` or `loserId`) **or** the `reporterId` |

**Error codes**

| Code | Condition |
|------|-----------|
| 400 | Match is already confirmed |
| 400 | Match is already rejected |
| 401 | Invalid or expired JWT, or malformed `Authorization` header |
| 403 | Not authorized to reject this match |
| 404 | Match not found or user profile not found |
| 422 | Missing `Authorization` header, or `match_id` is not a valid UUID |
| 429 | Rate limit exceeded (20 requests/minute per user; admins/superAdmins exempt) |

---

## Admin Endpoints

Most admin endpoints require `role_id = 3` (superAdmin). `GET /admin/matches/pending` is accessible to admin (`role_id = 2`) and superAdmin.

### `GET /admin/matches/pending`
Returns all pending (unconfirmed, unrejected) matches across the system, sorted by `reportedAt` descending. Accessible to admin and superAdmin.

**Headers**
```
Authorization: Bearer <admin_or_superAdmin_jwt>
```

**Query parameters**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | int | 50 | 100 | Matches per page |
| `before` | string | — | — | ISO 8601 cursor; return matches reported before this timestamp |

On the first page omit `before`. On subsequent pages pass `next_cursor` from the previous response.

**Response (200)**
```json
{
  "pending_matches": [
    {
      "id":              "<uuid>",
      "winnerId":        "<uuid>",
      "winnerName":      "<string>",
      "loserId":         "<uuid>",
      "loserName":       "<string>",
      "winnerEloBefore": 1000,
      "loserEloBefore":  984,
      "eloChange":       16,
      "reporterId":      "<uuid>",
      "reporterName":    "<string>",
      "reportedAt":      "<iso timestamp>",
      "confirmedAt":     null
    }
  ],
  "next_cursor": "<iso timestamp> | null"
}
```

- `next_cursor` is `null` when there are no more pages
- `confirmedAt` is always `null` (pending matches only)
- Results are sorted by `reportedAt` descending (most recently reported first)

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 403 | Caller is not admin or superAdmin |
| 422 | Missing `Authorization` header or invalid query params |

---

### `POST /admin/seed/users`
Creates test Supabase auth accounts with profiles. Useful for populating a dev/staging DB.

**Headers**
```
Authorization: Bearer <superAdmin_jwt>
```

**Request body**
```json
{
  "n_users":        0,
  "n_admins":       0,
  "n_super_admins": 0
}
```
All fields are optional and default to `0`. Max `100` per field.

**Response**
```json
{
  "created": [
    {
      "id":       "<uuid>",
      "email":    "test_user_<timestamp>_0@test.com",
      "username": "test_user_<timestamp>_0",
      "role":     "user"
    }
  ]
}
```

---

### `POST /admin/seed/matches`
Creates test match records in the `Matches` table.

**Headers**
```
Authorization: Bearer <superAdmin_jwt>
```

**Request body**
```json
{
  "n":         1,
  "confirmed": false
}
```
- `n` — number of matches to create (0–100, default `1`)
- `confirmed` — if `true`, sets `confirmedAt` so they count toward ELO (default `false`)

**Response**
```json
{
  "created": [ /* array of created match objects */ ]
}
```

---

### `POST /admin/reset`
**Test infrastructure only — do not call from the frontend or in production.**

Deletes all `Matches` rows and all Supabase auth users (and their profile rows) except the bootstrap superAdmin account identified by the `SUPER_ADMIN_EMAIL` server env var. Used by the test suite's `reset_and_seed` fixture to wipe the test Supabase project before seeding fresh accounts.

**Headers**
```
Authorization: Bearer <superAdmin_jwt>
```

**Response (200)**
```json
{ "reset": true }
```

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 403 | Caller is not a superAdmin |
| 422 | Missing `Authorization` header |
| 500 | `SUPER_ADMIN_EMAIL` env var not set on the server (configuration error) |

---

### `DELETE /admin/matches/{match_id}`
Permanently deletes a match record from the database. Intended for dev/test cleanup — no ELO rollback is performed.

**Headers**
```
Authorization: Bearer <superAdmin_jwt>
```

**Path parameters**
- `match_id` — UUID of the match to delete

**Response (200)**
```json
{ "deleted": "<match_id>" }
```

**Error codes**

| Code | Condition |
|------|-----------|
| 401 | Invalid or expired JWT |
| 403 | Caller is not a superAdmin |
| 404 | Match not found |
| 422 | Missing `Authorization` header |

---

## Roles

| Role       | `role_id` | Admin endpoint access |
|------------|-----------|----------------------|
| user       | 1         | None |
| admin      | 2         | `GET /admin/matches/pending` only |
| superAdmin | 3         | All admin endpoints |

---

## Notes for Frontend Developers

- **ELO baseline** — new users start at ELO `1000`.
- **Confirmed vs pending** — only matches with a non-NULL `confirmedAt` affect ELO rankings.
- **Caching** — `GET /users/top` and `GET /matches` are cached server-side for 60 seconds each. Both caches are cleared immediately when a match is confirmed, so updates appear near-instantly. Authenticated per-user endpoints are not cached.
- **CORS** — only specific origins are allowed. Permitted origins: `http://localhost:8081`, `http://localhost:19006`, `http://localhost:8080`, plus any origins set in the server's `CORS_ORIGINS` env var. Android and iOS native apps are unaffected by CORS. Do not send requests with `credentials: 'include'`; auth is handled via the `Authorization` header only.
