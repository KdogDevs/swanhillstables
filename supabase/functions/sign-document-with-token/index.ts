import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LABELS: Record<string, string> = {
  boarding_agreement: "Boarding Agreement",
  liability_waiver: "Liability Waiver",
  barn_rules: "Barn Rules",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, signature_data, signer_name } = await req.json();
    if (!token || !signature_data || !signer_name) {
      throw new Error("Missing token, signature, or name");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: doc, error: docErr } = await supabaseAdmin
      .from("client_documents")
      .select("id, user_id, document_type, status, token_expires_at, recipient_email")
      .eq("sign_token", token).maybeSingle();
    if (docErr || !doc) throw new Error("Invalid link");
    if (doc.status === "signed") throw new Error("Already signed");
    if (doc.token_expires_at && new Date(doc.token_expires_at) < new Date()) {
      throw new Error("Link expired");
    }

    const dateText = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    let pdfBytes: Uint8Array;
    let filename: string;
    if (doc.document_type === "barn_rules") {
      pdfBytes = await barnRulesPdf(signer_name, dateText, signature_data);
      filename = "Barn-Rules-Signed.pdf";
    } else if (doc.document_type === "liability_waiver") {
      pdfBytes = await waiverPdf(signer_name, dateText, signature_data);
      filename = "Liability-Waiver-Signed.pdf";
    } else if (doc.document_type === "boarding_agreement") {
      pdfBytes = await minimalBoardingSignedPdf(signer_name, dateText, signature_data);
      filename = "Boarding-Agreement-Signed.pdf";
    } else {
      throw new Error("Unsupported document type");
    }

    const path = `${doc.user_id}/${doc.document_type}-signed-${Date.now()}.pdf`;
    await supabaseAdmin.storage.from("signed-documents").upload(path, pdfBytes, {
      contentType: "application/pdf", upsert: true,
    });

    await supabaseAdmin.from("client_documents").update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signature_data,
      pdf_url: `signed-documents/${path}`,
      sign_token: null,
    }).eq("id", doc.id);

    // Email PDF to client + admins
    try {
      const { data: stables } = await supabaseAdmin
        .from("email_accounts").select("*")
        .eq("email_address", "stables@swanhillstables.com").single();
      const nodemailer = await import("npm:nodemailer@6.9.16");
      const t = nodemailer.default.createTransport({
        host: stables?.smtp_host || "mx440c.netcup.net",
        port: stables?.smtp_port || 465,
        secure: true,
        auth: {
          user: stables?.username || "stables@swanhillstables.com",
          pass: stables?.password || Deno.env.get("MAIL_PASSWORD")!,
        },
      });
      const from = `"${stables?.display_name || "Swan Hill Stables"}" <${stables?.email_address || "stables@swanhillstables.com"}>`;
      if (doc.recipient_email) {
        await t.sendMail({
          from, to: doc.recipient_email,
          subject: `Your Signed ${LABELS[doc.document_type]} — Swan Hill Stables`,
          html: `<p>Hi ${signer_name},</p><p>Thank you for signing the ${LABELS[doc.document_type]} on ${dateText}. A copy is attached for your records.</p><p>— Swan Hill Stables</p>`,
          attachments: [{ filename, content: pdfBytes, contentType: "application/pdf" }],
        });
      }
      const { data: adminRoles } = await supabaseAdmin.from("user_roles")
        .select("user_id").in("role", ["admin", "super_admin"]);
      const adminEmails: string[] = [];
      for (const r of adminRoles || []) {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        if (u?.user?.email) adminEmails.push(u.user.email);
      }
      if (adminEmails.length) {
        await t.sendMail({
          from, to: adminEmails.join(", "),
          subject: `Signed: ${LABELS[doc.document_type]} — ${signer_name}`,
          html: `<p>${signer_name} has signed the ${LABELS[doc.document_type]} on ${dateText}. PDF attached.</p>`,
          attachments: [{ filename, content: pdfBytes, contentType: "application/pdf" }],
        });
      }
    } catch (e) { console.error("Email error:", e); }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("sign-document-with-token error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ================ PDF Helpers ================

async function embedSig(pdfDoc: PDFDocument, sig: string) {
  const [header, base64] = sig.split(",");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return header.includes("png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
}

async function barnRulesPdf(name: string, date: string, sig: string): Promise<Uint8Array> {
  const bytes = await Deno.readFile(new URL("./barn-rules-template.pdf", import.meta.url));
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sigImg = await embedSig(pdf, sig);
  const pages = pdf.getPages();
  const last = pages[pages.length - 1];
  const { width } = last.getSize();
  const y = 36;
  last.drawRectangle({ x: 30, y, width: width - 60, height: 96,
    color: rgb(1,1,1), borderColor: rgb(0.75,0.75,0.75), borderWidth: 1, opacity: 0.97 });
  last.drawText("Acknowledged and Signed", { x: 44, y: y+74, size: 10, font: bold, color: rgb(0,0,0) });
  last.drawImage(sigImg, { x: 44, y: y+42, width: 150, height: 24 });
  last.drawText(`Name: ${name}`, { x: 44, y: y+22, size: 10, font, color: rgb(0,0,0) });
  last.drawText(`Date: ${date}`, { x: 44, y: y+8, size: 10, font, color: rgb(0,0,0) });
  return await pdf.save();
}

async function waiverPdf(name: string, date: string, sig: string): Promise<Uint8Array> {
  const bytes = await Deno.readFile(new URL("./equine-release-template.pdf", import.meta.url));
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages()[0];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sigImg = await embedSig(pdf, sig);
  const { height } = page.getSize();
  page.drawText(name, { x: 88, y: height-96, size: 10, font: bold, color: rgb(0,0,0) });
  page.drawText("Swan Hill Stables", { x: 392, y: height-96, size: 10, font: bold, color: rgb(0,0,0) });
  page.drawText("Swan Hill Stables", { x: 406, y: height-238, size: 10, font: bold, color: rgb(0,0,0) });
  page.drawText(date, { x: 72, y: height-663, size: 10, font, color: rgb(0,0,0) });
  page.drawImage(sigImg, { x: 78, y: height-728, width: 150, height: 26 });
  page.drawText(name, { x: 78, y: height-754, size: 10, font, color: rgb(0,0,0) });
  return await pdf.save();
}

async function minimalBoardingSignedPdf(name: string, date: string, sig: string): Promise<Uint8Array> {
  // For remote-signed boarding agreements, add a signature page at the end of the template
  const bytes = await Deno.readFile(new URL("./boarding-agreement-template.pdf", import.meta.url));
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sigImg = await embedSig(pdf, sig);
  const pages = pdf.getPages();
  const last = pages[pages.length - 1];
  const { width } = last.getSize();
  const y = 36;
  last.drawRectangle({ x: 30, y, width: width-60, height: 110,
    color: rgb(1,1,1), borderColor: rgb(0.75,0.75,0.75), borderWidth: 1, opacity: 0.97 });
  last.drawText("Signed Remotely", { x: 44, y: y+90, size: 10, font: bold, color: rgb(0,0,0) });
  last.drawImage(sigImg, { x: 44, y: y+48, width: 160, height: 28 });
  last.drawText(`Name: ${name}`, { x: 44, y: y+28, size: 10, font, color: rgb(0,0,0) });
  last.drawText(`Date: ${date}`, { x: 44, y: y+12, size: 10, font, color: rgb(0,0,0) });
  return await pdf.save();
}