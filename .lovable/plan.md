# In-app streaming and native-safe media

## Changes
- Add authenticated `/watch/:linkId`, resolving each source through the existing entitlement-checking RPC rather than trusting cached URLs.
- Keep a branded header with title, close, and permitted fullscreen controls. Fullscreen includes the header so branding remains visible.
- Embed iframe sources, with a six-second loading fallback and an always-available recovery action. Cross-origin frame blocking cannot always be detected automatically, so a loaded-but-blocked frame still needs an explicit recovery option.
- Use a maintained Capacitor native WebView plugin for `webview` sources with its URL bar hidden and a branded close toolbar. A native overlay cannot display the React header; its own branded toolbar supplies that context. Web users use the iframe instead.
- Preserve admin-selected external browsing and all existing download/non-stream links.
- Route Watch hub and streaming category buttons through the new player after the existing rotation warning.
- Add admin Playback and Allow fullscreen fields and playback badges.
- Make the dashboard logo switch to Dashboard.
- Normalize all imported asset-pointer URLs against `https://streamnetmirror.app` for bundled native builds.

## Technical details
- Resync generated backend types; reuse existing tables/RPC without migrations or payment changes.
- Add focused tests for streaming-category routing, playback normalization, and absolute asset URLs.
- Use the existing design controls and safe-area patterns; document plugin sync requirements.

## Verification
- Run relevant tests and inspect preview compilation results.
- Exercise signed-in dashboard-to-player and admin editing where an authorized test session is available; verify mobile/desktop headers, fallback, logo navigation, and media.
- Native playback and actual third-party video playback require device verification; report anything that cannot be checked here. No automatic publishing.