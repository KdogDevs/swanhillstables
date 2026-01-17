-- Add additional profile fields for emergency contacts and horse care preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_name text,
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS preferred_vet_name text,
ADD COLUMN IF NOT EXISTS preferred_vet_phone text,
ADD COLUMN IF NOT EXISTS preferred_farrier_name text,
ADD COLUMN IF NOT EXISTS preferred_farrier_phone text,
ADD COLUMN IF NOT EXISTS is_boarder boolean NOT NULL DEFAULT false;