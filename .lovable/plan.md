
I investigated the current implementation and found the conflict: admin access is split across two different checks.

- `/admin*` uses `useAdmin` → checks `user_roles` table only.
- `/dashboard` admin bypass uses `validate-admin-email` → checks `ADMIN_EMAILS` secret.
- Your backend confirms `ADMIN_EMAILS` works (`validate-admin-email` returns `{ valid: true }`), and the admin role row exists, so the endless loader is most likely a frontend auth-state/routing loop, not a secret misconfiguration.

## Plan to fix it (fully and consistently)

### 1) Unify admin decision logic (single source of truth)
Refactor admin auth flow so `ADMIN_EMAILS` is always evaluated for admin access checks, then role is synchronized for DB policies.

- Keep `ADMIN_EMAILS` as the canonical whitelist source.
- In `useAdmin`, for logged-in users:
  1. validate email via `validate-admin-email` (`data.valid`)
  2. if valid, call `assign-admin-role` (idempotent sync for RLS-backed admin queries)
  3. set `isAdmin = true`
- Keep role-table check only as fallback/compatibility, not primary gate.

### 2) Eliminate endless loading in admin screens
Refactor `useAdmin` auth lifecycle to prevent stuck `loading=true` states:

- Initialize auth listener first, then session bootstrap (race-safe pattern).
- Use a single `resolveAdminState(session)` function with strict `try/finally`.
- Add safety timeout fallback so admin pages never spin forever.
- Return an `authError` flag from `useAdmin` for UI fallback messaging.

### 3) Fix route accessibility and alias mismatch
Support both URL patterns so access is predictable:

- Keep existing `/admin/login`
- Add alias route `/admin-login` → same AdminLogin page (or redirect to `/admin/login`)
- Keep `/admin*` protected by `AdminRoute`

This addresses users opening `/admin-login` directly.

### 4) Remove conflicting duplicate admin hook usage
`AdminLayout` currently initializes `useAdmin` again just for `signOut`, creating extra auth listeners/checks.  
Refactor so layout uses direct sign-out action without full admin-state hook, reducing auth churn that can cause route flicker/loading loops.

### 5) Keep bypass-to-user-dashboard behavior intact (no conflict)
Preserve current intended behavior:

- Whitelisted admin can still bypass subscriber gating into `/dashboard`.
- This continues to use the same `ADMIN_EMAILS`-based decision path (shared helper), so admin dashboard access and user dashboard bypass cannot diverge anymore.

### 6) Permission/access verification pass (all pages)
After refactor, validate route + permission matrix end-to-end:

```text
Public:      /, /payment, /access, /signin, /signup, /terms, /privacy, /influencer/:promoCode
Subscriber:  /dashboard  (active subscriber OR ADMIN_EMAILS whitelisted)
Admin:       /admin, /admin/payments, /admin/analytics, /admin/customers, /admin/settings, /admin/influencers
Login URLs:  /admin/login and /admin-login
```

Expected outcomes:
- Signed out: `/admin*` redirects to admin login form (no spinner lock).
- Whitelisted admin: can sign in, enter `/admin*`, and also bypass to `/dashboard`.
- Non-admin user: cannot enter `/admin*`.
- No endless loader on admin/login or admin dashboard.

## Technical details (implementation-level)
- Files to update:
  - `src/hooks/useAdmin.tsx` (core fix: unified ADMIN_EMAILS + role sync + loading safety)
  - `src/components/admin/AdminRoute.tsx` (use new hook states cleanly)
  - `src/pages/admin/AdminLogin.tsx` (shared admin check helper, resilient UI fallback)
  - `src/App.tsx` (add `/admin-login` alias route)
  - `src/components/admin/AdminLayout.tsx` (remove extra full `useAdmin` subscription for sign-out)
  - `src/hooks/useSubscriber.ts` and `src/pages/SignIn.tsx` (reuse same admin-check helper to avoid divergence)
- No new database schema required; this is primarily auth flow + route guard consistency.
