# Plan: Backend Validation to Match Frontend Rules

## Why
Client-side validation is UX-only. Any user can call the API directly with `curl` or Postman, bypassing all frontend checks. The backend must be the source of truth for data integrity.

## Gaps identified (from `FRONTEND_API.md` + frontend plan)

### 1. Username validation on `POST /users/me/setup`
The API docs state "minimum 3 characters, must be unique" but do not mention:
- **Max length** — no upper bound. A user could submit a multi-KB username.
- **Allowed characters** — no restriction. Unicode, HTML entities, control characters, SQL-ish strings, etc. are all accepted.
- **Whitespace handling** — unclear whether leading/trailing whitespace is trimmed.

**Recommended backend changes:**
```python
# In the setup endpoint's Pydantic model or validation logic:
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]+$')
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 24

# Validation:
username = body.username.strip()
if len(username) < MIN_USERNAME_LENGTH or len(username) > MAX_USERNAME_LENGTH:
    raise HTTPException(400, f"Username must be {MIN_USERNAME_LENGTH}-{MAX_USERNAME_LENGTH} characters")
if not USERNAME_REGEX.match(username):
    raise HTTPException(400, "Username can only contain letters, numbers, underscores, and dashes")
```

These rules should match the frontend constants exactly so error messages are consistent.

### 2. Supabase auth password policy
Supabase's default minimum password length is **6 characters** with no complexity requirements. The frontend plan proposes requiring **8 characters**. Options:
- **Option A (recommended):** Configure Supabase's password policy in the Supabase dashboard (Authentication > Policies) to require 8+ characters. This enforces the rule at the auth layer and no backend code change is needed.
- **Option B:** Accept the mismatch — the frontend blocks < 8 chars but Supabase would still accept 6-7 char passwords via direct API calls. This is a minor gap since the signup flow goes through Supabase, not the backend.

### 3. Preference values on `PATCH /users/me/preferences`
The API docs say values must come from `GET /options` and returns 422 for invalid values — this is already enforced. No change needed here.

### 4. Update `FRONTEND_API.md`
After implementing backend changes, update the docs to reflect the new rules:

```markdown
### `POST /users/me/setup`
...
- `username` — 3-24 characters, alphanumeric plus underscore and dash only (`[a-zA-Z0-9_-]`), must be unique, trimmed of leading/trailing whitespace
- `accept_terms` — must be `true`

**Error codes**
| Code | Condition |
|------|-----------|
| 400 | `accept_terms` is `false` |
| 400 | Username does not meet length or character requirements |
| 401 | Invalid or expired JWT |
| 409 | Username already taken |
| 422 | Missing `Authorization` header or malformed request body |
```

## Files to change (backend repo)
- The FastAPI route handler for `POST /users/me/setup` (add length + regex validation)
- Supabase dashboard: Authentication > Password policy (set min length to 8)
- `Documentation/FRONTEND_API.md` (update username rules and error codes)

## Coordination with frontend
The frontend plan (`fix-registration-validation.md`) should use identical constants:
- `MIN_USERNAME_LENGTH = 3`
- `MAX_USERNAME_LENGTH = 24`
- `USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/`
- `MIN_PASSWORD_LENGTH = 8`

If either side changes these values, both must be updated together.
