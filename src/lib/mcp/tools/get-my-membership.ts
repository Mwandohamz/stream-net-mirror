import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_membership",
  title: "Get my membership",
  description:
    "Get the signed-in user's Stream Net Mirror membership status, name, email and signup date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("subscribers")
      .select("name, email, phone, status, created_at")
      .eq("user_id", ctx.getUserId() as string)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "No membership found for this account. Complete a payment and create an account with the same email address.",
          },
        ],
        structuredContent: { membership: null },
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { membership: data },
    };
  },
});
