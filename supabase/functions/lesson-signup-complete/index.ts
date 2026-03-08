import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // 6. Send confirmation email with signed documents
    try {
      const nodemailer = await import("npm:nodemailer@6.9.16");
      const transporter = nodemailer.default.createTransport({
        host: "mx440c.netcup.net",
        port: 465,
        secure: true,
        auth: {
          user: "kagen@swanhillstables.com",
          pass: Deno.env.get("MAIL_PASSWORD")!,
        },
      });

      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });

      const emailHtml = buildConfirmationEmail(formData.full_name, date);

      const attachments: any[] = [];
      if (barnRulesSignature) {
        attachments.push({
          filename: "barn-rules-signature.png",
          content: barnRulesSignature.split(",")[1],
          encoding: "base64",
          cid: "barn-rules-sig",
        });
      }
      if (waiverSignature) {
        attachments.push({
          filename: "waiver-signature.png",
          content: waiverSignature.split(",")[1],
          encoding: "base64",
          cid: "waiver-sig",
        });
      }

      await transporter.sendMail({
        from: '"Swan Hill Stables" <kagen@swanhillstables.com>',
        to: formData.email,
        subject: "Your Signed Documents - Swan Hill Stables",
        html: emailHtml,
        attachments,
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

function buildConfirmationEmail(name: string, date: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#2d4a3e;font-size:28px;margin:0;">Swan Hill Stables</h1>
    <p style="color:#8b7355;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Signed Documents</p>
  </div>

  <div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;border:1px solid #e5ddd0;">
    <p style="color:#3d3529;font-size:16px;">Dear ${name},</p>
    <p style="color:#6b6050;font-size:14px;line-height:1.6;">Thank you for registering for lessons at Swan Hill Stables! Below are copies of the documents you signed on ${date}. Please keep this email for your records.</p>
  </div>

  <div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;border:1px solid #e5ddd0;">
    <h2 style="color:#2d4a3e;font-size:18px;border-bottom:2px solid #d4c5a9;padding-bottom:10px;margin-top:0;">Barn Rules &amp; Safety Policies</h2>
    <div style="color:#6b6050;font-size:13px;line-height:1.8;">
      <p><strong style="color:#3d3529;">1. General Safety</strong> — Helmets required under 18, closed-toe shoes, no roughhousing, children under 12 supervised, no unauthorized horse contact, no stallions.</p>
      <p><strong style="color:#3d3529;">2. Horse Handling</strong> — Only assigned persons handle horses, no unauthorized feeding, report injuries immediately.</p>
      <p><strong style="color:#3d3529;">3. Riding Rules</strong> — Signed waiver required, no riding without approval.</p>
      <p><strong style="color:#3d3529;">4. Arena Etiquette</strong> — Left shoulder passing, faster gaits have right of way, pick up manure.</p>
      <p><strong style="color:#3d3529;">5. Tack &amp; Equipment</strong> — Use assigned tack only, return clean, report damage.</p>
      <p><strong style="color:#3d3529;">6. Visitors</strong> — Check in with staff, no unsupervised guests, no smoking/drugs/alcohol.</p>
      <p><strong style="color:#3d3529;">7. Facility</strong> — Keep aisles clear, clean up, close gates.</p>
      <p><strong style="color:#3d3529;">8. Lessons</strong> — Follow instructor directions, maintain confidentiality.</p>
      <p><strong style="color:#3d3529;">9. Emergencies</strong> — First aid kits in designated areas, follow staff instructions.</p>
      <p><strong style="color:#3d3529;">10. Enforcement</strong> — Violations may result in loss of privileges or removal.</p>
    </div>
    <div style="border-top:1px solid #e5ddd0;margin-top:20px;padding-top:15px;">
      <p style="color:#6b6050;font-size:12px;margin:0 0 8px;">Signed by ${name} on ${date}</p>
      <img src="cid:barn-rules-sig" alt="Signature" style="max-width:200px;max-height:60px;" />
    </div>
  </div>

  <div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;border:1px solid #e5ddd0;">
    <h2 style="color:#2d4a3e;font-size:18px;border-bottom:2px solid #d4c5a9;padding-bottom:10px;margin-top:0;">Equine Activity Release &amp; Hold Harmless Agreement</h2>
    <div style="color:#6b6050;font-size:13px;line-height:1.8;">
      <p>I, ${name}, the undersigned, understand and freely enter into this Agreement with Swan Hill Stables, understanding that this Release and Hold Harmless Agreement is a waiver of any and all liabilities.</p>
      <p>I understand the potential dangers in mounting, riding, walking, boarding, and feeding horses, including interactions with other horses. I hereby release the Company from any liability in the event of injury or damage.</p>
      <p>I recognize this Agreement is being voluntarily signed and may further limit the liability of equine professionals.</p>
      <p>I further agree to release equine professionals from any liability, including incidents related to negligence.</p>
    </div>
    <div style="border-top:1px solid #e5ddd0;margin-top:20px;padding-top:15px;">
      <p style="color:#6b6050;font-size:12px;margin:0 0 8px;">Signed by ${name} on ${date}</p>
      <img src="cid:waiver-sig" alt="Signature" style="max-width:200px;max-height:60px;" />
    </div>
  </div>

  <div style="text-align:center;color:#8b7355;font-size:11px;padding:20px;">
    <p style="margin:0 0 4px;">Swan Hill Stables</p>
    <p style="margin:0;">This is an automated confirmation. Please keep for your records.</p>
  </div>
</div>
</body></html>`;
}
