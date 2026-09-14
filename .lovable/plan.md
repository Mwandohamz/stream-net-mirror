# Meta Purchase tracking for verified payments

Goal: fire the standard Meta **Purchase** event exactly once, only after pawaPay has confirmed the payment server-side and the member's subscription is active. Pixel base code and PageView stay exactly as they are.

## What already exists

- Pixel `1626933832469255` base code + PageView is in `index.html` (script in head, noscript image in body). No changes there.
- `PaymentModal` polls `pawapay-proxy` (`status` action). The server re-checks the deposit with pawaPay, writes `payments.status = 'completed'`, and calls the shared activation that creates/extends the `subscriptions` row. The browser never decides success on its own.
- On success the modal calls `onSuccess(depositId)`, and `Payment.tsx` refreshes membership.
- `payments` rows hold the real `amount`, `currency` (ZMW for Zambian payers), `deposit_id`, `subscription_id`.

## Files to change

1. **`src/lib/analytics.ts`** — add a small Meta helper: `trackMetaEvent(name, params, eventId)` that no-ops when `window.fbq` is missing, when the visitor is internal/preview traffic (reuse the existing `isInternalTraffic` check), or when tracking is not allowed by the consent rule chosen below.
2. **New `src/lib/metaPurchase.ts`** — `reportPurchase(depositId)`:
   - reads the payment row for that `deposit_id` via the existing client (RLS-scoped to the signed-in user);
   - proceeds only if `status === 'completed'` **and** `subscription_id` is set;
   - fires `fbq('track','Purchase', { value, currency }, { eventID: depositId })` using the stored amount and currency — no invented values, nothing sent if the row lacks them.
3. **`src/pages/Payment.tsx`** — in the existing success handler, call `reportPurchase(depositId)` before/alongside the current membership refresh. No payment logic touched.
4. **`src/pages/MemberDashboard.tsx`** (or wherever the post-payment return lands) — no event; nothing fires on page view.

Optional, low-risk secondary events (only if you want them):
- **InitiateCheckout** — when the pawaPay deposit request is actually submitted in `PaymentModal` (the Pay button that creates the deposit), with the plan value and currency.
- **ViewContent** — on the plan/checkout page load in `Payment.tsx`, with plan name and USD value.

## Event flow

```text
Pay -> pawaPay prompt -> proxy polls pawaPay server-to-server
   -> provider says COMPLETED -> payments.status=completed + subscription activated
   -> modal success -> Payment.tsx calls reportPurchase(depositId)
   -> re-reads payment row (completed + subscription_id present)
   -> fbq Purchase { value, currency } with eventID = depositId
```

## Guarantee: only after a verified, activated payment

Nothing fires from a modal state, a click, or a URL. The helper re-reads the database row that only the server can write, and requires both `status = 'completed'` and a linked `subscription_id`. An unverified or failed payment has neither, so no event is sent.

## Duplicate prevention

- `eventID` = the pawaPay `depositId`, which is unique per transaction — Meta deduplicates on it.
- A local guard (`meta_purchase_sent:<depositId>` in `localStorage`) stops repeated polls, refreshes, or a revisit from re-firing.
- Because the event is tied to the deposit id and not to a success page, reloading a success screen sends nothing.

## Privacy

Only `value` and `currency` are sent. No email, phone, name, account id, promo code, or provider reference goes to Meta. No customer-matching identifiers are added.

## One decision needed from you

Meta counts ad clicks either way; this only affects measurement of visitors in regions that legally require consent (EU/UK and similar), not Zambia:

- **A — Regional banner (recommended):** a small consent bar shown only to visitors in those regions; tracking works normally everywhere else.
- **B — No banner:** the pixel and Purchase event are blocked for visitors in those regions and for anyone whose region can't be determined; everyone else is tracked as usual.

If you don't pick, I'll apply option B.

I'll also add a short line to the privacy policy naming Meta, the data shared (page visits and purchase value), and the purpose (advertising measurement).

## After deploying — Meta Events Manager

1. Publish the app so the live tracking runs on `https://streamnetmirror.app`.
2. Events Manager > your dataset > **Test Events**, enter the site URL and open it in the browser tab shown.
3. Browse a page (PageView appears), then complete one real low-value mobile-money payment end to end. Purchase should appear once, with the exact ZMW amount, after the prompt is approved — not before.
4. Refresh the dashboard and re-open the success screen to confirm no second Purchase appears.
5. Check Events Manager > Overview after a few hours: Purchase should be "Active" with no duplicate-event or missing-parameter warnings before the campaign spends.
