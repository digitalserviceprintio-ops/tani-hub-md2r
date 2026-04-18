import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
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
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    blok_id: "",
    petani_id: "",
    tonase_kg: "",
    jumlah_janjang: "",
    catatan: "",
  });

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
    const payload = {
      tanggal: parsed.data.tanggal,
      blok_id: parsed.data.blok_id,
      petani_id: parsed.data.petani_id,
      tonase_kg: parsed.data.tonase_kg,
      jumlah_janjang: parsed.data.jumlah_janjang,
      catatan: parsed.data.catatan ?? null,
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
      <Card className="p-6 text-center border-dashed">
        <p className="text-sm text-muted-foreground mb-4">
          {bloks.length === 0 && "Belum ada data blok. "}
          {petanis.length === 0 && "Belum ada data petani. "}
          Tambahkan dulu sebelum mencatat panen.
        </p>
        <div className="flex gap-2 justify-center">
          {bloks.length === 0 && <Button onClick={() => navigate("/blok")}>+ Tambah Blok</Button>}
          {petanis.length === 0 && <Button onClick={() => navigate("/petani")} variant="outline">+ Tambah Petani</Button>}
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="p-5 space-y-4 shadow-card border-border">
        <div>
          <Label htmlFor="tanggal">Tanggal Panen</Label>
          <Input
            id="tanggal"
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Blok</Label>
          <Select value={form.blok_id} onValueChange={(v) => setForm({ ...form, blok_id: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih blok" /></SelectTrigger>
            <SelectContent>
              {bloks.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.kode} — {b.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Petani Plasma</Label>
          <Select value={form.petani_id} onValueChange={(v) => setForm({ ...form, petani_id: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih petani" /></SelectTrigger>
            <SelectContent>
              {petanis.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tonase">Tonase (kg)</Label>
            <Input
              id="tonase"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={form.tonase_kg}
              onChange={(e) => setForm({ ...form, tonase_kg: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="janjang">Jumlah Janjang</Label>
            <Input
              id="janjang"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={form.jumlah_janjang}
              onChange={(e) => setForm({ ...form, jumlah_janjang: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="catatan">Catatan (opsional)</Label>
          <Textarea
            id="catatan"
            rows={2}
            maxLength={500}
            placeholder="Cuaca, kualitas buah, dll."
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </Card>

      <Button
        type="submit"
        disabled={saving}
        className="w-full h-12 gradient-leaf text-success-foreground font-bold shadow-cta hover:opacity-95"
      >
        <Save className="size-4 mr-2" />
        {saving ? "Menyimpan..." : "Simpan Catatan Panen"}
      </Button>
    </form>
  );
};

export default InputPanen;
