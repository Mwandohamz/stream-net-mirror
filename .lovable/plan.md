

# Plan: OTT Logo Updates, Admin Access Bypass, Smaller Icons, and Influencer System

## 1. Replace OTT Logos

- Copy `user-uploads://Netflix_Original.jpg` to `src/assets/ott/netflix.jpg` (replacing existing)
- Copy `user-uploads://paramount.jpg` to `src/assets/ott/paramount.jpg` (replacing existing)
- The first uploaded image is a reference screenshot and will NOT be embedded

## 2. Make OTT Icons 1/3 Smaller in Pricing Tier

In `PricingTier.tsx` and `MemberDashboard.tsx`, reduce logo containers from `w-12 h-12 md:w-14 md:h-14` to `w-8 h-8 md:w-10 md:h-10`.

## 3. Admin Bypass for Subscriber Pages

**Problem**: Admin can't access `/dashboard` (member page) without a payment/subscription record.

**Solution**: Modify `useSubscriber.ts` to also check if user is an admin (via `validate-admin-email` edge function). If admin email is whitelisted, `isSubscriber` returns `true` regardless of subscriber table.

Similarly update `SignIn.tsx` so admins signing in bypass the subscriber check and go straight to `/dashboard`.

## 4. Influencer Promo/Discount System

### 4A. Database Migration

Create three new tables:

```sql
-- Influencer profiles managed by admin
CREATE TABLE public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  promo_code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL DEFAULT 10,
  revenue_share_percent numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
-- Admin can CRUD, anon can read active codes for validation
CREATE POLICY "Admins can manage influencers" ON public.influencers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active influencers" ON public.influencers FOR SELECT TO anon, authenticated USING (is_active = true);
```

Add `promo_code` and `discount_applied` columns to `payments` table:

```sql
ALTER TABLE public.payments ADD COLUMN promo_code text DEFAULT NULL;
ALTER TABLE public.payments ADD COLUMN discount_applied numeric DEFAULT 0;
```

### 4B. Admin Influencer Management Page

New page `src/pages/admin/Influencers.tsx`:
- List all influencers with name, email, phone, promo code, discount %, revenue share %, active status
- Add new influencer form (full name, email, phone, discount %, revenue share %)
- Auto-generate promo code from name: e.g. "John Doe" becomes `JOHN-DOE`
- Toggle active/deactivate an influencer's code
- Delete influencer
- Show revenue stats per influencer (total payments using their code, total revenue, their share amount)

Add "Influencers" nav item to `AdminLayout.tsx` sidebar and route in `App.tsx`.

### 4C. Influencer Read-Only Dashboard

New page `src/pages/InfluencerDashboard.tsx` at route `/influencer/:promoCode`:
- Login with email + phone number (no Supabase auth, just match against `influencers` table)
- Read-only view showing: total payments with their code, total revenue, their share amount, payment list
- The link contains the influencer name in the URL path

### 4D. Promo Code in Payment Flow

Modify `Payment.tsx`:
- Add optional "Have a promo code?" expandable input field
- On entering a code, validate against `influencers` table (active code)
- If valid, show discount percentage and reduced price
- Pass promo code and discount to `PaymentModal`

Modify `PaymentModal.tsx`:
- Accept optional `promoCode` and `discountPercent` props
- Calculate discounted amount: `baseAmountZMW * (1 - discountPercent/100)`
- Store `promo_code` and `discount_applied` in the payment record via pawapay-proxy

Modify `pawapay-proxy/index.ts`:
- Accept and store `promo_code` and `discount_applied` fields when inserting payment

### 4E. Admin Dashboard Revenue Split

Update `Dashboard.tsx`:
- Add separate stats for organic revenue (no promo code) vs influencer revenue (with promo code)
- Show breakdown in existing charts or new stat cards

## Files to Create/Modify

| Action | File |
|--------|------|
| Replace | `src/assets/ott/netflix.jpg` |
| Replace | `src/assets/ott/paramount.jpg` |
| Modify | `src/components/PricingTier.tsx` — smaller icons |
| Modify | `src/pages/MemberDashboard.tsx` — smaller icons |
| Modify | `src/hooks/useSubscriber.ts` — admin bypass |
| Modify | `src/pages/SignIn.tsx` — admin bypass |
| Migration | New `influencers` table + payments columns |
| Create | `src/pages/admin/Influencers.tsx` |
| Create | `src/pages/InfluencerDashboard.tsx` |
| Modify | `src/components/admin/AdminLayout.tsx` — add Influencers nav |
| Modify | `src/App.tsx` — add routes |
| Modify | `src/pages/Payment.tsx` — promo code input |
| Modify | `src/components/PaymentModal.tsx` — discount logic |
| Modify | `supabase/functions/pawapay-proxy/index.ts` — store promo fields |
| Modify | `src/pages/admin/Dashboard.tsx` — revenue split stats |

