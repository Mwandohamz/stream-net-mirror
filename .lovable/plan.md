# StreamNetMirror: accounts, monthly subscriptions, country pricing and admin control

## Where things stand today

- Sign-up is blocked unless a completed payment already exists for that email, so accounts and payments are welded together.
- Accounts live in Lovable Cloud auth with email verification on; there is no profile record, no country, no phone on the account.
- Payments are one-off pawaPay mobile money, priced ZMW 49, with no plan, no renewal date and no confirmation email.
- Access is granted through a `subscribers` row; an admin can grant it manually with a temporary password.
- Admin dashboard shows payments, customers, tickets, influencers, analytics and settings — read-heavy, limited editing.

Everything below builds on that rather than replacing it.

## Batch 1 — Accounts stand on their own

- Anyone can create an account without paying: name, email, country, phone, password + confirm password.
- Country picker right after email, with flag and dialling code; phone field shows the selected country's code and the user types only the remaining digits.
- Email verification stays on (Lovable Cloud sends it); users must verify before signing in.
- Every account gets a saved profile (name, country, currency, phone, verification status, join date).
- Signed-up but unpaid users get a dashboard that shows their plan options and payment button — no streaming links, no download links.
- Admin dashboard gets a **Users** section listing every account with all details, searchable, with full create / view / edit / disable / delete control.

## Batch 2 — Pricing in the user's own currency

- One base price in USD, set by the admin.
- Live exchange rates convert it to the user's country currency everywhere they see a price.
- Prices shown to users are rounded sensibly per currency (no decimals for UGX, RWF, XAF etc.).
- Admin sees each transaction in the customer's currency plus its USD and ZMW equivalents, with the rate used at the time stored on the record so history never shifts.
- Promo codes and prices are edited in the admin dashboard and take effect immediately for every country.

## Batch 3 — Monthly subscription lifecycle

- Paying starts a subscription: start date, current period end, status (active / expiring / expired).
- Member dashboard shows a countdown to the next payment date and a Renew button.
- Access to streaming and download links is granted only while the subscription is active; it closes automatically when the period ends.
- Payment history with dates and amounts on both the member dashboard and the admin user record.
- Admin can extend, cancel, reactivate or manually mark a subscription paid.

## Batch 4 — Payments, confirmed instantly

- Checkout is opened to any signed-in user, prefilled from their profile; the payment is attached to their account, not just to an email string.
- pawaPay mobile money stays the default. Card payments are surfaced in the same wizard for countries where your pawaPay account has card channels enabled — I will query your account's live configuration and only show cards where they are genuinely available.
- Instant confirmation: the moment pawaPay reports success the subscription activates and the links unlock, with a fallback status check so a missed callback cannot leave a paid user locked out.
- Fix the recorded-but-incomplete payment data seen today (missing provider transaction reference).

## Batch 5 — Emails

Using Lovable's built-in email; you connect a sending domain in the app, no third-party key needed.

- Branded template with the app name and logo, used for all mail.
- Payment confirmation / receipt after every successful payment.
- Renewal reminders before a subscription expires, plus an expired notice.
- Admin can send a reminder to one user or to everyone expiring within a chosen window, manually — and can turn on automatic reminders at a threshold they set (e.g. 7 and 2 days before).
- Branded versions of the sign-up verification and password reset emails.

## Batch 6 — Admin dashboard consistency

- Full create / read / update / delete on users, subscriptions, payments, plans and pricing, promo codes, influencers, streaming links and support tickets.
- Every figure on the dashboard reads from the same source as the detail pages, so totals and lists always agree.
- Revenue reported in USD with ZMW equivalent; per-influencer revenue counted only from payments carrying that influencer's code.
- Reminder and email activity log so you can see what was sent and when.

## My recommendations

- **Keep verification on but let unverified users browse plans.** Blocking everything until the click-through hurts conversion; blocking only payment and links is enough.
- **Store the exchange rate on each payment.** Otherwise last month's revenue silently changes every time rates move.
- **Grace period, not a hard cut-off.** Give 3 days after expiry where links still work and the dashboard nags. Far fewer support tickets.
- **Keep the manual admin grant.** Mobile money fails in ways no code can catch; you need the override.
- **Automatic reminders beat manual ones**, with manual as the exception — set them and forget them.

## Technical notes

- New tables: `profiles` (user_id, name, country, currency, phone, created_at), `plans` (name, interval, price_usd, active), `subscriptions` (user_id, plan_id, status, current_period_start/end, cancel_at), `email_log`. `payments` gains `user_id`, `subscription_id`, `amount_usd`, `fx_rate`, `plan_id`. Each new public table ships with GRANTs, RLS enabled and owner-scoped policies; admin access via existing `has_role`.
- Trigger on `auth.users` insert creates the profile row from sign-up metadata.
- Country/phone input reuses the existing `react-phone-number-input` plus an expanded country list beyond the 13 pawaPay markets (payment countries stay restricted to pawaPay's supported set).
- Exchange rates move from the client-side `useExchangeRate` hook to a cached server-side fetch (edge function + `app_settings` cache, refreshed hourly) so pricing cannot be tampered with client-side.
- pawaPay card availability read from `/v2/active-conf` per country; the wizard renders MMO and card channels from that response instead of a hardcoded list.
- Subscription activation happens in `pawapay-callback` (service role), with `pawapay-proxy` status polling as the reconciliation path; both idempotent on `deposit_id`.
- Emails sent through Lovable's transactional email function; reminders driven by a scheduled job querying subscriptions expiring within the configured threshold, with the `email_log` preventing duplicates.
- Admin CRUD pages follow the existing `AdminLayout` + paginated table pattern (100 rows per page).

## Order of work

Batch 1 → 2 → 3 → 4 → 5 → 6. Each batch leaves the app fully working, so you can review and use it before the next starts. Email domain connection is needed before Batch 5 can send anything.
