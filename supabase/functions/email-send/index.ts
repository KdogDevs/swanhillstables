import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMTP_HOST = "mx440c.netcup.net";
const SMTP_PORT = 465;
const SMTP_USER = "kagen@swanhillstables.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, cc, bcc, subject, body, replyTo } = await req.json();
    const password = Deno.env.get("MAIL_PASSWORD");

    if (!password) {
      throw new Error("Mail password not configured");
    }

    if (!to || !subject) {
      throw new Error("'to' and 'subject' are required");
    }

    const nodemailer = await import("npm:nodemailer@6.9.16");

    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    const mailOptions: any = {
      from: `"Swan Hill Stables" <${SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: body,
    };

    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
    if (replyTo) mailOptions.inReplyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
