import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAP_HOST = "mx440c.netcup.net";
const IMAP_PORT = 993;
const IMAP_USER = "kagen@swanhillstables.com";

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("Unauthorized");
  }

  const userId = data.claims.sub;
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    throw new Error("Forbidden: Admin access required");
  }

  return userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);

    const { action, folder, page, pageSize, uid } = await req.json();
    const password = Deno.env.get("MAIL_PASSWORD");

    if (!password) {
      throw new Error("Mail password not configured");
    }

    const { ImapFlow } = await import("npm:imapflow@1.0.164");

    const client = new ImapFlow({
      host: IMAP_HOST,
      port: IMAP_PORT,
      secure: true,
      auth: {
        user: IMAP_USER,
        pass: password,
      },
      logger: false,
    });

    await client.connect();

    let result: unknown;

    try {
      if (action === "folders") {
        const folders = await client.list();
        result = folders.map((f: any) => ({
          name: f.name,
          path: f.path,
          specialUse: f.specialUse || null,
          delimiter: f.delimiter,
          listed: f.listed,
          flags: Array.from(f.flags || []),
        }));
      } else if (action === "list") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          const total = client.mailbox?.exists || 0;
          const perPage = pageSize || 20;
          const currentPage = page || 1;
          const end = Math.max(total - (currentPage - 1) * perPage, 0);
          const start = Math.max(end - perPage + 1, 1);

          if (end <= 0 || total === 0) {
            result = { emails: [], total, page: currentPage, pageSize: perPage, totalPages: Math.ceil(total / perPage) };
          } else {
            const emails: any[] = [];
            const range = `${start}:${end}`;

            for await (const msg of client.fetch(range, {
              envelope: true,
              flags: true,
              bodyStructure: true,
              uid: true,
            })) {
              emails.push({
                uid: msg.uid,
                seq: msg.seq,
                flags: Array.from(msg.flags || []),
                envelope: {
                  date: msg.envelope?.date?.toISOString() || null,
                  subject: msg.envelope?.subject || "(No Subject)",
                  from: msg.envelope?.from?.map((a: any) => ({
                    name: a.name,
                    address: `${a.mailbox}@${a.host}`,
                  })) || [],
                  to: msg.envelope?.to?.map((a: any) => ({
                    name: a.name,
                    address: `${a.mailbox}@${a.host}`,
                  })) || [],
                  cc: msg.envelope?.cc?.map((a: any) => ({
                    name: a.name,
                    address: `${a.mailbox}@${a.host}`,
                  })) || [],
                },
                hasAttachment: false,
              });
            }

            // Reverse so newest first
            emails.reverse();

            result = {
              emails,
              total,
              page: currentPage,
              pageSize: perPage,
              totalPages: Math.ceil(total / perPage),
            };
          }
        } finally {
          mailbox.release();
        }
      } else if (action === "read") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          const msg = await client.fetchOne(String(uid), {
            envelope: true,
            flags: true,
            source: true,
            bodyStructure: true,
            uid: true,
          }, { uid: true });

          // Parse body from source
          let body = "";
          let htmlBody = "";
          if (msg.source) {
            const source = msg.source.toString();
            // Simple extraction - try to get text/html or text/plain
            const boundaryMatch = source.match(/boundary="?([^"\r\n;]+)"?/i);
            if (boundaryMatch) {
              const boundary = boundaryMatch[1];
              const parts = source.split(`--${boundary}`);
              for (const part of parts) {
                if (part.includes("text/html")) {
                  const bodyStart = part.indexOf("\r\n\r\n");
                  if (bodyStart !== -1) {
                    htmlBody = part.substring(bodyStart + 4).replace(/--$/, "").trim();
                    // Handle transfer encoding
                    if (part.toLowerCase().includes("quoted-printable")) {
                      htmlBody = htmlBody.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
                    } else if (part.toLowerCase().includes("base64")) {
                      try { htmlBody = atob(htmlBody.replace(/\s/g, "")); } catch {}
                    }
                  }
                } else if (part.includes("text/plain") && !body) {
                  const bodyStart = part.indexOf("\r\n\r\n");
                  if (bodyStart !== -1) {
                    body = part.substring(bodyStart + 4).replace(/--$/, "").trim();
                    if (part.toLowerCase().includes("quoted-printable")) {
                      body = body.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
                    } else if (part.toLowerCase().includes("base64")) {
                      try { body = atob(body.replace(/\s/g, "")); } catch {}
                    }
                  }
                }
              }
            } else {
              // Simple single-part message
              const bodyStart = source.indexOf("\r\n\r\n");
              if (bodyStart !== -1) {
                body = source.substring(bodyStart + 4);
                if (source.toLowerCase().includes("text/html")) {
                  htmlBody = body;
                  body = "";
                }
              }
            }
          }

          // Mark as seen
          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

          result = {
            uid: msg.uid,
            flags: Array.from(msg.flags || []),
            envelope: {
              date: msg.envelope?.date?.toISOString() || null,
              subject: msg.envelope?.subject || "(No Subject)",
              from: msg.envelope?.from?.map((a: any) => ({
                name: a.name,
                address: `${a.mailbox}@${a.host}`,
              })) || [],
              to: msg.envelope?.to?.map((a: any) => ({
                name: a.name,
                address: `${a.mailbox}@${a.host}`,
              })) || [],
              cc: msg.envelope?.cc?.map((a: any) => ({
                name: a.name,
                address: `${a.mailbox}@${a.host}`,
              })) || [],
            },
            body,
            htmlBody,
          };
        } finally {
          mailbox.release();
        }
      } else if (action === "delete") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          await client.messageDelete(String(uid), { uid: true });
          result = { success: true };
        } finally {
          mailbox.release();
        }
      } else if (action === "move") {
        const { destination } = await req.json().catch(() => ({}));
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          await client.messageMove(String(uid), destination || "Trash", { uid: true });
          result = { success: true };
        } finally {
          mailbox.release();
        }
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
    } finally {
      await client.logout();
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email fetch error:", error);
    const status = error.message === "Unauthorized" ? 401 : error.message?.includes("Forbidden") ? 403 : 500;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
