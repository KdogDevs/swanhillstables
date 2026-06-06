-- Add image + notification tracking to supply_inventory
ALTER TABLE public.supply_inventory
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS low_stock_notified_at timestamptz;

-- Recipients for low-stock email alerts
CREATE TABLE IF NOT EXISTS public.supply_alert_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_alert_recipients TO authenticated;
GRANT ALL ON public.supply_alert_recipients TO service_role;

ALTER TABLE public.supply_alert_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alert recipients"
ON public.supply_alert_recipients
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Storage policies for supply-photos bucket
CREATE POLICY "Public can read supply photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'supply-photos');

CREATE POLICY "Admins can upload supply photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can update supply photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can delete supply photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);