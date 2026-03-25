import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, barnRulesSignature, waiverSignature, password } = await req.json();

    if (!formData?.email || !formData?.full_name) {
      throw new Error("Missing required fields");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Determine user
    let userId: string;
    const authHeader = req.headers.get("Authorization");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
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

    // 2. Insert lesson signup
    const { error: signupErr } = await supabaseAdmin.from("lesson_signups").insert({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      age: formData.age || null,
      experience_level: formData.experience_level || "beginner",
      horse_preference: formData.horse_preference || "school_horse",
      own_horse_name: formData.own_horse_name || null,
      goals: formData.goals || null,
      preferred_days: formData.preferred_days || [],
      preferred_time: formData.preferred_time || "flexible",
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      special_needs: formData.special_needs || null,
    });

    if (signupErr) console.error("Lesson signup error:", signupErr);

    // 3. Create client documents (signed)
    const now = new Date().toISOString();

    const { data: insertedDocs, error: docErr } = await supabaseAdmin
      .from("client_documents")
      .insert([
        {
          user_id: userId,
          document_type: "barn_rules",
          status: "signed",
          signed_at: now,
          signature_data: barnRulesSignature,
          recipient_email: formData.email,
        },
        {
          user_id: userId,
          document_type: "liability_waiver",
          status: "signed",
          signed_at: now,
          signature_data: waiverSignature,
          recipient_email: formData.email,
        },
      ])
      .select("id, document_type");

    if (docErr) console.error("Document error:", docErr);

    // 3b. Update user profile with collected info
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        address: formData.address || null,
      })
      .eq("user_id", userId);

    if (profileErr) console.error("Profile update error:", profileErr);

    // 4. Add to contacts
    const { error: contactErr } = await supabaseAdmin.from("contacts").insert({
      email: formData.email,
      name: formData.full_name,
      phone: formData.phone || null,
      notes: `Lesson signup - ${formData.experience_level} rider | Horse: ${formData.horse_preference}${formData.own_horse_name ? ` (${formData.own_horse_name})` : ""} | Preferred: ${(formData.preferred_days || []).join(", ")} ${formData.preferred_time || "flexible"}${formData.goals ? ` | Goals: ${formData.goals}` : ""}${formData.special_needs ? ` | Special needs: ${formData.special_needs}` : ""}${formData.age ? ` | Age: ${formData.age}` : ""} | Emergency: ${formData.emergency_contact_name} ${formData.emergency_contact_phone}`,
      created_by: userId,
    });

    if (contactErr && contactErr.code !== "23505") {
      console.error("Contact error:", contactErr);
    }

    // 5. Subscribe to all mailing lists
    const { data: allLists } = await supabaseAdmin.from("mailing_lists").select("id");

    if (allLists && allLists.length > 0) {
      const subs = allLists.map((list: any) => ({
        list_id: list.id,
        email: formData.email,
        name: formData.full_name,
      }));

      const { error: subErr } = await supabaseAdmin
        .from("mailing_list_subscribers")
        .upsert(subs, { onConflict: "list_id,email" });

      if (subErr) console.error("Mailing list error:", subErr);
    }

    // 6. Generate signed PDFs from the exact uploaded templates
    try {
      const dateText = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const barnRulesBytes = await generateBarnRulesPdfFromTemplate(
        formData.full_name,
        dateText,
        barnRulesSignature
      );

      const waiverBytes = await generateWaiverPdfFromTemplate(
        formData.full_name,
        dateText,
        waiverSignature
      );

      const timestamp = Date.now();
      const barnPath = `${userId}/barn-rules-signed-${timestamp}.pdf`;
      const waiverPath = `${userId}/liability-waiver-signed-${timestamp}.pdf`;

      const { error: barnUpErr } = await supabaseAdmin.storage
        .from("signed-documents")
        .upload(barnPath, barnRulesBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (barnUpErr) console.error("Barn rules upload error:", barnUpErr);

      const { error: waiverUpErr } = await supabaseAdmin.storage
        .from("signed-documents")
        .upload(waiverPath, waiverBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (waiverUpErr) console.error("Waiver upload error:", waiverUpErr);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const barnPdfUrl = `${supabaseUrl}/storage/v1/object/public/signed-documents/${barnPath}`;
      const waiverPdfUrl = `${supabaseUrl}/storage/v1/object/public/signed-documents/${waiverPath}`;

      const barnDocId = insertedDocs?.find((doc: any) => doc.document_type === "barn_rules")?.id;
      const waiverDocId = insertedDocs?.find((doc: any) => doc.document_type === "liability_waiver")?.id;

      if (barnDocId) {
        await supabaseAdmin.from("client_documents").update({ pdf_url: barnPdfUrl }).eq("id", barnDocId);
      }

      if (waiverDocId) {
        await supabaseAdmin.from("client_documents").update({ pdf_url: waiverPdfUrl }).eq("id", waiverDocId);
      }

      // 7. Send confirmation email with signed PDF attachments
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
        host: smtpHost,
        port: smtpPort,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const emailHtml = buildConfirmationEmail(formData.full_name, dateText);

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: formData.email,
        subject: "Your Signed Documents - Swan Hill Stables",
        html: emailHtml,
        attachments: [
          {
            filename: "Swan-Hill-Stables-Barn-Rules-Signed.pdf",
            content: barnRulesBytes,
            contentType: "application/pdf",
          },
          {
            filename: "Swan-Hill-Stables-Liability-Waiver-Signed.pdf",
            content: waiverBytes,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (pdfOrEmailErr) {
      console.error("PDF/Email error:", pdfOrEmailErr);
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Lesson signup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function readTemplatePdf(fileName: string): Promise<Uint8Array> {
  return await Deno.readFile(new URL(`./${fileName}`, import.meta.url));
}

async function embedSignatureImage(pdfDoc: PDFDocument, signatureData: string | null) {
  if (!signatureData?.startsWith("data:image")) return null;

  try {
    const [header, base64] = signatureData.split(",");
    if (!base64) return null;

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    if (header.includes("png")) {
      return await pdfDoc.embedPng(bytes);
    }

    return await pdfDoc.embedJpg(bytes);
  } catch (error) {
    console.error("Error embedding signature image:", error);
    return null;
  }
}

async function generateBarnRulesPdfFromTemplate(
  signerName: string,
  signedDate: string,
  signatureData: string | null
): Promise<Uint8Array> {
  const templateBytes = await readTemplatePdf("barn-rules-template.pdf");
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const signatureImage = await embedSignatureImage(pdfDoc, signatureData);

  const { width } = lastPage.getSize();
  const blockY = 36;

  lastPage.drawRectangle({
    x: 30,
    y: blockY,
    width: width - 60,
    height: 96,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 1,
    opacity: 0.97,
  });

  lastPage.drawText("Acknowledged and Signed", {
    x: 44,
    y: blockY + 74,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  if (signatureImage) {
    lastPage.drawImage(signatureImage, {
      x: 44,
      y: blockY + 42,
      width: 150,
      height: 24,
    });
  }

  lastPage.drawText(`Name: ${signerName}`, {
    x: 44,
    y: blockY + 22,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  lastPage.drawText(`Date: ${signedDate}`, {
    x: 44,
    y: blockY + 8,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

async function generateWaiverPdfFromTemplate(
  signerName: string,
  signedDate: string,
  signatureData: string | null
): Promise<Uint8Array> {
  const templateBytes = await readTemplatePdf("equine-release-template.pdf");
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const signatureImage = await embedSignatureImage(pdfDoc, signatureData);

  const { height } = page.getSize();

  // Fill blank fields on the exact template
  page.drawText(signerName, {
    x: 88,
    y: height - 96,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("Swan Hill Stables", {
    x: 392,
    y: height - 96,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("Swan Hill Stables", {
    x: 406,
    y: height - 238,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(signedDate, {
    x: 72,
    y: height - 663,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  if (signatureImage) {
    page.drawImage(signatureImage, {
      x: 78,
      y: height - 728,
      width: 150,
      height: 26,
    });
  }

  page.drawText(signerName, {
    x: 78,
    y: height - 754,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

function buildConfirmationEmail(name: string, date: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <img src="https://swanhillstables.lovable.app/logo-transparent.png" alt="Swan Hill Stables" style="height:80px;width:auto;margin:0 auto 12px;" />
    <p style="color:#c5a55a;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Document Confirmation</p>
  </div>

  <div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;border:1px solid #e5ddd0;">
    <p style="color:#1e3a5f;font-size:16px;">Dear ${name},</p>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;">Thank you for registering for lessons at Swan Hill Stables! Attached to this email are PDF copies of the documents you signed on ${date}:</p>
    <ul style="color:#4a5568;font-size:14px;line-height:1.8;">
      <li><strong>Barn Rules & Safety Policies</strong> — signed copy</li>
      <li><strong>Equine Activity Release & Hold Harmless Agreement</strong> — signed copy</li>
    </ul>
    <p style="color:#4a5568;font-size:14px;line-height:1.6;">Please save these PDFs for your records. We'll be in touch soon to schedule your first lesson!</p>
  </div>

  <div style="text-align:center;color:#c5a55a;font-size:11px;padding:20px;">
    <p style="margin:0 0 4px;color:#1e3a5f;font-weight:600;">Swan Hill Stables</p>
    <p style="margin:0;">This is an automated confirmation. Please keep for your records.</p>
  </div>
</div>
</body></html>`;
}
