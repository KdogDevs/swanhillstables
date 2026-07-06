
-- 1. Boarding signups
CREATE TABLE public.boarding_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  horse_name text NOT NULL,
  horse_breed text,
  horse_age text,
  horse_sex text NOT NULL,
  horse_color text,
  tier text NOT NULL,
  feed_plan text NOT NULL,
  monthly_amount numeric NOT NULL,
  addon_hay boolean NOT NULL DEFAULT false,
  addon_bedding boolean NOT NULL DEFAULT false,
  addon_pasture_feeding boolean NOT NULL DEFAULT false,
  addon_blanketing boolean NOT NULL DEFAULT false,
  addon_grooming boolean NOT NULL DEFAULT false,
  addon_training boolean NOT NULL DEFAULT false,
  vet_name text,
  vet_phone text,
  emergency_authorize boolean NOT NULL DEFAULT false,
  emergency_limit text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boarding_signups TO authenticated;
GRANT ALL ON public.boarding_signups TO service_role;
ALTER TABLE public.boarding_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage boarding signups" ON public.boarding_signups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Users view own boarding signups" ON public.boarding_signups
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER update_boarding_signups_updated_at
  BEFORE UPDATE ON public.boarding_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Link lesson signups to user
ALTER TABLE public.lesson_signups
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_signups_user_id ON public.lesson_signups(user_id);

-- 3. Signing-link fields on client_documents
ALTER TABLE public.client_documents
  ADD COLUMN IF NOT EXISTS sign_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_documents_sign_token
  ON public.client_documents(sign_token) WHERE sign_token IS NOT NULL;
