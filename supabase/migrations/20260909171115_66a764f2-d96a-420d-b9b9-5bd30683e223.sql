-- 1) Storage: restrict public reads to dedicated folders instead of a filename pattern
DROP POLICY IF EXISTS "Public can read app downloads" ON storage.objects;

CREATE POLICY "Public can read app downloads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'app-files'
  AND (storage.foldername(name))[1] IN ('avatars', 'downloads')
);

-- 2) Payments: make the server-only insert rule explicit and enforced
REVOKE INSERT ON public.payments FROM anon, authenticated;

DROP POLICY IF EXISTS "No client-side payment inserts" ON public.payments;
CREATE POLICY "No client-side payment inserts"
ON public.payments AS RESTRICTIVE FOR INSERT
TO anon, authenticated
WITH CHECK (false);

GRANT ALL ON public.payments TO service_role;