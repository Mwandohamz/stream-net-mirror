

# Plan: Admin Portal Link Setting + Bug Fixes

## Issues Found

1. **Streaming portal URL is hardcoded** to `https://net22.cc/home` in `MemberDashboard.tsx` (4 places) and `Access.tsx` — needs to be dynamic from `app_settings`.

2. **Influencer Dashboard payment query bug** — line 68-70 in `InfluencerDashboard.tsx` selects `name, email, amount, currency, created_at, status` but then filters by `p.promo_code` on line 70, which was never selected. This means the filter always returns empty. Fix: add `promo_code` to the select.

3. **SignIn.tsx admin bypass** — the `useEffect` on line 22-33 only checks subscriber table, doesn't check admin bypass. If admin is already logged in, they won't be auto-redirected.

## Changes

### 1. Admin Settings — Add "Streaming Portal URL" field
**File**: `src/pages/admin/Settings.tsx`
- Add a new card for "Streaming Portal URL" with an input field
- Uses `useAppSettings` to read/write `portal_url` key
- Default value: `https://net22.cc/home`

### 2. MemberDashboard — Use dynamic portal URL
**File**: `src/pages/MemberDashboard.tsx`
- Import `useAppSettings` hook
- Replace all 4 hardcoded `https://net22.cc/home` references with `settings.portal_url || "https://net22.cc/home"`

### 3. Access.tsx — Use dynamic portal URL
**File**: `src/pages/Access.tsx`
- Import `useAppSettings`, use `settings.portal_url` for the primary link

### 4. Fix Influencer Dashboard payment query
**File**: `src/pages/InfluencerDashboard.tsx`
- Line 68: Add `promo_code` to the select: `"name, email, amount, currency, created_at, status, promo_code"`

### 5. Fix SignIn.tsx admin auto-redirect
**File**: `src/pages/SignIn.tsx`
- In the `useEffect`, also check admin bypass via `validate-admin-email` if subscriber check fails

