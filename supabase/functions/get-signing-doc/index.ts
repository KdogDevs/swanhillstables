import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("Token required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: doc, error } = await supabaseAdmin
      .from("client_documents")
      .select("id, user_id, document_type, status, token_expires_at, recipient_email")
      .eq("sign_token", token).maybeSingle();
    if (error || !doc) throw new Error("Invalid link");
    if (doc.status === "signed") throw new Error("Already signed");
    if (doc.token_expires_at && new Date(doc.token_expires_at) < new Date()) {
      throw new Error("Link expired");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name").eq("user_id", doc.user_id).maybeSingle();

    return new Response(JSON.stringify({
      document_type: doc.document_type,
      recipient_email: doc.recipient_email,
      recipient_name: profile?.full_name || null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});