# Stream NetMirror — Android App Guide

The Android app is a Capacitor wrapper around the same React/Vite web app.
Release builds load the **bundled `dist` web build** — never the Lovable preview URL.
The website keeps deploying normally; nothing here changes web behavior.

- App name: `Stream NetMirror`
- Application ID (keep stable): `app.lovable.p25e647d373ae49318862c1ff709c52c3`
- Workflow: `.github/workflows/android-build.yml`
- Debug artifact: `stream-netmirror-debug-apk`
- Release artifact (only when signing is configured): `stream-netmirror-release-aab`

## 1. Primary path: build with GitHub Actions (no Android Studio needed)

1. Connect the project to GitHub (Lovable: + menu → GitHub → Connect project).
2. Every push to `main` runs **Android Build** automatically. You can also run it by hand:
   GitHub repo → **Actions** → **Android Build** → **Run workflow**.
3. The workflow installs dependencies from `bun.lockb`, runs `bun run build`,
   runs `cap sync android`, sets up Java 21 + Android SDK 36, and builds a debug APK.
4. Download: open the finished run → scroll to **Artifacts** → click
   `stream-netmirror-debug-apk`. You get a ZIP containing `app-debug.apk`.

### Installing the APK on a phone
1. Unzip and copy `app-debug.apk` to the phone (or download it on the phone).
2. Open it; allow "Install unknown apps" for your browser/file manager when asked.
3. Tap Install. A debug APK is for testing only — it cannot go to Google Play.

## 2. Signed release AAB (Google Play) — later

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
keytool -genkey -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
Keep `upload.jks` and its passwords safe and private — never commit them (`*.jks` is git-ignored).

Then run **Actions → Android Build → Run workflow** with **"Also build a signed release AAB"** ticked.
If secrets are missing, the workflow still builds the debug APK and clearly skips the AAB.
Version code = GitHub run number, so each upload to Play is higher than the last.

Still manual: a Google Play Console developer account, the store listing,
privacy policy URL, content rating, and enabling Play App Signing.

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
- Streaming links, downloads, and WhatsApp open in the system browser; Android Back navigates
  inside the app and minimizes it from the home screen.
- Only the `INTERNET` permission is requested. No secrets exist in the app bundle —
  Telegram, pawaPay, and admin keys live only on the server.
