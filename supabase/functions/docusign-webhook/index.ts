import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// DocuSign webhook for envelope status updates
// This is a public endpoint - no auth required but we validate the payload

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    console.log("Received DocuSign webhook");

    // Parse the XML or JSON payload
    let envelopeId: string | null = null;
    let status: string | null = null;
    let recipientEmail: string | null = null;

    // DocuSign Connect sends XML by default
    if (body.includes("<?xml")) {
      // Simple XML parsing for envelope status
      const envelopeIdMatch = body.match(/<EnvelopeID>([^<]+)<\/EnvelopeID>/i);
      const statusMatch = body.match(/<Status>([^<]+)<\/Status>/i);
      const emailMatch = body.match(/<Email>([^<]+)<\/Email>/i);
      
      envelopeId = envelopeIdMatch?.[1] || null;
      status = statusMatch?.[1]?.toLowerCase() || null;
      recipientEmail = emailMatch?.[1] || null;
    } else {
      // Try JSON parsing
      try {
        const jsonBody = JSON.parse(body);
        envelopeId = jsonBody.envelopeId || jsonBody.data?.envelopeSummary?.envelopeId;
        status = jsonBody.status || jsonBody.data?.envelopeSummary?.status;
        recipientEmail = jsonBody.recipientEmail;
      } catch {
        console.log("Could not parse as JSON, raw body:", body.substring(0, 500));
      }
    }

    if (!envelopeId) {
      console.log("No envelope ID found in webhook payload");
      return new Response("OK", { status: 200 });
    }

    console.log(`Processing webhook for envelope ${envelopeId}, status: ${status}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map DocuSign status to our status
    let mappedStatus = status;
    let signedAt = null;

    switch (status?.toLowerCase()) {
      case "completed":
      case "signed":
        mappedStatus = "signed";
        signedAt = new Date().toISOString();
        break;
      case "sent":
      case "delivered":
        mappedStatus = "sent";
        break;
      case "declined":
      case "voided":
        mappedStatus = "expired";
        break;
      default:
        mappedStatus = status || "pending";
    }

    // Update the document record
    const updateData: any = {
      docusign_status: status,
      status: mappedStatus,
    };

    if (signedAt) {
      updateData.signed_at = signedAt;
    }

    const { error, data } = await supabase
      .from("client_documents")
      .update(updateData)
      .eq("envelope_id", envelopeId)
      .select();

    if (error) {
      console.error("Error updating document:", error);
    } else {
      console.log(`Updated document for envelope ${envelopeId}:`, data);
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to acknowledge receipt even on error
    return new Response("OK", { status: 200 });
  }
});
