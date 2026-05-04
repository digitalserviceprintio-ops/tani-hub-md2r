// Edge function: AI assistant for analyzing harvest tonnage & maintenance data
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch context data
    const [{ data: panen }, { data: perawatan }, { data: blok }] = await Promise.all([
      supabase.from("panen").select("tanggal, tonase_kg, jumlah_janjang, blok(kode), petani(nama)").order("tanggal", { ascending: false }).limit(500),
      supabase.from("perawatan").select("tanggal, jenis, blok(kode), keterangan").order("tanggal", { ascending: false }).limit(300),
      supabase.from("blok").select("kode, nama, luas_hektar"),
    ]);

    const totalTon = (panen ?? []).reduce((s: number, r: any) => s + Number(r.tonase_kg ?? 0), 0) / 1000;
    const totalJanjang = (panen ?? []).reduce((s: number, r: any) => s + Number(r.jumlah_janjang ?? 0), 0);

    const systemPrompt = `Anda adalah asisten analisis pertanian kelapa sawit untuk aplikasi TaniHub.
Tugas Anda menganalisis data panen (tonase) dan perawatan kebun, memberikan insight singkat, jelas, dan actionable dalam Bahasa Indonesia.

DATA SAAT INI:
- Total Blok: ${blok?.length ?? 0}
- Total Tonase Panen (semua waktu, sampai 500 catatan terakhir): ${totalTon.toFixed(2)} ton
- Total Janjang: ${totalJanjang.toLocaleString("id-ID")}
- Jumlah catatan perawatan (sampai 300 terakhir): ${perawatan?.length ?? 0}

DATA BLOK:
${JSON.stringify(blok ?? [])}

DATA PANEN (terbaru):
${JSON.stringify((panen ?? []).slice(0, 100))}

DATA PERAWATAN (terbaru):
${JSON.stringify((perawatan ?? []).slice(0, 100))}

Aturan:
- Jawab singkat & padat (max 4 paragraf pendek atau bullet list).
- Gunakan angka dan satuan jelas (ton, janjang, ha).
- Jika ditanya pendapatan dan tidak ada harga, asumsikan harga TBS Rp 2.500/kg dan sebutkan asumsi tersebut.
- Berikan rekomendasi praktis bila relevan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Batas penggunaan tercapai. Coba lagi nanti." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Kredit AI habis. Tambahkan kredit di Lovable AI." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`AI gateway error: ${t}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asisten-analisis error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
