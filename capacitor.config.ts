import type { CapacitorConfig } from "@capacitor/cli";

// Release builds ALWAYS load the bundled `dist` web build.
// For live-reload device testing only, set CAP_SERVER_URL before `cap sync`, e.g.
//   CAP_SERVER_URL="https://<preview-host>" npx cap sync android
const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "app.lovable.p25e647d373ae49318862c1ff709c52c3",
  appName: "Stream NetMirror",
  webDir: "dist",
  server: {
    androidScheme: "https",
    ...(liveReloadUrl ? { url: liveReloadUrl } : {}),
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: "#07090fff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#07090f",
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;