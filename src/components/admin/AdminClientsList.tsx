import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Search, Loader2, Mail, Phone, MapPin, AlertCircle, FileText, Eye, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  id: string;
  document_type: string;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
}

export const AdminClientsList = () => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [filteredClients, setFilteredClients] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = clients.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone?.includes(searchQuery)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleViewClient = async (client: Profile) => {
    setSelectedClient(client);
    await fetchClientDocuments(client.user_id);
    setShowClientDialog(true);
  };

  const handleToggleBoarder = async (client: Profile, isBoarder: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_boarder: isBoarder })
        .eq("id", client.id);

      if (error) throw error;

      // Update local state
      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, is_boarder: isBoarder } : c
      ));
      
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...selectedClient, is_boarder: isBoarder });
      }

      toast({
        title: "Status Updated",
        description: `${client.full_name || "Client"} is now ${isBoarder ? "a boarder" : "lesson only"}`,
      });
    } catch (error) {
      console.error("Error updating boarder status:", error);
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDocumentStatusBadge = (status: string) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients
            </CardTitle>
            <CardDescription>
              Manage client profiles and information
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(client.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {client.full_name || "No name"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {client.phone || "No phone"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {client.is_boarder ? (
                      <Badge>Boarder</Badge>
                    ) : (
                      <Badge variant="outline">Lesson Only</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(client.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewClient(client)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>

      {/* Client Detail Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>
              View and manage client information
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedClient.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(selectedClient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedClient.full_name || "No name set"}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {selectedClient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedClient.phone}
                      </span>
                    )}
                    {selectedClient.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedClient.address}
                      </span>
                    )}
                  </div>
                  {/* Client Status Toggle */}
                  <div className="mt-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="boarder-toggle" className="font-medium">Boarder Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle to grant access to horse care preferences
                        </p>
                      </div>
                      <Switch
                        id="boarder-toggle"
                        checked={selectedClient.is_boarder}
                        onCheckedChange={(checked) => handleToggleBoarder(selectedClient, checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedClient.emergency_contact_name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedClient.emergency_contact_phone || "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Horse Care Preferences - Only for Boarders */}
              {selectedClient.is_boarder && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Horse Care Preferences
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Preferred Vet</p>
                        <p className="font-medium">
                          {selectedClient.preferred_vet_name || "Not set"}
                          {selectedClient.preferred_vet_phone && (
                            <span className="text-muted-foreground ml-1">
                              ({selectedClient.preferred_vet_phone})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preferred Farrier</p>
                        <p className="font-medium">
                          {selectedClient.preferred_farrier_name || "Not set"}
                          {selectedClient.preferred_farrier_phone && (
                            <span className="text-muted-foreground ml-1">
                              ({selectedClient.preferred_farrier_phone})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Documents */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  Documents
                </h4>
                {clientDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents on file
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clientDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <span className="text-sm font-medium">
                          {formatDocumentType(doc.document_type)}
                        </span>
                        {getDocumentStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};