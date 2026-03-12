

# Mobile Optimization & Content Enhancement Plan

## Changes Overview

### 1. Trending Section — Real Movie Posters via TMDB Image URLs
Replace gradient placeholder cards with real movie poster images from TMDB's public CDN. Add proper show metadata (year, rating). Reduce card sizes on mobile to ~1/3 current size (w-28 h-40 on mobile vs w-52 h-72 on desktop). Add smooth touch scrolling with `-webkit-overflow-scrolling: touch` and snap scrolling.

### 2. Hero Section — Mobile Optimization
- Reduce mobile heading from `text-5xl` to `text-3xl`
- Reduce hero height on mobile from `min-h-[90vh]` to `min-h-[70vh]`
- Shrink subtext and input on mobile
- Make CTA button full-width on mobile with larger touch target (h-11)

### 3. Navbar — Bigger Logos
- Increase hexagon logo from `h-10 w-10` to `h-12 w-12` (desktop) and keep `h-10 w-10` mobile
- Show brand name on mobile too (smaller text)
- Animate mobile menu with framer-motion slide-down

### 4. All Sections — Mobile Size Reduction (~1/3)
- **FeaturesGrid**: 2-col grid on mobile with smaller padding (p-4), smaller icons (w-8 h-8), smaller text
- **OTTPartners**: Smaller icon sizes on mobile (20px vs 28px), compact padding
- **ReasonsToJoin**: Reduce heading from `text-3xl` to `text-xl` on mobile, smaller images
- **HowItWorks**: Smaller step circles (w-14 h-14 on mobile vs w-20), reduce text
- **AppDownload**: Stack layout, smaller text on mobile
- **FAQSection**: Compact padding on mobile, smaller text
- **Footer**: Reduce footer text and spacing on mobile

### 5. Touch Interactions
- Add `touch-action: pan-x` on horizontal scroll containers
- Add CSS scroll-snap for trending carousel
- Add `active:scale-95` tap feedback on interactive cards/buttons
- Hide scrollbar on mobile trending section (already has scrollbar-hide)
- Add `-webkit-overflow-scrolling: touch` for momentum scrolling

### 6. Pages Cleanup
- All pages (/, /payment, /access, /terms, /privacy) are necessary — keep all
- Ensure /terms and /privacy links work from footer
- Style NotFound page to match dark theme

### 7. CSS Updates
- Add `.scrollbar-hide` utility class
- Add touch-optimized styles
- Add responsive scaling utilities

## Files to Modify
- `src/components/TrendingSection.tsx` — real posters, mobile sizing
- `src/components/HeroSection.tsx` — mobile text reduction
- `src/components/Navbar.tsx` — bigger logos, mobile menu animation
- `src/components/FeaturesGrid.tsx` — mobile compact
- `src/components/OTTPartners.tsx` — mobile compact
- `src/components/ReasonsToJoin.tsx` — mobile compact
- `src/components/HowItWorks.tsx` — mobile compact
- `src/components/AppDownload.tsx` — mobile compact
- `src/components/FAQSection.tsx` — mobile compact
- `src/components/Footer.tsx` — mobile compact
- `src/pages/NotFound.tsx` — match dark theme
- `src/index.css` — scrollbar-hide, touch utilities

