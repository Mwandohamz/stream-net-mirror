

# Plan: User Dashboard Overhaul, Support Chat, Admin Links & Fixes

## Changes Overview

### 1. Influencer dashboard link domain fix
**File**: `src/pages/admin/Influencers.tsx` (line 117)
- Change `copyLink` to use `https://streamnetmirror.fantasypromaster.fun/influencer/${promoCode}` instead of `window.location.origin`.

### 2. Member Dashboard overhaul (`src/pages/MemberDashboard.tsx`)
- **Important notice section**: Add a prominent info card explaining that links may change/break (especially for WebView/iOS users), that users should return to their account to get refreshed links, and that this is a cheap lifetime streaming clone service — occasional lags are expected but access remains free forever.
- **3 official website buttons**: Read `streaming_link_1`, `streaming_link_2`, `streaming_link_3` from `app_settings` and display 3 buttons ("Official Link 1/2/3") for fallback access.
- **APK as primary recommendation**: Reorder download section — APK first with "RECOMMENDED" badge for Android users; WebView/Laptop recommended for iPhone users.
- **Email support**: Change from `onlineplagiarismremover@gmail.com` to `shuvaegonera@gmail.com`.
- **WhatsApp button**: Remove the `href` link, make it show a toast saying "WhatsApp support coming soon" instead of opening a broken link.
- **Support tickets**: Keep existing ticket submission. Add a "My Tickets" section below showing user's past tickets with admin replies (chat-style thread).
- **Sign out**: Ensure the sign out button works (already calls `supabase.auth.signOut()` + navigates — looks correct, will verify).

### 3. Admin Settings — 3 official streaming links (`src/pages/admin/Settings.tsx`)
- Add a new card "OFFICIAL STREAMING LINKS" with 3 URL inputs for `streaming_link_1`, `streaming_link_2`, `streaming_link_3`, each saved to `app_settings`.

### 4. Admin Support Tickets page (new file: `src/pages/admin/SupportTickets.tsx`)
- New admin page showing all support tickets grouped by user.
- Each ticket expandable to show a chat thread (messages stored in a new `ticket_messages` table).
- Admin can reply to any ticket, and close/reopen tickets.
- Add route `/admin/support` in `App.tsx` and nav item in `AdminLayout.tsx`.

### 5. Database migration
- New table `ticket_messages`: `id`, `ticket_id` (FK → support_tickets), `sender_role` (enum: 'user'|'admin'), `message` (text), `created_at`.
- RLS: users can read messages for their own tickets, admins can read/insert all, users can insert on their own tickets.
- Add `updated_at` column to `support_tickets` for tracking last activity.

### 6. Footer email update (`src/components/Footer.tsx`)
- Change all `onlineplagiarismremover@gmail.com` references to `shuvaegonera@gmail.com`.
- Also update `termsContent` and `privacyContent` contact email references.

### 7. Influencer revenue tracking verification
- Already correct: both `InfluencerDashboard.tsx` (line 70) and `Influencers.tsx` (line 61) filter payments by `promo_code` match. Only payments made with that specific influencer code are counted.

### Files to create/modify
- **Create**: `src/pages/admin/SupportTickets.tsx`
- **Modify**: `src/pages/MemberDashboard.tsx`, `src/pages/admin/Settings.tsx`, `src/pages/admin/Influencers.tsx`, `src/components/admin/AdminLayout.tsx`, `src/components/Footer.tsx`, `src/App.tsx`
- **Migration**: New `ticket_messages` table + RLS policies

