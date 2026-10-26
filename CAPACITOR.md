# Stream NetMirror — Android App Guide

The Android app is a Capacitor wrapper around the same React/Vite web app.
Release builds load the **bundled `dist` web build** — never the Lovable preview URL.
The website keeps deploying normally; nothing here changes web behavior.

- App name: `Stream NetMirror`
- Application ID (keep stable): `app.lovable.p25e647d373ae49318862c1ff709c52c3`
- Workflow: `.github/workflows/android-build.yml`
- Debug artifact: `stream-netmirror-debug-apk`
- Signed install artifact: `stream-netmirror-release-apk`
- Google Play artifact: `stream-netmirror-release-aab`

## 1. Primary path: build with GitHub Actions (no Android Studio needed)

1. Connect the project to GitHub (Lovable: + menu → GitHub → Connect project).
2. Every push to `main` runs **Android Build** automatically. You can also run it by hand:
   GitHub repo → **Actions** → **Android Build** → **Run workflow**.
3. The workflow installs dependencies from `bun.lock` with a frozen lockfile, runs `bun run build`,
   runs `cap sync android`, sets up Java 21 + Android SDK 36, and builds a debug APK.
4. Download: open the finished run → scroll to **Artifacts** → click
   `stream-netmirror-debug-apk`. You get a ZIP containing `app-debug.apk`.

### Installing the APK on a phone
1. Unzip and copy `app-debug.apk` to the phone (or download it on the phone).
2. Open it; allow "Install unknown apps" for your browser/file manager when asked.
3. Tap Install. A debug APK is for testing only — it cannot go to Google Play.

## 2. Your own signed APK

Nothing secret is stored in the repo. Add these under GitHub repo →
**Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Your upload keystore, base64 encoded (`base64 -w0 upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |

Create a keystore once on any machine with Java:
```
keytool -genkeypair -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
Keep `upload.jks` and its passwords safe and private — never commit them (`*.jks` is git-ignored).

Then run **Actions → Android Build → Run workflow** with **"Also build signed release APK + AAB"** ticked.
If secrets are missing, the workflow still builds the debug APK and clearly skips the signed outputs.
Version code = GitHub run number, so each upload to Play is higher than the last.

Still manual: a Google Play Console developer account, the store listing,
privacy policy URL, content rating, and enabling Play App Signing.

### Keystore setup, step by step
1. If Java/keytool is missing, install Java 21 (Temurin JDK).
2. Run the keystore command above in a private folder. Enter strong passwords when prompted; use alias `upload`. If both passwords are identical, enter the same value for both GitHub password secrets.
3. Encode your keystore into a private file:
   - Linux: `base64 -w0 upload.jks > upload-base64.txt`
   - macOS: `base64 -i upload.jks | tr -d '\n' > upload-base64.txt`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path './upload.jks'))) | Set-Content -NoNewline upload-base64.txt`
4. Copy that file's contents into the GitHub `ANDROID_KEYSTORE_BASE64` secret. Set the other three secrets from the password/alias you chose. Never paste them in chat.
5. Remove the base64 text file and securely back up the keystore/passwords. **Reuse this same signing key for every update.** A different signing key prevents updating an already installed release.
6. Run the workflow with signed outputs enabled. It verifies the APK signature. GitHub secret values and actual APK compilation cannot be verified from this sandbox.

### Download and publish your APK
1. Wait for GitHub Actions to finish successfully.
2. Download the `stream-netmirror-release-apk` artifact and unzip it to get `app-release.apk`.
3. Test it on an Android phone: login, payment, account history, notification inbox, back navigation, movies and football. A debug installation usually needs uninstalling before the differently signed release can install; this clears its local session.
4. In Stream NetMirror, open **Admin → Settings → Android APK** and upload `app-release.apk`, not the artifact ZIP or AAB.
5. The existing private `app-files` bucket stores the file. A separate `streamnetmirror_apk_file_name` setting selects your own app. The legacy external APK setting is intentionally ignored by public download buttons.
6. Test Download App while signed out and signed in. Anyone can download, including unpaid users. Short-lived links protect storage; device/time logs count download requests, not completed installations.
7. Actions ZIPs expire; your uploaded APK remains in app storage. Upload replacements from your own repository only.

### Native experience
- Existing branded launcher icons and system splash resources are retained.
- A brief animated movie/football launch follows the static Android system splash. It respects reduced-motion settings and does not replay on resume.
- Native launches never render the website homepage. New/signed-out users see Sign In with Create Account; returning signed-in users go straight to dashboard Home. Email verification is still required when enabled. Native public Movies/Series/Football links open the matching dashboard section, while checkout, password recovery and support stay available. Android Back minimizes the app from Sign In or dashboard Home.
- The in-app bell shows existing subscription status and support-ticket updates. It is not background push messaging; no new phone permissions or push service were added.
- Account transaction history lists existing payments and subscription periods using the account's existing access rules.
- For local changes, first `git pull`, then install dependencies, build the web app and run `npx cap sync android`. GitHub Actions does this automatically.
- Read Lovable's Capacitor mobile-development blog post before preparing a store release.

## 3. Optional: local builds / Android Studio

Android Studio is only needed for emulator or USB-device debugging.
Prerequisites: Node 20+ or Bun, Java 21, Android SDK 36 (Android Studio installs these).

```
bun install            # or npm install
bun run build          # production web build → dist/
bunx cap sync android  # copies dist into the Android project
bun run android:open   # opens Android Studio (optional)
bun run android:debug  # builds app-debug.apk from the command line
bun run android:doctor # Capacitor health check
```

Live reload on a device (testing only — never for releases):
```
CAP_SERVER_URL="https://<your-preview-url>" bunx cap sync android
```
Run a plain `bunx cap sync android` afterwards to return to bundled content.

## 4. Updating the app after code changes
Change the app in Lovable → it syncs to GitHub → the workflow builds a new APK.
Locally: `git pull`, `bun install`, `bun run android:sync`.
Regenerate icons/splash from `assets/` with `bun run android:assets`.

## Behavior notes
- Login sessions persist in the app's private WebView storage (HTTPS scheme `https://localhost`).
- Payments are initiated only by tapping Pay; resuming the app just re-checks status
  and never creates a new payment or subscription. Meta Purchase is deduplicated per payment ID.
- Streaming links resolve through `/watch/:linkId` and the existing entitlement-checking RPC. Iframe sources show a persistent branded header; native `webview` sources use `@capgo/inappbrowser` with no toolbar/address bar, sized below that header. Android Back navigates within the native source; Close returns to the dashboard. Web users fall back to iframe playback. Only downloads and WhatsApp open in the system browser; streaming stays in the app; Android Back navigates
  inside the app and minimizes it from the home screen.
- Only the `INTERNET` permission is requested. No secrets exist in the app bundle —
  Telegram, pawaPay, and admin keys live only on the server.

## In-app playback update
After pulling this update locally: `git pull`, `bun install`, then `npx cap sync android` (after the web build). GitHub Actions also installs and syncs the new plugin automatically.
Hosted asset-pointer URLs resolve against `https://streamnetmirror.app`, not the bundled localhost origin. Existing saved avatars are normalized when displayed.
Iframe `load` does not reliably report cross-origin framing blocks; a six-second timeout/error notice and an always-visible Switch platform action provide recovery. Native video and sizing must be checked on a physical Android device, including rotation and close/back behavior. A third-party player may manage its own native video fullscreen; the admin fullscreen switch governs our iframe and fullscreen controls, not third-party native player internals.
Android Studio remains optional; build and download the APK through GitHub Actions. See Lovable's Capacitor mobile-development blog post before preparing a store release.

### Verification for this update
- Preview compilation passed and all 11 existing/new tests passed.
- Authorized admin session opened a real Sky Sports source from the dashboard inside `/watch/...`; the source page loaded with the app header visible. This confirms source embedding, not actual live-match video playback or paid-account behavior.
- Admin changed the real source to native webview, saved and read it back, verified web iframe fallback with no iframe-mode fullscreen toggle, then restored its original iframe mode.
- Simulated third-party navigation failure produced the six-second recovery notice; fullscreen retained the header. Dashboard home logo and hosted avatar/crest/logo rendering passed, including a 360px phone layout with no horizontal overflow.
- The existing watch RPC incorrectly treated publicly visible link IDs as entitlement; it now requires the existing RPC's nonempty entitled URL before revealing a source or recording a session, and rejects inactive/non-stream categories.
- Local `cap sync`/Doctor could not finish because the sandbox has no production `dist` output; native plugin Gradle registration is included, and GitHub Actions performs the web build and full sync before APK compilation. No Android device or paid-member session was available for final native/video verification. No website publication was performed.
