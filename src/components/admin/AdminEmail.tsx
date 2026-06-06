import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Loader2, Inbox, Send, Trash2, RefreshCw, ChevronLeft, ChevronRight,
  ArrowLeft, PenSquare, FolderOpen, Mail, MailOpen, Star, Reply,
  Search, X, Forward, Users, Clock, CalendarIcon, Paperclip, Download,
} from "lucide-react";
import { EmailHtmlViewer } from "./EmailHtmlViewer";

interface EmailAddress { name: string; address: string; }
interface EmailEnvelope {
  date: string | null; subject: string;
  from: EmailAddress[]; to: EmailAddress[]; cc: EmailAddress[];
  messageId?: string | null; inReplyTo?: string | null;
}
interface EmailSummary { uid: number; seq: number; flags: string[]; envelope: EmailEnvelope; }
interface EmailAttachment { filename: string; contentType: string; size: number; dataUrl: string; }
interface EmailFull {
  uid: number; flags: string[]; envelope: EmailEnvelope;
  body: string; htmlBody: string; attachments?: EmailAttachment[];
}
interface Folder { name: string; path: string; specialUse: string | null; delimiter: string; flags: string[]; }
interface EmailListResult { emails: EmailSummary[]; total: number; page: number; pageSize: number; totalPages: number; }
interface EmailAccount { id: string; email_address: string; display_name: string; }
interface ContactGroup { id: string; name: string; }
interface ContactInGroup { email: string; name: string | null; }
interface ScheduledEmail {
  id: string; subject: string; to_addresses: string[];
  scheduled_at: string; status: string; created_at: string;
}

type View = "list" | "read" | "compose" | "scheduled";

const folderIcons: Record<string, typeof Inbox> = {
  "\\Inbox": Inbox, "\\Sent": Send, "\\Trash": Trash2, "\\Drafts": PenSquare, "\\Flagged": Star,
};

function getFolderIcon(folder: Folder) {
  return (folder.specialUse && folderIcons[folder.specialUse]) || FolderOpen;
}
function formatAddr(addrs: EmailAddress[]) { return addrs.map(a => a.name || a.address).join(", ") || "Unknown"; }
function formatFullAddr(addrs: EmailAddress[]) { return addrs.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(", "); }
function formatDate(date: string | null) {
  if (!date) return "";
  const d = new Date(date), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function formatFullDate(date: string | null) { return date ? new Date(date).toLocaleString() : ""; }

interface AdminEmailProps { isSuperAdmin?: boolean; }

export const AdminEmail = ({ isSuperAdmin }: AdminEmailProps) => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Account switcher
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Compose
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [showBcc, setShowBcc] = useState(false);

  // Groups
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  // Schedule
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);

  // Signature
  const [signature, setSignature] = useState("");

  const fetchApi = useCallback(async (fn: string, body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...body, accountId: selectedAccountId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, [selectedAccountId]);

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        if (isSuperAdmin) {
          const { data } = await supabase.from("email_accounts").select("id, email_address, display_name");
          setAccounts(data || []);
        } else {
          const { data } = await supabase.from("email_account_access").select("email_account_id");
          if (data && data.length > 0) {
            const ids = data.map(a => a.email_account_id);
            const { data: accts } = await supabase.from("email_accounts").select("id, email_address, display_name").in("id", ids);
            setAccounts(accts || []);
            if (accts && accts.length > 0) {
              setSelectedAccountId(accts[0].id);
            }
          }
        }
      } catch {}
    };
    loadAccounts();
  }, [isSuperAdmin]);

  // Load contact groups
  useEffect(() => {
    const loadGroups = async () => {
      const { data } = await supabase.from("contact_groups").select("id, name").order("name");
      setContactGroups(data || []);
    };
    loadGroups();
  }, []);

  // Load signature
  useEffect(() => {
    const loadSignature = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("email_signatures")
        .select("signature_html").eq("user_id", user.id).eq("is_default", true).maybeSingle();
      if (data) setSignature(data.signature_html);
    };
    loadSignature();
  }, []);

  // Load scheduled emails
  const loadScheduledEmails = async () => {
    const { data } = await supabase.from("scheduled_emails")
      .select("id, subject, to_addresses, scheduled_at, status, created_at")
      .order("scheduled_at", { ascending: true });
    setScheduledEmails(data || []);
  };

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
        action: "list", folder: folder || currentFolder, page: p || page, pageSize: 20,
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) { loadEmails(); return; }
    setIsSearching(true); setLoading(true);
    try {
      const result = await fetchApi("email-fetch", { action: "search", folder: currentFolder, query: searchQuery });
      setEmails(result.emails); setTotal(result.total); setTotalPages(1);
    } catch (err: any) {
      toast({ title: "Search error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const clearSearch = () => { setSearchQuery(""); setIsSearching(false); loadEmails(); };

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { if (!isSearching) loadEmails(); }, [currentFolder, page, selectedAccountId]);

  const openEmail = async (uid: number) => {
    setLoadingEmail(true);
    try {
      const result: EmailFull = await fetchApi("email-fetch", { action: "read", folder: currentFolder, uid });
      setSelectedEmail(result); setView("read");
      setEmails(prev => prev.map(e => e.uid === uid ? { ...e, flags: [...new Set([...e.flags, "\\Seen"])] } : e));
    } catch (err: any) {
      toast({ title: "Error reading email", description: err.message, variant: "destructive" });
    } finally { setLoadingEmail(false); }
  };

  const toggleStar = async (uid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.uid === uid);
    if (!email) return;
    const isStarred = email.flags.includes("\\Flagged");
    try {
      await fetchApi("email-fetch", { action: "star", folder: currentFolder, uid, starred: !isStarred });
      setEmails(prev => prev.map(em => {
        if (em.uid !== uid) return em;
        return { ...em, flags: isStarred ? em.flags.filter(f => f !== "\\Flagged") : [...em.flags, "\\Flagged"] };
      }));
    } catch {}
  };

  const deleteEmail = async (uid: number) => {
    try {
      await fetchApi("email-fetch", { action: "delete", folder: currentFolder, uid });
      toast({ title: "Email deleted" }); setView("list"); setSelectedEmail(null); loadEmails();
    } catch (err: any) {
      toast({ title: "Error deleting email", description: err.message, variant: "destructive" });
    }
  };

  // Add group emails to To field
  const addGroupToRecipients = async (groupId: string) => {
    const { data: members } = await supabase
      .from("contact_group_members")
      .select("contact_id")
      .eq("group_id", groupId);
    if (!members || members.length === 0) {
      toast({ title: "Group has no members", variant: "destructive" }); return;
    }
    const ids = members.map(m => m.contact_id);
    const { data: contacts } = await supabase
      .from("contacts")
      .select("email, name")
      .in("id", ids);
    if (!contacts) return;
    const newEmails = contacts.map(c => c.email);
    const existing = composeTo.split(",").map(e => e.trim()).filter(Boolean);
    const combined = [...new Set([...existing, ...newEmails])];
    setComposeTo(combined.join(", "));
    setShowGroupPicker(false);
    toast({ title: `Added ${newEmails.length} recipients from group` });
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Please fill in To and Subject", variant: "destructive" }); return;
    }
    setSending(true);
    try {
      await fetchApi("email-send", {
        to: composeTo.split(",").map(s => s.trim()),
        cc: composeCc ? composeCc.split(",").map(s => s.trim()) : undefined,
        bcc: composeBcc ? composeBcc.split(",").map(s => s.trim()) : undefined,
        subject: composeSubject,
        body: composeBody.replace(/\n/g, "<br>"),
        signature: signature || undefined,
      });
      toast({ title: "Email sent successfully" }); resetCompose(); setView("list");
    } catch (err: any) {
      toast({ title: "Error sending", description: err.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  const handleScheduleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Please fill in To and Subject", variant: "destructive" }); return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast({ title: "Please select date and time", variant: "destructive" }); return;
    }

    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const scheduledAt = new Date(scheduleDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    if (scheduledAt <= new Date()) {
      toast({ title: "Scheduled time must be in the future", variant: "destructive" }); return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const toAddresses = composeTo.split(",").map(s => s.trim()).filter(Boolean);
    const ccAddresses = composeCc ? composeCc.split(",").map(s => s.trim()).filter(Boolean) : null;
    const bccAddresses = composeBcc ? composeBcc.split(",").map(s => s.trim()).filter(Boolean) : null;

    const { error } = await supabase.from("scheduled_emails").insert({
      account_id: selectedAccountId || null,
      to_addresses: toAddresses,
      cc_addresses: ccAddresses,
      bcc_addresses: bccAddresses,
      subject: composeSubject,
      body: composeBody.replace(/\n/g, "<br>"),
      signature: signature || null,
      scheduled_at: scheduledAt.toISOString(),
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error scheduling", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Email scheduled for ${format(scheduledAt, "PPP 'at' p")}` });
      resetCompose(); setShowSchedule(false); setView("list");
    }
  };

  const cancelScheduled = async (id: string) => {
    await supabase.from("scheduled_emails").delete().eq("id", id);
    toast({ title: "Scheduled email cancelled" });
    loadScheduledEmails();
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.envelope.from[0]?.address || "");
    setComposeSubject(`Re: ${selectedEmail.envelope.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${formatFullAddr(selectedEmail.envelope.from)}\nDate: ${formatFullDate(selectedEmail.envelope.date)}\nSubject: ${selectedEmail.envelope.subject}\n\n${selectedEmail.body || "(HTML content)"}`);
    setView("compose");
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    setComposeTo("");
    setComposeSubject(`Fwd: ${selectedEmail.envelope.subject}`);
    setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${formatFullAddr(selectedEmail.envelope.from)}\nDate: ${formatFullDate(selectedEmail.envelope.date)}\nSubject: ${selectedEmail.envelope.subject}\nTo: ${formatFullAddr(selectedEmail.envelope.to)}\n\n${selectedEmail.body || "(HTML content)"}`);
    setView("compose");
  };

  const resetCompose = () => {
    setComposeTo(""); setComposeCc(""); setComposeBcc(""); setComposeSubject(""); setComposeBody("");
    setShowBcc(false); setShowSchedule(false); setScheduleDate(undefined); setScheduleTime("");
  };

  const selectFolder = (path: string) => {
    setCurrentFolder(path); setPage(1); setView("list"); setSelectedEmail(null); setIsSearching(false); setSearchQuery("");
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-280px)] min-h-[400px] border border-border rounded-lg overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-border flex flex-col bg-muted/30 max-h-52 lg:max-h-none overflow-y-auto lg:overflow-visible">
        {accounts.length > 0 && (
          <div className="p-2 border-b border-border">
            <Select value={selectedAccountId || "default"} onValueChange={v => setSelectedAccountId(v === "default" ? null : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Default account" /></SelectTrigger>
              <SelectContent>
                {isSuperAdmin && <SelectItem value="default">kagen@swanhillstables.com</SelectItem>}
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.email_address}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="p-3">
          <Button size="sm" className="w-full gap-2" onClick={() => { resetCompose(); setView("compose"); }}>
            <PenSquare className="h-4 w-4" /> Compose
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {folders.map(folder => {
              const Icon = getFolderIcon(folder);
              const isActive = folder.path === currentFolder && view === "list";
              return (
                <button key={folder.path} onClick={() => selectFolder(folder.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
            <Separator className="my-2" />
            <button onClick={() => { setView("scheduled"); loadScheduledEmails(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${view === "scheduled" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Scheduled</span>
            </button>
          </div>
        </ScrollArea>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* EMAIL LIST VIEW */}
        {view === "list" && (
          <>
            <div className="flex items-center justify-between p-3 border-b border-border gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground capitalize">{currentFolder === "INBOX" ? "Inbox" : currentFolder}</h3>
                <Badge variant="secondary" className="text-xs">{total}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="flex items-center gap-1 flex-1 relative">
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search emails..." className="h-8 text-sm pr-8" onKeyDown={e => e.key === "Enter" && handleSearch()} />
                  {isSearching && <button onClick={clearSearch} className="absolute right-2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadEmails()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
                {!isSearching && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{page}/{totalPages || 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Inbox className="h-10 w-10 mb-2" /><p>{isSearching ? "No results found" : "No emails in this folder"}</p>
                </div>
              ) : (
                <div>
                  {emails.map(email => {
                    const isSeen = email.flags.includes("\\Seen");
                    const isStarred = email.flags.includes("\\Flagged");
                    return (
                      <button key={email.uid} onClick={() => openEmail(email.uid)} disabled={loadingEmail}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${!isSeen ? "bg-primary/5" : ""}`}>
                        <button onClick={e => toggleStar(email.uid, e)} className="flex-shrink-0">
                          <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400"}`} />
                        </button>
                        {isSeen ? <MailOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <Mail className="h-4 w-4 text-primary flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${!isSeen ? "font-semibold" : ""} text-foreground`}>{formatAddr(email.envelope.from)}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(email.envelope.date)}</span>
                          </div>
                          <p className={`text-sm truncate ${!isSeen ? "font-medium text-foreground" : "text-muted-foreground"}`}>{email.envelope.subject}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {/* READ VIEW */}
        {view === "read" && selectedEmail && (
          <>
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Button variant="ghost" size="sm" onClick={() => { setView("list"); setSelectedEmail(null); }}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={handleReply}><Reply className="h-4 w-4 mr-1" /> Reply</Button>
              <Button variant="ghost" size="sm" onClick={handleForward}><Forward className="h-4 w-4 mr-1" /> Forward</Button>
              <Button variant="ghost" size="sm" onClick={() => deleteEmail(selectedEmail.uid)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 sm:p-6 max-w-5xl mx-auto w-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">{selectedEmail.envelope.subject}</h2>
                <div className="space-y-1 mb-6 text-sm">
                  <div className="flex gap-2"><span className="text-muted-foreground w-12">From:</span><span className="text-foreground">{formatFullAddr(selectedEmail.envelope.from)}</span></div>
                  <div className="flex gap-2"><span className="text-muted-foreground w-12">To:</span><span className="text-foreground">{formatFullAddr(selectedEmail.envelope.to)}</span></div>
                  {selectedEmail.envelope.cc.length > 0 && <div className="flex gap-2"><span className="text-muted-foreground w-12">CC:</span><span className="text-foreground">{formatFullAddr(selectedEmail.envelope.cc)}</span></div>}
                  <div className="flex gap-2"><span className="text-muted-foreground w-12">Date:</span><span className="text-foreground">{formatFullDate(selectedEmail.envelope.date)}</span></div>
                </div>
                <Separator className="mb-4" />
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.dataUrl}
                        download={att.filename}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{att.filename}</span>
                        <span className="text-muted-foreground">
                          {att.size > 1024 * 1024
                            ? `${(att.size / 1024 / 1024).toFixed(1)} MB`
                            : `${Math.max(1, Math.round(att.size / 1024))} KB`}
                        </span>
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                )}
                {selectedEmail.htmlBody ? (
                  <EmailHtmlViewer html={selectedEmail.htmlBody} />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{selectedEmail.body || "(No content)"}</pre>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* COMPOSE VIEW */}
        {view === "compose" && (
          <>
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Button variant="ghost" size="sm" onClick={() => { setView("list"); resetCompose(); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <span className="text-sm font-medium text-foreground">New Message</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setShowSchedule(!showSchedule)} className="gap-1.5">
                <Clock className="h-4 w-4" /> Schedule
              </Button>
              <Button size="sm" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Send
              </Button>
            </div>

            {/* Schedule picker */}
            {showSchedule && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Schedule for:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full sm:w-[160px] justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduleDate ? format(scheduleDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full sm:w-[130px] h-8" />
                <Button size="sm" variant="default" onClick={handleScheduleSend} disabled={!scheduleDate || !scheduleTime}>
                  <Clock className="h-4 w-4 mr-1" /> Schedule Send
                </Button>
              </div>
            )}

            <div className="flex-1 flex flex-col p-4 gap-3 overflow-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">To:</span>
                <Input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@example.com" className="flex-1" />
                <Popover open={showGroupPicker} onOpenChange={setShowGroupPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" title="Add from group">
                      <Users className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">Add group recipients</p>
                    {contactGroups.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-3">No groups created yet</p>
                    ) : (
                      <div className="space-y-0.5">
                        {contactGroups.map(g => (
                          <button key={g.id} onClick={() => addGroupToRecipients(g.id)}
                            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {g.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">CC:</span>
                <Input value={composeCc} onChange={e => setComposeCc(e.target.value)} placeholder="cc@example.com" className="flex-1" />
                {!showBcc && <Button variant="link" size="sm" onClick={() => setShowBcc(true)} className="text-xs">BCC</Button>}
              </div>
              {showBcc && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16">BCC:</span>
                  <Input value={composeBcc} onChange={e => setComposeBcc(e.target.value)} placeholder="bcc@example.com" className="flex-1" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">Subject:</span>
                <Input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject" className="flex-1" />
              </div>
              <Textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." className="flex-1 min-h-[250px] resize-none" />
              {signature && (
                <div className="text-xs text-muted-foreground border-t border-border pt-2"><span className="font-medium">Signature attached</span></div>
              )}
            </div>
          </>
        )}

        {/* SCHEDULED VIEW */}
        {view === "scheduled" && (
          <>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-foreground">Scheduled Emails</h3>
                <Badge variant="secondary" className="text-xs">{scheduledEmails.length}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadScheduledEmails}><RefreshCw className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              {scheduledEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Clock className="h-10 w-10 mb-2" /><p>No scheduled emails</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {scheduledEmails.map(se => (
                    <div key={se.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{se.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">To: {se.to_addresses.join(", ")}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={se.status === "pending" ? "default" : se.status === "sent" ? "secondary" : "destructive"} className="text-xs">
                            {se.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {format(new Date(se.scheduled_at), "MMM d, yyyy 'at' p")}
                          </span>
                        </div>
                      </div>
                      {se.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelScheduled(se.id)}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
};
