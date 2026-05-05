import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Camera, Image as ImageIcon, X } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  blok_id: z.string().uuid("Pilih blok"),
  petani_id: z.string().uuid("Pilih petani"),
  tonase_kg: z.number().min(0.01, "Tonase harus > 0").max(100000),
  jumlah_janjang: z.number().int().min(1, "Janjang minimal 1").max(100000),
  catatan: z.string().max(500).optional(),
});

const InputPanen = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bloks, setBloks] = useState<{ id: string; kode: string; nama: string }[]>([]);
  const [petanis, setPetanis] = useState<{ id: string; nama: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    blok_id: "",
    petani_id: "",
    tonase_kg: "",
    jumlah_janjang: "",
    catatan: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 8 MB.", variant: "destructive" });
      return;
    }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const clearFoto = () => {
    setFoto(null);
    setFotoPreview("");
    if (cameraRef.current) cameraRef.current.value = "";
    if (galeriRef.current) galeriRef.current.value = "";
  };

  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: p }] = await Promise.all([
        supabase.from("blok").select("id, kode, nama").order("kode"),
        supabase.from("petani").select("id, nama").order("nama"),
      ]);
      setBloks(b ?? []);
      setPetanis(p ?? []);
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      tonase_kg: parseFloat(form.tonase_kg),
      jumlah_janjang: parseInt(form.jumlah_janjang),
    });
    if (!parsed.success) {
      toast({ title: "Periksa kembali", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSaving(true);

    let foto_url: string | null = null;
    if (foto) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        toast({ title: "Sesi habis", description: "Silakan login ulang.", variant: "destructive" });
        return;
      }
      const ext = foto.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("panen-foto").upload(path, foto, {
        contentType: foto.type,
        upsert: false,
      });
      if (upErr) {
        setSaving(false);
        toast({ title: "Gagal upload foto", description: upErr.message, variant: "destructive" });
        return;
      }
      foto_url = supabase.storage.from("panen-foto").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      tanggal: parsed.data.tanggal,
      blok_id: parsed.data.blok_id,
      petani_id: parsed.data.petani_id,
      tonase_kg: parsed.data.tonase_kg,
      jumlah_janjang: parsed.data.jumlah_janjang,
      catatan: parsed.data.catatan ?? null,
      foto_url,
    };
    const { error } = await supabase.from("panen").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Tersimpan ✓", description: "Catatan panen berhasil dicatat." });
    navigate("/");
  };

  if (bloks.length === 0 || petanis.length === 0) {
    return (
      <div className="native-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {bloks.length === 0 && "Belum ada data blok. "}
          {petanis.length === 0 && "Belum ada data petani. "}
          Tambahkan dulu sebelum mencatat panen.
        </p>
        <div className="flex gap-2 justify-center">
          {bloks.length === 0 && <Button onClick={() => navigate("/blok")} className="rounded-xl h-11">+ Tambah Blok</Button>}
          {petanis.length === 0 && <Button onClick={() => navigate("/petani")} variant="outline" className="rounded-xl h-11">+ Tambah Petani</Button>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="native-card p-4 space-y-4">
        <div>
          <Label htmlFor="tanggal" className="text-sm">Tanggal Panen</Label>
          <Input id="tanggal" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
        </div>

        <div>
          <Label className="text-sm">Blok</Label>
          <Select value={form.blok_id} onValueChange={(v) => setForm({ ...form, blok_id: v })}>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0"><SelectValue placeholder="Pilih blok" /></SelectTrigger>
            <SelectContent>
              {bloks.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.kode} — {b.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Petani Plasma</Label>
          <Select value={form.petani_id} onValueChange={(v) => setForm({ ...form, petani_id: v })}>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0"><SelectValue placeholder="Pilih petani" /></SelectTrigger>
            <SelectContent>
              {petanis.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tonase" className="text-sm">Tonase (kg)</Label>
            <Input id="tonase" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={form.tonase_kg} onChange={(e) => setForm({ ...form, tonase_kg: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
          </div>
          <div>
            <Label htmlFor="janjang" className="text-sm">Jumlah Janjang</Label>
            <Input id="janjang" type="number" inputMode="numeric" placeholder="0" value={form.jumlah_janjang} onChange={(e) => setForm({ ...form, jumlah_janjang: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
          </div>
        </div>

        <div>
          <Label htmlFor="catatan" className="text-sm">Catatan (opsional)</Label>
          <Textarea id="catatan" rows={2} maxLength={500} placeholder="Cuaca, kualitas buah, dll." value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="mt-1.5 rounded-xl bg-muted/50 border-0" />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-semibold text-base shadow-cta press-effect">
        <CheckCircle2 className="size-5 mr-2" />
        {saving ? "Menyimpan..." : "Simpan Catatan Panen"}
      </Button>
    </form>
  );
};

export default InputPanen;
