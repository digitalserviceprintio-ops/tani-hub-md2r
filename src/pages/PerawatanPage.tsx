import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Wrench, Plus, BarChart3, Pencil } from "lucide-react";

const JENIS_OPTIONS = ["Pemupukan", "Penyemprotan", "Pruning", "Penyiangan", "Penyulaman", "Lainnya"];

const PerawatanPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [jenis, setJenis] = useState("");
  const [blokId, setBlokId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");

  // Edit state
  const [editItem, setEditItem] = useState<any>(null);
  const [editJenis, setEditJenis] = useState("");
  const [editBlokId, setEditBlokId] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");

  const { data: blokList = [] } = useQuery({
    queryKey: ["blok"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blok").select("*").order("kode");
      if (error) throw error;
      return data;
    },
  });

  const { data: perawatanList = [], isLoading } = useQuery({
    queryKey: ["perawatan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perawatan")
        .select("*, blok(kode, nama)")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("perawatan").insert({
        blok_id: blokId,
        jenis,
        tanggal,
        keterangan: keterangan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perawatan"] });
      toast.success("Perawatan berhasil dicatat");
      setShowForm(false);
      setJenis("");
      setBlokId("");
      setKeterangan("");
      setTanggal(new Date().toISOString().slice(0, 10));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("perawatan").update({
        blok_id: editBlokId,
        jenis: editJenis,
        tanggal: editTanggal,
        keterangan: editKeterangan || null,
      }).eq("id", editItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perawatan"] });
      toast.success("Data perawatan diperbarui");
      setEditItem(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("perawatan").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perawatan"] });
      toast.success("Data dihapus");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenis || !blokId) {
      toast.error("Pilih blok dan jenis perawatan");
      return;
    }
    addMutation.mutate();
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setEditJenis(item.jenis);
    setEditBlokId(item.blok_id);
    setEditTanggal(item.tanggal);
    setEditKeterangan(item.keterangan || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJenis || !editBlokId) {
      toast.error("Pilih blok dan jenis perawatan");
      return;
    }
    updateMutation.mutate();
  };

  const formFields = (
    prefix: "add" | "edit",
    values: { jenis: string; blokId: string; tanggal: string; keterangan: string },
    setters: { setJenis: (v: string) => void; setBlokId: (v: string) => void; setTanggal: (v: string) => void; setKeterangan: (v: string) => void }
  ) => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Blok</Label>
          <Select value={values.blokId} onValueChange={setters.setBlokId}>
            <SelectTrigger><SelectValue placeholder="Pilih blok" /></SelectTrigger>
            <SelectContent>
              {blokList.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.kode} - {b.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jenis</Label>
          <Select value={values.jenis} onValueChange={setters.setJenis}>
            <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
            <SelectContent>
              {JENIS_OPTIONS.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Tanggal</Label>
        <Input type="date" value={values.tanggal} onChange={(e) => setters.setTanggal(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Keterangan</Label>
        <Textarea value={values.keterangan} onChange={(e) => setters.setKeterangan(e.target.value)} placeholder="Catatan tambahan (opsional)" rows={2} />
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold text-primary">Perawatan</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/rekap-perawatan")} className="gap-1.5">
            <BarChart3 className="size-4" />
            Rekap
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="size-4" />
            Tambah
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Catat Perawatan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formFields("add", { jenis, blokId, tanggal, keterangan }, { setJenis, setBlokId, setTanggal, setKeterangan })}
              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Memuat data...</p>
      ) : perawatanList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data perawatan</p>
      ) : (
        <div className="space-y-3">
          {perawatanList.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-accent flex items-center justify-center mt-0.5">
                    <Wrench className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.jenis}</div>
                    <div className="text-xs text-muted-foreground">
                      {(item.blok as any)?.kode} — {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </div>
                    {item.keterangan && (
                      <div className="text-xs text-muted-foreground mt-0.5">{item.keterangan}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Perawatan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formFields("edit",
              { jenis: editJenis, blokId: editBlokId, tanggal: editTanggal, keterangan: editKeterangan },
              { setJenis: setEditJenis, setBlokId: setEditBlokId, setTanggal: setEditTanggal, setKeterangan: setEditKeterangan }
            )}
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerawatanPage;
