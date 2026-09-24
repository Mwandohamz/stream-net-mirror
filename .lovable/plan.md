# Capacitor Android foundation and mobile polish

## Goal
Prepare the existing Stream NetMirror React application as an Android-first Capacitor app while preserving the website, authentication, payments, notifications, tracking, admin tools, and backend behavior.

## What will change

### 1. Native application foundation
- Add Capacitor core, command-line tooling, Android, splash-screen, status-bar, keyboard, and browser packages using compatible versions.
- Add a Capacitor configuration for the existing Vite `dist` output and the established native application identifier.
- Generate the Android project and keep all native source/configuration required for Android Studio in the repository.
- Add focused scripts for syncing and opening Android without changing the existing web build or deployment commands.

### 2. Android behavior and navigation
- Add a small native runtime layer that only activates inside Capacitor.
- Configure status/navigation bar appearance, keyboard resizing, splash dismissal, Android back-button behavior, and safe-area CSS variables.
- Route normal internal navigation through the existing app while opening genuine external destinations in the appropriate system browser where necessary.
- Preserve browser behavior, authentication state, payment polling, protected routes, and deep links.

### 3. Native splash and launch assets
- Build a portrait-safe cinematic launch composition from the existing Stream NetMirror logo, movie imagery, and football imagery.
- Generate Android splash and launcher resources at the required densities, with a dark branded fallback for Android 12+.
- Keep the launch display brief and dismiss it when the React app is ready.

### 4. Sign-in and account creation polish
- Restyle the existing sign-in and sign-up pages as mobile-first native screens while preserving every field, validation rule, avatar choice, verification flow, and checkout return destination.
- Add accessible password visibility controls, correct keyboard/input hints, large touch targets, safe-area spacing, and keyboard-friendly scrolling.
- Reuse the existing visual tokens, logo, movie image, and football image; retain a restrained desktop layout.
- Hide website-only chrome around authentication when running natively while leaving it unchanged on the website.

### 5. Validation
- Sync the web application into Android and validate native project configuration.
- Run TypeScript checks, targeted tests, and the normal web build through the project harness.
- Inspect sign-in and sign-up on small-phone, tablet, and desktop viewports; confirm no regressions in existing web routes.

## Technical details
- No database migration or backend-function change is planned.
- No secrets will enter native source or browser code.
- Existing web URLs and React routes remain authoritative; native-specific behavior is guarded by Capacitor platform detection.
- The Android project will use the required Stream NetMirror application identity and the configured Lovable preview URL for sandbox device testing; release builds can switch to bundled `dist` content without changing application code.
- iOS behavior will be prepared at the shared code/configuration level, but the iOS platform project will not be generated in this Android-first batch.

## Manual steps after implementation
- Export/pull the project locally, install dependencies, run `npx cap sync android`, then open/run it with Android Studio.
- A signed release still requires an Android signing key and Play Console configuration; these credentials will not be created or stored in the project.
