# Stream NetMirror — final catalogue and highlights audit

Audit date: 18 November 2026.

## 1. Code audit — passed with fixes
- Public Movies, TV Series and member catalogues use the same TMDB function.
- Genre filters now use discover queries before pagination rather than filtering only one trending page.
- Pagination is capped at TMDB's 500-page limit. Country changes reset the provider; global trending/search queries do not restrict country.
- Signed-in unpaid Watch actions use payment; guests use signup; active members use the existing Watch hub. Existing server entitlement enforcement is unchanged.
- Fixed mobile heading overlap and clipped poster action buttons without redesigning the application.
- Highlights use shared query caching rather than fetching on every section mount.
- Sync now uses the existing permitted `started` run status, preserves approval by excluding it from metadata updates, records attempted API requests, and blocks private/unprocessed/missing videos.
- Matching requires both complete team names in the title, a finished fixture within seven days, and exactly one candidate; descriptions cannot cause false positives.
- Public highlights require approval, embeddability, available status and unexpired API data.

## 2. Database verification — passed
Inspected all four existing tables, column types, constraints, indexes, grants and RLS. All have RLS enabled; anonymous/authenticated direct reads are denied and server access is granted. Existing source/video uniqueness prevents duplicate pairs; fixture/source foreign keys remain intact.

Applied only one migration: `drizzle/migrations/0005_allow_tmdb_provider_cache.sql`. It adds `providers` to the existing cache query-type constraint, which previously rejected provider cache writes. No tables were recreated and no payment/subscription records were changed.

## 3. Edge Functions — deployed and live-tested individually
| Function | Deployment | Executed check |
| --- | --- | --- |
| tmdb-catalog | Successful | Trending, search, discover, providers and invalid-input responses |
| sync-football-highlights | Successful | Admin request and managed cron return 200; anonymous/invalid token return 401 |
| match-football-highlights | Successful | Admin request returns 200; anonymous/invalid token return 401 |
| get-football-highlights | Successful | Public request returns 200 with the legitimate empty list |

JWT gateway checking is disabled for these functions; sync/matching validate the caller in code and use the existing protected admin-role function. Sync additionally accepts only the managed scheduling credential, using the generated timing-safe helper. Public read functions return only approved metadata.

## 4. Secrets — configured
- TMDB_ACCESS_TOKEN: configured and verified by successful live TMDB responses.
- YOUTUBE_API_KEY: configured; a low-cost video-category API request returned 200.
- Standard backend URL, publishable key and service-role binding: verified through live authenticated/public calls and cache writes.
- Managed scheduling credential: configured and authenticated callback returned 200.
- No credential values appear in this report or frontend additions.

## 5. TMDB catalogue — executed tests passed
Live endpoint checks: movie/TV trending, Stranger Things TV search, Netflix US discover, Action discover page 2, US/Zambia providers, repeat cached responses, and rejection of page 501, malformed country and object search queries.

Browser checks: public Movies/TV, search, next page, Netflix selection, country change clearing provider, genre selection, guest Watch destination, authenticated Movies & Series, and mobile layout. No page runtime exceptions and no horizontal mobile overflow.

Cache verification: search expires after 3 hours; trending/discover after 12 hours; providers after 24 hours. Cache keys include effective request parameters. US provider list returned 295 entries versus 23 for Zambia.

This is discovery metadata, not a guarantee that every title is on Netflix or playable through current member links. Search and provider filtering remain separate modes in the existing interface.

## 6. Football highlights — partial live verification
Public/member empty states, public endpoint and administrative authorization were exercised. Privacy-enhanced youtube-nocookie embeds remain in place. Tests cover complete team matching, ambiguous matches and exclusion of nonembeddable/private/unprocessed videos.

Actual channel ingestion, duplicate retries, approval preservation during a real sync, success/failure run records and real YouTube playback cannot be exercised because no channel is configured and there are zero highlights. Those behaviors were code-audited; they are not claimed as successful live video tests.

## 7. YouTube sources — configuration outstanding
All eight sources are disabled and have no channel ID, handle or URL: SuperSport, Sky Sports, Premier League, UEFA Champions League, LaLiga, Bundesliga, UEFA Europa League and UEFA Conference League. No IDs were guessed and no unverified source was enabled.

Provide and verify each intended official channel's ID/URL before enabling it. Sync requests up to 20 recent uploads per due channel using uploads playlists, avoiding expensive YouTube search calls.

## 8. Automated scheduling — configured
Created `football-highlights-sync` at `17 * * * *` using managed authenticated scheduling. Existing football fixture schedule was preserved. Sources' individual sync intervals are respected. The callback is verified, but there is no due configured source yet, so no actual scheduled ingestion is claimed.

## 9. Build, lint and tests
- Automated tests: 52 passed across 14 files, including payment/subscription duration and streaming regression tests.
- Relevant four Edge Function Deno checks: passed.
- Scoped catalogue/highlights lint: zero errors and warnings.
- Repository-wide lint: failed with 201 errors and 27 warnings, predominantly existing unrelated files; no lint rules were disabled or unrelated modules rewritten.
- Harness compilation/build log: latest entry `build OK`. Per platform instruction, a separate manual production build/typecheck was not run.
- Desktop/mobile browser flows: passed; no runtime exceptions.

## 10. Security findings
Reviewed available scan results. Existing findings concerned public page-view insertion, public fixtures and public avatar/content-media listing, not this catalogue/highlights scope; they were not ignored or changed. Several scan results are stale, so this audit does not claim a fresh, comprehensive security scan.

Fixed scoped issues: incompatible gateway JWT settings, admin role authorization, malformed input handling, unsafe approval overwriting and stale/blocked highlight exposure. Tokens remain server-only. Pricing, plan rules, payment amounts, payment confirmation, Telegram and Meta logic were not modified.

## 11. Production deployment
All four functions and the one safe cache migration are live. Frontend deployment succeeded at https://streamnetmirror.app. Executed production browser checks: `/movies` returned HTTP 200, the updated country control was present and 19 movie cards loaded; `/live-sports` displayed the legitimate empty highlights state. No production page runtime exceptions were observed. This verifies the new frontend was served, not merely that publishing was scheduled.

## 12. Outstanding manual actions
1. Supply/verify official channel IDs, enable intended sources, run sync, review and approve appropriate highlights.
2. Verify a real ingested highlight plays on web and the rebuilt Android APK; check regional YouTube restrictions.
3. A fresh real payment was not charged during this audit; payment regression tests passed and payment code/data were untouched.
4. Resolve unrelated repository-wide lint issues separately if full-project lint cleanliness is required.
5. Rebuild the APK to include the frontend changes in native distribution.

Older roadmap items (release signing/device testing and recipient inbox/autofill checks) are outside this catalogue/highlights audit and are not claimed complete.