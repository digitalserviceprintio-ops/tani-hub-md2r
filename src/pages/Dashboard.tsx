import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Sprout, Scale, MapPin, TrendingUp } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";

interface PanenRow {
  id: string;
  tanggal: string;
  tonase_kg: number;
  jumlah_janjang: number;
  blok: { kode: string; nama: string } | null;
  petani: { nama: string } | null;
}

const Dashboard = () => {
  const [rows, setRows] = useState<PanenRow[]>([]);
  const [blokCount, setBlokCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("panen")
        .select("id, tanggal, tonase_kg, jumlah_janjang, blok(kode, nama), petani(nama)")
        .order("tanggal", { ascending: false })
        .limit(50);
      const { count } = await supabase.from("blok").select("*", { count: "exact", head: true });
      setRows((data as any) ?? []);
      setBlokCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRows = rows.filter((r) => r.tanggal === today);
  const todayTon = todayRows.reduce((s, r) => s + Number(r.tonase_kg), 0) / 1000;
  const totalJanjang = rows.reduce((s, r) => s + r.jumlah_janjang, 0);

  // 7-day chart
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    const key = format(d, "yyyy-MM-dd");
    const ton = rows.filter((r) => r.tanggal === key).reduce((s, r) => s + Number(r.tonase_kg), 0) / 1000;
    return { day: format(d, "EEE", { locale: idLocale }), ton: Number(ton.toFixed(2)) };
  });

  const recent = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-serif text-2xl font-bold text-primary mb-1">Selamat datang 🌴</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard icon={Scale} label="Hari Ini" value={todayTon.toFixed(2)} unit="ton" />
        <StatCard icon={Sprout} label="Total" value={totalJanjang.toLocaleString("id-ID")} unit="janjang" />
        <StatCard icon={MapPin} label="Aktif" value={String(blokCount)} unit="blok" />
      </section>

      <section>
        <Card className="p-4 shadow-card border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Tonase 7 hari terakhir</div>
              <div className="font-serif font-bold text-lg text-primary flex items-center gap-1.5">
                <TrendingUp className="size-4 text-success" />
                {chartData.reduce((s, d) => s + d.ton, 0).toFixed(2)} ton
              </div>
            </div>
          </div>
          <div className="h-32 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v} ton`, "Tonase"]}
                />
                <Area type="monotone" dataKey="ton" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#leafGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-bold text-lg text-primary">Panen Terkini</h2>
          <Link to="/laporan" className="text-xs font-semibold text-accent">Lihat semua →</Link>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Memuat...</div>
        ) : recent.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
            Belum ada catatan panen. Tap tombol <strong className="text-success">+</strong> di bawah untuk mulai.
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {recent.map((r) => (
              <li key={r.id}>
                <Card className="p-3.5 flex items-center justify-between border-border shadow-soft">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary text-sm truncate">
                      {r.blok?.kode ?? "—"} • {r.petani?.nama ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.tanggal), "d MMM yyyy", { locale: idLocale })} · {r.jumlah_janjang} janjang
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-primary tabular-nums">
                      {(Number(r.tonase_kg) / 1000).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">ton</div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, unit }: any) => (
  <Card className="p-3.5 text-center shadow-soft border-border">
    <Icon className="size-4 text-accent mx-auto mb-1.5" />
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
    <div className="font-serif font-bold text-xl text-primary tabular-nums leading-tight">{value}</div>
    <div className="text-[10px] text-muted-foreground">{unit}</div>
  </Card>
);

export default Dashboard;
