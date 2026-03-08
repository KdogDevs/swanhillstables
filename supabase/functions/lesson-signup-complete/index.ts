import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

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
    const { error: docErr } = await supabaseAdmin.from("client_documents").insert([
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
    ]);
    if (docErr) console.error("Document error:", docErr);

    // 4. Add to contacts
    const { error: contactErr } = await supabaseAdmin.from("contacts").insert({
      email: formData.email,
      name: formData.full_name,
      phone: formData.phone || null,
      notes: `Lesson signup - ${formData.experience_level} rider`,
      created_by: userId,
    });
    if (contactErr && contactErr.code !== "23505") console.error("Contact error:", contactErr);

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

    // 6. Generate PDFs, upload to storage, and send confirmation email
    try {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      const barnRulesPdf = generateBarnRulesPdf(formData.full_name, date, barnRulesSignature);
      const waiverPdf = generateWaiverPdf(formData.full_name, date, waiverSignature);

      const barnRulesBytes = new Uint8Array(barnRulesPdf);
      const waiverBytes = new Uint8Array(waiverPdf);

      // Upload PDFs to storage
      const timestamp = Date.now();
      const barnPath = `${userId}/barn-rules-signed-${timestamp}.pdf`;
      const waiverPath = `${userId}/liability-waiver-signed-${timestamp}.pdf`;

      const { error: barnUpErr } = await supabaseAdmin.storage
        .from("signed-documents")
        .upload(barnPath, barnRulesBytes, { contentType: "application/pdf", upsert: true });
      if (barnUpErr) console.error("Barn rules upload error:", barnUpErr);

      const { error: waiverUpErr } = await supabaseAdmin.storage
        .from("signed-documents")
        .upload(waiverPath, waiverBytes, { contentType: "application/pdf", upsert: true });
      if (waiverUpErr) console.error("Waiver upload error:", waiverUpErr);

      // Get public URLs
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const barnPdfUrl = `${supabaseUrl}/storage/v1/object/public/signed-documents/${barnPath}`;
      const waiverPdfUrl = `${supabaseUrl}/storage/v1/object/public/signed-documents/${waiverPath}`;

      // Update client_documents with PDF URLs
      await supabaseAdmin.from("client_documents")
        .update({ pdf_url: barnPdfUrl })
        .eq("user_id", userId)
        .eq("document_type", "barn_rules")
        .eq("signed_at", now);

      await supabaseAdmin.from("client_documents")
        .update({ pdf_url: waiverPdfUrl })
        .eq("user_id", userId)
        .eq("document_type", "liability_waiver")
        .eq("signed_at", now);

      // Get stables email account credentials
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

      const emailHtml = buildConfirmationEmail(formData.full_name, date);

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
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
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

function addSignatureImage(doc: any, signatureData: string, x: number, y: number) {
  if (!signatureData) return;
  try {
    const base64 = signatureData.split(",")[1];
    if (base64) {
      doc.addImage(base64, "PNG", x, y, 50, 15);
    }
  } catch (e) {
    console.error("Error adding signature image:", e);
  }
}

function generateBarnRulesPdf(name: string, date: string, signature: string | null): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SWAN HILL STABLES", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(16);
  doc.text("Barn Rules & Safety Policies", pageWidth / 2, y, { align: "center" });
  y += 15;

  const sections = [
    { title: "1. General Safety", items: [
      "Helmets are required for participants under 18 at all times when mounted, no exceptions.",
      "Closed-toe shoes are required on the property. No sandals or flip-flops.",
      "No running, yelling, or roughhousing in the barn or around horses.",
      "Children under 12 must be supervised by an adult at all times.",
      "Do not approach or handle horses without permission.",
      "No stallions allowed on the property, no exceptions.",
    ]},
    { title: "2. Horse Handling", items: [
      "Only assigned individuals may catch, groom, tack, or ride their horses.",
      "No feeding horses without owner or staff approval.",
      "Treats must be given flat-handed and approved by staff.",
      "Do not enter stalls or paddocks without permission.",
      "When putting horses in stalls or pastures turn them to face the gate/door before removing halter.",
      "Report any injuries, loose horses, or unsafe behavior immediately.",
    ]},
    { title: "3. Riding Rules", items: [
      "Participants must sign a liability waiver before riding or interacting with horses.",
      "No riding without staff approval.",
    ]},
    { title: "4. Arena Etiquette", items: [
      "Left shoulder to left shoulder when passing.",
      "Faster gaits have the right of way.",
      "No lunging in the main arena during lessons.",
      "Pick up manure after riding.",
      "Properly store equipment after use (ex. Jumps, barrels, lunge lines/whips)",
      "No spectators inside the arena unless approved.",
    ]},
    { title: "5. Tack & Equipment", items: [
      "Use only your assigned tack unless permission is given.",
      "Return equipment clean and in its proper place.",
      "Do not adjust others' tack without permission.",
      "Report broken or unsafe equipment immediately.",
      "Keep tack and equipment in designated areas.",
    ]},
    { title: "6. Visitors & Guests", items: [
      "All guests must check in with staff.",
      "No unsupervised guests or children.",
      "No dogs unless approved and on a leash.",
      "No smoking, vaping, drugs, or alcohol on property.",
    ]},
    { title: "7. Facility Rules", items: [
      "Keep aisles clear at all times.",
      "Clean up after yourself and your horse.",
      "Dispose of trash properly.",
      "Do not use equipment without permission.",
      "Respect private areas and closed spaces.",
      "If a gate or door is opened, close it.",
    ]},
    { title: "8. Lesson Program", items: [
      "Follow instructor directions at all times.",
      "Volunteers must be approved and trained.",
      "No photos or videos of clients without verbal consent.",
      "Maintain confidentiality and professionalism.",
    ]},
    { title: "9. Emergencies", items: [
      "First aid kits are located in designated areas.",
      "Fire extinguishers must remain accessible.",
      "In case of emergency, follow staff instructions immediately.",
      "Emergency contact numbers are posted in the barn.",
    ]},
    { title: "10. Enforcement", items: [
      "Failure to follow barn rules may result in:",
      "Loss of riding privileges",
      "Termination of lessons or board",
      "Removal from property without refund",
    ]},
  ];

  doc.setFontSize(9);
  for (const section of sections) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.title, 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const item of section.items) {
      if (y > 275) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 35);
      doc.text(lines, 20, y);
      y += lines.length * 4.5;
    }
    y += 3;
  }

  // Signature block
  if (y > 240) { doc.addPage(); y = 20; }
  y += 10;
  doc.setDrawColor(180);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Signed by: ${name}`, 15, y);
  y += 6;
  doc.text(`Date: ${date}`, 15, y);
  y += 8;

  if (signature) {
    addSignatureImage(doc, signature, 15, y);
  }

  return doc.output("arraybuffer");
}

function generateWaiverPdf(name: string, date: string, signature: string | null): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 25;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Equine Activity Release and", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.text("Hold Harmless Agreement", pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const paragraphs = [
    `1. I, ${name}, the undersigned understand, and freely and voluntarily enter into this Agreement with Swan Hill Stables understanding that this Release and Hold Harmless Agreement is a waiver of any and all liability(ies).`,
    `2. I understand the potential dangers that I could incur in mounting, riding, walking, boarding, feeding said horse; including, but not limited to, any interactions with other horses. Understanding those risks I hereby release that Company, its officers, directors, shareholders, employees and anyone else directly or indirectly connected with that Company from any liability whatsoever in the event of injury or damage of any nature (or perhaps even death) to me or anyone else caused by or incidental to my electing to mount and ride a horse owned or operated by Swan Hill Stables.`,
    `4. I understand and recognize and warrant that this Release and Hold Harmless Agreement, is being voluntarily and intentionally signed and agreed to, and that in signing this Release and Hold Harmless Agreement I know and understand that this Release and Hold Harmless Agreement may further limit the liability of equine professionals to include any activity, whatsoever, involving an equine, including death, personal injury and/or damage to property.`,
    `5. I recognize and agree that I know which equine professional(s) I will be working with, and acknowledge that I agree said equine professional(s) has/have made reasonable and prudent efforts to determine my ability to engage in the equine activity, and has/have sufficient knowledge of my equine and horseback riding skills as to relieve, release and hold harmless said equine professional(s) from any continuing duty to monitor my equine activities.`,
    `6. I further voluntarily agree and warrant to Release and Hold Harmless this (these) equine professional(s) from any liability whatsoever, including, but not limited to, any incident caused by or related to said equine professional's (s') negligence, relating to injuries known, unknown, or otherwise not herein disclosed; including, but not limited to, injuries, death or property damage from: mounting; riding; dismounting; walking; grooming; feeding; use of horse barn, paddock, trails or horse ring, in any capacity; falling off horse whether horse is bucking, flipping, spooked; or my failure to understand any equine professional's directions relating to my riding or otherwise use and control, or lack thereof, of my horse or the horse I have been assigned to.`,
  ];

  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, pageWidth - 30);
    if (y + lines.length * 5 > 270) { doc.addPage(); y = 20; }
    doc.text(lines, 15, y);
    y += lines.length * 5 + 6;
  }

  // Signature block
  if (y > 230) { doc.addPage(); y = 20; }
  y += 10;
  doc.setDrawColor(180);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  doc.text(`Date: ${date}`, 15, y);
  y += 8;
  doc.text(`Company: Swan Hill Stables`, 15, y);
  y += 10;
  doc.text("Person voluntarily entering into this Release and Hold Harmless Agreement:", 15, y);
  y += 10;

  if (signature) {
    addSignatureImage(doc, signature, 15, y);
    y += 20;
  }

  doc.text(`Printed Name: ${name}`, 15, y);

  return doc.output("arraybuffer");
}

function buildConfirmationEmail(name: string, date: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#2d4a3e;font-size:28px;margin:0;">Swan Hill Stables</h1>
    <p style="color:#8b7355;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Document Confirmation</p>
  </div>

  <div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;border:1px solid #e5ddd0;">
    <p style="color:#3d3529;font-size:16px;">Dear ${name},</p>
    <p style="color:#6b6050;font-size:14px;line-height:1.6;">Thank you for registering for lessons at Swan Hill Stables! Attached to this email are PDF copies of the documents you signed on ${date}:</p>
    <ul style="color:#6b6050;font-size:14px;line-height:1.8;">
      <li><strong>Barn Rules & Safety Policies</strong> — signed copy</li>
      <li><strong>Equine Activity Release & Hold Harmless Agreement</strong> — signed copy</li>
    </ul>
    <p style="color:#6b6050;font-size:14px;line-height:1.6;">Please save these PDFs for your records. We'll be in touch soon to schedule your first lesson!</p>
  </div>

  <div style="text-align:center;color:#8b7355;font-size:11px;padding:20px;">
    <p style="margin:0 0 4px;">Swan Hill Stables</p>
    <p style="margin:0;">This is an automated confirmation. Please keep for your records.</p>
  </div>
</div>
</body></html>`;
}
