

# Plan: Fix Influencer Links, Phone Input, Dashboard Improvements

## Issues Found

1. **Influencer link 404**: The published URL is `https://stream-net-mirror.lovable.app` but the influencer links point to `https://streamnetmirror.fantasypromaster.fun/`. That domain likely doesn't have proper routing configured (SPA fallback). The route `/influencer/:promoCode` exists in the app — the issue is the **custom domain not serving the SPA correctly** (shows Cloudflare/hosting 404). This is a hosting config issue, not a code bug. However, as a fix we should ensure the link uses the working published URL OR the custom domain if properly configured.

2. **Influencer phone login**: Currently a plain text input. Need to add a phone input library with country code selector (e.g., `react-phone-number-input`).

3. **Official NetMirror links**: Need to be hidden behind a toggle button.

4. **Payment receipt in user dashboard**: Not currently shown. Need to fetch user's payment from `payments` table and display receipt info.

5. **Old email `onlineplagiarismremover@gmail.com`**: Still referenced in Payment.tsx, Terms.tsx, Privacy.tsx, and FAQSection.tsx.

6. **Admin visibility of user info**: Customers page only shows payment-based info. Support tickets show user IDs not names/emails.

---

## Implementation

### 1. Fix influencer link domain
**File**: `src/pages/admin/Influencers.tsx`
- Change `copyLink` to use the published Lovable URL as the working domain: `https://stream-net-mirror.lovable.app/influencer/${promoCode}` (since the custom domain isn't routing properly). 
- Also keep the custom domain as a fallback comment so admin can switch when DNS/routing is fixed.

### 2. Add phone input with country code for influencer login
- Install `react-phone-number-input` package.
- **File**: `src/pages/InfluencerDashboard.tsx`
  - Replace plain phone `<Input>` with `PhoneInput` component from library.
  - Compare the full international number (with country code) against the stored phone.
  - Style to match existing dark theme.

### 3. Hide official NetMirror links behind a toggle
**File**: `src/pages/MemberDashboard.tsx` (lines 237-263)
- Add a `showBackupLinks` state (default `false`).
- Replace direct rendering with a button "Show Backup Links" that toggles the section visible.

### 4. Add payment receipt to user dashboard
**File**: `src/pages/MemberDashboard.tsx`
- Fetch user's payment record from `payments` table by matching their auth email.
- Display a "Payment Receipt" card showing: name, email, amount, currency, date, status, transaction ID, provider.

### 5. Update all old email references
**Files**: `src/pages/Payment.tsx`, `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`, `src/components/FAQSection.tsx`
- Replace all `onlineplagiarismremover@gmail.com` → `shuvaegonera@gmail.com`.

### 6. Show user info in admin support tickets
**File**: `src/pages/admin/SupportTickets.tsx`
- After fetching tickets, collect unique `user_id`s and fetch corresponding names/emails from `subscribers` table.
- Display user name + email instead of just truncated UUID.

### 7. Admin Customers page — show more columns
**File**: `src/pages/admin/Customers.tsx`
- Add `country`, `currency`, `promo_code`, `discount_applied` columns to the table so admin sees full user info.

### 8. Admin Payments page — show promo code & discount
**File**: `src/pages/admin/Payments.tsx`
- Add `promo_code` and `discount_applied` columns.
- Include `currency` column (currently hardcoded as ZMW).

---

## Files to modify
- `src/pages/admin/Influencers.tsx` — link domain
- `src/pages/InfluencerDashboard.tsx` — phone input with country code
- `src/pages/MemberDashboard.tsx` — backup links toggle, payment receipt
- `src/pages/Payment.tsx` — email fix
- `src/pages/Terms.tsx` — email fix  
- `src/pages/Privacy.tsx` — email fix
- `src/components/FAQSection.tsx` — email fix
- `src/pages/admin/SupportTickets.tsx` — show user name/email
- `src/pages/admin/Customers.tsx` — more columns
- `src/pages/admin/Payments.tsx` — more columns

## Package to install
- `react-phone-number-input` (for country-code phone input)

