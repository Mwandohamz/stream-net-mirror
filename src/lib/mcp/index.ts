import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyMembership from "./tools/get-my-membership";
import listMyPayments from "./tools/list-my-payments";
import listMySupportTickets from "./tools/list-my-support-tickets";
import createSupportTicket from "./tools/create-support-ticket";
import getStreamingLinks from "./tools/get-streaming-links";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "stream-net-mirror",
  title: "Stream Net Mirror",
  version: "0.1.0",
  instructions:
    "Tools for Stream Net Mirror members. Check membership status, review payments, read and open support tickets, and fetch the current official streaming and APK download links. All tools act as the signed-in member.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyMembership,
    listMyPayments,
    listMySupportTickets,
    createSupportTicket,
    getStreamingLinks,
  ],
});
