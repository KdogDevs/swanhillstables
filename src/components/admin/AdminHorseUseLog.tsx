import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Bookmark, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface HorseUseLog {
  id: string;
  horse_name: string;
  rider_name: string;
  rider_id: string | null;
  ride_date: string;
  duration_minutes: number | null;
  activity_type: string;
  notes: string | null;
  logged_by: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

const activityTypes = [
  { value: "lesson", label: "Lesson" },
  { value: "trail_ride", label: "Trail Ride" },
  { value: "training", label: "Training" },
  { value: "exercise", label: "Exercise" },
  { value: "show", label: "Show/Competition" },
  { value: "other", label: "Other" },
];

export const AdminHorseUseLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HorseUseLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [horseName, setHorseName] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderId, setRiderId] = useState<string | null>(null);
  const [rideDate, setRideDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [activityType, setActivityType] = useState("lesson");
  const [notes, setNotes] = useState("");

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("horse_use_logs")
      .select("*")
      .order("ride_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load horse use logs",
        variant: "destructive",
      });
    } else {
      setLogs(data || []);
    }
    setIsLoading(false);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (!error && data) {
      setProfiles(data);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchProfiles();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    if (profileId === "custom") {
      setRiderId(null);
      setRiderName("");
    } else {
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        setRiderId(profile.id);
        setRiderName(profile.full_name || "");
      }
    }
  };

  const resetForm = () => {
    setHorseName("");
    setRiderName("");
    setRiderId(null);
    setRideDate(format(new Date(), "yyyy-MM-dd"));
    setDurationMinutes("");
    setActivityType("lesson");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!horseName.trim() || !riderName.trim() || !rideDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in horse name, rider name, and date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("horse_use_logs").insert({
      horse_name: horseName.trim(),
      rider_name: riderName.trim(),
      rider_id: riderId,
      ride_date: rideDate,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
      activity_type: activityType,
      notes: notes.trim() || null,
      logged_by: user?.id,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create log entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Horse use log entry created",
      });
      resetForm();
      setIsDialogOpen(false);
      fetchLogs();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("horse_use_logs").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete log entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Log entry removed",
      });
      fetchLogs();
    }
  };

  const getActivityLabel = (value: string) => {
    return activityTypes.find((t) => t.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Horse Use Log
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Horse Use</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="horseName">Horse Name *</Label>
                <Input
                  id="horseName"
                  value={horseName}
                  onChange={(e) => setHorseName(e.target.value)}
                  placeholder="Enter horse name"
                />
              </div>

              <div className="space-y-2">
                <Label>Rider</Label>
                <Select onValueChange={handleProfileSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rider or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Name</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!riderId && (
                <div className="space-y-2">
                  <Label htmlFor="riderName">Rider Name *</Label>
                  <Input
                    id="riderName"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="Enter rider name"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rideDate">Date *</Label>
                  <Input
                    id="rideDate"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the ride..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No horse use logs yet. Add an entry to get started.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[580px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date
                  </TableHead>
                  <TableHead>
                    <Bookmark className="h-4 w-4 inline mr-1" />
                    Horse
                  </TableHead>
                  <TableHead>
                    <User className="h-4 w-4 inline mr-1" />
                    Rider
                  </TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Duration
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.ride_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{log.horse_name}</TableCell>
                    <TableCell>{log.rider_name}</TableCell>
                    <TableCell>{getActivityLabel(log.activity_type)}</TableCell>
                    <TableCell>
                      {log.duration_minutes ? `${log.duration_minutes} min` : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(log.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
