

# Plan: Pricing Update, UI Polish, Logo Crossfade, Email Collection & Admin Dashboard

## 1. Price Change: ZMW 39 → ZMW 49
Update all references across 6 files: `Payment.tsx`, `HeroSection.tsx`, `HowItWorks.tsx`, `FAQSection.tsx`, `Footer.tsx`, `Terms.tsx`.

## 2. Home Section Typography & Branding
- Make the app name "STREAM NET MIRROR" use a Netflix-style compact look: tighter letter-spacing, bolder weight, red gradient text.
- Increase `font-weight` on body text headings. Add `font-bold` to key subheadings.
- In `index.css`, add a `.netflix-title` utility class with tight tracking and text-shadow.

## 3. Logo Crossfade (Single Position, Alternating)
Replace `LogoShowcase` to show one logo at a time in the same position, crossfading between hexagon and N logos every 3 seconds using framer-motion `AnimatePresence` with fade transitions. Remove the side-by-side layout.

## 4. Email Field on Payment Page
Add an email input field (with `Mail` icon) to `Payment.tsx` between name and phone. Update validation to require valid email. This email will be stored when payment gateway is integrated.

## 5. Admin Dashboard (Supabase Auth Required)
This is the largest piece. Requires Supabase connection first.

### Database Schema (via migrations)
- **`payments`** table: `id`, `name`, `email`, `phone`, `provider`, `amount`, `status`, `created_at`, `transaction_id`
- **`page_views`** table: `id`, `page`, `referrer`, `user_agent`, `session_id`, `created_at`
- **`user_roles`** table: `id`, `user_id` (FK auth.users), `role` (enum: admin/user)
- **`has_role()`** security definer function
- RLS on all tables: payments/page_views readable by admins only

### Admin Pages & Components
- **`/admin/login`** — Supabase email/password auth (admin only, no public signup)
- **`/admin`** — Dashboard layout with sidebar navigation
- **Dashboard sections:**
  - **Overview**: Total revenue, total payments, today's payments, conversion rate — displayed as stat cards with recharts line/bar charts
  - **Payments**: Searchable/filterable table of all payments with name, email, phone, provider, amount, status, date. Export CSV.
  - **Analytics**: Page views over time, bounce rate tracking, traffic sources, device breakdown (from user_agent parsing)
  - **Users/Customers**: All paying customers list with details
  - **Settings**: Admin profile management

### Files to Create
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Payments.tsx`
- `src/pages/admin/Analytics.tsx`
- `src/pages/admin/Customers.tsx`
- `src/pages/admin/Settings.tsx`
- `src/components/admin/AdminLayout.tsx` — sidebar + header layout
- `src/components/admin/AdminRoute.tsx` — protected route wrapper (checks Supabase auth + admin role)
- `src/components/admin/StatCard.tsx`
- `src/components/admin/RevenueChart.tsx`
- `src/hooks/useAdmin.tsx` — hook for admin auth state + role check
- `src/lib/analytics.ts` — page view tracking utility (inserts to page_views table)

### Route Updates in `App.tsx`
Add `/admin`, `/admin/login`, `/admin/payments`, `/admin/analytics`, `/admin/customers`, `/admin/settings`.

### Page View Tracking
Add an analytics tracker component in `App.tsx` that logs every route change to the `page_views` table (with page, referrer, user_agent, session_id).

## 6. Payment Flow Update
On payment success, store payment details to Supabase `payments` table (name, email, phone, provider, amount=49, status="completed"). This prepares for real gateway integration.

## Prerequisites
- **Supabase must be connected first** before implementing the admin dashboard and payment storage. I'll need to set up the connection.

## Files to Modify
- `src/components/LogoShowcase.tsx` — crossfade animation
- `src/components/HeroSection.tsx` — price + typography
- `src/components/Navbar.tsx` — Netflix-style title
- `src/components/HowItWorks.tsx` — price
- `src/components/FAQSection.tsx` — price
- `src/components/Footer.tsx` — price + logo
- `src/pages/Payment.tsx` — price + email field + Supabase insert
- `src/pages/Terms.tsx` — price
- `src/index.css` — Netflix title utility
- `src/App.tsx` — admin routes + analytics tracking
- `tailwind.config.ts` — if needed
- `mem://index.md` — update price to 49

