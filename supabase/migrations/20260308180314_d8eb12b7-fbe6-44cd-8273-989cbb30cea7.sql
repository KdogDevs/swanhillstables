CREATE TABLE public.lesson_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  age integer,
  experience_level text NOT NULL DEFAULT 'beginner',
  horse_preference text NOT NULL DEFAULT 'school_horse',
  own_horse_name text,
  goals text,
  preferred_days text[],
  preferred_time text,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  special_needs text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a signup (public form)
CREATE POLICY "Anyone can submit lesson signup"
ON public.lesson_signups FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view and manage all signups
CREATE POLICY "Admins can manage lesson signups"
ON public.lesson_signups FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
