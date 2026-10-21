# Architecture rules

- Signup and all verification resends share `src/lib/emailVerification.ts` to land on the public `/verify` route and preserve safe internal checkout destinations on success.
- Streaming buttons route to the authenticated Watch page, which resolves current URLs with `resolve_watch_link`; cached content URLs are not player authority.
- Native streams use a sized, toolbar-less Capgo WebView below the React header; never pass app credentials or inject the Capacitor bridge into third-party content.
- Asset pointer URLs pass through `toAbsoluteAssetUrl` so bundled native builds do not request hosted asset routes from localhost.
- `resolve_watch_link` must check the nonempty entitled URL from `list_content_links`, not just the publicly listed ID, before returning a source or recording a session.