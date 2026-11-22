# Architecture rules

- Fixtures are public cached metadata synced only by the protected football-fixtures function; fixture Watch actions reuse the live-sports platform picker and never create per-match stream URLs.

- Signup and all verification resends share `src/lib/emailVerification.ts` to land on the public `/verify` route and preserve safe internal checkout destinations on success.
- Native session age is enforced by NativeSessionGuard independently of refresh-token renewal; store only expiry metadata and use OS/password-manager autofill, never stored passwords.
- Streaming buttons route to the authenticated Watch page, which resolves current URLs with `resolve_watch_link`; cached content URLs are not player authority.
- Explicit browser fallback uses `streamBrowser.ts` and the same entitled resolver; the player switcher uses cached catalog metadata and keeps playback navigation within Watch.
- Member launch buttons and player switching use StreamLaunchDialog for a warning and in-app/external choices on every launch; never persist an acknowledgement that skips this choice.
- Custom plan days reuse interval=day and interval_count, while shared planDuration calculates fixed-day activation periods and activation explicitly clears grace days; this avoids a parallel duration field and implicit expiry extensions.
- Native streams use a sized, toolbar-less Capgo WebView below the React header; never pass app credentials or inject the Capacitor bridge into third-party content.
- Asset pointer URLs pass through `toAbsoluteAssetUrl` so bundled native builds do not request hosted asset routes from localhost.
- `resolve_watch_link` must check the nonempty entitled URL from `list_content_links`, not just the publicly listed ID, before returning a source or recording a session.
- Own-app distribution uses a separate app setting and a namespaced path in the existing private app-files bucket, preventing legacy third-party APKs from being delivered.
- Account history and notification inbox read existing RLS-protected subscription, payment and ticket records via cached queries; never create a parallel payment or notification authority.
- The native launch animation runs once per cold app mount above routes; it must not replay on resume or initiate payments or tracking.
- NativeEntryFlow replaces website landing/entertainment routes with session-aware dashboard destinations before rendering them; account verification, checkout and web routes stay unchanged.
- Public and member catalogues share the server-only TMDB cache; region affects provider availability, not the global catalogue, and discover filters run before pagination.
- Dashboard tab state follows router query changes so catalogue Watch actions and browser history select the intended platform hub without a remount.
- Highlight sync preserves approval separately from metadata updates; fixture matching uses both teams in the title and only completed fixtures to avoid description-based false matches.- Membership status starts from a device-local snapshot (`membershipCache.ts`, status/expiry only, cleared on sign-out) and is re-checked silently; an expired snapshot is never shown as active, preventing the inactive flash without trusting stale access.
- Discovery rows (`TMDBRow`) read live TMDB trending/discover through the cached `tmdb-catalog` function; public Watch taps follow `publicWatchDestination` (account → payment → Watch).
- Server-side guard rails use `_shared/rateLimit.ts` with the service-only `check_rate_limit` function (hashed user/IP subjects, fail-open on errors); client cooldowns are UX only, never the enforcement.
- Admin Edge Functions authenticate through `_shared/adminAuth.ts` (local JWT claims + allow-list/role) and the client reads failure bodies with `functionErrorMessage`, so admins see the real reason instead of a generic status error.
- Fixture sync uses adaptive freshness for upcoming/live/overdue unfinished games and a thirty-day results window; bounded recent/upcoming reads prevent fixtures from crowding out scores in any league.
- Auth and app emails share BrandHeader with a public storage PNG, so email logos remain accessible independently of frontend publishing.
- Highlight review uses the admin-highlights endpoint with server-side admin authentication, 100-row pagination, and availability checks before publishing; sync never overwrites approval.
- Admin date filters share `src/lib/dateRange.ts`/`DateRangeFilter`; MRR/ARR come from currently active subscriptions normalised by plan interval, independent of the selected dates.
