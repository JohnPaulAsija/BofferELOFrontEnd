# Proposed Endpoint: `GET /admin/matches/pending`

## Motivation

The admin panel needs to display all unconfirmed (pending) matches across the entire system so that admins can review and confirm them. There is currently no endpoint that returns system-wide pending matches — `GET /matches` only returns confirmed matches and `GET /users/me/matches` is scoped to the authenticated user.

---

## Specification

### `GET /admin/matches/pending`

Returns all pending matches (where `confirmedAt IS NULL` and `rejectedAt IS NULL`), sorted by `reportedAt` descending. Requires admin or superAdmin role.

**Headers**
```
Authorization: Bearer <jwt>
```

**Query parameters**

| Parameter | Type   | Default | Max | Description                                                      |
|-----------|--------|---------|-----|------------------------------------------------------------------|
| `limit`   | int    | 50      | 100 | Matches per page                                                 |
| `before`  | string | —       | —   | ISO 8601 cursor; return matches reported before this timestamp   |

Cursor-based pagination matches the pattern used by `GET /users/{user_id}/matches`. On the first request omit `before`; on subsequent pages pass `next_cursor` from the previous response.

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

- `next_cursor` is `null` when there are no more pages.
- Results are sorted by `reportedAt` descending (most recently reported first).
- Only matches where both `confirmedAt IS NULL` and `rejectedAt IS NULL` are returned.

**Authorization**

| Role       | Access |
|------------|--------|
| superAdmin | Yes    |
| admin      | Yes    |
| user       | No — returns 403 |

**Error codes**

| Code | Condition                                              |
|------|--------------------------------------------------------|
| 401  | Invalid or expired JWT                                 |
| 403  | Caller is not admin or superAdmin                      |
| 422  | Missing `Authorization` header or invalid query params |

---

## Frontend usage

Once this endpoint exists, `lib/apiInteractions.ts` will add:

```typescript
export type PendingMatch = {
  id: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerEloBefore: number;
  loserEloBefore: number;
  eloChange: number;
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  confirmedAt: null;
};

export const getPendingMatchesFromAPI = async (jwt: string): Promise<PendingMatch[]> => {
  const response = await fetch(`${API_URL}/admin/matches/pending`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    throw err;
  }
  const data = await response.json();
  return data.pending_matches as PendingMatch[];
};
```

The admin panel (`app/admin.tsx`) will call this on mount and render each match as a row with a Confirm button that calls `POST /matches/{id}/confirm`.

---

## Notes

- The `eloChange` field in the response is the pre-calculated delta stored when the match was reported — no re-calculation is needed on confirm.
- Pagination is recommended but the admin panel can start with a single page (limit 50) and add "load more" later.
- The route is placed under `/admin/` to make the role requirement clear and consistent with existing admin endpoints (`/admin/seed/...`, `/admin/reset`, `/admin/matches/{id}`).
