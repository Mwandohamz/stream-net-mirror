

# Enhancements: Page Transitions, Trending Hover, Logos, Footer Popups

## 1. Page Transitions (AnimatePresence in App.tsx)
Wrap `<Routes>` with framer-motion `AnimatePresence` and add a `PageTransition` wrapper component that applies fade+slide on route changes using `useLocation()`.

## 2. Trending Section — Netflix Hover & Play Button
- On hover/tap, expand the card and show a Netflix-style overlay with: title, genre, rating, year, a short description, and a **Play** button that navigates to `/payment`.
- Add descriptions to each trending item data.
- Use framer-motion `whileHover` for desktop, tap overlay for mobile.

## 3. NetMirror Logo Integration
- Copy the uploaded N logo (`icon-removebg-preview-2.png`) to `public/logo-n.png` (replace existing).
- Make both logos **2x bigger** everywhere (navbar: `h-20 w-20` desktop / `h-16 w-16` mobile).
- Add a **dual-logo showcase** component used in Hero, OTTPartners, and Footer — two logos side by side with a spinning/pulse animation, synced.
- Footer: both logos at bottom, larger.

## 4. Footer — Popup Dialogs for Terms & Privacy
- Add a `Dialog` (radix) for Terms and Privacy that can be triggered from footer links.
- Keep `/terms` and `/privacy` routes as standalone pages with back buttons.
- Footer links open the dialog popup; dialog has a "View Full Page" link to the route.

## 5. Fix Navigation Links
- Navbar "Movies" and "TV Series" scroll to `#trending` on the home page.
- "Download App" scrolls to `#download`.
- All footer links point to correct sections/pages.

## 6. Files to Modify
- `src/App.tsx` — page transitions with AnimatePresence + location
- `src/components/PageTransition.tsx` — new wrapper component
- `src/components/TrendingSection.tsx` — hover cards with play button + descriptions
- `src/components/Navbar.tsx` — 2x bigger logos
- `src/components/Footer.tsx` — bigger logos, dual logo display, popup dialogs for Terms/Privacy
- `src/components/LogoShowcase.tsx` — new reusable dual-logo spinning component
- `src/components/HeroSection.tsx` — add LogoShowcase
- `src/components/OTTPartners.tsx` — add LogoShowcase
- `src/pages/Terms.tsx` — add back button
- `src/pages/Privacy.tsx` — add back button
- Copy uploaded logo to `public/logo-n.png`

