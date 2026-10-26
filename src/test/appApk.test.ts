import { describe, expect, it } from "vitest";
import { APP_APK_SETTING, isOwnAppApkPath } from "../lib/appApk";
describe("own application APK", () => {
  it("uses a separate setting from the external APK", () => {
    expect(APP_APK_SETTING).toBe("streamnetmirror_apk_file_name");
    expect(APP_APK_SETTING).not.toBe("apk_file_name");
  });
  it("does not distribute legacy external APK paths", () => {
    expect(isOwnAppApkPath("downloads/streamnetmirror-123.apk")).toBe(false);
    expect(isOwnAppApkPath("downloads/streamnetmirror-own-123.apk")).toBe(true);
    expect(isOwnAppApkPath("downloads/streamnetmirror-own-../old.apk")).toBe(false);
  });
});