

# Plan: STREAMNETMIRROR Complete Overhaul

## Summary

This is a large, multi-part implementation covering: dynamic pricing tier UI, real analytics, paid-user authentication, a protected member dashboard, OTT branding, and mobile optimization. I will break it into phases.

---

## Phase 1: Branding & Dynamic Pricing Tier

### 1A. Copy OTT logos to project
- Copy uploaded images (Netflix, Disney+, HBO Max, JioHotstar, Apple TV+) to `src/assets/ott/`
- These will be used in the pricing tier card and throughout the site

### 1B. Rename brand to "STREAMNETMIRROR"
- Update `Navbar.tsx` — change "NETMIRROR" to "STREAMNETMIRROR"
- Update `Footer.tsx`, `HeroSection.tsx`, `FAQSection.tsx`, `FeaturesGrid.tsx` — all brand references
- Update page titles and meta

### 1C. Create Pricing Tier component
- New `src/components/PricingTier.tsx` — Netflix-inspired single pricing card
- Shows dynamic price from `app_settings` (fetched via `useAppSettings`)
- **Discount display**: always shows 70% discount. If admin sets price to ZMW 49, the "was" price = `49 / 0.30` = ~ZMW 163 (crossed out), current = ZMW 49, badge "Save 70%"
- **Plan details** (modeled after Netflix Standard): 1080p resolution, multiple devices, downloads
- **OTT logos grid**: Netflix, Disney+, HBO Max, Apple TV+, JioHotstar displayed as uploaded images (same size, no background, high quality)
- Emphasize: "ONE PAYMENT. LIFETIME ACCESS." and "All platforms included"
- Mobile-optimized: card fills width, logos wrap in grid

### 1D. Update existing price references
- `HeroSection.tsx` — fetch dynamic price, show discount (crossed-out old price + new price)
- `HowItWorks.tsx` — dynamic price in step 2 and CTA button
- `Payment.tsx` — dynamic price display
- `PaymentModal.tsx` — already uses dynamic price (keep as-is)
- `FAQSection.tsx` — dynamic price in answers
- `Footer.tsx` — dynamic price in terms text

### 1E. Add Pricing Tier to Index page
- Insert `PricingTier` component between `OTTPartners` and `FeaturesGrid` on the home page

---

## Phase 2: Real Analytics & Revenue Fix

### 2A. Fix revenue to only count successful payments
- `Dashboard.tsx` — filter payments by `status === 'completed'` for revenue calculations
- Remove hardcoded "+12%" trend — calculate real trend from data

### 2B. Analytics are already real
- The current analytics page already queries real `page_views` data (session tracking, device breakdown, bounce rate, top pages). This is working correctly with the existing `trackPageView` function. No changes needed here.

---

## Phase 3: User Authentication for Paid Users

### 3A. Database: `subscribers` table
- New migration: create `subscribers` table with columns: `id`, `user_id` (FK to auth.users), `email`, `phone`, `name`, `payment_id` (FK to payments), `status` (active/inactive), `created_at`
- RLS: users can read their own row; admins can read all

### 3B. Post-payment account creation flow
- After successful payment in `PaymentModal.tsx`, redirect to a new `/signup` page (not the current `/access`)
- `/signup` page pre-fills email and name from payment, asks user to set a password
- On submit: calls `supabase.auth.signUp()`, then inserts into `subscribers` table linking to payment
- Validates that payment exists and is `completed` for the given email before allowing signup

### 3C. Sign-in flow for returning users
- Update Navbar "Sign In" button to navigate to `/signin` page
- New `/signin` page: email + password login via `supabase.auth.signInWithPassword()`
- After login, check `subscribers` table — if user has active subscription, redirect to `/dashboard` (member area)
- If no subscription found, show message: "No active subscription. Please complete payment first."

### 3D. Protected Member Dashboard (`/dashboard`)
- New route protected by auth (check subscriber status)
- Shows:
  - Welcome message with user's name
  - Clear instructions on how to use StreamNetMirror
  - **Hidden button** to access official NetMirror website: `https://net22.cc/home` — button says "Launch Streaming Portal", opens in new tab
  - Instructions for mobile: accept permissions to install APK, grant phone permissions
  - Download APK section
  - Google Auth sign-in mention for the official site
  - **Customer Support section**: WhatsApp link, support ticket form (creates entries in a `support_tickets` table), promise of immediate response

### 3E. Database: `support_tickets` table
- Migration: `support_tickets` table with `id`, `user_id`, `subject`, `message`, `status` (open/resolved), `created_at`
- RLS: users can insert and read their own; admins can read all

---

## Phase 4: Email Notifications (Future — requires Resend setup)
- After payment success, send email with login details and receipt
- This will require the user to provide a Resend API key or set up email domain
- Will be implemented as a follow-up after core features are working

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Copy | `src/assets/ott/netflix.jpg` | OTT logo |
| Copy | `src/assets/ott/disney-plus.jpg` | OTT logo |
| Copy | `src/assets/ott/hbo-max.jpg` | OTT logo |
| Copy | `src/assets/ott/jiohotstar.jpg` | OTT logo |
| Copy | `src/assets/ott/apple-tv.jpg` | OTT logo |
| Create | `src/components/PricingTier.tsx` | Pricing card with OTT logos |
| Create | `src/pages/SignIn.tsx` | Subscriber login |
| Create | `src/pages/SignUp.tsx` | Post-payment account creation |
| Create | `src/pages/MemberDashboard.tsx` | Protected member area |
| Create | `src/components/SubscriberRoute.tsx` | Route guard for paid users |
| Migration | `subscribers` + `support_tickets` tables | DB schema |
| Modify | `src/App.tsx` | Add new routes |
| Modify | `src/components/Navbar.tsx` | Brand name + sign-in link |
| Modify | `src/components/HeroSection.tsx` | Dynamic pricing + discount |
| Modify | `src/components/HowItWorks.tsx` | Dynamic pricing |
| Modify | `src/components/FAQSection.tsx` | Dynamic pricing in answers |
| Modify | `src/components/Footer.tsx` | Brand name |
| Modify | `src/pages/Index.tsx` | Add PricingTier |
| Modify | `src/pages/Payment.tsx` | Dynamic pricing |
| Modify | `src/pages/admin/Dashboard.tsx` | Revenue = completed only |
| Modify | `src/components/PaymentModal.tsx` | Post-payment redirect to signup |

---

## Technical Notes

- Dynamic discount formula: `oldPrice = currentPrice / 0.30` (since 70% off means paying 30%)
- All price displays will use `useAppSettings` hook to fetch the admin-set price
- The official streaming link `https://net22.cc/home` will only be accessible on the protected `/dashboard` page behind auth + payment verification
- Support tickets stored in database with admin visibility in the admin dashboard
- OTT logos will be imported as ES6 modules from `src/assets/ott/` for proper bundling

