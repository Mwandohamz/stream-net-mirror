Design system: dark Netflix-style theme, red primary (#E50914 equiv HSL), Bebas Neue display font, Inter body font
Logos: hexagon S + red N alternate crossfade (single position, 3s interval)
Payment: ZMW 49 one-time, multi-country via pawaPay (Airtel, MTN, Zamtel + 10 other African countries)
App name: Stream Net Mirror / NETMIRROR (Netflix-compact style via .netflix-title class)
Contact email: shuvaegonera@gmail.com
Refunds: available within 7 days (fine print)
Admin: /admin route, Supabase auth, requires admin role in user_roles table
DB tables: payments (with deposit_id, currency, country, failure_reason, provider_transaction_id), page_views, user_roles (with has_role() function), subscribers, support_tickets, ticket_messages, influencers, app_settings
Sidebar CSS vars added to index.css for admin dashboard
Payment integration: pawaPay via edge function proxy (pawapay-proxy), secrets: PAWAPAY_API_TOKEN, PAWAPAY_BASE_URL
FX rates: open.er-api.com (public, client-side), converts ZMW 49 to local currencies
Edge functions: all use verify_jwt=false in config.toml, validate JWTs via getClaims() in code
Public support: /support page for guest ticket submission (no auth required), uses public-support-ticket edge function
Admin grant access: admin-grant-access edge function creates/updates auth users with temp passwords for paid users who can't create accounts
Member dashboard: password change via Account Settings section, payment receipt display, backup links toggle
