import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Loader2, Phone, MapPin, AlertCircle, FileText, Eye, Stethoscope, UserPlus, Send, Copy, Trash2, Save, Edit, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { ClientCareLogSection } from "./ClientCareLogSection";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  secondary_emergency_contact_name: string | null;
  secondary_emergency_contact_phone: string | null;
  preferred_vet_name: string | null;
  preferred_vet_phone: string | null;
  preferred_farrier_name: string | null;
  preferred_farrier_phone: string | null;
  is_boarder: boolean;
  created_at: string;
}

interface ClientDocument {
  id: string; user_id: string; document_type: string; status: string;
  sent_at: string | null; signed_at: string | null; signature_data: string | null;
  pdf_url: string | null; sign_token: string | null;
}

interface LessonSignup {
  id: string; user_id: string | null; full_name: string; email: string; phone: string | null;
  age: number | null; experience_level: string; horse_preference: string; own_horse_name: string | null;
  goals: string | null; preferred_days: string[] | null; preferred_time: string | null;
  emergency_contact_name: string; emergency_contact_phone: string; special_needs: string | null;
  status: string; admin_notes: string | null; created_at: string;
}

interface BoardingSignup {
  id: string; user_id: string | null; full_name: string; email: string; phone: string | null;
  address: string | null; horse_name: string; horse_breed: string | null; horse_age: string | null;
  horse_sex: string; horse_color: string | null; tier: string; feed_plan: string; monthly_amount: number;
  addon_hay: boolean; addon_bedding: boolean; addon_pasture_feeding: boolean; addon_blanketing: boolean;
  addon_grooming: boolean; addon_training: boolean; vet_name: string | null; vet_phone: string | null;
  emergency_authorize: boolean; emergency_limit: string | null; status: string; created_at: string;
}

const emptyEdit = (p: Profile) => ({
  full_name: p.full_name || "",
  phone: p.phone || "",
  address: p.address || "",
  emergency_contact_name: p.emergency_contact_name || "",
  emergency_contact_phone: p.emergency_contact_phone || "",
  secondary_emergency_contact_name: p.secondary_emergency_contact_name || "",
  secondary_emergency_contact_phone: p.secondary_emergency_contact_phone || "",
  preferred_vet_name: p.preferred_vet_name || "",
  preferred_vet_phone: p.preferred_vet_phone || "",
  preferred_farrier_name: p.preferred_farrier_name || "",
  preferred_farrier_phone: p.preferred_farrier_phone || "",
});

export const AdminClientsList = () => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [lessonSignups, setLessonSignups] = useState<LessonSignup[]>([]);
  const [boardingSignups, setBoardingSignups] = useState<BoardingSignup[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<ReturnType<typeof emptyEdit> | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);

  // Create client
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClient, setNewClient] = useState({ email: "", full_name: "", phone: "", address: "", send_invite: true });
  const [creating, setCreating] = useState(false);

  // Signature link
  const [signDocType, setSignDocType] = useState<string>("boarding_agreement");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
    else setClients(data || []);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const loadClientDetail = async (client: Profile) => {
    const [docs, lessons, boardings] = await Promise.all([
      supabase.from("client_documents").select("*").eq("user_id", client.user_id).order("created_at", { ascending: false }),
      supabase.from("lesson_signups").select("*").eq("user_id", client.user_id).order("created_at", { ascending: false }),
      supabase.from("boarding_signups").select("*").eq("user_id", client.user_id).order("created_at", { ascending: false }),
    ]);
    setClientDocuments((docs.data as ClientDocument[]) || []);
    setLessonSignups((lessons.data as LessonSignup[]) || []);
    setBoardingSignups((boardings.data as BoardingSignup[]) || []);
  };

  const handleViewClient = async (client: Profile) => {
    setSelectedClient(client);
    setEditData(emptyEdit(client));
    setEditing(false);
    setLastLink(null);
    await loadClientDetail(client);
    setShowClientDialog(true);
  };

  const handleToggleBoarder = async (client: Profile, isBoarder: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_boarder: isBoarder }).eq("id", client.id);
    if (error) return toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_boarder: isBoarder } : c));
    if (selectedClient?.id === client.id) setSelectedClient({ ...selectedClient, is_boarder: isBoarder });
    toast({ title: "Updated" });
  };

  const handleSaveEdit = async () => {
    if (!selectedClient || !editData) return;
    const payload = { ...editData };
    Object.keys(payload).forEach((k) => { if ((payload as any)[k] === "") (payload as any)[k] = null; });
    const { error } = await supabase.from("profiles").update(payload).eq("id", selectedClient.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    const updated = { ...selectedClient, ...payload };
    setSelectedClient(updated);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditing(false);
    toast({ title: "Profile saved" });
  };

  const handleCreateClient = async () => {
    if (!newClient.email || !newClient.full_name) {
      return toast({ title: "Missing info", description: "Email and name required", variant: "destructive" });
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-client", { body: newClient });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Client created", description: newClient.send_invite ? "Invite email sent" : "Admin-managed profile created" });
      setShowCreateDialog(false);
      setNewClient({ email: "", full_name: "", phone: "", address: "", send_invite: true });
      await fetchClients();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleGenerateLink = async () => {
    if (!selectedClient) return;
    setGeneratingLink(true);
    setLastLink(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-request-signature", {
        body: { user_id: selectedClient.user_id, document_type: signDocType, base_url: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setLastLink(data.signing_url);
      await loadClientDetail(selectedClient);
      toast({ title: "Link sent", description: `Email sent to ${selectedClient.full_name || "client"}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    } finally { setGeneratingLink(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    const { error } = await supabase.from("lesson_signups").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLessonSignups(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lesson signup deleted" });
  };

  const handleDeleteBoarding = async (id: string) => {
    const { error } = await supabase.from("boarding_signups").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setBoardingSignups(prev => prev.filter(b => b.id !== id));
    toast({ title: "Boarding application deleted" });
  };

  const handleDeleteDoc = async (id: string) => {
    const { error } = await supabase.from("client_documents").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setClientDocuments(prev => prev.filter(d => d.id !== id));
    toast({ title: "Document deleted" });
  };

  const getInitials = (name: string | null) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const fmtType = (t: string) => t.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  const statusBadge = (s: string) => s === "signed" ? <Badge className="bg-green-500">Signed</Badge> :
    s === "sent" ? <Badge variant="secondary">Sent</Badge> :
    s === "pending" ? <Badge variant="outline">Pending</Badge> :
    <Badge variant="destructive">{s}</Badge>;

  const filtered = searchQuery
    ? clients.filter(c => c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery))
    : clients;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Clients</CardTitle>
            <CardDescription>Manage client profiles and information</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Client Profile</DialogTitle>
                  <DialogDescription>Optionally send them an invite to claim the account.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2"><Label>Full Name *</Label><Input value={newClient.full_name} onChange={e => setNewClient({...newClient, full_name: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} /></div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="invite" className="cursor-pointer">Send account invite email</Label>
                      <p className="text-xs text-muted-foreground">Client picks their password</p>
                    </div>
                    <Switch id="invite" checked={newClient.send_invite} onCheckedChange={v => setNewClient({...newClient, send_invite: v})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateClient} disabled={creating}>
                    {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>No clients found</p></div>
        ) : (
          <div className="overflow-x-auto"><Table className="min-w-[560px]">
            <TableHeader><TableRow>
              <TableHead>Client</TableHead><TableHead>Contact</TableHead><TableHead>Type</TableHead>
              <TableHead>Since</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell><div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarImage src={client.avatar_url || undefined} /><AvatarFallback className="text-xs">{getInitials(client.full_name)}</AvatarFallback></Avatar>
                  <span className="font-medium">{client.full_name || "No name"}</span>
                </div></TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{client.phone || "—"}</span></TableCell>
                <TableCell>{client.is_boarder ? <Badge>Boarder</Badge> : <Badge variant="outline">Lesson</Badge>}</TableCell>
                <TableCell>{format(new Date(client.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}><Eye className="h-4 w-4 mr-1" />View</Button>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></div>
        )}
      </CardContent>

      {/* Client Detail */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <span>Client Details</span>
              {!editing ? (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); if (selectedClient) setEditData(emptyEdit(selectedClient)); }}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveEdit}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && editData && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={selectedClient.avatar_url || undefined} /><AvatarFallback className="text-xl">{getInitials(selectedClient.full_name)}</AvatarFallback></Avatar>
                <div className="flex-1 space-y-3">
                  {editing ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Full Name</Label><Input value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} /></div>
                      <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Address</Label><Input value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} /></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold">{selectedClient.full_name || "No name set"}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {selectedClient.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedClient.phone}</span>}
                        {selectedClient.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedClient.address}</span>}
                      </div>
                    </>
                  )}
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div>
                      <Label htmlFor="boarder-toggle" className="font-medium">Boarder Status</Label>
                      <p className="text-xs text-muted-foreground">Grants access to horse care preferences</p>
                    </div>
                    <Switch id="boarder-toggle" checked={selectedClient.is_boarder} onCheckedChange={(v) => handleToggleBoarder(selectedClient, v)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contacts */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3"><AlertCircle className="h-4 w-4 text-accent" />Emergency Contacts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {editing ? (
                    <>
                      <div className="space-y-1"><Label className="text-xs">Primary Name</Label><Input value={editData.emergency_contact_name} onChange={e => setEditData({...editData, emergency_contact_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Primary Phone</Label><Input value={editData.emergency_contact_phone} onChange={e => setEditData({...editData, emergency_contact_phone: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Secondary Name</Label><Input value={editData.secondary_emergency_contact_name} onChange={e => setEditData({...editData, secondary_emergency_contact_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Secondary Phone</Label><Input value={editData.secondary_emergency_contact_phone} onChange={e => setEditData({...editData, secondary_emergency_contact_phone: e.target.value})} /></div>
                    </>
                  ) : (
                    <>
                      <div><p className="text-muted-foreground">Primary</p><p className="font-medium">{selectedClient.emergency_contact_name || "—"} <span className="text-muted-foreground font-normal">{selectedClient.emergency_contact_phone || ""}</span></p></div>
                      <div><p className="text-muted-foreground">Secondary</p><p className="font-medium">{selectedClient.secondary_emergency_contact_name || "—"} <span className="text-muted-foreground font-normal">{selectedClient.secondary_emergency_contact_phone || ""}</span></p></div>
                    </>
                  )}
                </div>
              </div>

              {/* Horse Care */}
              <Separator />
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3"><Stethoscope className="h-4 w-4 text-primary" />Horse Care Preferences</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {editing ? (
                    <>
                      <div className="space-y-1"><Label className="text-xs">Vet Name</Label><Input value={editData.preferred_vet_name} onChange={e => setEditData({...editData, preferred_vet_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Vet Phone</Label><Input value={editData.preferred_vet_phone} onChange={e => setEditData({...editData, preferred_vet_phone: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Farrier Name</Label><Input value={editData.preferred_farrier_name} onChange={e => setEditData({...editData, preferred_farrier_name: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-xs">Farrier Phone</Label><Input value={editData.preferred_farrier_phone} onChange={e => setEditData({...editData, preferred_farrier_phone: e.target.value})} /></div>
                    </>
                  ) : (
                    <>
                      <div><p className="text-muted-foreground">Vet</p><p className="font-medium">{selectedClient.preferred_vet_name || "—"} <span className="text-muted-foreground font-normal">{selectedClient.preferred_vet_phone || ""}</span></p></div>
                      <div><p className="text-muted-foreground">Farrier</p><p className="font-medium">{selectedClient.preferred_farrier_name || "—"} <span className="text-muted-foreground font-normal">{selectedClient.preferred_farrier_phone || ""}</span></p></div>
                    </>
                  )}
                </div>
              </div>

              {/* Lesson signups */}
              {lessonSignups.length > 0 && (<><Separator />
                <div>
                  <h4 className="font-medium mb-3">Lesson Applications ({lessonSignups.length})</h4>
                  <div className="space-y-3">{lessonSignups.map(l => (
                    <div key={l.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{format(new Date(l.created_at), "MMM d, yyyy")} · {l.experience_level}</div>
                        <ConfirmDelete onConfirm={() => handleDeleteLesson(l.id)} label="lesson signup" />
                      </div>
                      <p><span className="text-muted-foreground">Horse:</span> {l.horse_preference}{l.own_horse_name ? ` (${l.own_horse_name})` : ""}</p>
                      {l.age && <p><span className="text-muted-foreground">Age:</span> {l.age}</p>}
                      <p><span className="text-muted-foreground">Days:</span> {(l.preferred_days || []).join(", ") || "—"} · <span className="text-muted-foreground">Time:</span> {l.preferred_time}</p>
                      {l.goals && <p><span className="text-muted-foreground">Goals:</span> {l.goals}</p>}
                      {l.special_needs && <p><span className="text-muted-foreground">Special needs:</span> {l.special_needs}</p>}
                      <p><span className="text-muted-foreground">Emergency:</span> {l.emergency_contact_name} {l.emergency_contact_phone}</p>
                    </div>
                  ))}</div>
                </div>
              </>)}

              {/* Boarding signups */}
              {boardingSignups.length > 0 && (<><Separator />
                <div>
                  <h4 className="font-medium mb-3">Boarding Applications ({boardingSignups.length})</h4>
                  <div className="space-y-3">{boardingSignups.map(b => (
                    <div key={b.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{format(new Date(b.created_at), "MMM d, yyyy")} · {b.tier} · ${b.monthly_amount}/mo</div>
                        <ConfirmDelete onConfirm={() => handleDeleteBoarding(b.id)} label="boarding application" />
                      </div>
                      <p><span className="text-muted-foreground">Horse:</span> {b.horse_name} ({b.horse_breed || "?"}, {b.horse_age || "?"}, {b.horse_sex}, {b.horse_color || "?"})</p>
                      <p><span className="text-muted-foreground">Feed:</span> {b.feed_plan}</p>
                      <p><span className="text-muted-foreground">Add-ons:</span> {[
                        b.addon_hay && "Hay", b.addon_bedding && "Bedding", b.addon_pasture_feeding && "Pasture feeding",
                        b.addon_blanketing && "Blanketing", b.addon_grooming && "Grooming", b.addon_training && "Training"
                      ].filter(Boolean).join(", ") || "None"}</p>
                      {b.vet_name && <p><span className="text-muted-foreground">Vet:</span> {b.vet_name} {b.vet_phone || ""}</p>}
                      <p><span className="text-muted-foreground">Emergency care:</span> {b.emergency_authorize ? `Authorized up to $${b.emergency_limit || "?"}` : "Not authorized"}</p>
                    </div>
                  ))}</div>
                </div>
              </>)}

              <Separator />

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Documents</h4>
                </div>
                {clientDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents on file</p>
                ) : (
                  <div className="space-y-2">
                    {clientDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{fmtType(doc.document_type)}</span>
                          {doc.signed_at && <span className="text-xs text-muted-foreground ml-2">{format(new Date(doc.signed_at), "MMM d")}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge(doc.status)}
                          {doc.pdf_url && <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)}><Eye className="h-3.5 w-3.5" /></Button>}
                          {doc.status !== "signed" && <ConfirmDelete onConfirm={() => handleDeleteDoc(doc.id)} label="document" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Horse Care Log — boarders only */}
              {selectedClient.is_boarder && (<><Separator />
                <ClientCareLogSection userId={selectedClient.user_id} />
              </>)}

              {/* Request signature link */}
              <Separator />
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" />Request a Signature</h4>
                <p className="text-xs text-muted-foreground">Generates a secure link and emails it to the client. Link expires in 30 days.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={signDocType} onValueChange={setSignDocType}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boarding_agreement">Boarding Agreement</SelectItem>
                      <SelectItem value="liability_waiver">Liability Waiver</SelectItem>
                      <SelectItem value="barn_rules">Barn Rules</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateLink} disabled={generatingLink}>
                    {generatingLink ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-1" />Send Link</>}
                  </Button>
                </div>
                {lastLink && (
                  <div className="flex items-center gap-2 p-2 rounded bg-muted text-xs">
                    <code className="flex-1 truncate">{lastLink}</code>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(lastLink); toast({ title: "Copied" }); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={() => setPreviewDoc(null)}
        documentType={previewDoc?.document_type || ""}
        signerName={selectedClient?.full_name || null}
        signatureData={previewDoc?.signature_data || null}
        signedAt={previewDoc?.signed_at || null}
        pdfUrl={previewDoc?.pdf_url || null}
      />
    </Card>
  );
};

const ConfirmDelete = ({ onConfirm, label }: { onConfirm: () => void; label: string }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);