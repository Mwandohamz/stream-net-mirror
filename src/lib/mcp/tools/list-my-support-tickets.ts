import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_support_tickets",
  title: "List my support tickets",
  description: "List the signed-in user's support tickets with subject, status and creation date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, message, status, payment_ref, created_at, updated_at")
      .eq("user_id", ctx.getUserId() as string)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const tickets = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(tickets) }],
      structuredContent: { tickets, count: tickets.length },
    };
  },
});
