import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Loader2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SignedImage } from "@/components/SignedStorageMedia";

interface CareLog {
  id: string;
  title: string;
  description: string | null;
  incident_type: string;
  photo_url: string | null;
  created_at: string;
}

const INCIDENT_TYPES: Record<string, string> = {
  injury: "Injury/Cut",
  lost_shoe: "Lost Shoe",
  illness: "Illness",
  vet_visit: "Vet Visit",
  farrier_visit: "Farrier Visit",
  medication: "Medication Given",
  general: "General Note",
};

export const BoarderCareLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<CareLog | null>(null);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("horse_care_logs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching care logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIncidentBadgeVariant = (type: string) => {
    switch (type) {
      case "injury":
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Horse Care Log
          </CardTitle>
          <CardDescription>
            View incidents, treatments, and notes from the barn staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No care log entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getIncidentBadgeVariant(log.incident_type) as any}>
                        {INCIDENT_TYPES[log.incident_type] || log.incident_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground">{log.title}</h4>
                    {log.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {log.description}
                      </p>
                    )}
                  </div>
                  {log.photo_url && (
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                        <SignedImage
                          storagePath={log.photo_url}
                          bucket="care-log-photos"
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLog?.title}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getIncidentBadgeVariant(selectedLog.incident_type) as any}>
                  {INCIDENT_TYPES[selectedLog.incident_type] || selectedLog.incident_type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedLog.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>

              {selectedLog.description && (
                <p className="text-foreground">{selectedLog.description}</p>
              )}

              {selectedLog.photo_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedLog.photo_url}
                    alt="Care log photo"
                    className="w-full max-h-96 object-contain bg-muted"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};