import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SMTP_HOST = "mx440c.netcup.net";
const SMTP_PORT = 465;
const SMTP_USER = "kagen@swanhillstables.com";
const FROM_NAME = "Swan Hill Stables";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles || []).map((r: any) => r.role));
    if (!roleSet.has("admin") && !roleSet.has("super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Items that are at/below threshold AND haven't been notified yet
    const { data: lowItems, error: itemsErr } = await admin
      .from("supply_inventory")
      .select("id, supply_name, category, quantity, unit, low_threshold, low_stock_notified_at")
      .not("low_threshold", "is", null)
      .is("low_stock_notified_at", null);

    if (itemsErr) throw itemsErr;

    const due = (lowItems || []).filter(
      (i: any) => i.low_threshold !== null && Number(i.quantity) <= Number(i.low_threshold)
    );

    if (due.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipients } = await admin
      .from("supply_alert_recipients")
      .select("email");
    const emails = (recipients || []).map((r: any) => r.email).filter(Boolean);

    if (emails.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "No alert recipients configured",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const smtpPass = Deno.env.get("MAIL_PASSWORD");
    if (!smtpPass) throw new Error("MAIL_PASSWORD not configured");

    const rows = due.map((i: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">${escapeHtml(i.supply_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-transform:capitalize;color:#666;">${escapeHtml(i.category)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#b45309;">${i.quantity} ${escapeHtml(i.unit)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;">${i.low_threshold} ${escapeHtml(i.unit)}</td>
      </tr>`).join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
        <h2 style="color:#1e3a5f;margin:0 0 8px;">Low Stock Alert</h2>
        <p style="color:#4b5563;margin:0 0 20px;">The following ${due.length === 1 ? "supply has" : "supplies have"} hit the low-stock threshold at Swan Hill Stables:</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <thead>
            <tr style="background:#f9fafb;">
              <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6b7280;">Supply</th>
              <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6b7280;">Category</th>
              <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6b7280;">Remaining</th>
              <th align="left" style="padding:10px 12px;font-size:12px;text-transform:uppercase;color:#6b7280;">Threshold</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">Open the admin console to restock or update thresholds.</p>
      </div>`;

    const nodemailer = await import("npm:nodemailer@6.9.16");
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: true,
      auth: { user: SMTP_USER, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to: emails.join(", "),
      subject: `Low Stock Alert — ${due.length} item${due.length === 1 ? "" : "s"}`,
      html,
    });

    const nowIso = new Date().toISOString();
    await admin
      .from("supply_inventory")
      .update({ low_stock_notified_at: nowIso })
      .in("id", due.map((i: any) => i.id));

    return new Response(JSON.stringify({
      success: true, notified: due.length, recipients: emails.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("notify-low-stock error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}