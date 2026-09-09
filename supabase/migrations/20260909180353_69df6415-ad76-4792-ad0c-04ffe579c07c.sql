ALTER TABLE public.lesson_signups
  ALTER COLUMN horse_preference DROP NOT NULL,
  ALTER COLUMN emergency_contact_name DROP NOT NULL,
  ALTER COLUMN emergency_contact_phone DROP NOT NULL,
  ALTER COLUMN experience_level DROP NOT NULL;

GRANT INSERT ON public.lesson_signups TO anon;
GRANT INSERT ON public.boarding_waitlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_signups TO authenticated;
GRANT ALL ON public.lesson_signups TO service_role;
GRANT ALL ON public.boarding_waitlist TO service_role;