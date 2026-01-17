-- Create lesson_slots table for available time slots
CREATE TABLE public.lesson_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
  max_capacity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create lesson_bookings table for user bookings
CREATE TABLE public.lesson_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.lesson_slots(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot_id)
);

-- Enable RLS
ALTER TABLE public.lesson_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_slots (everyone can view, only admins can manage)
CREATE POLICY "Anyone can view lesson slots"
ON public.lesson_slots
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create slots"
ON public.lesson_slots
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Slot creators can update their slots"
ON public.lesson_slots
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Slot creators can delete their slots"
ON public.lesson_slots
FOR DELETE
USING (auth.uid() = created_by);

-- RLS policies for lesson_bookings
CREATE POLICY "Users can view their own bookings"
ON public.lesson_bookings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.lesson_bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.lesson_bookings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own bookings"
ON public.lesson_bookings
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lesson_slots_updated_at
BEFORE UPDATE ON public.lesson_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_bookings_updated_at
BEFORE UPDATE ON public.lesson_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();