import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOCUSIGN_AUTH_SERVER = "https://account-d.docusign.com";
const DOCUSIGN_INTEGRATION_KEY = Deno.env.get("DOCUSIGN_INTEGRATION_KEY")!;
const DOCUSIGN_CLIENT_SECRET = Deno.env.get("DOCUSIGN_CLIENT_SECRET")!;

// Base64 encoded simple PDF templates
const DOCUMENT_TEMPLATES: Record<string, { name: string; content: string }> = {
  liability_waiver: {
    name: "Liability Waiver",
    content: generateLiabilityWaiverHtml(),
  },
  boarding_agreement: {
    name: "Boarding Agreement", 
    content: generateBoardingAgreementHtml(),
  },
  lesson_registration: {
    name: "Lesson Registration Form",
    content: generateLessonRegistrationHtml(),
  },
  emergency_contact_form: {
    name: "Emergency Contact Form",
    content: generateEmergencyContactHtml(),
  },
};

function generateLiabilityWaiverHtml(): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1 style="text-align: center; color: #1a1a1a;">Swan Hill Stables</h1>
      <h2 style="text-align: center; color: #444;">Liability Waiver and Release</h2>
      
      <p style="margin-top: 30px;">I, the undersigned, acknowledge and agree to the following:</p>
      
      <ol style="line-height: 1.8;">
        <li>I understand that horseback riding and related equestrian activities involve inherent risks, including but not limited to bodily injury, property damage, and death.</li>
        <li>I voluntarily assume all risks associated with participating in equestrian activities at Swan Hill Stables.</li>
        <li>I release and hold harmless Swan Hill Stables, its owners, employees, and agents from any and all liability for injuries or damages.</li>
        <li>I agree to follow all safety rules and instructions provided by Swan Hill Stables staff.</li>
        <li>I confirm that I am physically and mentally capable of participating in equestrian activities.</li>
        <li>I understand that this waiver applies to myself and any minor children under my supervision.</li>
      </ol>
      
      <p style="margin-top: 40px;">By signing below, I acknowledge that I have read, understood, and agree to the terms of this liability waiver.</p>
      
      <div style="margin-top: 60px;">
        <p><strong>Participant Name:</strong> /sn1/</p>
        <p><strong>Signature:</strong> /s1/</p>
        <p><strong>Date:</strong> /d1/</p>
      </div>
    </body>
    </html>
  `;
}

function generateBoardingAgreementHtml(): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1 style="text-align: center; color: #1a1a1a;">Swan Hill Stables</h1>
      <h2 style="text-align: center; color: #444;">Horse Boarding Agreement</h2>
      
      <p style="margin-top: 30px;">This Boarding Agreement is entered into between Swan Hill Stables ("Stable") and the undersigned horse owner ("Boarder").</p>
      
      <h3>Terms and Conditions:</h3>
      <ol style="line-height: 1.8;">
        <li><strong>Board Rate:</strong> Monthly boarding fees are due on the 1st of each month. Late payments incur a 10% fee after 5 days.</li>
        <li><strong>Care Provided:</strong> Includes daily feeding, watering, stall cleaning, and turnout as per stable schedule.</li>
        <li><strong>Veterinary Care:</strong> In emergencies, the Stable may authorize veterinary care at the Boarder's expense.</li>
        <li><strong>Farrier Services:</strong> Boarder is responsible for scheduling and paying for farrier services.</li>
        <li><strong>Insurance:</strong> Boarder is strongly encouraged to maintain mortality and liability insurance.</li>
        <li><strong>Termination:</strong> Either party may terminate with 30 days written notice.</li>
        <li><strong>Liability:</strong> The Stable is not liable for injury, illness, death, or loss of the horse except in cases of gross negligence.</li>
      </ol>
      
      <div style="margin-top: 60px;">
        <p><strong>Horse Owner Name:</strong> /sn1/</p>
        <p><strong>Signature:</strong> /s1/</p>
        <p><strong>Date:</strong> /d1/</p>
      </div>
    </body>
    </html>
  `;
}

function generateLessonRegistrationHtml(): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1 style="text-align: center; color: #1a1a1a;">Swan Hill Stables</h1>
      <h2 style="text-align: center; color: #444;">Lesson Registration Form</h2>
      
      <p style="margin-top: 30px;">Please complete this form to register for riding lessons at Swan Hill Stables.</p>
      
      <h3>Lesson Policies:</h3>
      <ul style="line-height: 1.8;">
        <li>Lessons must be cancelled at least 24 hours in advance for a full refund.</li>
        <li>Appropriate riding attire is required (boots with heels, long pants).</li>
        <li>ASTM/SEI certified helmets are mandatory and provided free of charge.</li>
        <li>Students should arrive 15 minutes before scheduled lesson time.</li>
        <li>Lesson packages are non-transferable and expire after 6 months.</li>
      </ul>
      
      <p style="margin-top: 20px;">I have read and agree to the lesson policies above. I understand that I must also sign a separate Liability Waiver.</p>
      
      <div style="margin-top: 60px;">
        <p><strong>Student Name:</strong> /sn1/</p>
        <p><strong>Signature:</strong> /s1/</p>
        <p><strong>Date:</strong> /d1/</p>
      </div>
    </body>
    </html>
  `;
}

function generateEmergencyContactHtml(): string {
  return `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <h1 style="text-align: center; color: #1a1a1a;">Swan Hill Stables</h1>
      <h2 style="text-align: center; color: #444;">Emergency Contact Form</h2>
      
      <p style="margin-top: 30px;">Please provide emergency contact information. This information will be used only in case of an emergency.</p>
      
      <p style="margin-top: 20px;">I authorize Swan Hill Stables to contact the persons listed on my profile in case of emergency and to seek medical treatment on my behalf if necessary.</p>
      
      <div style="margin-top: 60px;">
        <p><strong>Name:</strong> /sn1/</p>
        <p><strong>Signature:</strong> /s1/</p>
        <p><strong>Date:</strong> /d1/</p>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get DocuSign tokens
    let { data: tokenData } = await supabase
      .from("docusign_tokens")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    if (!tokenData) {
      return new Response(JSON.stringify({ error: "DocuSign not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    if (new Date(tokenData.expires_at) < new Date()) {
      tokenData = await refreshToken(supabase, tokenData);
      if (!tokenData) {
        return new Response(JSON.stringify({ error: "Failed to refresh DocuSign token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { documentId, recipientEmail, recipientName, documentType } = body;

    if (!documentId || !recipientEmail || !recipientName || !documentType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = DOCUMENT_TEMPLATES[documentType];
    if (!template) {
      return new Response(JSON.stringify({ error: "Unknown document type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create envelope with DocuSign
    const envelopeDefinition = {
      emailSubject: `Please sign: ${template.name} - Swan Hill Stables`,
      emailBlurb: `Please review and sign the attached ${template.name} for Swan Hill Stables.`,
      documents: [
        {
          documentId: "1",
          name: `${template.name}.html`,
          fileExtension: "html",
          documentBase64: btoa(template.content),
        },
      ],
      recipients: {
        signers: [
          {
            email: recipientEmail,
            name: recipientName,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  anchorString: "/s1/",
                  anchorUnits: "pixels",
                  anchorXOffset: "0",
                  anchorYOffset: "0",
                },
              ],
              dateSignedTabs: [
                {
                  anchorString: "/d1/",
                  anchorUnits: "pixels",
                  anchorXOffset: "0",
                  anchorYOffset: "0",
                },
              ],
              textTabs: [
                {
                  anchorString: "/sn1/",
                  anchorUnits: "pixels",
                  anchorXOffset: "0",
                  anchorYOffset: "0",
                  value: recipientName,
                  locked: "true",
                },
              ],
            },
          },
        ],
      },
      status: "sent",
    };

    console.log("Sending envelope to DocuSign...");
    
    const envelopeResponse = await fetch(
      `${tokenData.base_uri}/restapi/v2.1/accounts/${tokenData.account_id}/envelopes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error("DocuSign envelope error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send document", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const envelopeResult = await envelopeResponse.json();
    console.log("Envelope created:", envelopeResult.envelopeId);

    // Update document record in database
    const { error: updateError } = await supabase
      .from("client_documents")
      .update({
        envelope_id: envelopeResult.envelopeId,
        docusign_status: "sent",
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_email: recipientEmail,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Failed to update document record:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      envelopeId: envelopeResult.envelopeId,
      status: envelopeResult.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("DocuSign send error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function refreshToken(supabase: any, tokenData: any): Promise<any> {
  try {
    const response = await fetch(`${DOCUSIGN_AUTH_SERVER}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${DOCUSIGN_INTEGRATION_KEY}:${DOCUSIGN_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", await response.text());
      return null;
    }

    const data = await response.json();
    
    const { data: updated } = await supabase
      .from("docusign_tokens")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq("user_id", tokenData.user_id)
      .select()
      .single();

    return updated;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}
