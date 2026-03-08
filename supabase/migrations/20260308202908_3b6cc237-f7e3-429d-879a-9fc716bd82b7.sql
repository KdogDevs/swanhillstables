
INSERT INTO storage.buckets (id, name, public) VALUES ('signed-documents', 'signed-documents', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can manage signed documents" ON storage.objects FOR ALL USING (bucket_id = 'signed-documents' AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));

CREATE POLICY "Users can view own signed documents" ON storage.objects FOR SELECT USING (bucket_id = 'signed-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can upload signed documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signed-documents');
