-- Storage RLS for supply-photos bucket (private; signed URLs in app)
CREATE POLICY "Auth can read supply photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'supply-photos');

CREATE POLICY "Admins upload supply photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins update supply photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins delete supply photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'supply-photos'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
);