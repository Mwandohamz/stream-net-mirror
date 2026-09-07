import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

const LINK_KEYS = ["streaming_link_1", "streaming_link_2", "streaming_link_3", "apk_download_link"];

export default defineTool({
  name: "get_streaming_links",
  title: "Get streaming links",
  description:
    "Get the current official Stream Net Mirror streaming website links and the Android APK download link.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("app_settings").select("key, value");

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const links: Record<string, string> = {};
    for (const row of data ?? []) {
      if (LINK_KEYS.includes(row.key)) links[row.key] = row.value;
    }
    return {
      content: [{ type: "text", text: JSON.stringify(links) }],
      structuredContent: { links },
    };
  },
});
