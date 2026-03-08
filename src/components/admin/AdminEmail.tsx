import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Inbox,
  Send,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  PenSquare,
  FolderOpen,
  Mail,
  MailOpen,
  Star,
  Reply,
} from "lucide-react";

interface EmailAddress {
  name: string;
  address: string;
}

interface EmailEnvelope {
  date: string | null;
  subject: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc: EmailAddress[];
}

interface EmailSummary {
  uid: number;
  seq: number;
  flags: string[];
  envelope: EmailEnvelope;
  hasAttachment: boolean;
}

interface EmailFull {
  uid: number;
  flags: string[];
  envelope: EmailEnvelope;
  body: string;
  htmlBody: string;
}

interface Folder {
  name: string;
  path: string;
  specialUse: string | null;
  delimiter: string;
  flags: string[];
}

interface EmailListResult {
  emails: EmailSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type View = "list" | "read" | "compose";

const folderIcons: Record<string, typeof Inbox> = {
  "\\Inbox": Inbox,
  "\\Sent": Send,
  "\\Trash": Trash2,
  "\\Drafts": PenSquare,
  "\\Flagged": Star,
};

function getFolderIcon(folder: Folder) {
  if (folder.specialUse && folderIcons[folder.specialUse]) {
    return folderIcons[folder.specialUse];
  }
  return FolderOpen;
}

function formatAddress(addrs: EmailAddress[]) {
  return addrs.map((a) => a.name || a.address).join(", ") || "Unknown";
}

function formatFullAddress(addrs: EmailAddress[]) {
  return addrs.map((a) => (a.name ? `${a.name} <${a.address}>` : a.address)).join(", ");
}

function formatDate(date: string | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleString();
}

export const AdminEmail = () => {
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState("INBOX");
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailFull | null>(null);
  const [view, setView] = useState<View>("list");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sending, setSending] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const fetchApi = useCallback(async (functionName: string, body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const result = await fetchApi("email-fetch", { action: "folders" });
      setFolders(result);
    } catch (err: any) {
      toast({ title: "Error loading folders", description: err.message, variant: "destructive" });
    }
  }, [fetchApi, toast]);

  const loadEmails = useCallback(async (folder?: string, p?: number) => {
    setLoading(true);
    try {
      const result: EmailListResult = await fetchApi("email-fetch", {
        action: "list",
        folder: folder || currentFolder,
        page: p || page,
        pageSize: 20,
      });
      setEmails(result.emails);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err: any) {
      toast({ title: "Error loading emails", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [fetchApi, currentFolder, page, toast]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadEmails();
  }, [currentFolder, page]);

  const openEmail = async (uid: number) => {
    setLoadingEmail(true);
    try {
      const result: EmailFull = await fetchApi("email-fetch", {
        action: "read",
        folder: currentFolder,
        uid,
      });
      setSelectedEmail(result);
      setView("read");
      // Mark as seen in local list
      setEmails((prev) =>
        prev.map((e) =>
          e.uid === uid ? { ...e, flags: [...new Set([...e.flags, "\\Seen"])] } : e
        )
      );
    } catch (err: any) {
      toast({ title: "Error reading email", description: err.message, variant: "destructive" });
    } finally {
      setLoadingEmail(false);
    }
  };

  const deleteEmail = async (uid: number) => {
    try {
      await fetchApi("email-fetch", { action: "delete", folder: currentFolder, uid });
      toast({ title: "Email deleted" });
      setView("list");
      setSelectedEmail(null);
      loadEmails();
    } catch (err: any) {
      toast({ title: "Error deleting email", description: err.message, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Please fill in To and Subject", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await fetchApi("email-send", {
        to: composeTo.split(",").map((s) => s.trim()),
        cc: composeCc ? composeCc.split(",").map((s) => s.trim()) : undefined,
        subject: composeSubject,
        body: composeBody.replace(/\n/g, "<br>"),
      });
      toast({ title: "Email sent successfully" });
      resetCompose();
      setView("list");
    } catch (err: any) {
      toast({ title: "Error sending email", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const from = selectedEmail.envelope.from[0];
    setComposeTo(from?.address || "");
    setComposeSubject(`Re: ${selectedEmail.envelope.subject}`);
    setComposeBody(
      `\n\n--- Original Message ---\nFrom: ${formatFullAddress(selectedEmail.envelope.from)}\nDate: ${formatFullDate(selectedEmail.envelope.date)}\nSubject: ${selectedEmail.envelope.subject}\n\n${selectedEmail.body || "(HTML content)"}`
    );
    setView("compose");
  };

  const resetCompose = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeSubject("");
    setComposeBody("");
  };

  const selectFolder = (path: string) => {
    setCurrentFolder(path);
    setPage(1);
    setView("list");
    setSelectedEmail(null);
  };

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[500px] border border-border rounded-lg overflow-hidden bg-card">
      {/* Sidebar - Folders */}
      <div className="w-56 border-r border-border flex flex-col bg-muted/30">
        <div className="p-3">
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              resetCompose();
              setView("compose");
            }}
          >
            <PenSquare className="h-4 w-4" />
            Compose
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {folders.map((folder) => {
              const Icon = getFolderIcon(folder);
              const isActive = folder.path === currentFolder;
              return (
                <button
                  key={folder.path}
                  onClick={() => selectFolder(folder.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {view === "list" && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground capitalize">
                  {currentFolder === "INBOX" ? "Inbox" : currentFolder}
                </h3>
                <Badge variant="secondary" className="text-xs">{total}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => loadEmails()} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Page {page}/{totalPages || 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Email list */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Inbox className="h-10 w-10 mb-2" />
                  <p>No emails in this folder</p>
                </div>
              ) : (
                <div>
                  {emails.map((email) => {
                    const isSeen = email.flags.includes("\\Seen");
                    return (
                      <button
                        key={email.uid}
                        onClick={() => openEmail(email.uid)}
                        disabled={loadingEmail}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                          !isSeen ? "bg-primary/5" : ""
                        }`}
                      >
                        {isSeen ? (
                          <MailOpen className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!isSeen ? "font-semibold text-foreground" : "text-foreground"}`}>
                              {formatAddress(email.envelope.from)}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(email.envelope.date)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${!isSeen ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                            {email.envelope.subject}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {view === "read" && selectedEmail && (
          <>
            {/* Read toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Button variant="ghost" size="sm" onClick={() => { setView("list"); setSelectedEmail(null); }}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={handleReply}>
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteEmail(selectedEmail.uid)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            {/* Email content */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-4xl">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {selectedEmail.envelope.subject}
                </h2>
                <div className="space-y-1 mb-6 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12">From:</span>
                    <span className="text-foreground">{formatFullAddress(selectedEmail.envelope.from)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12">To:</span>
                    <span className="text-foreground">{formatFullAddress(selectedEmail.envelope.to)}</span>
                  </div>
                  {selectedEmail.envelope.cc.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-12">CC:</span>
                      <span className="text-foreground">{formatFullAddress(selectedEmail.envelope.cc)}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12">Date:</span>
                    <span className="text-foreground">{formatFullDate(selectedEmail.envelope.date)}</span>
                  </div>
                </div>
                <Separator className="mb-6" />
                {selectedEmail.htmlBody ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                    {selectedEmail.body || "(No content)"}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {view === "compose" && (
          <>
            {/* Compose toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetCompose(); }}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <span className="text-sm font-medium text-foreground">New Message</span>
              <div className="flex-1" />
              <Button size="sm" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Send
              </Button>
            </div>

            {/* Compose form */}
            <div className="flex-1 flex flex-col p-4 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12">To:</span>
                <Input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12">CC:</span>
                <Input
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  placeholder="cc@example.com (optional)"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12">Subject:</span>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject"
                  className="flex-1"
                />
              </div>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                className="flex-1 min-h-[300px] resize-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
