import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Sprout, MapPin, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
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

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    const key = format(d, "yyyy-MM-dd");
    const ton = rows.filter((r) => r.tanggal === key).reduce((s, r) => s + Number(r.tonase_kg), 0) / 1000;
    return { day: format(d, "EEE", { locale: idLocale }), ton: Number(ton.toFixed(2)) };
  });

  const recent = rows.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Selamat datang 🌴</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale })}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={Scale} label="Hari Ini" value={todayTon.toFixed(2)} unit="ton" color="text-primary" />
        <StatCard icon={Sprout} label="Total" value={totalJanjang.toLocaleString("id-ID")} unit="janjang" color="text-harvest" />
        <StatCard icon={MapPin} label="Aktif" value={String(blokCount)} unit="blok" color="text-blue-500" />
      </div>

      {/* AI Assistant CTA */}
      <Link
        to="/asisten"
        className="native-card p-4 flex items-center gap-3 press-effect block"
      >
        <div className="size-11 rounded-2xl gradient-leaf flex items-center justify-center shrink-0 shadow-cta">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Asisten Analisis</div>
          <div className="text-xs text-muted-foreground">Pendapatan, tonase panen & perawatan</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </Link>

      {/* Chart */}
      <div className="native-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Tonase 7 hari</p>
            <p className="font-bold text-lg tabular-nums flex items-center gap-1.5">
              <TrendingUp className="size-4 text-primary" />
              {chartData.reduce((s, d) => s + d.ton, 0).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">ton</span>
            </p>
          </div>
        </div>
        <div className="h-32 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
                }}
                formatter={(v: number) => [`${v} ton`, "Tonase"]}
              />
              <Area type="monotone" dataKey="ton" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#leafGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent harvests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="section-header mb-0">Panen Terkini</p>
          <Link to="/laporan" className="text-xs font-semibold text-primary flex items-center gap-0.5">
            Semua <ChevronRight className="size-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Memuat...</div>
        ) : recent.length === 0 ? (
          <div className="native-card p-8 text-center text-muted-foreground text-sm">
            Belum ada catatan panen. Tap <strong className="text-primary">+</strong> untuk mulai.
          </div>
        ) : (
          <div className="native-card overflow-hidden">
            {recent.map((r, idx) => (
              <div key={r.id} className={`native-list-item ${idx < recent.length - 1 ? '' : 'border-0'}`}>
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Sprout className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {r.blok?.kode ?? "—"} · {r.petani?.nama ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.tanggal), "d MMM yyyy", { locale: idLocale })} · {r.jumlah_janjang} janjang
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums text-sm">
                    {(Number(r.tonase_kg) / 1000).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">ton</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, unit, color }: any) => (
  <div className="native-card p-3 text-center press-effect">
    <Icon className={`size-5 mx-auto mb-1 ${color}`} strokeWidth={1.8} />
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
    <div className="font-bold text-xl tabular-nums leading-tight mt-0.5">{value}</div>
    <div className="text-[10px] text-muted-foreground">{unit}</div>
  </div>
);

export default Dashboard;
