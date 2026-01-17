import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOCUSIGN_AUTH_SERVER = "https://account-d.docusign.com"; // Demo server, change to account.docusign.com for production
const DOCUSIGN_INTEGRATION_KEY = Deno.env.get("DOCUSIGN_INTEGRATION_KEY")!;
const DOCUSIGN_CLIENT_SECRET = Deno.env.get("DOCUSIGN_CLIENT_SECRET")!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin
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

    // Check if user is admin
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "get-auth-url") {
      // Generate OAuth URL for DocuSign
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/docusign-callback`;
      const state = userData.user.id; // Pass user ID in state
      
      const authUrl = `${DOCUSIGN_AUTH_SERVER}/oauth/auth?` +
        `response_type=code&` +
        `scope=signature&` +
        `client_id=${DOCUSIGN_INTEGRATION_KEY}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check-connection") {
      // Check if user has valid DocuSign tokens
      const { data: tokenData } = await supabase
        .from("docusign_tokens")
        .select("*")
        .eq("user_id", userData.user.id)
        .single();

      if (!tokenData) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if token is expired
      const isExpired = new Date(tokenData.expires_at) < new Date();
      
      if (isExpired) {
        // Try to refresh the token
        const refreshed = await refreshToken(supabase, tokenData);
        return new Response(JSON.stringify({ connected: refreshed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ connected: true, accountId: tokenData.account_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase
        .from("docusign_tokens")
        .delete()
        .eq("user_id", userData.user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("DocuSign auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function refreshToken(supabase: any, tokenData: any): Promise<boolean> {
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
      return false;
    }

    const data = await response.json();
    
    await supabase
      .from("docusign_tokens")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq("user_id", tokenData.user_id);

    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
}
