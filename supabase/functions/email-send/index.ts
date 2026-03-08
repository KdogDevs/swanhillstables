import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SMTP_HOST = "mx440c.netcup.net";
const DEFAULT_SMTP_PORT = 465;
const DEFAULT_USER = "kagen@swanhillstables.com";

async function getAuthAndRole(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");

  const userId = data.claims.sub as string;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roleSet = new Set((roles || []).map((r: any) => r.role));
  if (!roleSet.has("admin") && !roleSet.has("super_admin")) {
    throw new Error("Forbidden");
  }

  return { userId, isSuperAdmin: roleSet.has("super_admin"), supabase };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, isSuperAdmin } = await getAuthAndRole(req);
    const body = await req.json();
    const { to, cc, bcc, subject, body: emailBody, accountId, signature, replyTo, bulk } = body;

    // Get SMTP credentials
    let smtpHost = DEFAULT_SMTP_HOST;
    let smtpPort = DEFAULT_SMTP_PORT;
    let smtpUser = DEFAULT_USER;
    let smtpPass = Deno.env.get("MAIL_PASSWORD")!;
    let fromName = "Swan Hill Stables";

    if (accountId) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: account, error } = await serviceClient
        .from("email_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (error || !account) throw new Error("Email account not found");

      if (!isSuperAdmin) {
        const { data: access } = await serviceClient
          .from("email_account_access")
          .select("can_send")
          .eq("email_account_id", accountId)
          .eq("user_id", userId)
          .single();

        if (!access?.can_send) throw new Error("No send permission for this account");
      }

      smtpHost = account.smtp_host;
      smtpPort = account.smtp_port;
      smtpUser = account.username;
      smtpPass = account.password;
      fromName = account.display_name || account.email_address;
    }

    if (!smtpPass) throw new Error("Mail password not configured");

    const nodemailer = await import("npm:nodemailer@6.9.16");
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Build HTML body with optional signature
    let fullBody = emailBody || "";
    if (signature) {
      fullBody += `<br><br>--<br>${signature}`;
    }

    // Handle bulk sending
    if (bulk && Array.isArray(bulk.recipients)) {
      const results: any[] = [];
      for (const recipient of bulk.recipients) {
        try {
          const info = await transporter.sendMail({
            from: `"${fromName}" <${smtpUser}>`,
            to: recipient.email,
            subject: subject || "",
            html: fullBody.replace(/\{\{name\}\}/g, recipient.name || ""),
          });
          results.push({ email: recipient.email, success: true, messageId: info.messageId });
        } catch (err: any) {
          results.push({ email: recipient.email, success: false, error: err.message });
        }
      }
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single email
    if (!to || !subject) throw new Error("'to' and 'subject' are required");

    const mailOptions: any = {
      from: `"${fromName}" <${smtpUser}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: fullBody,
    };
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
    if (replyTo) mailOptions.inReplyTo = replyTo;

    const info = await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message?.includes("Forbidden") ? 403 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
