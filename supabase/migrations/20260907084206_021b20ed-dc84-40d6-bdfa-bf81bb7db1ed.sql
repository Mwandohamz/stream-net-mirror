ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_key ON public.subscriptions (user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Avatar images are publicly readable') THEN
    CREATE POLICY "Avatar images are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'app-files' AND (storage.foldername(name))[1] = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload their own avatar') THEN
    CREATE POLICY "Users can upload their own avatar"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'app-files' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their own avatar') THEN
    CREATE POLICY "Users can update their own avatar"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'app-files' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text)
      WITH CHECK (bucket_id = 'app-files' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their own avatar') THEN
    CREATE POLICY "Users can delete their own avatar"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'app-files' AND (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text);
  END IF;
END $$;