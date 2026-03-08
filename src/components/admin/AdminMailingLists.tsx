import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Send, Users, Loader2, Upload, Download, Pencil } from "lucide-react";

interface MailingList {
  id: string; name: string; description: string | null; created_at: string;
}
interface Subscriber {
  id: string; email: string; name: string | null; subscribed: boolean;
  subscribed_at: string; unsubscribed_at: string | null;
}

export const AdminMailingLists = () => {
  const { toast } = useToast();
  const [lists, setLists] = useState<MailingList[]>([]);
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [sending, setSending] = useState(false);

  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [subEmail, setSubEmail] = useState("");
  const [subName, setSubName] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [importText, setImportText] = useState("");

  const loadLists = async () => {
    const { data } = await supabase.from("mailing_lists").select("*").order("name");
    setLists(data || []);
  };

  const loadSubscribers = async (listId: string) => {
    setLoading(true);
    const { data } = await supabase.from("mailing_list_subscribers").select("*").eq("list_id", listId).order("subscribed_at", { ascending: false });
    setSubscribers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadLists(); }, []);

  const createList = async () => {
    if (!listName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("mailing_lists").insert({
      name: listName.trim(), description: listDesc.trim() || null, created_by: user.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "List created" }); setShowAddList(false); setListName(""); setListDesc(""); loadLists(); }
  };

  const deleteList = async (id: string) => {
    await supabase.from("mailing_lists").delete().eq("id", id);
    toast({ title: "List deleted" });
    if (selectedList?.id === id) { setSelectedList(null); setSubscribers([]); }
    loadLists();
  };

  const addSubscriber = async () => {
    if (!selectedList || !subEmail.trim()) return;
    const { error } = await supabase.from("mailing_list_subscribers").insert({
      list_id: selectedList.id, email: subEmail.trim(), name: subName.trim() || null,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Already subscribed", variant: "destructive" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subscriber added" });
      setSubEmail(""); setSubName(""); setShowAddSub(false);
      loadSubscribers(selectedList.id);
    }
  };

  const toggleSubscribed = async (sub: Subscriber) => {
    const { error } = await supabase.from("mailing_list_subscribers").update({
      subscribed: !sub.subscribed,
      unsubscribed_at: sub.subscribed ? new Date().toISOString() : null,
    }).eq("id", sub.id);
    if (!error && selectedList) loadSubscribers(selectedList.id);
  };

  const removeSub = async (id: string) => {
    await supabase.from("mailing_list_subscribers").delete().eq("id", id);
    if (selectedList) loadSubscribers(selectedList.id);
    toast({ title: "Subscriber removed" });
  };

  const bulkImport = async () => {
    if (!selectedList || !importText.trim()) return;
    const lines = importText.trim().split("\n").filter(l => l.trim());
    const subs = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { list_id: selectedList.id, email: parts[0], name: parts[1] || null };
    }).filter(s => s.email.includes("@"));

    if (subs.length === 0) { toast({ title: "No valid emails found", variant: "destructive" }); return; }

    const { error } = await supabase.from("mailing_list_subscribers").upsert(subs, { onConflict: "list_id,email" });
    if (error) toast({ title: "Import error", description: error.message, variant: "destructive" });
    else { toast({ title: `${subs.length} subscribers imported` }); setShowBulkImport(false); setImportText(""); loadSubscribers(selectedList.id); }
  };

  const sendBulkEmail = async () => {
    if (!selectedList || !bulkSubject.trim() || !bulkBody.trim()) return;
    const active = subscribers.filter(s => s.subscribed);
    if (active.length === 0) { toast({ title: "No active subscribers", variant: "destructive" }); return; }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          subject: bulkSubject,
          body: bulkBody.replace(/\n/g, "<br>"),
          bulk: { recipients: active.map(s => ({ email: s.email, name: s.name })) },
        }),
      });
      const result = await res.json();
      if (result.success) {
        const sent = result.results.filter((r: any) => r.success).length;
        const failed = result.results.filter((r: any) => !r.success).length;
        toast({ title: `Sent to ${sent} subscribers${failed > 0 ? `, ${failed} failed` : ""}` });
        setShowBulkSend(false); setBulkSubject(""); setBulkBody("");
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Send error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const exportSubscribers = () => {
    const csv = ["Name,Email,Subscribed", ...subscribers.map(s => `${s.name || ""},${s.email},${s.subscribed}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selectedList?.name || "subscribers"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">Mailing Lists</h3>
        <Button size="sm" onClick={() => setShowAddList(true)}>
          <Plus className="h-4 w-4 mr-1" /> New List
        </Button>
      </div>

      {/* Create list dialog */}
      <Dialog open={showAddList} onOpenChange={setShowAddList}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Mailing List</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={listName} onChange={e => setListName(e.target.value)} placeholder="List name *" />
            <Textarea value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Description" rows={2} />
            <Button onClick={createList} className="w-full">Create List</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-4 gap-6">
        {/* List sidebar */}
        <div className="space-y-2">
          {lists.map(list => (
            <Card key={list.id} className={`cursor-pointer transition-colors ${selectedList?.id === list.id ? "border-primary" : ""}`}
              onClick={() => { setSelectedList(list); loadSubscribers(list.id); }}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{list.name}</p>
                  {list.description && <p className="text-xs text-muted-foreground truncate">{list.description}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive flex-shrink-0" onClick={e => { e.stopPropagation(); deleteList(list.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {lists.length === 0 && <p className="text-sm text-muted-foreground p-4">No lists yet</p>}
        </div>

        {/* Subscriber panel */}
        <div className="col-span-3">
          {selectedList ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {selectedList.name}
                    <Badge variant="secondary">{subscribers.filter(s => s.subscribed).length} active</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowBulkImport(true)}>
                      <Upload className="h-4 w-4 mr-1" /> Import
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportSubscribers}>
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddSub(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button size="sm" onClick={() => setShowBulkSend(true)}>
                      <Send className="h-4 w-4 mr-1" /> Send Campaign
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : subscribers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No subscribers yet</TableCell></TableRow>
                    ) : subscribers.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.name || "—"}</TableCell>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={sub.subscribed} onCheckedChange={() => toggleSubscribed(sub)} />
                            <Badge variant={sub.subscribed ? "default" : "secondary"}>
                              {sub.subscribed ? "Active" : "Unsubscribed"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(sub.subscribed_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSub(sub.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Select a list to manage subscribers</div>
          )}
        </div>
      </div>

      {/* Add subscriber dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Subscriber</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={subEmail} onChange={e => setSubEmail(e.target.value)} placeholder="Email *" />
            <Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Name" />
            <Button onClick={addSubscriber} className="w-full">Add Subscriber</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Import Subscribers</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Enter one subscriber per line: email,name</p>
            <Textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="john@example.com,John Doe&#10;jane@example.com,Jane Smith" rows={8} />
            <Button onClick={bulkImport} className="w-full">Import</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk send dialog */}
      <Dialog open={showBulkSend} onOpenChange={setShowBulkSend}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Send Campaign to {selectedList?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sending to {subscribers.filter(s => s.subscribed).length} active subscribers. Use {"{{name}}"} for personalization.
            </p>
            <Input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} placeholder="Subject *" />
            <Textarea value={bulkBody} onChange={e => setBulkBody(e.target.value)} placeholder="Email body..." rows={10} />
            <Button onClick={sendBulkEmail} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
