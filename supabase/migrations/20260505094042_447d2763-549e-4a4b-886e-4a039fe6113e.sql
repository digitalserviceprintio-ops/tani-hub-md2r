
ALTER TABLE public.petani ADD COLUMN IF NOT EXISTS foto_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('petani-foto', 'petani-foto', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view petani foto"
ON storage.objects FOR SELECT
USING (bucket_id = 'petani-foto');

CREATE POLICY "Public can upload petani foto"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'petani-foto');

CREATE POLICY "Public can update petani foto"
ON storage.objects FOR UPDATE
USING (bucket_id = 'petani-foto');

CREATE POLICY "Public can delete petani foto"
ON storage.objects FOR DELETE
USING (bucket_id = 'petani-foto');
