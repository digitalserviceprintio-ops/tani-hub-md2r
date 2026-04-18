import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PanenRow {
  id: string;
  tanggal: string;
  tonase_kg: number;
  jumlah_janjang: number;
  blok: { kode: string; nama: string } | null;
  petani: { nama: string } | null;
}

const Laporan = () => {
  const { toast } = useToast();
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rows, setRows] = useState<PanenRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("panen")
      .select("id, tanggal, tonase_kg, jumlah_janjang, blok(kode, nama), petani(nama)")
      .gte("tanggal", from)
      .lte("tanggal", to)
      .order("tanggal", { ascending: false });
    if (error) toast({ title: "Gagal memuat", description: error.message, variant: "destructive" });
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const totalTon = rows.reduce((s, r) => s + Number(r.tonase_kg), 0) / 1000;
  const totalJanjang = rows.reduce((s, r) => s + r.jumlah_janjang, 0);

  const perBlok = useMemo(() => {
    const map = new Map<string, { label: string; ton: number; janjang: number }>();
    rows.forEach((r) => {
      const k = r.blok?.kode ?? "—";
      const cur = map.get(k) ?? { label: k, ton: 0, janjang: 0 };
      cur.ton += Number(r.tonase_kg) / 1000;
      cur.janjang += r.jumlah_janjang;
      map.set(k, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.ton - a.ton);
  }, [rows]);

  const perPetani = useMemo(() => {
    const map = new Map<string, { label: string; ton: number; janjang: number }>();
    rows.forEach((r) => {
      const k = r.petani?.nama ?? "—";
      const cur = map.get(k) ?? { label: k, ton: 0, janjang: 0 };
      cur.ton += Number(r.tonase_kg) / 1000;
      cur.janjang += r.jumlah_janjang;
      map.set(k, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.ton - a.ton);
  }, [rows]);

  const exportExcel = () => {
    const detail = rows.map((r) => ({
      Tanggal: r.tanggal,
      Blok: r.blok?.kode ?? "",
      "Nama Blok": r.blok?.nama ?? "",
      Petani: r.petani?.nama ?? "",
      "Tonase (kg)": Number(r.tonase_kg),
      "Janjang": r.jumlah_janjang,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), "Detail");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(perBlok.map((x) => ({ Blok: x.label, "Tonase (ton)": x.ton.toFixed(2), Janjang: x.janjang }))),
      "Per Blok"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(perPetani.map((x) => ({ Petani: x.label, "Tonase (ton)": x.ton.toFixed(2), Janjang: x.janjang }))),
      "Per Petani"
    );
    XLSX.writeFile(wb, `TaniHub_Laporan_${from}_${to}.xlsx`);
    toast({ title: "Excel diunduh ✓" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("TaniHub — Laporan Panen Plasma", 14, 16);
    doc.setFontSize(10);
    doc.text(`Periode: ${from} s/d ${to}`, 14, 23);
    doc.text(`Total: ${totalTon.toFixed(2)} ton • ${totalJanjang.toLocaleString("id-ID")} janjang`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [["Tanggal", "Blok", "Petani", "Tonase (kg)", "Janjang"]],
      body: rows.map((r) => [
        r.tanggal,
        r.blok?.kode ?? "",
        r.petani?.nama ?? "",
        Number(r.tonase_kg).toFixed(2),
        String(r.jumlah_janjang),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [58, 44, 33] },
    });

    const afterY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text("Rekap per Blok", 14, afterY);
    autoTable(doc, {
      startY: afterY + 3,
      head: [["Blok", "Tonase (ton)", "Janjang"]],
      body: perBlok.map((x) => [x.label, x.ton.toFixed(2), String(x.janjang)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [106, 138, 58] },
    });

    const afterY2 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text("Rekap per Petani", 14, afterY2);
    autoTable(doc, {
      startY: afterY2 + 3,
      head: [["Petani", "Tonase (ton)", "Janjang"]],
      body: perPetani.map((x) => [x.label, x.ton.toFixed(2), String(x.janjang)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [106, 138, 58] },
    });

    doc.save(`TaniHub_Laporan_${from}_${to}.pdf`);
    toast({ title: "PDF diunduh ✓" });
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 shadow-soft border-border">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs">Dari</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Sampai</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Total Tonase</div>
            <div className="font-serif font-bold text-xl text-primary tabular-nums">{totalTon.toFixed(2)} <span className="text-xs font-sans font-normal text-muted-foreground">ton</span></div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Total Janjang</div>
            <div className="font-serif font-bold text-xl text-primary tabular-nums">{totalJanjang.toLocaleString("id-ID")}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportExcel} disabled={rows.length === 0} variant="outline" className="border-success text-success hover:bg-success/10">
          <FileSpreadsheet className="size-4 mr-1.5" /> Excel
        </Button>
        <Button onClick={exportPDF} disabled={rows.length === 0} variant="outline" className="border-accent text-accent hover:bg-accent/10">
          <FileText className="size-4 mr-1.5" /> PDF
        </Button>
      </div>

      <Tabs defaultValue="blok">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="blok">Per Blok</TabsTrigger>
          <TabsTrigger value="petani">Per Petani</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="blok" className="space-y-3 mt-3">
          {perBlok.length > 0 && (
            <Card className="p-3 shadow-soft border-border">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perBlok.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }}
                      formatter={(v: number) => [`${v.toFixed(2)} ton`, "Tonase"]}
                    />
                    <Bar dataKey="ton" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <RekapList items={perBlok} />
        </TabsContent>

        <TabsContent value="petani" className="space-y-3 mt-3">
          {perPetani.length > 0 && (
            <Card className="p-3 shadow-soft border-border">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perPetani.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }}
                      formatter={(v: number) => [`${v.toFixed(2)} ton`, "Tonase"]}
                    />
                    <Bar dataKey="ton" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <RekapList items={perPetani} />
        </TabsContent>

        <TabsContent value="detail" className="mt-3">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Memuat...</p>
          ) : rows.length === 0 ? (
            <Card className="p-8 text-center border-dashed text-muted-foreground text-sm">Tidak ada data dalam periode ini.</Card>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id}>
                  <Card className="p-3 flex items-center justify-between border-border shadow-soft text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold text-primary truncate">{r.blok?.kode} • {r.petani?.nama}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(r.tanggal), "d MMM yyyy", { locale: idLocale })} · {r.jumlah_janjang} janjang</div>
                    </div>
                    <div className="text-right shrink-0 ml-3 font-bold text-primary tabular-nums">{(Number(r.tonase_kg) / 1000).toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">ton</span></div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const RekapList = ({ items }: { items: { label: string; ton: number; janjang: number }[] }) => {
  if (items.length === 0)
    return <Card className="p-8 text-center border-dashed text-muted-foreground text-sm">Belum ada data.</Card>;
  const max = Math.max(...items.map((i) => i.ton));
  return (
    <ul className="space-y-2">
      {items.map((x) => (
        <li key={x.label}>
          <Card className="p-3 border-border shadow-soft">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-primary text-sm truncate">{x.label}</span>
              <span className="font-bold text-primary tabular-nums text-sm">{x.ton.toFixed(2)} ton</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-leaf" style={{ width: `${(x.ton / max) * 100}%` }} />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{x.janjang.toLocaleString("id-ID")} janjang</div>
          </Card>
        </li>
      ))}
    </ul>
  );
};

export default Laporan;
