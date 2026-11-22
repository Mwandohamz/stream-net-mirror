# Roadmap — dashboard native polish + in-app streaming + APK downloads

## Current request
- [x] Change football highlight sync from every three hours to five daily checks at five-hour UTC intervals
- [x] Verify the admin Highlights sidebar destination and approval page are available with pending videos loaded
- [x] Make USD the default admin money view with a USD/ZMW selector using each payment's stored historical rate; missing rates stay unavailable
- [x] Correct Overview, Payments, Customers and Analytics totals so currencies are never added together and ARR is clearly MRR × 12
- [x] Close seven expired pending payments and add lazy member/admin reconciliation without another scheduled job; zero pending payments remain
- [x] Pass 82 tests and typecheck, deploy three affected functions, verify signed-in admin screens with no runtime errors, and prepare the commit

## Previous request
- [x] Verify and repair live scores/results across PL, CL and PD, including league selection; signed-in desktop/mobile scores and reload persistence checked
- [x] Repair shared email logo and clarify sender-avatar requirements; four deployed email previews rendered with the public PNG
- [x] Diagnose missing highlights and enable three verified official sources; 60 videos ingested, three-hour schedule retained, approval preserved
- [x] Add admin-only highlights review/publish controls; preview → approve → public read → unpublish verified with a real video and original pending state restored
- [ ] Configure inbox sender-avatar branding — email providers control display; requires a separate verified-brand/BIMI setup, not an email-template change
- [x] Audit and correct TMDB catalogue, provider/genre filters, caching and highlights integration
- [x] Verify protected tables, four deployed functions, configured credentials and authenticated hourly scheduling
- [x] 52 automated tests, scoped lint, Deno checks and desktop/mobile signed-in/public browser checks passed; frontend publishing requested
- [x] Configure verified official PL/UEFA/La Liga YouTube channels and admin approval; other channels remain disabled pending verification
- [x] Confirm production frontend deployment: https://streamnetmirror.app/movies returned 200 with new controls and 19 movie cards; Live Sports highlights empty state passed, no runtime errors
- [x] Shared streaming warning with in-app and external website choices for every platform and player switch
- [x] Admin-editable exact plan days using existing fields; default 30 days and zero implicit grace on future activations; 16 tests passed and preview compilation clean
- [ ] Deploy duration activation changes and verify signed-in streaming/admin plan save — hosted database is paused; deployment of pawapay-proxy, pawapay-callback and claim-payments was refused; public browser check passed with no runtime errors
- [x] Native 14-day reauthentication window, password-manager-friendly sign-in, official-domain verification and email-code alternative; 13 tests, email sender validation/deploy and signed-in dashboard browser check passed
- [ ] Verify newly delivered email link/code and Android autofill on rebuilt release APK — requires recipient inbox and Android device; hosted session timebox/inactivity limits not exposed by available settings tools
- [x] Browser fallback on each stream and player; switch links in a popup without leaving playback — 10 tests and signed-in browser switching/tab-opening checks passed; native device check requires rebuilt APK
- [x] Native-only entry routing: splash → login/signup → dashboard, no website landing pages
- [x] Verified 26 tests and clean preview compilation; browser-emulated native splash/signup/saved-session dashboard and unchanged web homepage; documented APK rebuild (real-device check still manual)
- [x] Mobile sidebar and gradient Play action
- [x] Account transaction/subscription history and in-app notification inbox (existing account records, not push notifications)
- [x] Animated native launch using existing icon/movie/football assets
- [x] Separate own-app APK upload from legacy external APK; signed release APK workflow and instructions
- [x] 22 tests, preview compilation, workflow syntax and signed-in mobile validation
- [ ] Build/install signed APK and verify real-device launch/login/payment/playback — requires user's GitHub signing secrets/workflow and Android device
- [ ] Upload own Stream NetMirror release APK in Admin Settings — requires successful GitHub APK artifact; old external APK is intentionally unavailable

- [x] Swap dashboard tab icons: House for Home, ball for Football (bottom nav + sidebar)
- [x] Login/signup/account creation → straight to /dashboard (already in place, verified)
- [x] In-app streaming is the default with explicit browser recovery; iframe back button + popup platform switcher + popup/redirect blocking
- [x] APK download for everyone, tracked downloads (device/time) visible in admin Settings
- [x] LIVE badge on live football fixtures
- [x] Reduced dashboard text; compact link-rotation notice
- [x] Profile section redesign (gradient header, centered avatar, info rows, plan status); sidebar Download App button with Android-warning dialog
- [x] Play-icon loading indicator replacing spinners
- [x] Verified: typecheck, 20 tests, build OK, signed-in desktop + mobile browser pass, download endpoint returns signed APK URL and logs the download
