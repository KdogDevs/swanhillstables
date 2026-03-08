import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SMTP_HOST = "mx440c.netcup.net";
const DEFAULT_SMTP_PORT = 465;
const DEFAULT_USER = "kagen@swanhillstables.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pending scheduled emails that are due
    const { data: pendingEmails, error } = await serviceClient
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(10);

    if (error) throw error;
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nodemailer = await import("npm:nodemailer@6.9.16");
    let processed = 0;

    for (const email of pendingEmails) {
      try {
        // Mark as processing
        await serviceClient.from("scheduled_emails")
          .update({ status: "processing" })
          .eq("id", email.id);

        // Get SMTP credentials
        let smtpHost = DEFAULT_SMTP_HOST;
        let smtpPort = DEFAULT_SMTP_PORT;
        let smtpUser = DEFAULT_USER;
        let smtpPass = Deno.env.get("MAIL_PASSWORD")!;
        let fromName = "Swan Hill Stables";

        if (email.account_id) {
          const { data: account } = await serviceClient
            .from("email_accounts")
            .select("*")
            .eq("id", email.account_id)
            .single();

          if (account) {
            smtpHost = account.smtp_host;
            smtpPort = account.smtp_port;
            smtpUser = account.username;
            smtpPass = account.password;
            fromName = account.display_name || account.email_address;
          }
        }

        const transporter = nodemailer.default.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });

        let fullBody = email.body || "";
        if (email.signature) fullBody += `<br><br>--<br>${email.signature}`;

        const mailOptions: any = {
          from: `"${fromName}" <${smtpUser}>`,
          to: email.to_addresses.join(", "),
          subject: email.subject,
          html: fullBody,
        };

        if (email.cc_addresses?.length) mailOptions.cc = email.cc_addresses.join(", ");
        if (email.bcc_addresses?.length) mailOptions.bcc = email.bcc_addresses.join(", ");

        await transporter.sendMail(mailOptions);

        await serviceClient.from("scheduled_emails")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        processed++;
      } catch (err: any) {
        console.error(`Failed to send scheduled email ${email.id}:`, err);
        await serviceClient.from("scheduled_emails")
          .update({ status: "failed", error: err.message })
          .eq("id", email.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scheduled email processor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
