# Paid vs unpaid experience, accurate currency, and a full app review

Two parts: (1) build the member/visitor experience changes you asked for, (2) deliver the six review reports with pass/fail and scores.

## Part 1 — What gets built

### 1. Paid members and unpaid visitors feel different everywhere

- A single shared "membership status" is read once and used by every page, so the whole site knows if you are signed out, signed in but unpaid, or an active member.
- Signed out: current marketing pages, buttons say "Create free account".
- Signed in, unpaid: a slim amber strip at the top of every page — "Your account is ready. Unlock streaming for {price}" with a Pay button. Pricing card CTA becomes "Unlock now". Locked areas show a lock badge instead of vanishing, so people can see what they are buying.
- Active member: a green "Member — renews in N days" pill in the header, the top bar becomes "Go to my dashboard" plus "Open streaming portal", pricing sections switch from "Get started" to "Manage membership". Payment page for an active member shows their renewal date with a Renew option instead of a fresh checkout.
- In grace period or expiring within 7 days: the strip turns amber with "Renew before {date}".
- All three states share the same components and tokens, so it is one visual language, not three designs.

### 2. Currency accuracy to 2 decimals

- Every displayed amount rounds once, at display time, to exactly 2 decimals (except currencies that have no minor unit, e.g. UGX, RWF — those show whole numbers, unchanged).
- Conversion always runs from the admin's USD price; no intermediate rounded value is ever converted again.
- Amounts shown next to each other (price, discount, total) are recomputed from the same USD base so the arithmetic always adds up on screen.

### 3. Country picker for seeing local price

- A compact country/currency selector next to the price on the home page, pricing card, plan page and checkout. It defaults to the visitor's saved country, or their browser locale when signed out.
- Choosing a country instantly re-renders every price on that page, showing "USD X.XX ≈ {LOCAL} Y.YY" so the admin-set USD figure is always visible alongside the local equivalent.
- The choice is remembered for the session; for signed-in users it can be saved to their profile.
- Countries pawaPay cannot collect in are shown as "view only — pay in USD / by another method" so nobody reaches checkout with an unsupported currency.

### 4. The exact admin amount reaches pawaPay

- Checkout computes the charge from the active plan's USD price and the current rate, applies any promo discount, then formats to the payment currency's required precision before the request is sent.
- The request stores the USD amount, the rate used and the local amount together, so the admin dashboard can show local, USD and ZMW equivalents that always reconcile.
- The confirmation screen and the admin payment row display the same three figures.

## Part 2 — The six reviews

I will produce one report per area (frontend, backend/API, database & storage, auth & permissions, hosting & deployment, cloud/compute, security, rate limiting & cost, caching & performance, error tracking) with pass/fail per item, a specific example from your code for each, an overall score, and the top 3 fixes. Anything trivially fixable and low risk (missing image labels, missing form error text, missing lazy loading, missing error boundary, unindexed lookup columns) I will fix in the same pass and mark as fixed in the report. Larger items (Sentry, CDN policy, billing alerts, backup restore test) will be listed as recommendations with effort, not done silently.

## Order of work

1. Membership status + the three-state experience across all pages
2. Currency rounding and the country selector
3. pawaPay amount alignment and admin reconciliation display
4. Reviews and the quick fixes they turn up

## Technical notes

- New `useMembership()` built on `useSubscriber` + `usePricing`, exposing `state: "guest" | "unpaid" | "active" | "grace" | "expired"`, days remaining, and the CTA label/target. A `<MembershipBanner />` rendered from a shared layout wrapper; `<MembershipBadge />` in `Navbar`.
- `src/lib/currency.ts` gains a single `formatMoney(amountUsd, currency, rates)` used by every surface; `usePricing` returns pre-rounded strings so components never call `toFixed` themselves. `MembershipLocked.tsx` currently formats prices with its own `priceLabel` helper — it moves to `usePricing`.
- Country selector: reuse `src/data/allCountries.ts` plus a `CurrencyContext` provider holding the selected ISO code; `useFxRates` unchanged.
- Checkout: `PaymentModal` derives `amount` from `plan.price_usd × rate` with `roundForCurrency`, and always sends `amountUsd` + `fxRate`; server-side `activateSubscriptionForPayment` already re-checks the amount against the plan, so client and server agree.
- Reviews are read-only analysis over `src/`, `supabase/functions/`, the schema and RLS policies; no infrastructure changes without asking.
