# Football fixtures

`football-fixtures` is a POST-only, protected Lovable Cloud function. It is deployed with application changes. It accepts an authenticated session with the existing admin role, or an `x-sync-secret` header matching `FIXTURES_SYNC_SECRET`. No browser-triggered synchronization or public writes are added.

## Setup
1. Register for a free key at https://www.football-data.org/ and confirm your account includes PL, CL, and PD.
2. Add `FOOTBALL_DATA_API_KEY` in Project Settings → Secrets.
3. Create one strong random shared value using a password manager or `openssl rand -hex 32`; save it as `FIXTURES_SYNC_SECRET` in Project Settings → Secrets and securely in your scheduled job configuration. Never commit it, put it in frontend code, or place it in public SQL examples.
4. In View Backend → Functions → football-fixtures, copy the deployed function URL for your scheduled POST request. Supply `x-sync-secret` with the same value. The app never needs this secret.

Before the API key is configured, authorized requests return HTTP 200 with `{ "skipped": true, "reason": "no_api_key" }`. Unauthenticated requests still return 401. An admin can also invoke the function while logged in; the no-key behavior does not weaken authorization.

## Behavior
- Requests scheduled matches from `/v4/competitions/{PL|CL|PD}/matches?status=SCHEDULED` using backend-only `X-Auth-Token`.
- At least one second between competition requests; 429 is logged once with no retries.
- Skips competitions whose most recent stored fixture was synced less than ten minutes ago. An empty upstream competition has no row to timestamp, so the schedule should also be at least ten minutes apart. Concurrent overlapping invocations are not an atomic distributed quota lock.
- Upserts the API match ID into the existing `fixtures` table. No new tables, RLS changes, cron jobs, payment logic, or per-match streaming URLs.
- Both sports views read the next 20 fixtures after a two-hour lookback with a three-minute cache per competition filter. Times use the viewer's timezone.
- Watch opens the existing sports-only WatchHub picker for entitled members; guests go to signup and unpaid accounts go to payment. The existing link picker and rotation warning precede `/watch/:linkId`.
- This scheduled-only feed is not a live-score feed: status chips reflect stored API status; actual live/finished scores require a later expanded sync scope.

## Verification limits
Real upstream synchronization requires the API key; paid-member playback requires an authorized paid account. Do not mistake mocked fixture UI checks for upstream API or live-video verification.