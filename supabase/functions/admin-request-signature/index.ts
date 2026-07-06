import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DOC_LABELS: Record<string, string> = {
  boarding_agreement: "Boarding Agreement",
  liability_waiver: "Liability Waiver",
  barn_rules: "Barn Rules",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user_id, document_type, base_url } = await req.json();
    if (!user_id || !document_type) throw new Error("user_id and document_type required");
    if (!DOC_LABELS[document_type]) throw new Error("Unsupported document type");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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

    // Fetch recipient email and name
    const { data: recipient } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const recipientEmail = recipient?.user?.email;
    if (!recipientEmail) throw new Error("Recipient email not found");
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("full_name").eq("user_id", user_id).single();
    const recipientName = profile?.full_name || "there";

    const token = crypto.randomUUID().replace(/-/g, "") +
                  crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: doc, error: docErr } = await supabaseAdmin
      .from("client_documents").insert({
        user_id,
        document_type,
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_email: recipientEmail,
        sign_token: token,
        token_expires_at: expiresAt,
      }).select("id").single();
    if (docErr) throw new Error(`Doc insert failed: ${docErr.message}`);

    const siteUrl = base_url || "https://swanhillstables.lovable.app";
    const signingUrl = `${siteUrl}/sign/${token}`;

    // Send email via stables account
    try {
      const { data: stablesAccount } = await supabaseAdmin
        .from("email_accounts").select("*")
        .eq("email_address", "stables@swanhillstables.com").single();
      const nodemailer = await import("npm:nodemailer@6.9.16");
      const transporter = nodemailer.default.createTransport({
        host: stablesAccount?.smtp_host || "mx440c.netcup.net",
        port: stablesAccount?.smtp_port || 465,
        secure: true,
        auth: {
          user: stablesAccount?.username || "stables@swanhillstables.com",
          pass: stablesAccount?.password || Deno.env.get("MAIL_PASSWORD")!,
        },
      });
      await transporter.sendMail({
        from: `"${stablesAccount?.display_name || "Swan Hill Stables"}" <${stablesAccount?.email_address || "stables@swanhillstables.com"}>`,
        to: recipientEmail,
        subject: `Please sign: ${DOC_LABELS[document_type]} — Swan Hill Stables`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <img src="https://swanhillstables.lovable.app/logo-transparent.png" alt="Swan Hill Stables" style="height:80px;" />
    <p style="color:#c5a55a;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Document Signature Requested</p>
  </div>
  <div style="background:#fff;border-radius:8px;padding:30px;border:1px solid #e5ddd0;">
    <p style="color:#1e3a5f;font-size:16px;">Hi ${recipientName},</p>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;">Swan Hill Stables is requesting your signature on the <strong>${DOC_LABELS[document_type]}</strong>. This link is unique to you and expires in 30 days.</p>
    <p style="text-align:center;margin:30px 0;">
      <a href="${signingUrl}" style="background:#1e3a5f;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Review & Sign</a>
    </p>
    <p style="color:#4a5568;font-size:12px;line-height:1.6;">Or copy this link: <span style="word-break:break-all;color:#1e3a5f;">${signingUrl}</span></p>
  </div>
  <p style="text-align:center;color:#c5a55a;font-size:11px;padding:20px;">Swan Hill Stables · Northport, AL</p>
</div></body></html>`,
      });
    } catch (emailErr) {
      console.error("Signing email error:", emailErr);
    }

    return new Response(JSON.stringify({
      success: true, signing_url: signingUrl, document_id: doc.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("admin-request-signature error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});