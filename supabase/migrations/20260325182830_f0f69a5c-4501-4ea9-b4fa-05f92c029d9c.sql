
-- Make buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('care-log-photos', 'signed-documents');

-- Drop any existing policies on storage.objects for these buckets
DROP POLICY IF EXISTS "Authenticated users can upload care log photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view care log photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin read care-log-photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin read signed-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users read own care-log-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users read own signed-documents" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload care-log-photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload signed-documents" ON storage.objects;

-- care-log-photos: authenticated users can upload, users can read own files, admins can read all
CREATE POLICY "Auth upload care-log-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'care-log-photos');

CREATE POLICY "Users read own care-log-photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'care-log-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin read care-log-photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'care-log-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- signed-documents: authenticated users can upload, users can read own folder, admins can read all
CREATE POLICY "Auth upload signed-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signed-documents');

CREATE POLICY "Users read own signed-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'signed-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin read signed-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'signed-documents'
  AND public.has_role(auth.uid(), 'admin')
);
