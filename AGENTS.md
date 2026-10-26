# Architecture rules

- Fixtures are public cached metadata synced only by the protected football-fixtures function; fixture Watch actions reuse the live-sports platform picker and never create per-match stream URLs.

- Signup and all verification resends share `src/lib/emailVerification.ts` to land on the public `/verify` route and preserve safe internal checkout destinations on success.
- Streaming buttons route to the authenticated Watch page, which resolves current URLs with `resolve_watch_link`; cached content URLs are not player authority.
- Native streams use a sized, toolbar-less Capgo WebView below the React header; never pass app credentials or inject the Capacitor bridge into third-party content.
- Asset pointer URLs pass through `toAbsoluteAssetUrl` so bundled native builds do not request hosted asset routes from localhost.
- `resolve_watch_link` must check the nonempty entitled URL from `list_content_links`, not just the publicly listed ID, before returning a source or recording a session.
- Own-app distribution uses a separate app setting and a namespaced path in the existing private app-files bucket, preventing legacy third-party APKs from being delivered.
- Account history and notification inbox read existing RLS-protected subscription, payment and ticket records via cached queries; never create a parallel payment or notification authority.
- The native launch animation runs once per cold app mount above routes; it must not replay on resume or initiate payments or tracking.