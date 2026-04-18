-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- BLOK
CREATE TABLE public.blok (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  luas_hektar NUMERIC(10,2) DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view blok" ON public.blok FOR SELECT USING (true);
CREATE POLICY "Public can insert blok" ON public.blok FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update blok" ON public.blok FOR UPDATE USING (true);
CREATE POLICY "Public can delete blok" ON public.blok FOR DELETE USING (true);
CREATE TRIGGER update_blok_updated_at BEFORE UPDATE ON public.blok
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PETANI
CREATE TABLE public.petani (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nik TEXT,
  telepon TEXT,
  alamat TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.petani ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view petani" ON public.petani FOR SELECT USING (true);
CREATE POLICY "Public can insert petani" ON public.petani FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update petani" ON public.petani FOR UPDATE USING (true);
CREATE POLICY "Public can delete petani" ON public.petani FOR DELETE USING (true);
CREATE TRIGGER update_petani_updated_at BEFORE UPDATE ON public.petani
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PANEN
CREATE TABLE public.panen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  blok_id UUID NOT NULL REFERENCES public.blok(id) ON DELETE RESTRICT,
  petani_id UUID NOT NULL REFERENCES public.petani(id) ON DELETE RESTRICT,
  tonase_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  jumlah_janjang INTEGER NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.panen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view panen" ON public.panen FOR SELECT USING (true);
CREATE POLICY "Public can insert panen" ON public.panen FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update panen" ON public.panen FOR UPDATE USING (true);
CREATE POLICY "Public can delete panen" ON public.panen FOR DELETE USING (true);
CREATE TRIGGER update_panen_updated_at BEFORE UPDATE ON public.panen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_panen_tanggal ON public.panen(tanggal DESC);
CREATE INDEX idx_panen_blok ON public.panen(blok_id);
CREATE INDEX idx_panen_petani ON public.panen(petani_id);