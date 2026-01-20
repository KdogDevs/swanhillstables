-- Create horse use logs table
CREATE TABLE public.horse_use_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_name TEXT NOT NULL,
  rider_name TEXT NOT NULL,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ride_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  activity_type TEXT NOT NULL DEFAULT 'lesson',
  notes TEXT,
  logged_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.horse_use_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admins can manage all horse use logs"
ON public.horse_use_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_horse_use_logs_updated_at
BEFORE UPDATE ON public.horse_use_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();