

# Fix Admin Dashboard Data Display, User Notifications & Admin Badges

## Problem Summary
1. Admin dashboard may show zero revenue because the stat card grid has 8 columns which causes cards to be too small/unreadable
2. No temp password notification in user dashboard prompting password change
3. No "Copy link & share to WhatsApp" feature in user dashboard
4. No notification badges in admin sidebar showing counts for payments, support tickets, and customers
5. Date/timestamp display needs to be more detailed (include time, not just date)

## Changes

### 1. Admin Dashboard — Fix display and add detailed timestamps
**File:** `src/pages/admin/Dashboard.tsx`
- Change stat card grid from 8 columns to 4 columns (`grid-cols-2 md:grid-cols-4`) so values are readable
- Add full timestamp (date + time) to recent payments table
- Add new stat cards: "New Customers" (subscribers count), "Open Tickets" (support_tickets where status=open)
- Fetch support ticket and subscriber counts in `fetchStats`

### 2. Admin Sidebar — Add notification badges
**File:** `src/components/admin/AdminLayout.tsx`
- Fetch counts from database: new payments (today), open support tickets, total customers
- Show badge numbers next to sidebar nav items (Payments, Support, Customers)
- Use small red/primary badge circles with counts

### 3. User Dashboard — Temp password notification + Copy/Share link
**File:** `src/pages/MemberDashboard.tsx`
- Detect if user was created via admin grant access (check `user_metadata` for temp password flag, or simply show a prominent "Change your password" banner if account settings haven't been visited)
- Add a "Copy Dashboard Link" button and "Share to WhatsApp" button in the header area
- WhatsApp share opens `https://wa.me/?text=...` with the site URL

### 4. Payments table — Add full timestamps
**File:** `src/pages/admin/Payments.tsx`
- Change date column from `toLocaleDateString()` to `toLocaleString()` to show date + time

### Files to modify:
- `src/pages/admin/Dashboard.tsx` — Fix grid, add ticket/subscriber counts, detailed timestamps
- `src/components/admin/AdminLayout.tsx` — Add notification badges to sidebar
- `src/pages/MemberDashboard.tsx` — Add temp password banner, copy link, WhatsApp share
- `src/pages/admin/Payments.tsx` — Full timestamps

