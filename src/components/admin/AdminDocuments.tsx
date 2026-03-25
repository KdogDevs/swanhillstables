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
import { FileText, Plus, Loader2, CheckCircle, Clock, AlertTriangle, Send, Eye, ArrowLeft, Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";

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
  signature_data: string | null;
  pdf_url: string | null;
}

interface ClientSummary {
  user_id: string;
  full_name: string | null;
  email: string | null;
  documentCount: number;
  signedCount: number;
  pendingCount: number;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
}

const DOCUMENT_TYPES = [
  { value: "liability_waiver", label: "Liability Waiver" },
  { value: "barn_rules", label: "Barn Rules" },
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
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedClientView, setSelectedClientView] = useState<string | null>(null);
  const [viewSignature, setViewSignature] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);

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
      const { data: docs, error: docsErr } = await supabase
        .from("client_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsErr) throw docsErr;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const allDocs = (docs || []) as ClientDocument[];
      setDocuments(allDocs);

      // Build client summaries
      const clientMap = new Map<string, ClientSummary>();
      for (const doc of allDocs) {
        if (!clientMap.has(doc.user_id)) {
          clientMap.set(doc.user_id, {
            user_id: doc.user_id,
            full_name: profileMap.get(doc.user_id) || null,
            email: doc.recipient_email,
            documentCount: 0,
            signedCount: 0,
            pendingCount: 0,
          });
        }
        const summary = clientMap.get(doc.user_id)!;
        summary.documentCount++;
        if (doc.status === "signed") summary.signedCount++;
        if (doc.status === "pending" || doc.status === "sent") summary.pendingCount++;
        if (!summary.email && doc.recipient_email) summary.email = doc.recipient_email;
      }
      setClientSummaries(Array.from(clientMap.values()).sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      ));
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

  const selectedClientDocs = documents.filter(d => d.user_id === selectedClientView);
  const selectedClientInfo = clientSummaries.find(c => c.user_id === selectedClientView);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Client detail view
  if (selectedClientView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClientView(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
          <div>
            <h3 className="font-serif text-xl font-semibold">{selectedClientInfo?.full_name || "Unknown Client"}</h3>
            {selectedClientInfo?.email && (
              <p className="text-sm text-muted-foreground">{selectedClientInfo.email}</p>
            )}
          </div>
        </div>

        {/* Document Preview Dialog */}
        <DocumentPreviewDialog
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          documentType={previewDoc?.document_type || ""}
          signerName={selectedClientInfo?.full_name || null}
          signatureData={previewDoc?.signature_data || null}
          signedAt={previewDoc?.signed_at || null}
          pdfUrl={previewDoc?.pdf_url || null}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({selectedClientDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClientDocs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No documents found for this client</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Document</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Signed</TableHead>
                     <TableHead>Preview</TableHead>
                     <TableHead>PDF</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {selectedClientDocs.map(doc => (
                     <TableRow key={doc.id}>
                       <TableCell>
                         <span className="font-medium">{formatDocumentType(doc.document_type)}</span>
                         {doc.notes && <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>}
                       </TableCell>
                       <TableCell>{getStatusBadge(doc.status)}</TableCell>
                       <TableCell className="text-sm">
                         {doc.signed_at ? format(new Date(doc.signed_at), "MMM d, yyyy") : "—"}
                       </TableCell>
                       <TableCell>
                         {(doc.document_type === "liability_waiver" || doc.document_type === "barn_rules") ? (
                           <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)}>
                             <Eye className="h-3.5 w-3.5 mr-1" /> View
                           </Button>
                         ) : doc.signature_data ? (
                           <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)}>
                             <Eye className="h-3.5 w-3.5 mr-1" /> View
                           </Button>
                         ) : "—"}
                      </TableCell>
                       <TableCell>
                         {doc.pdf_url ? (
                           <PdfDownloadButton storagePath={doc.pdf_url} />
                         ) : "—"}
                       </TableCell>
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
  }

  // Main clients list view
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clientSummaries.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{documents.filter(d => d.status === "pending" || d.status === "sent").length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paperwork & Documents
              </CardTitle>
              <CardDescription>Click a client to view their documents</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          {clientSummaries.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No documents found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientSummaries.map(client => (
                  <TableRow
                    key={client.user_id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelectedClientView(client.user_id)}
                  >
                    <TableCell className="font-medium">{client.full_name || "Unknown"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.email || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{client.documentCount}</Badge></TableCell>
                    <TableCell>
                      {client.signedCount > 0 ? (
                        <Badge className="bg-green-500">{client.signedCount}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {client.pendingCount > 0 ? (
                        <Badge variant="outline">{client.pendingCount}</Badge>
                      ) : "—"}
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
