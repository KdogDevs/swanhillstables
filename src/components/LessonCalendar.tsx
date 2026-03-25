import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, Download, Loader2, Check } from "lucide-react";
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
  max_capacity: number;
  booking_count?: number;
  is_booked_by_user?: boolean;
}

interface Booking {
  id: string;
  slot_id: string;
  status: string;
  notes: string | null;
  lesson_slots: LessonSlot;
}

export const LessonCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<LessonSlot[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<LessonSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch slots for the selected month
  useEffect(() => {
    fetchSlots();
    if (user) {
      fetchUserBookings();
    }
  }, [selectedDate, user]);

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
      toast({
        title: "Error",
        description: "Failed to load lesson slots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("lesson_bookings")
        .select(`
          id,
          slot_id,
          status,
          notes,
          lesson_slots (
            id,
            slot_date,
            start_time,
            end_time,
            notes
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "confirmed");

      if (error) throw error;
      setUserBookings((data as unknown as Booking[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const handleBookLesson = async () => {
    if (!selectedSlot || !user) return;

    setIsBooking(true);
    try {
      const { error } = await supabase
        .from("lesson_bookings")
        .insert({
          user_id: user.id,
          slot_id: selectedSlot.id,
          notes: bookingNotes || null,
          status: "confirmed",
        });

      if (error) throw error;

      toast({
        title: "Lesson Booked!",
        description: `Your lesson on ${format(parseISO(selectedSlot.slot_date), "MMMM d")} at ${formatTime(selectedSlot.start_time)} has been confirmed.`,
      });

      setShowBookingDialog(false);
      setBookingNotes("");
      setSelectedSlot(null);
      fetchSlots();
      fetchUserBookings();
    } catch (error: any) {
      console.error("Error booking lesson:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Could not book this lesson",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("lesson_bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Lesson Cancelled",
        description: "Your lesson has been cancelled successfully.",
      });

      fetchSlots();
      fetchUserBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the lesson",
        variant: "destructive",
      });
    }
  };

  const downloadICalFile = (booking: Booking) => {
    const slot = booking.lesson_slots;
    const startDate = parseISO(`${slot.slot_date}T${slot.start_time}`);
    const endDate = parseISO(`${slot.slot_date}T${slot.end_time}`);

    const formatICalDate = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Swan Hill Stables//Lesson Booking//EN
BEGIN:VEVENT
UID:${booking.id}@swanhillstables.com
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startDate)}
DTEND:${formatICalDate(endDate)}
SUMMARY:Riding Lesson - Swan Hill Stables
DESCRIPTION:Private riding lesson at Swan Hill Stables${booking.notes ? `\\n\\nNotes: ${booking.notes}` : ""}
LOCATION:Swan Hill Stables
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icalContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lesson-${format(startDate, "yyyy-MM-dd")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Calendar Downloaded",
      description: "Add this to your calendar app",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter((slot) => isSameDay(parseISO(slot.slot_date), date));
  };

  const isUserBooked = (slotId: string) => {
    return userBookings.some((booking) => booking.slot_id === slotId);
  };

  const datesWithSlots = slots.map((slot) => parseISO(slot.slot_date));

  const selectedDateSlots = getSlotsForDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* User's Upcoming Bookings */}
      {user && userBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Your Upcoming Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div>
                    <p className="font-medium">
                      {format(parseISO(booking.lesson_slots.slot_date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(booking.lesson_slots.start_time)} - {formatTime(booking.lesson_slots.end_time)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadICalFile(booking)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Add to Calendar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar and Available Slots */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select a Date
            </CardTitle>
            <CardDescription>
              Days with available lessons are highlighted
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
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </CardContent>
        </Card>

        {/* Available Slots for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Slots
            </CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDateSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No lessons available on this date</p>
                <p className="text-sm mt-1">Try selecting another day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSlots.map((slot) => {
                  const booked = isUserBooked(slot.id);
                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-colors",
                        booked
                          ? "bg-primary/10 border-primary/30"
                          : "bg-card hover:bg-secondary/50"
                      )}
                    >
                      <div>
                        <p className="font-medium">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Private Lesson • $50
                        </p>
                        {slot.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                      {booked ? (
                        <Badge variant="default" className="bg-primary">
                          <Check className="h-3 w-3 mr-1" />
                          Booked
                        </Badge>
                      ) : user ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowBookingDialog(true);
                          }}
                        >
                          Book Now
                        </Button>
                      ) : (
                        <Badge variant="outline">Sign in to book</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Lesson</DialogTitle>
            <DialogDescription>
              Book your private lesson at Swan Hill Stables
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="font-medium">
                  {format(parseISO(selectedSlot.slot_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                </p>
                <p className="text-lg font-semibold mt-2">$40</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or things we should know?"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookLesson} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};