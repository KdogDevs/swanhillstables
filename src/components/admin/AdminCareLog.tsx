import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Plus, Loader2, Upload, Image, Trash2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SignedLink } from "@/components/SignedStorageMedia";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  is_boarder: boolean;
}

interface CareLog {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  incident_type: string;
  photo_url: string | null;
  logged_by: string;
  created_at: string;
}

const INCIDENT_TYPES = [
  { value: "injury", label: "Injury/Cut" },
  { value: "lost_shoe", label: "Lost Shoe" },
  { value: "illness", label: "Illness" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "farrier_visit", label: "Farrier Visit" },
  { value: "medication", label: "Medication Given" },
  { value: "general", label: "General Note" },
];

export const AdminCareLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [boarders, setBoarders] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedBoarder, setSelectedBoarder] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("general");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch boarders
      const { data: boarderData, error: boarderError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, is_boarder")
        .eq("is_boarder", true)
        .order("full_name");

      if (boarderError) throw boarderError;
      setBoarders(boarderData || []);

      // Fetch care logs
      const { data: logData, error: logError } = await supabase
        .from("horse_care_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logError) throw logError;
      setLogs(logData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load care logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const resetForm = () => {
    setSelectedBoarder("");
    setTitle("");
    setDescription("");
    setIncidentType("general");
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedBoarder || !title) return;

    setIsSubmitting(true);
    try {
      let photoUrl = null;

      // Upload photo if present
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${selectedBoarder}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("care-log-photos")
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        photoUrl = fileName;
      }

      // Create care log entry
      const { error } = await supabase
        .from("horse_care_logs")
        .insert({
          user_id: selectedBoarder,
          title,
          description,
          incident_type: incidentType,
          photo_url: photoUrl,
          logged_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Log Entry Added",
        description: "The care log entry has been created successfully",
      });

      resetForm();
      setShowAddDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error creating log:", error);
      toast({
        title: "Error",
        description: "Failed to create care log entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (logId: string, photoPath: string | null) => {
    try {
      // Delete photo from storage if exists
      if (photoPath) {
        await supabase.storage.from("care-log-photos").remove([photoPath]);
      }

      const { error } = await supabase
        .from("horse_care_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      toast({
        title: "Entry Deleted",
        description: "The care log entry has been removed",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast({
        title: "Error",
        description: "Failed to delete care log entry",
        variant: "destructive",
      });
    }
  };

  const getBoarderName = (userId: string) => {
    const boarder = boarders.find(b => b.user_id === userId);
    return boarder?.full_name || "Unknown";
  };

  const getIncidentLabel = (type: string) => {
    return INCIDENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getIncidentBadgeVariant = (type: string) => {
    switch (type) {
      case "injury":
        return "destructive";
      case "illness":
        return "destructive";
      case "lost_shoe":
        return "secondary";
      case "vet_visit":
      case "farrier_visit":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Horse Care Log
            </CardTitle>
            <CardDescription>
              Track incidents, treatments, and notes for boarders' horses
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Care Log Entry</DialogTitle>
                <DialogDescription>
                  Record an incident or note for a boarder's horse
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="boarder">Boarder</Label>
                  <Select value={selectedBoarder} onValueChange={setSelectedBoarder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a boarder" />
                    </SelectTrigger>
                    <SelectContent>
                      {boarders.map((boarder) => (
                        <SelectItem key={boarder.user_id} value={boarder.user_id}>
                          {boarder.full_name || "Unnamed"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Details</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about the incident..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo (optional)</Label>
                  {/* Hidden file inputs */}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="camera-capture"
                  />
                  
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging 
                          ? "border-primary bg-primary/5" 
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop an image here
                        </p>
                        <div className="flex gap-2 mt-2">
                          <label
                            htmlFor="photo-upload"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-muted transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            Browse
                          </label>
                          <label
                            htmlFor="camera-capture"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-muted transition-colors md:hidden"
                          >
                            <Camera className="h-4 w-4" />
                            Camera
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowAddDialog(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !selectedBoarder || !title}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No care log entries yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Boarder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getBoarderName(log.user_id)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getIncidentBadgeVariant(log.incident_type) as any}>
                      {getIncidentLabel(log.incident_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.title}</TableCell>
                  <TableCell>
                    {log.photo_url ? (
                      <SignedLink
                        storagePath={log.photo_url}
                        bucket="care-log-photos"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Image className="h-4 w-4" />
                        View
                      </SignedLink>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id, log.photo_url)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};