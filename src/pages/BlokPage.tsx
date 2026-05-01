import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Trash2, ChevronRight } from "lucide-react";

interface Blok {
  id: string;
  kode: string;
  nama: string;
  luas_hektar: number;
  catatan: string | null;
}

const BlokPage = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Blok[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kode: "", nama: "", luas_hektar: "", catatan: "" });

  const load = async () => {
    const { data } = await supabase.from("blok").select("*").order("kode");
    setList((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.kode.trim() || !form.nama.trim()) {
      toast({ title: "Lengkapi kode & nama", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("blok").insert({
      kode: form.kode.trim().toUpperCase().slice(0, 20),
      nama: form.nama.trim().slice(0, 100),
      luas_hektar: parseFloat(form.luas_hektar) || 0,
      catatan: form.catatan.trim().slice(0, 500) || null,
    });
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Blok ditambahkan ✓" });
    setForm({ kode: "", nama: "", luas_hektar: "", catatan: "" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("blok").delete().eq("id", id);
    if (error) {
      toast({ title: "Tidak bisa hapus", description: "Blok mungkin masih dipakai catatan panen.", variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{list.length} blok terdaftar</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full h-9 px-4 font-semibold">
              <Plus className="size-4 mr-1" /> Blok
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Tambah Blok Baru</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Kode Blok</Label>
                <Input placeholder="A1" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} maxLength={20} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>Nama Blok</Label>
                <Input placeholder="Blok Mawar" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} maxLength={100} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>Luas (hektar)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.luas_hektar} onChange={(e) => setForm({ ...form, luas_hektar: e.target.value })} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>Catatan</Label>
                <Textarea rows={2} maxLength={500} value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="mt-1.5 rounded-xl bg-muted/50 border-0" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} className="w-full h-11 rounded-xl font-semibold">Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="native-card p-8 text-center">
          <MapPin className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada blok. Tambahkan blok pertama Anda.</p>
        </div>
      ) : (
        <div className="native-card overflow-hidden">
          {list.map((b, idx) => (
            <div key={b.id} className={`native-list-item press-effect ${idx < list.length - 1 ? '' : 'border-0'}`}>
              <div className="size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{b.kode}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{b.nama}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {Number(b.luas_hektar).toFixed(2)} ha
                  {b.catatan && ` · ${b.catatan}`}
                </div>
              </div>
              <button onClick={() => remove(b.id)} className="p-2 text-destructive/60 hover:text-destructive transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlokPage;
