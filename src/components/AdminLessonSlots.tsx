import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Clock, Trash2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LessonSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  is_recurring: boolean;
  recurring_day_of_week: number | null;
  created_by: string | null;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export const AdminLessonSlots = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [slotDate, setSlotDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<string>("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("lesson_slots")
        .select("*")
        .gte("slot_date", format(startOfMonth, "yyyy-MM-dd"))
        .lte("slot_date", format(endOfMonth, "yyyy-MM-dd"))
        .order("slot_date")
        .order("start_time");

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const slotData = {
        slot_date: format(slotDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        is_recurring: isRecurring,
        recurring_day_of_week: isRecurring && recurringDay ? parseInt(recurringDay) : null,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("lesson_slots")
        .insert(slotData);

      if (error) throw error;

      toast({
        title: "Slot Created",
        description: `Lesson slot added for ${format(slotDate, "MMMM d, yyyy")}`,
      });

      setShowCreateDialog(false);
      resetForm();
      fetchSlots();
    } catch (error: any) {
      console.error("Error creating slot:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create slot",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from("lesson_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      toast({
        title: "Slot Deleted",
        description: "The lesson slot has been removed",
      });

      fetchSlots();
    } catch (error: any) {
      console.error("Error deleting slot:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSlotDate(new Date());
    setStartTime("10:00");
    setEndTime("11:00");
    setNotes("");
    setIsRecurring(false);
    setRecurringDay("");
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => 
      format(parseISO(slot.slot_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const datesWithSlots = slots.map((slot) => parseISO(slot.slot_date));
  const selectedDateSlots = getSlotsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold">Manage Lesson Slots</h2>
          <p className="text-muted-foreground">Add and manage available lesson times</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Lesson Slot</DialogTitle>
              <DialogDescription>
                Add a new available time for lessons
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={slotDate}
                  onSelect={(date) => date && setSlotDate(date)}
                  className="rounded-md border pointer-events-auto"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Beginner-friendly, advanced riders only"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recurring Weekly</Label>
                  <p className="text-xs text-muted-foreground">
                    Repeat this slot every week
                  </p>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
              {isRecurring && (
                <div className="space-y-2">
                  <Label>Repeat On</Label>
                  <Select value={recurringDay} onValueChange={setRecurringDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={day} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSlot} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Slot"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>
              Select a date to view or manage slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                hasSlots: datesWithSlots,
              }}
              modifiersStyles={{
                hasSlots: {
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Slots for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Slots for {format(selectedDate, "MMM d")}
            </CardTitle>
            <CardDescription>
              {selectedDateSlots.length} slot(s) available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDateSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No slots for this date</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setSlotDate(selectedDate);
                    setShowCreateDialog(true);
                  }}
                >
                  Add a slot
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border"
                  >
                    <div>
                      <p className="font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                      {slot.notes && (
                        <p className="text-sm text-muted-foreground">{slot.notes}</p>
                      )}
                      {slot.is_recurring && (
                        <p className="text-xs text-primary">
                          Repeats {slot.recurring_day_of_week !== null && DAYS_OF_WEEK[slot.recurring_day_of_week]}s
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};