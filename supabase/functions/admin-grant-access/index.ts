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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("getUser error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerEmail = user.email || "";
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const adminEmails = adminEmailsRaw.split(",").map((e: string) => e.trim().toLowerCase());

    if (!adminEmails.includes(callerEmail.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target email from body
    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const targetEmail = email.trim().toLowerCase();

    // Check payment exists
    const { data: payment } = await adminClient
      .from("payments")
      .select("id, name, phone, status")
      .eq("email", targetEmail)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      return new Response(
        JSON.stringify({ error: "No completed payment found for this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a temp password
    const tempPassword = "Temp" + Math.random().toString(36).slice(2, 8) + "!" + Math.floor(Math.random() * 100);

    // Check if user already exists in auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === targetEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: tempPassword,
        email_confirm: true,
      });
      if (updateError) {
        console.error("Update user error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update user: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: targetEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: payment.name },
      });
      if (createError || !newUser?.user) {
        console.error("Create user error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user: " + (createError?.message || "Unknown error") }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = newUser.user.id;
    }

    // Ensure subscriber record exists
    const { data: existingSub } = await adminClient
      .from("subscribers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingSub) {
      const { error: subError } = await adminClient
        .from("subscribers")
        .insert({
          user_id: userId,
          email: targetEmail,
          name: payment.name,
          phone: payment.phone,
          payment_id: payment.id,
          status: "active",
        });
      if (subError) {
        console.error("Subscriber insert error:", subError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tempPassword,
        message: `Access granted for ${targetEmail}. Temporary password: ${tempPassword}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Grant access error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
