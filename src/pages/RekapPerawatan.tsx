import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Wrench } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["hsl(142,55%,40%)", "hsl(35,80%,50%)", "hsl(200,65%,50%)", "hsl(0,60%,50%)", "hsl(270,50%,55%)", "hsl(180,50%,40%)"];

const RekapPerawatan = () => {
  const [blokId, setBlokId] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: blokList = [] } = useQuery({
    queryKey: ["blok"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blok").select("*").order("kode");
      if (error) throw error;
      return data;
    },
  });

  const { data: perawatanList = [], isLoading } = useQuery({
    queryKey: ["perawatan-rekap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perawatan")
        .select("*, blok(kode, nama)")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return perawatanList.filter((item: any) => {
      if (blokId !== "all" && item.blok_id !== blokId) return false;
      if (startDate && new Date(item.tanggal) < startDate) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        if (new Date(item.tanggal) > end) return false;
      }
      return true;
    });
  }, [perawatanList, blokId, startDate, endDate]);

  const summary = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((item: any) => {
      map[item.jenis] = (map[item.jenis] || 0) + 1;
    });
    return Object.entries(map)
      .map(([jenis, jumlah]) => ({ jenis, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [filtered]);

  const resetFilter = () => {
    setBlokId("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-serif font-bold text-primary">Rekap Perawatan</h1>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Blok</Label>
            <Select value={blokId} onValueChange={setBlokId}>
              <SelectTrigger><SelectValue placeholder="Semua blok" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Blok</SelectItem>
                {blokList.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.kode} - {b.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dari Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 size-4" />
                    {startDate ? format(startDate, "dd MMM yyyy", { locale: localeId }) : "Pilih"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Sampai Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 size-4" />
                    {endDate ? format(endDate, "dd MMM yyyy", { locale: localeId }) : "Pilih"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={resetFilter} className="text-xs">Reset Filter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ringkasan ({filtered.length} kegiatan)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Memuat...</p>
          ) : summary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada data untuk filter ini</p>
          ) : (
            <>
              <div className="h-52 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="jenis" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="jumlah" radius={[0, 6, 6, 0]}>
                      {summary.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {summary.map((s, i) => (
                  <div key={s.jenis} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium">{s.jenis}</span>
                    </div>
                    <span className="text-sm font-bold">{s.jumlah}x</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detail Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className="size-8 rounded-lg bg-accent flex items-center justify-center mt-0.5">
                  <Wrench className="size-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.jenis}</span>
                    <span className="text-xs text-muted-foreground">{new Date(item.tanggal).toLocaleDateString("id-ID")}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{(item.blok as any)?.kode}</div>
                  {item.keterangan && <div className="text-xs text-muted-foreground mt-0.5">{item.keterangan}</div>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RekapPerawatan;
