import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Loader2, CheckCircle, Clock, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientDocument {
  id: string;
  user_id: string;
  document_type: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  recipient_email: string | null;
  profiles?: {
    full_name: string | null;
  };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
}

const DOCUMENT_TYPES = [
  { value: "liability_waiver", label: "Liability Waiver" },
  { value: "boarding_agreement", label: "Boarding Agreement" },
  { value: "lesson_registration", label: "Lesson Registration" },
  { value: "emergency_contact_form", label: "Emergency Contact Form" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
];

export const AdminDocuments = () => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [notes, setNotes] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("client_documents")
        .select(`*, profiles:user_id (full_name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data as unknown as ClientDocument[]) || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name")
        .order("full_name");
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleCreateDocument = async () => {
    if (!selectedClient || !documentType) {
      toast({ title: "Missing Information", description: "Please select a client and document type", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("client_documents").insert({
        user_id: selectedClient,
        document_type: documentType,
        status: "pending",
        notes: notes || null,
        recipient_email: recipientEmail || null,
      });

      if (error) throw error;
      toast({ title: "Document Created", description: "The document has been added to the client's file" });
      setShowCreateDialog(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create document", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (docId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "sent") updateData.sent_at = new Date().toISOString();
      else if (newStatus === "signed") updateData.signed_at = new Date().toISOString();

      const { error } = await supabase.from("client_documents").update(updateData).eq("id", docId);
      if (error) throw error;
      toast({ title: "Status Updated", description: `Document marked as ${newStatus}` });
      fetchDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedClient("");
    setDocumentType("");
    setNotes("");
    setRecipientEmail("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed": return <Badge className="bg-green-500">Signed</Badge>;
      case "sent": return <Badge variant="secondary">Sent</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      case "expired": return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDocumentType = (type: string) =>
    type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const filteredDocuments = statusFilter === "all" ? documents : documents.filter(doc => doc.status === statusFilter);

  const stats = {
    pending: documents.filter(d => d.status === "pending").length,
    sent: documents.filter(d => d.status === "sent").length,
    signed: documents.filter(d => d.status === "signed").length,
    expired: documents.filter(d => d.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("sent")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("signed")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signed</p>
                <p className="text-2xl font-bold">{stats.signed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-secondary/50" onClick={() => setStatusFilter("expired")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paperwork & Documents
              </CardTitle>
              <CardDescription>Track waivers, agreements, and required forms</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" /> Add Document</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Document Record</DialogTitle>
                    <DialogDescription>Add a new document to a client's file</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || "Unnamed"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Email (optional)</Label>
                      <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="client@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateDocument} disabled={isCreating}>
                      {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No documents found</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell>
                      {formatDocumentType(doc.document_type)}
                      {doc.notes && <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>}
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="text-sm">{doc.sent_at ? format(new Date(doc.sent_at), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell className="text-sm">{doc.signed_at ? format(new Date(doc.signed_at), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Select value={doc.status} onValueChange={(v) => handleUpdateStatus(doc.id, v)}>
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
