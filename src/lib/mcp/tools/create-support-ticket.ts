import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_support_ticket",
  title: "Create support ticket",
  description: "Open a new support ticket for the signed-in user.",
  inputSchema: {
    subject: z.string().trim().describe("Short summary of the issue."),
    message: z.string().trim().describe("Full description of the issue."),
    payment_ref: z
      .string()
      .trim()
      .optional()
      .describe("Optional payment reference or transaction id related to the issue."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ subject, message, payment_ref }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!subject || !message) {
      return {
        content: [{ type: "text", text: "Both subject and message are required." }],
        isError: true,
      };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: ctx.getUserId() as string,
        subject: subject.slice(0, 200),
        message: message.slice(0, 5000),
        payment_ref: payment_ref || null,
        guest_email: ctx.getUserEmail() ?? null,
      })
      .select("id, subject, status, created_at")
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Ticket created: ${JSON.stringify(data)}` }],
      structuredContent: { ticket: data },
    };
  },
});
