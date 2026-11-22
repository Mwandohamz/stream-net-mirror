import { useAppSettings } from "@/hooks/useAppSettings";
export const HIGHLIGHTS_SETTING = "highlights_enabled";
/** Highlights are off unless an admin has explicitly switched them on. */
export function useHighlightsEnabled() {
  const { settings } = useAppSettings();
  return settings[HIGHLIGHTS_SETTING] === "true";
}
