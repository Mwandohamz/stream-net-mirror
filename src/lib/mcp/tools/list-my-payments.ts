import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_payments",
  title: "List my payments",
  description:
    "List the payments made with the signed-in user's email address, including amount, currency, status and date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, amount, currency, country, status, provider, promo_code, discount_applied, provider_transaction_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const payments = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(payments) }],
      structuredContent: { payments, count: payments.length },
    };
  },
});
