CREATE TABLE public.boarding_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  num_horses integer NOT NULL DEFAULT 1,
  horse_genders text NOT NULL,
  tier text,
  notes text,
  status text NOT NULL DEFAULT 'waiting',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.boarding_waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boarding_waitlist TO authenticated;
GRANT ALL ON public.boarding_waitlist TO service_role;

ALTER TABLE public.boarding_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
ON public.boarding_waitlist FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
ON public.boarding_waitlist FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update waitlist"
ON public.boarding_waitlist FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete waitlist"
ON public.boarding_waitlist FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_boarding_waitlist_updated_at
BEFORE UPDATE ON public.boarding_waitlist
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();