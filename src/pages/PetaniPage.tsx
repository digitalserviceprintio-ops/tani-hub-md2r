import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Trash2, Phone } from "lucide-react";

interface Petani {
  id: string;
  nama: string;
  nik: string | null;
  telepon: string | null;
  alamat: string | null;
}

const PetaniPage = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Petani[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nama: "", nik: "", telepon: "", alamat: "" });

  const load = async () => {
    const { data } = await supabase.from("petani").select("*").order("nama");
    setList((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nama.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("petani").insert({
      nama: form.nama.trim().slice(0, 100),
      nik: form.nik.trim().slice(0, 20) || null,
      telepon: form.telepon.trim().slice(0, 20) || null,
      alamat: form.alamat.trim().slice(0, 500) || null,
    });
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Petani ditambahkan ✓" });
    setForm({ nama: "", nik: "", telepon: "", alamat: "" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("petani").delete().eq("id", id);
    if (error) {
      toast({ title: "Tidak bisa hapus", description: "Petani mungkin masih dipakai catatan panen.", variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{list.length} petani plasma</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full h-9 px-4 font-semibold">
              <Plus className="size-4 mr-1" /> Petani
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Tambah Petani Plasma</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nama Lengkap</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} maxLength={100} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>NIK</Label>
                <Input inputMode="numeric" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} maxLength={20} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>No. Telepon</Label>
                <Input inputMode="tel" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} maxLength={20} className="mt-1.5 h-11 rounded-xl bg-muted/50 border-0" />
              </div>
              <div>
                <Label>Alamat</Label>
                <Textarea rows={2} maxLength={500} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="mt-1.5 rounded-xl bg-muted/50 border-0" />
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
          <User className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada petani. Tambahkan petani plasma pertama.</p>
        </div>
      ) : (
        <div className="native-card overflow-hidden">
          {list.map((p, idx) => (
            <div key={p.id} className={`native-list-item press-effect ${idx < list.length - 1 ? '' : 'border-0'}`}>
              <div className="size-10 rounded-full gradient-earth flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {p.nama.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{p.nama}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  {p.telepon && <span className="flex items-center gap-1"><Phone className="size-3" />{p.telepon}</span>}
                  {p.nik && <span className="truncate">NIK: {p.nik}</span>}
                </div>
              </div>
              <button onClick={() => remove(p.id)} className="p-2 text-destructive/60 hover:text-destructive transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PetaniPage;
