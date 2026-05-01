import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Wrench, Plus } from "lucide-react";

const JENIS_OPTIONS = ["Pemupukan", "Penyemprotan", "Pruning", "Penyiangan", "Penyulaman", "Lainnya"];

const PerawatanPage = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [jenis, setJenis] = useState("");
  const [blokId, setBlokId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState("");

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold text-primary">Perawatan</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="size-4" />
          Tambah
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Catat Perawatan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Blok</Label>
                  <Select value={blokId} onValueChange={setBlokId}>
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
                  <Select value={jenis} onValueChange={setJenis}>
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
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Keterangan</Label>
                <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Catatan tambahan (opsional)" rows={2} />
              </div>
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
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerawatanPage;
