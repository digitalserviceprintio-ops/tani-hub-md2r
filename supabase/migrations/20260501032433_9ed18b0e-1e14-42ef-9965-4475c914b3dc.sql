
CREATE TABLE public.perawatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blok_id UUID REFERENCES public.blok(id) ON DELETE CASCADE NOT NULL,
  jenis TEXT NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT,
  user_id UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.perawatan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view perawatan" ON public.perawatan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert perawatan" ON public.perawatan FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update perawatan" ON public.perawatan FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete perawatan" ON public.perawatan FOR DELETE TO authenticated USING (true);
