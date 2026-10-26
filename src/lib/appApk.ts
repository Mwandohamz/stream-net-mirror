/** Keep our GitHub-built APK separate from the legacy third-party download. */
export const APP_APK_SETTING = "streamnetmirror_apk_file_name";
export const APP_APK_PREFIX = "downloads/streamnetmirror-own-";
export function isOwnAppApkPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith(APP_APK_PREFIX) && /^downloads\/streamnetmirror-own-[a-zA-Z0-9-]+\.apk$/.test(path);
}