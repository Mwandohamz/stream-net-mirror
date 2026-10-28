const ASSET_ORIGIN = "https://streamnetmirror.app";

/** Asset pointers also work in bundled Capacitor builds served from localhost. */
export const toAbsoluteAssetUrl = (url: string): string =>
  url.startsWith("/__l5e/") ? `${ASSET_ORIGIN}${url}` : url;