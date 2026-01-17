import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Loader2, Send, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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

  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("client_documents")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
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
      toast({
        title: "Missing Information",
        description: "Please select a client and document type",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("client_documents").insert({
        user_id: selectedClient,
        document_type: documentType,
        status: "pending",
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Document Created",
        description: "The document has been added to the client's file",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error("Error creating document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (docId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === "sent") {
        updateData.sent_at = new Date().toISOString();
      } else if (newStatus === "signed") {
        updateData.signed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("client_documents")
        .update(updateData)
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Document marked as ${newStatus}`,
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedClient("");
    setDocumentType("");
    setNotes("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-500">Signed</Badge>;
      case "sent":
        return <Badge variant="secondary">Sent</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredDocuments = statusFilter === "all" 
    ? documents 
    : documents.filter(doc => doc.status === statusFilter);

  // Calculate stats
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
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
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
              <Send className="h-8 w-8 text-blue-500 opacity-50" />
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
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
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
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
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
              <CardDescription>
                Track waivers, agreements, and required forms
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Document</DialogTitle>
                    <DialogDescription>
                      Create a new document requirement for a client
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.user_id}>
                              {client.full_name || "Unnamed Client"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        placeholder="Any additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDocument} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Document"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>{formatDocumentType(doc.document_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        {getStatusBadge(doc.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={doc.status}
                        onValueChange={(value) => handleUpdateStatus(doc.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
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