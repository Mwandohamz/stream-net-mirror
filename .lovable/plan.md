

# Fix Admin Data Display, Trending Section, Promo Visibility, and Device Instructions

## Root Cause: Admin Dashboard Shows No Data

The database confirms 4 payments exist (1 completed ZMW 3 for mwando.julu@gmail.com). The admin role exists for user `76fe7496`. The likely cause is that edge functions `assign-admin-role` and `admin-grant-access` use `auth.getClaims(token)` which does not exist in `supabase-js@2` via esm.sh -- it was introduced later. This causes the function to crash with a 500 error. Although the admin role already exists in the DB, the silent failure may cause timing/auth issues.

**Fix:** Replace `getClaims` with `getUser` in both edge functions. This is the stable v2 API for token validation.

## Changes

### 1. Fix Edge Functions (Root Cause of Empty Dashboard)

**Files:** `supabase/functions/assign-admin-role/index.ts`, `supabase/functions/admin-grant-access/index.ts`

Replace:
```js
const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
const userId = claimsData.claims.sub;
const userEmail = claimsData.claims.email;
```
With:
```js
const { data: { user }, error: userError } = await userClient.auth.getUser();
const userId = user.id;
const userEmail = user.email;
```

This is the stable supabase-js v2 API that works with esm.sh.

### 2. Enhanced Trending Section (Netflix-style Popover)

**File:** `src/components/TrendingSection.tsx`

- Make cards larger: `w-36 h-52 md:w-56 md:h-80` for more room
- On hover/tap, show a richer overlay with:
  - Full description text (no line-clamp, or at least 4-5 lines)
  - Star rating with yellow stars
  - Genre tags as small badges
  - Larger "Watch Now" and "More Info" buttons
  - Smoother slide-up animation instead of simple fade
- Keep existing scroll behavior

### 3. Promo Code More Visible on Payment Page

**File:** `src/pages/Payment.tsx`

- Remove the `showPromo` toggle -- always show the promo code field
- Add a highlighted border/background to draw attention: `bg-primary/5 border-primary/20 border rounded-lg p-3`
- Add label text: "Have a promo code? Enter it below for a discount!"

### 4. iOS DODO WebView Instructions in User Dashboard

**File:** `src/pages/MemberDashboard.tsx`

Add a new card in the Download & Access section with iOS DODO instructions:
- Title: "How to Stream on iPhone (iOS)"
- Step 1: Search "DODO Webview" on Apple App Store
- Step 2: Type site URL (from app settings `portal_url` or `streaming_link_1`)
- Step 3: Turn ON all 3 buttons (Full Screen, Auto Rotation, HTTPS) and click "Open WebView"
- Note: "DODO webview is a third party app, we have no control over this app, it is just a webview app on which we just open our site just like we do in a browser."
- Add "Download iOS DODO App" button linking to the App Store

### 5. Android TV Instructions in User Dashboard

**File:** `src/pages/MemberDashboard.tsx`

Add another card for Android TV:
- Title: "How to Stream on Android TV"
- Description: "Download Android TV APK. We tested on Android TV and Google TV."
- "Download TV APK" button linking to the APK download
- Tabs or sections: Android, iOS, Computer, Android TV (matching the reference screenshots)

### 6. Admin Badge Fix (Clear on Page Open)

**File:** `src/components/admin/AdminLayout.tsx`

Current implementation already marks seen on page open via `markSeenForCurrentPage`. The issue is that `fetchBadges` also calls `assign-admin-role` which may fail (see fix #1). Once edge functions are fixed, badges should work. No additional code change needed beyond the edge function fix.

## Files Summary

**Modify (5):**
- `supabase/functions/assign-admin-role/index.ts` -- Fix `getClaims` -> `getUser`
- `supabase/functions/admin-grant-access/index.ts` -- Fix `getClaims` -> `getUser`
- `src/components/TrendingSection.tsx` -- Enhanced Netflix-style popover
- `src/pages/Payment.tsx` -- Always-visible promo code field
- `src/pages/MemberDashboard.tsx` -- Add iOS DODO + Android TV instruction cards

