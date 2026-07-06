import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, Loader2, Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SignedLink } from "@/components/SignedStorageMedia";

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

const badgeVariant = (t: string): any =>
  t === "injury" || t === "illness" ? "destructive"
  : t === "lost_shoe" ? "secondary"
  : t === "vet_visit" || t === "farrier_visit" ? "default"
  : "outline";

export const ClientCareLogSection = ({ userId }: { userId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("general");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("horse_care_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: "Failed to load care log", variant: "destructive" });
    else setLogs(data || []);
    setLoading(false);
  }, [userId, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast({ title: "Please upload an image", variant: "destructive" });
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setTitle(""); setDescription(""); setIncidentType("general");
    setPhotoFile(null); setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("care-log-photos").upload(fileName, photoFile);
        if (upErr) throw upErr;
        photoUrl = fileName;
      }
      const { error } = await supabase.from("horse_care_logs").insert({
        user_id: userId, title, description, incident_type: incidentType,
        photo_url: photoUrl, logged_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Entry added" });
      reset();
      setShowForm(false);
      fetchLogs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, photoPath: string | null) => {
    if (photoPath) await supabase.storage.from("care-log-photos").remove([photoPath]);
    const { error } = await supabase.from("horse_care_logs").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLogs(prev => prev.filter(l => l.id !== id));
    toast({ title: "Entry deleted" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Horse Care Log
          <span className="text-xs text-muted-foreground font-normal">({logs.length})</span>
        </h4>
        <Button size="sm" variant={showForm ? "ghost" : "outline"} onClick={() => { setShowForm(v => !v); if (showForm) reset(); }}>
          {showForm ? <><X className="h-3.5 w-3.5 mr-1" />Cancel</> : <><Plus className="h-3.5 w-3.5 mr-1" />Add Entry</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border p-3 space-y-3 mb-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Details</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Photo (optional)</Label>
            <Input type="file" accept="image/*" id="care-photo" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="" className="max-h-24 rounded-md" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label htmlFor="care-photo" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md cursor-pointer hover:bg-muted">
                <Upload className="h-3.5 w-3.5" /> Add photo
              </label>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !title}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}Save Entry
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No care log entries yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={badgeVariant(log.incident_type)}>
                      {INCIDENT_TYPES.find(t => t.value === log.incident_type)?.label || log.incident_type}
                    </Badge>
                    <span className="font-medium">{log.title}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "MMM d, yyyy")}</span>
                  </div>
                  {log.description && <p className="text-muted-foreground mt-1">{log.description}</p>}
                  {log.photo_url && (
                    <SignedLink storagePath={log.photo_url} bucket="care-log-photos"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1">
                      <ImageIcon className="h-3 w-3" /> View photo
                    </SignedLink>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id, log.photo_url)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};