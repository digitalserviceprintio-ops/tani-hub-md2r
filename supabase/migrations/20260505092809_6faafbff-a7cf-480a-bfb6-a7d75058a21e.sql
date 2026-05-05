
ALTER TABLE public.panen ADD COLUMN IF NOT EXISTS foto_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('panen-foto', 'panen-foto', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Panen foto public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'panen-foto');

CREATE POLICY "Auth users upload panen foto"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'panen-foto' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own panen foto"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'panen-foto' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own panen foto"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'panen-foto' AND auth.uid()::text = (storage.foldername(name))[1]);
