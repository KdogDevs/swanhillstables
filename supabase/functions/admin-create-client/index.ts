import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, full_name, phone, address, send_invite } = await req.json();
    if (!email || !full_name) throw new Error("Email and name required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: caller } } = await supabaseAuth.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", caller.id);
    const isAdmin = (roles || []).some((r: any) =>
      r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) throw new Error("Admin access required");

    let userId: string;

    if (send_invite) {
      // Send an invite email; user sets password on first sign-in
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { data: { full_name } },
      );
      if (error) throw new Error(`Invite failed: ${error.message}`);
      userId = data.user.id;
    } else {
      // Shadow profile: create user with a random password, email confirmed
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { full_name, admin_created: true },
      });
      if (error) {
        if (error.message?.includes("already")) {
          throw new Error("An account with this email already exists");
        }
        throw new Error(`Create failed: ${error.message}`);
      }
      userId = data.user.id;
    }

    // Ensure profile fields
    await supabaseAdmin.from("profiles").update({
      full_name, phone: phone || null, address: address || null,
    }).eq("user_id", userId);

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("admin-create-client error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});