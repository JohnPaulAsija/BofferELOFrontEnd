# Account Management — Plan Index

This plan has been split into four independent plans:

1. **[Change Username](change-username.md)** — Self-service API function + own-profile inline edit (sets up the ACCOUNT section in UserProfile.tsx)
2. **[Change Email](change-email.md)** — Self-service API function + own-profile inline edit (adds to the ACCOUNT section)
3. **[Delete Account](delete-account.md)** — Self-service API function + own-profile Danger Zone with type-to-confirm
4. **[Admin User Management](admin-user-management.md)** — All three admin API functions + new AdminUserManager component + admin panel integration

Plans 1–3 are self-service only and can be implemented in any order (each builds on the ACCOUNT section). Plan 4 is fully self-contained — it adds its own admin API functions and UI.
