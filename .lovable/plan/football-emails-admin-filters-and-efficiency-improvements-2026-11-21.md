# Football, emails, admin filters and efficiency improvements

## 1. Live scores on football games
- Show the score next to each match (for example "LIVE 2 - 1 · 67'") while a game is being played, and the final score once it ends, using the scores the football data service already sends.
- Matches update on the screen every 60 seconds, but only while a game is live. When nothing is live, the app doesn't check for updates.

## 2. League filters that stay selected
- Tapping Champions League, Premier League or La Liga opens the Football tab with that league selected, instead of going back to Home.
- The league you picked stays selected when you refresh, go back, or move between the sidebar, drawer and league tabs.
- The cause has not been confirmed yet. The first step is to reproduce the bug in the browser. The likely cause is the dashboard reading its tab from the web address before the league is saved there.

## 3. Admin emails, subscription emails and in-app notifications
- Reproduce the "Could not send" error and read the real reason. The admin then sees a clear message (for example "Email domain not verified yet") instead of a vague error.
- Fix the cause, then send a test admin email, a subscription email and a payment-confirmation email, and check that each one is delivered.
- Check that in-app notifications (payment confirmed, plan activated, expiry reminders, support replies) show up without errors.

## 4. Lower compute use
- Football match updates: the update currently runs every 20 minutes (72 times a day). New schedule: every 15 minutes during match hours, every 6 hours otherwise, and it stops early if nothing has changed. That's about 70–80% fewer runs while live scores still stay fresh.
- Highlights update: hourly becomes every 3 hours. You can still press Refresh by hand.
- Admin and dashboard screens: data is reused for longer and the app stops checking for updates in the background, so the database is busy less often.

## 5. Remember email and password in the Android app
- Turn on the phone's built-in password saving (Google Password Manager / Autofill) on the sign-in and sign-up forms, so users can save their email and password and fill them in with one tap.
- Remember the last email on the device. The app itself never stores the password. The existing 14-day sign-in stays as it is.

## 6. Influencers: full add, edit and delete
- An edit dialog for name, email, phone, promo code, discount %, revenue share % and active/inactive.
- The promo code can be changed by hand. It's checked so it can't match another influencer's code, and it's saved in capital letters.
- Delete asks for confirmation first. Changing a code does not rewrite old payments; their earnings stay under the code they used at the time.

## 7. Date filters and MRR/ARR
- One shared date filter on the Dashboard, Payments, Customers and Users pages: Today, 7 days, 30 days, This month, Last month, This year, or Custom (calendar range).
- The Dashboard shows MRR (monthly recurring revenue from active subscriptions, converted to a monthly amount) and ARR (MRR × 12), plus revenue for the chosen dates.
- Payments, Customers and Users filter by date on the server, so each page still loads 100 records at a time.

## Technical details
- Fixtures: show `home_score`/`away_score`/status in `UpcomingFixtures`. Turn on the 60s `refetchInterval` only when a fixture's status is IN_PLAY or PAUSED. Change the sync schedule with `update_http_schedule` and add an early exit when nothing changed (`If-Modified-Since`-style).
- Leagues: make the `?tab=football&league=` URL the single source of truth. `MemberDashboard` reads the league and `onTabChange` writes `?tab` back to the URL, so state and URL stay in step.
- `admin-send-email`: read the response body with `error.context` on the client, return structured `{code,message}` from the function, check the email domain status and logs, and redeploy.
- `subscription-emails`, `pawapay-callback`, notification queries: run a test call and read the logs.
- Native autofill: `autocomplete="username"`/`"current-password"`/`"new-password"` and correct `name`s on the auth forms, with the last email kept in `localStorage` (no password).
- Influencers: an update mutation on the existing table with a unique-code check. RLS is admin-only and already exists.
- Filters: a shared `DateRangeFilter` component plus `from`/`to` params passed to `admin-metrics` and the paginated queries. MRR is calculated from active subscriptions × plan price normalized by interval.
