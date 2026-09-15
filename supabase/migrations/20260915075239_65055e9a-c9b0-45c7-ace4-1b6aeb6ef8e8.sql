DROP POLICY IF EXISTS "Public can read app downloads" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;

CREATE POLICY "Users can read own app-files avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-files'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Members can read app downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-files'
  AND (storage.foldername(name))[1] = 'downloads'
  AND (public.has_active_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
);