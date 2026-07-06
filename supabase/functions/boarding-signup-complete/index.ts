import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BoardingPayload {
  formData: {
    full_name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    horse_name: string;
    horse_breed?: string | null;
    horse_age?: string | null;
    horse_sex: "gelding" | "mare";
    horse_color?: string | null;
    tier: "indoor" | "outdoor" | "pasture";
    feed_plan: "boarder" | "barn_1bag_basic" | "barn_1bag_tcs" | "barn_2bag_basic" | "barn_2bag_tcs";
    monthly_amount: number;
    addon_hay: boolean;
    addon_bedding: boolean;
    addon_pasture_feeding: boolean;
    addon_blanketing: boolean;
    addon_grooming: boolean;
    addon_training: boolean;
    vet_name?: string | null;
    vet_phone?: string | null;
    emergency_authorize: boolean;
    emergency_limit?: string | null;
  };
  signatureData: string | null;
  password?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, signatureData, password } = (await req.json()) as BoardingPayload;

    if (!formData?.email || !formData?.full_name || !formData?.horse_name || !formData?.tier) {
      throw new Error("Missing required fields");
    }
    if (!signatureData) {
      throw new Error("Signature is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Determine user
    let userId: string;
    const authHeader = req.headers.get("Authorization");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    const { data: { user: existingUser } } = await supabaseAuth.auth.getUser();

    if (existingUser) {
      userId = existingUser.id;
    } else if (password) {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name },
      });
      if (createErr) {
        if (createErr.message?.includes("already")) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        throw new Error(`Account creation failed: ${createErr.message}`);
      }
      userId = newUser.user.id;
    } else {
      throw new Error("Authentication required. Please create an account or sign in.");
    }

    // 2. Insert client_documents row (signed)
    const now = new Date().toISOString();

    // 2a. Insert boarding_signups record for admin visibility & deletion
    await supabaseAdmin.from("boarding_signups").insert({
      user_id: userId,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      address: formData.address || null,
      horse_name: formData.horse_name,
      horse_breed: formData.horse_breed || null,
      horse_age: formData.horse_age || null,
      horse_sex: formData.horse_sex,
      horse_color: formData.horse_color || null,
      tier: formData.tier,
      feed_plan: formData.feed_plan,
      monthly_amount: formData.monthly_amount,
      addon_hay: formData.addon_hay,
      addon_bedding: formData.addon_bedding,
      addon_pasture_feeding: formData.addon_pasture_feeding,
      addon_blanketing: formData.addon_blanketing,
      addon_grooming: formData.addon_grooming,
      addon_training: formData.addon_training,
      vet_name: formData.vet_name || null,
      vet_phone: formData.vet_phone || null,
      emergency_authorize: formData.emergency_authorize,
      emergency_limit: formData.emergency_limit || null,
    });

    const { data: insertedDoc, error: docErr } = await supabaseAdmin
      .from("client_documents")
      .insert({
        user_id: userId,
        document_type: "boarding_agreement",
        status: "signed",
        signed_at: now,
        signature_data: signatureData,
        recipient_email: formData.email,
        notes: buildNotes(formData),
      })
      .select("id")
      .single();

    if (docErr) console.error("Document insert error:", docErr);
    const docId = insertedDoc?.id;

    // 3. Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        address: formData.address || null,
        is_boarder: true,
      })
      .eq("user_id", userId);

    // 4. Add to contacts
    const { error: contactErr } = await supabaseAdmin.from("contacts").insert({
      email: formData.email,
      name: formData.full_name,
      phone: formData.phone || null,
      notes: `Boarding signup - ${tierLabel(formData.tier)} | Horse: ${formData.horse_name}${formData.horse_breed ? ` (${formData.horse_breed})` : ""} | $${formData.monthly_amount}/mo`,
      created_by: userId,
    });
    if (contactErr && contactErr.code !== "23505") {
      console.error("Contact error:", contactErr);
    }

    // 5. Subscribe to mailing lists
    const { data: allLists } = await supabaseAdmin.from("mailing_lists").select("id");
    if (allLists && allLists.length > 0) {
      await supabaseAdmin.from("mailing_list_subscribers").upsert(
        allLists.map((l: any) => ({ list_id: l.id, email: formData.email, name: formData.full_name })),
        { onConflict: "list_id,email" },
      );
    }

    // 6. Generate signed PDF
    const dateText = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const pdfBytes = await generateBoardingPdf(formData, dateText, signatureData);
    const path = `${userId}/boarding-agreement-signed-${Date.now()}.pdf`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("signed-documents")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (upErr) console.error("PDF upload error:", upErr);
    if (docId) {
      await supabaseAdmin
        .from("client_documents")
        .update({ pdf_url: `signed-documents/${path}` })
        .eq("id", docId);
    }

    // 7. Send confirmation + admin notification emails
    try {
      const { data: stablesAccount } = await supabaseAdmin
        .from("email_accounts")
        .select("*")
        .eq("email_address", "stables@swanhillstables.com")
        .single();

      const smtpUser = stablesAccount?.username || "stables@swanhillstables.com";
      const smtpPass = stablesAccount?.password || Deno.env.get("MAIL_PASSWORD")!;
      const smtpHost = stablesAccount?.smtp_host || "mx440c.netcup.net";
      const smtpPort = stablesAccount?.smtp_port || 465;
      const fromEmail = stablesAccount?.email_address || "stables@swanhillstables.com";
      const fromName = stablesAccount?.display_name || "Swan Hill Stables";

      const nodemailer = await import("npm:nodemailer@6.9.16");
      const transporter = nodemailer.default.createTransport({
        host: smtpHost, port: smtpPort, secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });

      // Confirmation to boarder
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: formData.email,
        subject: "Your Signed Boarding Agreement — Swan Hill Stables",
        html: buildBoarderEmail(formData, dateText),
        attachments: [{
          filename: "Swan-Hill-Stables-Boarding-Agreement-Signed.pdf",
          content: pdfBytes,
          contentType: "application/pdf",
        }],
      });

      // Admin notification — send to ALL admins
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "super_admin"]);

      if (adminRoles && adminRoles.length > 0) {
        const adminUserIds = adminRoles.map((r: any) => r.user_id);
        const adminEmails: string[] = [];
        for (const uid of adminUserIds) {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (u?.user?.email) adminEmails.push(u.user.email);
        }

        if (adminEmails.length > 0) {
          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: adminEmails.join(", "),
            subject: `🐴 New Boarding Agreement to Review — ${formData.full_name}`,
            html: buildAdminEmail(formData, dateText),
            attachments: [{
              filename: `Boarding-Agreement-${formData.full_name.replace(/\s+/g, "-")}.pdf`,
              content: pdfBytes,
              contentType: "application/pdf",
            }],
          });
        }
      }
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    return new Response(JSON.stringify({ success: true, userId, documentId: docId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Boarding signup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// =================== Helpers ===================

function tierLabel(tier: string): string {
  if (tier === "indoor") return "Top Tier — Indoor Stall";
  if (tier === "outdoor") return "Middle Tier — Outdoor / Shed-Row Stall";
  return "Pasture Board";
}

function feedLabel(plan: string): string {
  switch (plan) {
    case "boarder": return "Boarder provides feed";
    case "barn_1bag_basic": return "Barn provides feed (1 bag/week, basic 14% Starch)";
    case "barn_1bag_tcs": return "Barn provides feed (1 bag/week, Triple Crown Senior)";
    case "barn_2bag_basic": return "Barn provides feed (2 bags/week, basic 14% Starch)";
    case "barn_2bag_tcs": return "Barn provides feed (2 bags/week, Triple Crown Senior)";
    default: return plan;
  }
}

function buildNotes(d: BoardingPayload["formData"]): string {
  const addons: string[] = [];
  if (d.addon_hay) addons.push("Hay (+$100)");
  if (d.addon_bedding) addons.push("Pelletized bedding (+$60)");
  if (d.addon_pasture_feeding) addons.push("Pasture twice-daily feeding (+$50–65)");
  if (d.addon_blanketing) addons.push("Blanketing");
  if (d.addon_grooming) addons.push("Daily grooming");
  if (d.addon_training) addons.push("Training rides");
  return [
    `Tier: ${tierLabel(d.tier)}`,
    `Feed: ${feedLabel(d.feed_plan)}`,
    `Monthly: $${d.monthly_amount}`,
    `Horse: ${d.horse_name} (${d.horse_breed || "?"}, ${d.horse_age || "?"}, ${d.horse_sex}, ${d.horse_color || "?"})`,
    addons.length ? `Add-ons: ${addons.join(", ")}` : "No add-ons",
    d.vet_name ? `Vet: ${d.vet_name} ${d.vet_phone || ""}` : "No vet on file",
    d.emergency_authorize ? `Emergency care authorized up to $${d.emergency_limit || "?"}` : "Emergency care NOT pre-authorized",
  ].join(" | ");
}

async function embedSignatureImage(pdfDoc: PDFDocument, signatureData: string | null) {
  if (!signatureData?.startsWith("data:image")) return null;
  try {
    const [header, base64] = signatureData.split(",");
    if (!base64) return null;
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    if (header.includes("png")) return await pdfDoc.embedPng(bytes);
    return await pdfDoc.embedJpg(bytes);
  } catch (e) {
    console.error("Signature embed error:", e);
    return null;
  }
}

async function generateBoardingPdf(
  d: BoardingPayload["formData"],
  dateText: string,
  signatureData: string | null,
): Promise<Uint8Array> {
  const templateBytes = await Deno.readFile(
    new URL("./boarding-agreement-template.pdf", import.meta.url),
  );
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sigImg = await embedSignatureImage(pdfDoc, signatureData);

  const H = 792; // letter height
  // pdfplumber `top` -> pdf-lib y = H - top - 11 (for 10pt text baseline-ish)
  const yTop = (top: number) => H - top - 9;

  // ---- Page 1 ----
  const p1 = pages[0];
  // "entered into on ____" -> blank starts after "on" near x=275
  p1.drawText(dateText, { x: 275, y: yTop(365), size: 10, font, color: rgb(0, 0, 0) });
  // Boarder Name (line 491)
  p1.drawText(d.full_name, { x: 110, y: yTop(491), size: 10, font: boldFont, color: rgb(0, 0, 0) });
  // Address (line 505)
  if (d.address) p1.drawText(d.address, { x: 120, y: yTop(505), size: 10, font, color: rgb(0, 0, 0) });
  // Phone / Email (line 520)
  p1.drawText(`${d.phone || ""}  ${d.email}`, { x: 160, y: yTop(520), size: 10, font, color: rgb(0, 0, 0) });
  // Horse Name (line 613)
  p1.drawText(d.horse_name, { x: 145, y: yTop(613), size: 10, font: boldFont, color: rgb(0, 0, 0) });
  // Breed (line 628), Age right after "Age:" near x=255
  if (d.horse_breed) p1.drawText(d.horse_breed, { x: 110, y: yTop(628), size: 10, font, color: rgb(0, 0, 0) });
  if (d.horse_age) p1.drawText(d.horse_age, { x: 252, y: yTop(628), size: 10, font, color: rgb(0, 0, 0) });
  // Sex checkboxes - Gelding box ~x=104, Mare box ~x=160
  if (d.horse_sex === "gelding") {
    p1.drawText("X", { x: 103, y: yTop(642), size: 11, font: boldFont, color: rgb(0, 0, 0) });
  } else {
    p1.drawText("X", { x: 159, y: yTop(642), size: 11, font: boldFont, color: rgb(0, 0, 0) });
  }
  // Color/Markings (line 657)
  if (d.horse_color) p1.drawText(d.horse_color, { x: 165, y: yTop(657), size: 10, font, color: rgb(0, 0, 0) });

  // ---- Page 2: highlight selected tier (Top Tier at y=219) ----
  const p2 = pages[1];
  if (d.tier === "indoor") {
    drawHighlight(p2, 80, yTop(232) - 2, 200, 16);
  } else if (d.tier === "outdoor") {
    drawHighlight(p2, 80, yTop(660) - 2, 290, 16);
  }
  // ---- Page 3: pasture tier ----
  const p3 = pages[2];
  if (d.tier === "pasture") {
    drawHighlight(p3, 80, yTop(506) - 2, 230, 16);
  }

  // ---- Page 4: Monthly Board Amount (line 339) ----
  const p4 = pages[3];
  p4.drawText(`$${d.monthly_amount}`, { x: 220, y: yTop(339), size: 11, font: boldFont, color: rgb(0, 0, 0) });

  // ---- Page 5: Boarder signature (line 293), Vet (454/469), Emergency limit (495) ----
  const p5 = pages[4];
  if (sigImg) {
    p5.drawImage(sigImg, { x: 178, y: yTop(304), width: 140, height: 22 });
  }
  p5.drawText(dateText, { x: 405, y: yTop(293), size: 10, font, color: rgb(0, 0, 0) });
  if (d.vet_name) p5.drawText(d.vet_name, { x: 178, y: yTop(454), size: 10, font, color: rgb(0, 0, 0) });
  if (d.vet_phone) p5.drawText(d.vet_phone, { x: 110, y: yTop(469), size: 10, font, color: rgb(0, 0, 0) });
  if (d.emergency_authorize) {
    p5.drawText("X", { x: 78, y: yTop(495), size: 11, font: boldFont, color: rgb(0, 0, 0) });
    if (d.emergency_limit) {
      p5.drawText(`$${d.emergency_limit}`, { x: 320, y: yTop(495), size: 10, font: boldFont, color: rgb(0, 0, 0) });
    }
  }

  // ---- Page 8: Final signatures ----
  const p8 = pages[7];
  if (sigImg) {
    p8.drawImage(sigImg, { x: 130, y: yTop(99), width: 160, height: 26 });
  }
  p8.drawText(d.full_name, { x: 158, y: yTop(103), size: 10, font, color: rgb(0, 0, 0) });
  p8.drawText(dateText, { x: 110, y: yTop(117), size: 10, font, color: rgb(0, 0, 0) });
  // Stables president — pre-fill name (left blank for Nicole's later signature)
  p8.drawText("Nicole Barry", { x: 158, y: yTop(173), size: 10, font, color: rgb(0, 0, 0) });

  return await pdfDoc.save();
}

function drawHighlight(page: any, x: number, y: number, w: number, h: number) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: rgb(1, 0.93, 0.55),
    opacity: 0.45,
    borderColor: rgb(0.77, 0.65, 0.35),
    borderWidth: 1.2,
  });
}

function buildBoarderEmail(d: BoardingPayload["formData"], date: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <img src="https://swanhillstables.lovable.app/logo-transparent.png" alt="Swan Hill Stables" style="height:80px;width:auto;" />
    <p style="color:#c5a55a;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Boarding Agreement</p>
  </div>
  <div style="background:#fff;border-radius:8px;padding:30px;border:1px solid #e5ddd0;">
    <p style="color:#1e3a5f;font-size:16px;">Dear ${d.full_name},</p>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;">Thank you for submitting your boarding agreement on ${date}. Attached is a signed copy for your records.</p>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;"><strong>Summary:</strong></p>
    <ul style="color:#4a5568;font-size:14px;line-height:1.8;">
      <li><strong>Horse:</strong> ${d.horse_name}</li>
      <li><strong>Tier:</strong> ${tierLabel(d.tier)}</li>
      <li><strong>Feed plan:</strong> ${feedLabel(d.feed_plan)}</li>
      <li><strong>Monthly board:</strong> $${d.monthly_amount}</li>
    </ul>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;">Nicole will review your agreement and reach out shortly to coordinate your move-in.</p>
  </div>
  <p style="text-align:center;color:#c5a55a;font-size:11px;padding:20px;">Swan Hill Stables · Northport, AL</p>
</div></body></html>`;
}

function buildAdminEmail(d: BoardingPayload["formData"], date: string): string {
  const addons: string[] = [];
  if (d.addon_hay) addons.push("Hay (+$100)");
  if (d.addon_bedding) addons.push("Bedding (+$60)");
  if (d.addon_pasture_feeding) addons.push("Pasture feeding");
  if (d.addon_blanketing) addons.push("Blanketing");
  if (d.addon_grooming) addons.push("Grooming");
  if (d.addon_training) addons.push("Training rides");
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,serif;">
<div style="max-width:640px;margin:0 auto;padding:40px 20px;">
  <div style="background:#1e3a5f;color:#fff;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">🐴 New Boarding Agreement</h1>
    <p style="margin:8px 0 0;color:#c5a55a;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Action Required</p>
  </div>
  <div style="background:#fff;padding:30px;border:1px solid #e5ddd0;border-top:0;border-radius:0 0 8px 8px;">
    <p style="color:#1e3a5f;font-size:15px;"><strong>${d.full_name}</strong> submitted a signed boarding agreement on ${date}.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#4a5568;">
      <tr><td style="padding:6px 0;width:140px;"><strong>Email:</strong></td><td>${d.email}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Phone:</strong></td><td>${d.phone || "—"}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Address:</strong></td><td>${d.address || "—"}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Horse:</strong></td><td>${d.horse_name} — ${d.horse_breed || "?"}, ${d.horse_age || "?"} yrs, ${d.horse_sex}, ${d.horse_color || "?"}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Tier:</strong></td><td>${tierLabel(d.tier)}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Feed:</strong></td><td>${feedLabel(d.feed_plan)}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Monthly:</strong></td><td><strong style="color:#1e3a5f;font-size:16px;">$${d.monthly_amount}</strong></td></tr>
      <tr><td style="padding:6px 0;"><strong>Add-ons:</strong></td><td>${addons.length ? addons.join(", ") : "None"}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Vet:</strong></td><td>${d.vet_name || "—"} ${d.vet_phone || ""}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Emergency auth:</strong></td><td>${d.emergency_authorize ? `Yes, up to $${d.emergency_limit || "?"}` : "No"}</td></tr>
    </table>
    <p style="margin-top:20px;text-align:center;">
      <a href="https://swanhillstables.lovable.app/admin" style="background:#c5a55a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Review in Admin Dashboard</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:20px;">The signed PDF is attached.</p>
  </div>
</div></body></html>`;
}
