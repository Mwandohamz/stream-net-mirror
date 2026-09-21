# Member dashboard rebrand

## Goal
Turn the signed-in dashboard into a simple, native-feeling streaming app. The first screen prioritizes six watch destinations and removes public-site navigation from the member area.

## Experience
- Apply the selected Stadium Night palette with Outfit headings and Figtree body text inside the dashboard.
- Replace the current six-tab mobile navigation with exactly five destinations: **Dashboard**, **Movies & Series**, **Watch**, **Football**, and **Account**.
- Make **Watch** the raised center action on mobile and the primary action in the desktop sidebar.
- Keep desktop clean with a slim navigation rail and a wider two-column content area.
- Remove Home, public Movies, public TV Series, and public Live Sports links from all dashboard menus.

## Dashboard home and Watch flow
- Make the new watch hub the default screen after login.
- Show Netflix, Prime Video, Sky Sports, UEFA, EPL, and LaLiga as six equal tiles in two columns and three rows on mobile.
- Match those tiles to admin-managed content where available; never place protected URLs in the page for unpaid users.
- For unpaid users, **Watch now** shows a lock and opens checkout.
- For paid users, **Watch now** opens a platform-link picker. Selecting a link then shows the existing link-rotation warning before opening it.
- Add a compact **More platforms** disclosure beneath the six featured tiles for all remaining streaming destinations.

## Remaining sections
- **Movies & Series:** member streaming links for film and series viewing.
- **Football:** live-sports links and football destinations.
- **Account:** profile, subscription, billing/receipt, security settings, support, and Games & Software Downloads in one understandable area.
- Preserve current membership countdowns, download security, support tickets, profile editing, password updates, payment redirects, and sign-out.

## Technical details
- Refactor `DashboardShell` around the five destinations and remove its public explore links.
- Refactor `MemberDashboard` into focused tab sections without changing payment or backend rules.
- Extend `CategoryLinks` with a featured-grid presentation and two-step paid link opening while retaining server-masked URLs.
- Add dashboard-scoped semantic theme tokens and typography; do not alter the public website’s branding.
- Validate type safety, build status, mobile and desktop rendering, locked behavior, navigation, and dialogs. Authenticated live verification will resume when the paused backend is available.
