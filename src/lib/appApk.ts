/** Keep our GitHub-built APK separate from the legacy third-party download. */
export const APP_APK_SETTING = "streamnetmirror_apk_file_name";
export const APP_APK_PREFIX = "downloads/streamnetmirror-own-";
/** Shown next to download buttons. */
export const APP_APK_SIZE_LABEL = "20 MB";
/** Every download entry point checks the current own-app setting, never the legacy APK. */
export const hasOwnAppApk = (settings: Record<string, string>) => Boolean(settings[APP_APK_SETTING]);
/** Accepts admin uploads plus GitHub artifacts placed at the bucket root. */
export function isOwnAppApkPath(path: unknown): path is string {
  return typeof path === "string" && (
    /^downloads\/streamnetmirror-own-[a-zA-Z0-9-]+\.apk$/.test(path) ||
    /^app-(debug|release)\.apk$/.test(path)
  );
}
