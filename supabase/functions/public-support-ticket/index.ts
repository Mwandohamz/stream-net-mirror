import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, subject, message, phone, paymentRef } = payload as Record<string, unknown>;

    const errors: string[] = [];
    const required = (v: unknown, label: string, max: number) => {
      if (typeof v !== "string") {
        errors.push(`${label} is required`);
        return "";
      }
      const value = v.trim();
      if (!value) errors.push(`${label} is required`);
      else if (value.length > max) errors.push(`${label} must be ${max} characters or fewer`);
      return value;
    };
    const optional = (v: unknown, label: string, max: number) => {
      if (v === undefined || v === null || v === "") return "";
      if (typeof v !== "string") {
        errors.push(`${label} must be text`);
        return "";
      }
      const value = v.trim();
      if (value.length > max) errors.push(`${label} must be ${max} characters or fewer`);
      return value;
    };

    const safeName = require(name, "Name", 100);
    const safeEmail = require(email, "Email", 254).toLowerCase();
    const safeSubject = require(subject, "Subject", 100);
    const safeMessage = require(message, "Message", 2000);
    const safePhone = optional(phone, "Phone", 20);
    const safeRef = optional(paymentRef, "Payment reference", 100);

    if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(safeEmail)) {
      errors.push("Email address is not valid");
    }
    if (safePhone && !/^[+0-9()\s-]{6,20}$/.test(safePhone)) {
      errors.push("Phone number is not valid");
    }

    if (errors.length) {
      return new Response(JSON.stringify({ error: errors.join(", ") }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    


    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: null,
        guest_name: safeName,
        guest_email: safeEmail,
        guest_phone: safePhone || null,
        payment_ref: safeRef || null,
        subject: safeSubject,
        message: safeMessage,
        status: "open",
      })
      .select("id")
      .single();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      return new Response(
        JSON.stringify({ error: "Failed to create ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, ticketId: ticket.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Public support ticket error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
