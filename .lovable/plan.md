# Plan: Payment Tracking Fix, Public Support, Admin Grant Access & Password Management

## Analysis

**Payment for [mwando.julu@gmail.com](mailto:mwando.julu@gmail.com)**: The 3 ZMW payment IS tracked in the database with status "completed". The `provider_transaction_id` is null despite the callback receiving it — likely a timing/config issue. The user can't create an account because they need to go to `/signup` and the email verification flow may be blocking them.

**Root causes identified:**

1. Edge functions (`pawapay-proxy`, `validate-admin-email`, `assign-admin-role`) are missing `verify_jwt = false` in config.toml — can cause 401 errors with signing-keys
2. The callback successfully updates status but may fail silently on `provider_transaction_id` update
3. No way for users who paid but can't create accounts to contact support
4. No admin mechanism to manually grant dashboard access

## Changes

### 1. Fix edge function config (`supabase/config.toml`)

Add `verify_jwt = false` for `pawapay-proxy`, `validate-admin-email`, and `assign-admin-role` — required for signing-keys compatibility.

### 2. Create edge function `admin-grant-access`

New edge function that:

- Accepts admin JWT + target email
- Verifies caller is admin (via ADMIN_EMAILS secret)
- Checks payment exists for that email
- Creates auth user via `supabase.auth.admin.createUser()` with email confirmed and a temporary password
- Creates subscriber record linking user to payment
- Returns the temporary password to admin so they can share it with the user

### 3. Create public support page (`src/pages/Support.tsx`)

A page at `/support` accessible WITHOUT login where users can:

- Enter their name, email (used for payment), describe their issue
- Optionally provide payment reference/phone number
- Submit creates a support ticket using a new edge function (`public-support-ticket`) that inserts without requiring auth
- This ticket appears in admin's support dashboard

### 4. Create edge function `public-support-ticket`

Inserts a support ticket using service role (no auth required), storing payment email as metadata in the ticket message.

### 5. Add "Grant Access" to admin Support Tickets page

Add a button per user group that:

- Calls `admin-grant-access` edge function with the user's email
- Shows the generated temporary password to admin
- Admin can share credentials with the user

### 6. Add password change to MemberDashboard

Add a collapsible "Account Settings" card with:

- Current email (read-only)
- New password + confirm password fields
- Uses `supabase.auth.updateUser({ password })` to update

### 7. Add route and nav link for `/support`

Register in App.tsx, add "Need Help?" link to Navbar and SignUp/SignIn pages.

### 8. Fix callback logging

Add error logging to pawapay-callback for the update operation to help debug future issues.

## Files to create/modify

- **Create**: `src/pages/Support.tsx`, `supabase/functions/admin-grant-access/index.ts`, `supabase/functions/public-support-ticket/index.ts`
- **Modify**: `supabase/config.toml` (add verify_jwt entries), `src/App.tsx` (add routes), `src/components/Navbar.tsx` (add Support link), `src/pages/MemberDashboard.tsx` (add password change), `src/pages/admin/SupportTickets.tsx` (add grant access button), `src/pages/SignIn.tsx` (add support link), `src/pages/SignUp.tsx` (add support link), `supabase/functions/pawapay-callback/index.ts` (add error logging)   Additionally make sure all payments and revenes are tracked and recorded in the admin dashboard.