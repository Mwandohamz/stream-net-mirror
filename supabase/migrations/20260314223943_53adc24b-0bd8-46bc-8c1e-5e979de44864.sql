INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-files', 'app-files', true, 104857600, ARRAY['application/vnd.android.package-archive', 'application/octet-stream']);

CREATE POLICY "Public can read app files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'app-files');

CREATE POLICY "Admins can upload app files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-files' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'app-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-files' AND public.has_role(auth.uid(), 'admin'));