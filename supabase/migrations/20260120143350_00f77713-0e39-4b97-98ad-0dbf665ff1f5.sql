-- Create horse care log table for tracking incidents
CREATE TABLE public.horse_care_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  incident_type TEXT NOT NULL DEFAULT 'general',
  photo_url TEXT,
  logged_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.horse_care_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage all logs
CREATE POLICY "Admins can manage all care logs"
ON public.horse_care_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Boarders can view their own logs
CREATE POLICY "Boarders can view their own care logs"
ON public.horse_care_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_horse_care_logs_updated_at
BEFORE UPDATE ON public.horse_care_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for care log photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('care-log-photos', 'care-log-photos', true);

-- Storage policies for care log photos
CREATE POLICY "Admins can upload care photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'care-log-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update care photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'care-log-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete care photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'care-log-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view care photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'care-log-photos');