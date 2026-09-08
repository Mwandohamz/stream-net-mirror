# StreamNetMirror: app-style dashboard, three content categories, and payment hardening

Answer first: yes — admin access is already restricted to the addresses in your ADMIN_EMAILS secret. The admin check calls a server-side function that compares the signed-in email against that list; nobody outside it can open the admin screens.

Everything below builds on what exists — no rebuild. Six batches, each safe to ship on its own.

## Batch 1 — Currency default and leftovers

- Visitors currently see GBP because the site guesses the country from the browser language. New rule: **USD is always the base**, shown first everywhere; the country picker beside it only adds a local equivalent.
- Finish the two open items from the previous batch: confirm the exact amount sent to pawaPay matches the admin price, and make the admin money columns reconcile (local, USD, ZMW).

## Batch 2 — Live countdown for subscriptions

- Replace the plain renewal date with a live ticking countdown (days, hours, minutes) shown to members on their dashboard and to admins on the customer/subscription rows.
- Colour states: green while comfortable, amber inside 7 days or in grace, red on the last day and after expiry.

## Batch 3 — Three content categories (admin CRUD + member views)

New content model the admin fully controls:

- **Categories**: NetMirror Streaming, Live Sports, Movie Downloads (admin can add more, rename, reorder, activate/deactivate).
- **Links** inside each category: title, description, what the link does, URL, logo/icon, platform badge (Android / iOS / Web / TV), sort order, active flag.
- Admin gets a new "Content" screen with full create/edit/delete for both, including logo upload to file storage.
- The five league logos you uploaded (UEFA Champions League, Premier League, LaLiga, Bundesliga, Sky Sports Football) are seeded as the starting Live Sports entries.
- Member dashboard renders each category the same way the NetMirror section works today: neat cards with logo, name, what it gives you, and a copy/open action — locked for unpaid accounts, open for paid ones.
- Live Sports section carries your positioning copy: we find, verify and maintain free football streaming links from anywhere in the world, we do the dirty work, we support you, and we are not responsible for third-party sites.
- Movie Downloads section lists download links plus the software tools that make them work (games guides can be added later by you, no code needed).

## Batch 4 — Dashboard redesign (web-app feel)

- Left sidebar on desktop, bottom navigation bar on mobile, top bar with the app name and a profile menu in the top-right (name, avatar, account settings, sign out).
- Centre of the dashboard: a segmented switcher between the three categories, with the active one filling the page.
- Sections split into clean pages instead of one long scroll: Overview, Streaming, Live Sports, Downloads, Billing, Support.
- Public site navigation becomes Home, Movies, TV Series, Live Sports, Download App, so visitors can browse those pages before joining.

## Batch 5 — Plans, packages and the signup-first rule

- Two visual plan cards: **NetMirror only** (today's plan) and **All Access** (streaming + live sports + downloads).
- Admin can tick which categories a plan includes when creating it, so the cards and the member's unlocked sections follow automatically.
- Cards show the icons of what is included — OTT logos for streaming, league logos for sports — so the difference is obvious at a glance.
- **Account first**: every call to action on the public site (including "Get Started") sends a visitor to create an account. Checkout is only reachable from inside the dashboard, so nobody can pay without an account.
- Support links and the contact-support entry disappear for visitors without an account and appear once they are signed in.

## Batch 6 — Payment confirmation, terms, and admin tracking

- A "I agree to the Terms and Conditions" checkbox is required before paying; the terms open in a popup explaining exactly what the service provides.
- Payments expire after 10 minutes if the mobile-money prompt is not completed: the member sees a clear "this payment timed out, try again" message and the admin sees the row marked expired with the reason.
- On confirmation, access is granted immediately and the confirmation email goes out at once, stating the USD amount, the local amount actually paid, the plan, and the categories unlocked.
- Admin payments screen gets clear status grouping — approved, pending, failed, expired — with the failure reason on every non-successful row, and consistent totals across dashboard, payments and customers.

## Technical notes

- New tables: `content_categories` (slug, name, description, icon, sort, active) and `content_links` (category, title, description, url, logo_url, platform, sort, active) — public read for active rows, admin full write. `plans` gains a category mapping so plan → unlocked categories is data, not code.
- League logos stored in the existing `app-files` bucket; admin uploads new ones from the Content screen.
- `CurrencyContext` default changes from locale guess to USD; the picker still remembers a session choice.
- Countdown via a shared `useCountdown` hook driven by `subscriptions.current_period_end` plus `grace_days`.
- Dashboard shell reuses the shadcn sidebar plus a mobile bottom bar; existing dashboard cards move into route children rather than being rewritten.
- Payment expiry: a `expires_at` on the deposit, enforced in the pawaPay polling hook and reconciled server-side in the callback function; email send stays on the existing transactional email path.
- Terms checkbox blocks the submit button and its acceptance is stored with the payment record.
