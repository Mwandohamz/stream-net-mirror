

# StreamNetMirror — Full System Improvements

## Overview
7 changes implemented in order: Password Reset, Payment Wizard 5→3 steps, Guest Ticket Schema Fix, Receipt Lookup Fix, Phone Normalization, Admin Pagination, Influencer Phone Fix.

---

## 1. Password Reset Flow

**New files:**
- `src/pages/ForgotPassword.tsx` — Email input, calls `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`. Same visual style as `/signin`.
- `src/pages/ResetPassword.tsx` — New password + confirm fields (min 8 chars), calls `supabase.auth.updateUser()`. Redirects to `/signin` after 2s.

**Modified files:**
- `src/App.tsx` — Add routes for `/forgot-password` and `/reset-password`
- `src/pages/SignIn.tsx` — Add "Forgot your password?" link. On "Email not confirmed" error, show resend verification button using `supabase.auth.resend({ type: 'signup', email })`.

---

## 2. Payment Wizard: 5 Steps → 3 Steps

**Modified file:** `src/components/PaymentModal.tsx`

- **Step 1 (Country + Price):** Merge current steps 1+2. Show country selector and price together. Keep USD conversion and discount display.
- **Step 2 (Phone + Auto-detect Provider):** Show phone input with country prefix. After 4+ digits typed, debounce 500ms then call `predictProvider()`. Show spinner while detecting. If detected: show provider name with green checkmark, no dropdown. If failed: show fallback provider dropdown from `active-conf`. "Pay Now" button disabled until provider resolved.
- **Step 3 (Processing):** Same as current step 5.
- Update `STEP_LABELS` from 5 to 3, update `Step` type to `1 | 2 | 3`.

---

## 3. Guest Support Ticket Schema Fix

**Database migration:**
```sql
ALTER TABLE support_tickets 
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS payment_ref text;
ALTER TABLE support_tickets ALTER COLUMN user_id DROP NOT NULL;
```

Also update the admin SELECT RLS policy to include `user_id IS NULL` tickets.

**Modified files:**
- `supabase/functions/public-support-ticket/index.ts` — Write guest fields to proper columns, set `user_id: null`, message is just the message text (no prefix).
- `src/pages/Support.tsx` — Send fields separately (no concatenation).
- `src/pages/admin/SupportTickets.tsx` — Read `ticket.guest_name`, `ticket.guest_email`, `ticket.guest_phone`, `ticket.payment_ref` directly. Show "Guest" badge. Use `guest_email` for Grant Access instead of regex parsing.

---

## 4. Payment Receipt Lookup Fix

**Modified file:** `src/pages/MemberDashboard.tsx`

Replace email-based receipt query with two-step approach:
1. Fetch `payment_id` from `subscribers` where `user_id = session.user.id`
2. Fetch payment by `id = payment_id`
3. Fallback to email query if `payment_id` is null

---

## 5. E.164 Phone Normalization for Influencers

**Modified file:** `src/pages/admin/Influencers.tsx`

- Replace plain phone `<Input>` with `PhoneInput` from `react-phone-number-input` (already installed)
- Before insert/update, validate with `isValidPhoneNumber()` and normalize with `parsePhoneNumber().format('E.164')`
- Show validation error if invalid

---

## 6. Admin Table Pagination

**Modified files:** `src/pages/admin/Payments.tsx`, `src/pages/admin/Customers.tsx`, `src/pages/admin/Analytics.tsx`

For each:
- Add `page` state (0-indexed) and `totalCount` state
- Query with `.range(page * 100, (page + 1) * 100 - 1)` and `{ count: 'exact', head: true }` for total
- Show "Showing X–Y of Z" with Previous/Next buttons
- Reset to page 0 when search changes
- CSV export fetches ALL records (no `.range()`)

---

## 7. Influencer Phone Comparison Fix

**Modified file:** `src/pages/InfluencerDashboard.tsx`

- Add `normalizePhone()` helper using `parsePhoneNumber().format('E.164')`
- Compare normalized stored phone vs normalized input phone
- Show specific error "Phone number doesn't match our records" on mismatch

---

## Files Summary

**Create (2):** `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`

**Modify (10):** `src/App.tsx`, `src/pages/SignIn.tsx`, `src/components/PaymentModal.tsx`, `supabase/functions/public-support-ticket/index.ts`, `src/pages/Support.tsx`, `src/pages/admin/SupportTickets.tsx`, `src/pages/MemberDashboard.tsx`, `src/pages/admin/Influencers.tsx`, `src/pages/admin/Payments.tsx`, `src/pages/admin/Customers.tsx`, `src/pages/admin/Analytics.tsx`, `src/pages/InfluencerDashboard.tsx`

**Database migration:** Add guest columns to `support_tickets`, make `user_id` nullable

