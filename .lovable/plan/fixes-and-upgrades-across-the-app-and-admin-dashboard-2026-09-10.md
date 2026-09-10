# Fixes and upgrades across the app and admin dashboard

## 1. Admin money sections showing nothing

The database does have payments (one completed payment of ZMW 2.11 / USD 0.11 for the active member, plus older records), but Overview, Payments and Customers render empty. The pages read the payments table directly from the browser, which depends on the signed-in admin passing the database access check on every request — that is the fragile part.

Fix: add a single admin data endpoint that runs with trusted server access, verifies the caller is a whitelisted admin, and returns:
- totals (revenue in ZMW and USD equivalent, organic vs promo, today's payments, conversion)
- the payment list (paged, searchable)
- the customer list grouped by email
- recent payments for Overview

Overview, Payments and Customers then read from this one endpoint. Amounts are computed from `amount_usd` when present and from the stored FX rate otherwise, rounded to 2 decimals, and status matching becomes case-insensitive so `completed` / `COMPLETED` both count.

## 2. Caching for every admin section

Introduce a shared query cache (React Query, already available) with:
- `staleTime` of 60s and cached data kept for 5 minutes, so switching sections or browser tabs shows data instantly
- no refetch on window focus; a manual Refresh button per section
- background revalidation after the stale window

Applied to Overview, Users, Payments, Customers, Plans, Content, Analytics, Support, Influencers and Emails.

## 3. Users table layout

Trim the table to: Name (with admin/disabled/unverified marks), Email, Country, Subscription + countdown, and a single "View" (eye) action.

The eye opens a details panel containing everything else — phone, joined date, last sign-in, verification state, payment count and total, plan details — plus all the existing actions (edit, subscription, admin toggle, disable, delete). Table becomes readable on narrow screens; rows collapse to stacked cards on mobile.

## 4. Plan billing period shown correctly

Plan cards, checkout, dashboard and admin all read the plan's own interval (weekly / monthly / yearly / lifetime) instead of assuming one. Public pages default to showing the monthly plan when several exist. Remove the "lifetime access" wording from the home hero and anywhere else it no longer applies.

## 5. Live Sports icons on mobile plan cards

The sports/platform logo strip inside the plan card is hidden or clipped at small widths. Fix the card so the platform logos and the sports icons both render on mobile, wrapping instead of overflowing.

## 6. Link rotation notice

Before any streaming link opens (and on Copy link), show a short dialog: links rotate and can stop working, so members should come back here for the refreshed link. Confirming with "Okay, I understand" opens or copies. The choice is remembered for the session so it is not annoying.

## 7. Payment result feedback

On success: a large animated check mark with the confirmed amount and plan, and a button into the dashboard.
On failure: the actual reason in plain words — timed out, insufficient balance, wrong PIN, cancelled, rejected by provider — mapped from the payment provider's failure codes. The same final status is written to the payment record so the admin sees it too.

## 8. Email Activity — targeted sending with editable templates

Add to the Emails section:
- a recipient picker listing accounts with filters for country, plan, subscription state (active / expiring within N days / expired) and a name/email search
- select one, several, or all matching accounts
- a template chooser (renewal reminder, expiry notice, payment confirmation, plus a free-form announcement-style account notice)
- a preview of the chosen template with editable subject and body before sending
- send to the selected recipients, with the result of each send recorded in the activity log below

Sending stays server-side; recipients are re-validated on the server.

## Technical notes

- New edge function `admin-metrics` (service-role, admin-verified) backing Overview / Payments / Customers.
- New edge function action for targeted email sends; templates gain overridable subject/body fields passed through `templateData`.
- React Query provider already exists in `App.tsx`; add per-section query keys and a shared `useAdminQuery` helper.
- Currency conversion centralised in `src/lib/currency.ts`; all displays 2-decimal.
- pawaPay failure codes mapped in one place and reused by `usePaymentStatus`, the payment page and the admin payment status column.
