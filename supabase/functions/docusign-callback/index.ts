import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOCUSIGN_AUTH_SERVER = "https://account-d.docusign.com";
const DOCUSIGN_INTEGRATION_KEY = Deno.env.get("DOCUSIGN_INTEGRATION_KEY")!;
const DOCUSIGN_CLIENT_SECRET = Deno.env.get("DOCUSIGN_CLIENT_SECRET")!;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // This is the user_id
    const error = url.searchParams.get("error");

    if (error) {
      console.error("DocuSign OAuth error:", error);
      return redirectToAdmin("error=oauth_failed");
    }

    if (!code || !state) {
      return redirectToAdmin("error=missing_params");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Exchange code for tokens
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/docusign-callback`;
    
    const tokenResponse = await fetch(`${DOCUSIGN_AUTH_SERVER}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${DOCUSIGN_INTEGRATION_KEY}:${DOCUSIGN_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return redirectToAdmin("error=token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    console.log("Token exchange successful");

    // Get user info to get account ID and base URI
    const userInfoResponse = await fetch(`${DOCUSIGN_AUTH_SERVER}/oauth/userinfo`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to get user info:", await userInfoResponse.text());
      return redirectToAdmin("error=userinfo_failed");
    }

    const userInfo = await userInfoResponse.json();
    const account = userInfo.accounts?.[0];
    
    if (!account) {
      console.error("No DocuSign account found");
      return redirectToAdmin("error=no_account");
    }

    console.log("DocuSign account:", account.account_id, account.base_uri);

    // Store tokens in database
    const { error: upsertError } = await supabase
      .from("docusign_tokens")
      .upsert({
        user_id: state,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        account_id: account.account_id,
        base_uri: account.base_uri,
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      return redirectToAdmin("error=storage_failed");
    }

    console.log("DocuSign connected successfully for user:", state);
    return redirectToAdmin("docusign=connected");

  } catch (error) {
    console.error("DocuSign callback error:", error);
    return redirectToAdmin("error=unknown");
  }
});

function redirectToAdmin(queryParams: string): Response {
  // Get the frontend URL from environment or use a default
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://id-preview--43b2333a-649f-40ce-becd-7134c3517cfd.lovable.app";
  return new Response(null, {
    status: 302,
    headers: {
      "Location": `${frontendUrl}/admin?${queryParams}`,
    },
  });
}
