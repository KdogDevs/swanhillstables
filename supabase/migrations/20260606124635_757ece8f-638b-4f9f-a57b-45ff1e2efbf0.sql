CREATE POLICY "Admins read receipt photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supply-receipts' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Admins upload receipt photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supply-receipts' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Admins update receipt photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'supply-receipts' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

CREATE POLICY "Admins delete receipt photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'supply-receipts' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));