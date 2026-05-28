import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_IMAP_HOST = "mx440c.netcup.net";
const DEFAULT_IMAP_PORT = 993;
const DEFAULT_USER = "kagen@swanhillstables.com";

function formatAddress(a: any): { name: string; address: string } {
  const mailbox = a.mailbox || "";
  const host = a.host || "";
  const address = mailbox && host ? `${mailbox}@${host}` : a.address || "";
  return { name: a.name || "", address };
}

async function getAuthAndRole(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");

  const userId = data.claims.sub as string;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roleSet = new Set((roles || []).map((r: any) => r.role));
  if (!roleSet.has("admin") && !roleSet.has("super_admin")) {
    throw new Error("Forbidden: Admin access required");
  }

  return { userId, isSuperAdmin: roleSet.has("super_admin"), supabase };
}

async function getAccountCredentials(accountId: string | null, userId: string, isSuperAdmin: boolean) {
  if (!accountId) {
    return {
      host: DEFAULT_IMAP_HOST,
      port: DEFAULT_IMAP_PORT,
      user: DEFAULT_USER,
      pass: Deno.env.get("MAIL_PASSWORD")!,
    };
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: account, error } = await serviceClient
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error || !account) throw new Error("Email account not found");

  if (!isSuperAdmin) {
    const { data: access } = await serviceClient
      .from("email_account_access")
      .select("can_read, can_send, can_delete")
      .eq("email_account_id", accountId)
      .eq("user_id", userId)
      .single();

    if (!access || !access.can_read) {
      throw new Error("No access to this email account");
    }
  }

  return {
    host: account.imap_host,
    port: account.imap_port,
    user: account.username,
    pass: account.password,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, isSuperAdmin } = await getAuthAndRole(req);
    const body = await req.json();
    const { action, folder, page, pageSize, uid, accountId } = body;

    const creds = await getAccountCredentials(accountId || null, userId, isSuperAdmin);
    if (!creds.pass) throw new Error("Mail password not configured");

    const { ImapFlow } = await import("npm:imapflow@1.0.164");

    const client = new ImapFlow({
      host: creds.host,
      port: creds.port,
      secure: true,
      auth: { user: creds.user, pass: creds.pass },
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
            for await (const msg of client.fetch(`${start}:${end}`, {
              envelope: true, flags: true, bodyStructure: true, uid: true,
            })) {
              emails.push({
                uid: msg.uid,
                seq: msg.seq,
                flags: Array.from(msg.flags || []),
                envelope: {
                  date: msg.envelope?.date?.toISOString() || null,
                  subject: msg.envelope?.subject || "(No Subject)",
                  from: (msg.envelope?.from || []).map(formatAddress),
                  to: (msg.envelope?.to || []).map(formatAddress),
                  cc: (msg.envelope?.cc || []).map(formatAddress),
                  messageId: msg.envelope?.messageId || null,
                  inReplyTo: msg.envelope?.inReplyTo || null,
                },
              });
            }
            emails.reverse();
            result = { emails, total, page: currentPage, pageSize: perPage, totalPages: Math.ceil(total / perPage) };
          }
        } finally {
          mailbox.release();
        }
      } else if (action === "read") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          const msg = await client.fetchOne(String(uid), {
            envelope: true, flags: true, source: true, uid: true,
          }, { uid: true });

          let textBody = "";
          let htmlBody = "";
          let attachments: Array<{ filename: string; contentType: string; size: number; dataUrl: string }> = [];

          if (msg.source) {
            try {
              const { simpleParser } = await import("npm:mailparser@3.7.1");
              const parsed: any = await simpleParser(msg.source);
              textBody = parsed.text || "";
              htmlBody = parsed.html || (parsed.textAsHtml || "");

              // Replace cid: references with data URLs for inline images,
              // and collect non-inline attachments for download.
              for (const att of (parsed.attachments || [])) {
                const b64 = att.content?.toString("base64") || "";
                const dataUrl = `data:${att.contentType};base64,${b64}`;
                if (att.cid && htmlBody) {
                  const cidEscaped = att.cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  htmlBody = htmlBody.replace(
                    new RegExp(`cid:${cidEscaped}`, "gi"),
                    dataUrl,
                  );
                }
                if (!att.related) {
                  attachments.push({
                    filename: att.filename || "attachment",
                    contentType: att.contentType || "application/octet-stream",
                    size: att.size || 0,
                    dataUrl,
                  });
                }
              }
            } catch (e) {
              console.error("mailparser failed, falling back:", e);
              const source = msg.source.toString();
              const bodyStart = source.indexOf("\r\n\r\n");
              if (bodyStart !== -1) textBody = source.substring(bodyStart + 4);
            }
          }

          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

          result = {
            uid: msg.uid,
            flags: Array.from(msg.flags || []),
            envelope: {
              date: msg.envelope?.date?.toISOString() || null,
              subject: msg.envelope?.subject || "(No Subject)",
              from: (msg.envelope?.from || []).map(formatAddress),
              to: (msg.envelope?.to || []).map(formatAddress),
              cc: (msg.envelope?.cc || []).map(formatAddress),
              messageId: msg.envelope?.messageId || null,
              inReplyTo: msg.envelope?.inReplyTo || null,
            },
            body: textBody,
            htmlBody,
            attachments,
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
      } else if (action === "star") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          const starred = body.starred;
          if (starred) {
            await client.messageFlagsAdd(String(uid), ["\\Flagged"], { uid: true });
          } else {
            await client.messageFlagsRemove(String(uid), ["\\Flagged"], { uid: true });
          }
          result = { success: true };
        } finally {
          mailbox.release();
        }
      } else if (action === "move") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          await client.messageMove(String(uid), body.destination || "Trash", { uid: true });
          result = { success: true };
        } finally {
          mailbox.release();
        }
      } else if (action === "search") {
        const mailbox = await client.getMailboxLock(folder || "INBOX");
        try {
          const searchQuery = body.query;
          const uids = await client.search({ or: [
            { subject: searchQuery },
            { from: searchQuery },
            { to: searchQuery },
          ]}, { uid: true });

          const emails: any[] = [];
          if (uids.length > 0) {
            const uidRange = uids.slice(0, 50).join(",");
            for await (const msg of client.fetch(uidRange, {
              envelope: true, flags: true, uid: true,
            }, { uid: true })) {
              emails.push({
                uid: msg.uid,
                seq: msg.seq,
                flags: Array.from(msg.flags || []),
                envelope: {
                  date: msg.envelope?.date?.toISOString() || null,
                  subject: msg.envelope?.subject || "(No Subject)",
                  from: (msg.envelope?.from || []).map(formatAddress),
                  to: (msg.envelope?.to || []).map(formatAddress),
                  cc: (msg.envelope?.cc || []).map(formatAddress),
                },
              });
            }
            emails.reverse();
          }
          result = { emails, total: uids.length };
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
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function decodePart(part: string): string {
  const bodyStart = part.indexOf("\r\n\r\n");
  if (bodyStart === -1) return "";
  let content = part.substring(bodyStart + 4).replace(/--$/, "").trim();
  if (part.toLowerCase().includes("quoted-printable")) {
    content = content.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  } else if (part.toLowerCase().includes("base64")) {
    try { content = atob(content.replace(/\s/g, "")); } catch {}
  }
  return content;
}
