# App catalogue, highlights, faster membership and public discovery

OneSignal is not set up, so the phone app will keep using in-app notifications (no lock-screen push).

## 1. Phone app and dashboard
- **Search works everywhere:** search buttons and "find movies" actions open the full Movies & Series catalogue with search inside the dashboard, so the phone app no longer sends people to website pages.
- **Home tab order:** greeting, then **Football Highlights** (a scrollable row of approved highlights that play inside the app), then **Popular Right Now**.
- **Popular Right Now / Trending Series** come straight from TMDB's live trending and popular lists (cached), not fixed sample titles.
- **Sidebar (phone drawer and desktop):** new entries for **Highlights** (full highlights page) and **Browse & Search** (all movies and series).

## 2. Membership shows Active right away
- The last known membership status is remembered on the device and shown instantly at sign-in or app launch, then quietly re-checked. This removes the amber "inactive" flash.
- If the check finds the membership has expired, the screen updates straight away.

## 3. Speed and lower database use
- Cache catalogue, highlights, fixtures, profile, notifications and plans with sensible freshness times, so moving between sections doesn't reload data.
- Remove duplicate membership and profile requests, and load less-used screens only when opened.
- Admin data keeps its existing cached sources.

## 4. Notifications
- In-app inbox and pop-up alerts for payment confirmed, subscription activated, expiring soon (3 days and 1 day) and support replies, using existing records.
- **Subscription confirmation email:** redesign it in the brand style, with logo, plan, amount, expiry date and a "Start watching" button.

## 5. Public website
- Instagram and Facebook links in the footer, and on the mobile menu.
- New rows below "Trending Now": Popular Movies, Popular TV Series, three anime rows (Action, Fantasy, Romance), and Football Highlights. Each row has a **See more** link to the full searchable list.
- Watch flow: no account → create account → payment → dashboard. Signed in but not paid → payment. Paid → Watch.

## Technical details
- `MemberDashboard`, `DashboardShell` (nav/drawer), `NativeEntryFlow` routing for search targets; reuse embedded `CatalogBrowser` and `FootballHighlights`.
- `tmdb-catalog` gets `trending` (trending/all/week) and anime discover (genre 16, original language ja) options, stored in the existing TMDB cache.
- `useMembership`: React Query with `initialData` from localStorage (status and expiry only, keyed by user ID, cleared on sign-out), `staleTime` 5 min; a stored expiry in the past is never shown as active.
- Global QueryClient defaults: staleTime 5 min, gcTime 30 min, no refetch on window focus; lazy-load routes.
- Notifications are derived client-side from RLS-protected payments, subscriptions and tickets (no new table); subscription email template is updated in the existing email function.
- Tests: membership cache never shows an expired membership as active; public Watch routing for each state; Home section order.
- Native: after building, rebuild the APK in GitHub Actions (no new native plugins).
