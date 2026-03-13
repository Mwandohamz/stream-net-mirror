

# Plan: Complete pawaPay Production Setup + Dynamic Pricing

## Current State Assessment

After reviewing the codebase and secrets:

1. **Missing secret**: `PAWAPAY_BASE_URL` is not configured. The edge function defaults to sandbox (`https://api.sandbox.pawapay.io`). Since this is a **live production account**, you need to add `https://api.pawapay.io` as the value.

2. **No callback endpoint**: pawaPay requires a callback URL where it sends final payment statuses (completed/failed). Currently the system relies only on polling, which can miss updates. You need a new edge function to receive these callbacks.

3. **Price is hardcoded**: `BASE_AMOUNT_ZMW = 49` is a constant in `PaymentModal.tsx`. There's no way to change it from the admin dashboard.

---

## What You Need to Do in pawaPay Dashboard

### Callback URL
Your callback URL for **Deposits** should be:

```
https://rhobeyejmrnnreepacmr.supabase.co/functions/v1/pawapay-callback
```

For **Refunds**, use the same URL or check "I do not wish to receive callbacks" if you don't plan to process refunds.

This URL will work regardless of your custom domain — it's a backend function URL that doesn't change.

### Secret to Add
I will add the `PAWAPAY_BASE_URL` secret with value `https://api.pawapay.io` for production.

---

## Implementation Plan

### 1. Add `PAWAPAY_BASE_URL` secret
Set to `https://api.pawapay.io` for production.

### 2. Create callback edge function (`pawapay-callback`)
- Receives POST from pawaPay with deposit status updates
- Updates the `payments` table with final status (completed/failed)
- Handles deposit and refund callback types
- No authentication needed from pawaPay side (they just POST to the URL)

### 3. Add dynamic pricing via admin dashboard
- **New DB table**: `app_settings` with key-value pairs (e.g., `base_price_zmw` = `49`)
- **Admin Settings UI**: Add a "Pricing" card to the Settings page where admin can update the base price
- **PaymentModal update**: Fetch the price from the database instead of using the hardcoded constant
- RLS: admins can read/write, anonymous users can read (needed for the payment modal)

### Files to create/modify

| Action | File |
|--------|------|
| Create | `supabase/functions/pawapay-callback/index.ts` |
| Migration | Create `app_settings` table + seed default price |
| Modify | `src/pages/admin/Settings.tsx` — add pricing management card |
| Modify | `src/components/PaymentModal.tsx` — fetch price from DB |
| Create | `src/hooks/useAppSettings.ts` — hook to read settings |

