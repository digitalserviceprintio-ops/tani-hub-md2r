// Edge function: AI assistant returning STRUCTURED summary cards.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tools = [
  {
    type: "function",
    function: {
      name: "render_summary_cards",
      description:
        "Tampilkan jawaban sebagai kumpulan kartu ringkasan yang mudah dibaca di mobile. WAJIB selalu dipanggil untuk setiap pertanyaan pengguna.",
      parameters: {
        type: "object",
        properties: {
          intro: {
            type: "string",
            description: "Kalimat pembuka singkat (max 1 kalimat) yang menjawab pertanyaan secara umum.",
          },
          cards: {
            type: "array",
            description: "Daftar kartu ringkasan. Maksimal 4 kartu.",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["top_blok", "tren_tonase", "rekomendasi_perawatan", "pendapatan", "info"],
                  description: "Jenis kartu.",
                },
                title: { type: "string", description: "Judul kartu (3-5 kata)." },
                metric: {
                  type: "string",
                  description: "Angka utama / highlight (mis. '12,4 ton', 'Rp 31 jt'). Opsional.",
                },
                metric_label: { type: "string", description: "Keterangan singkat untuk metric." },
                items: {
                  type: "array",
                  description: "Daftar item dalam kartu (mis. top blok, atau bullet rekomendasi).",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" },
                    },
                    required: ["label"],
                    additionalProperties: false,
                  },
                },
                note: { type: "string", description: "Catatan / asumsi singkat di bawah kartu." },
              },
              required: ["type", "title"],
              additionalProperties: false,
            },
          },
        },
        required: ["intro", "cards"],
        additionalProperties: false,
      },
    },
  },
];

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

    const [{ data: panen }, { data: perawatan }, { data: blok }] = await Promise.all([
      supabase
        .from("panen")
        .select("tanggal, tonase_kg, jumlah_janjang, blok(kode), petani(nama)")
        .order("tanggal", { ascending: false })
        .limit(500),
      supabase
        .from("perawatan")
        .select("tanggal, jenis, blok(kode), keterangan")
        .order("tanggal", { ascending: false })
        .limit(300),
      supabase.from("blok").select("kode, nama, luas_hektar"),
    ]);

    const totalTon = (panen ?? []).reduce((s: number, r: any) => s + Number(r.tonase_kg ?? 0), 0) / 1000;
    const totalJanjang = (panen ?? []).reduce((s: number, r: any) => s + Number(r.jumlah_janjang ?? 0), 0);

    const systemPrompt = `Anda asisten analisis kebun sawit untuk aplikasi TaniHub. Jawaban WAJIB dikembalikan via tool "render_summary_cards" — JANGAN balas teks bebas.

Panduan kartu:
- Maksimal 4 kartu, paling relevan dengan pertanyaan.
- Gunakan tipe kartu yang tepat: top_blok, tren_tonase, rekomendasi_perawatan, pendapatan, info.
- Bahasa Indonesia, padat, angka jelas (ton, janjang, ha, Rp).
- Untuk pendapatan, asumsikan harga TBS Rp 2.500/kg jika tidak disebut, dan tulis asumsi di field "note".
- Untuk top_blok / rekomendasi: gunakan field "items" (label + value).
- Untuk tren / pendapatan: gunakan field "metric" + "metric_label".

DATA KONTEKS:
- Total Blok: ${blok?.length ?? 0}
- Total Tonase (≤500 catatan terbaru): ${totalTon.toFixed(2)} ton
- Total Janjang: ${totalJanjang.toLocaleString("id-ID")}
- Catatan perawatan (≤300): ${perawatan?.length ?? 0}

BLOK: ${JSON.stringify(blok ?? [])}
PANEN (100 terbaru): ${JSON.stringify((panen ?? []).slice(0, 100))}
PERAWATAN (100 terbaru): ${JSON.stringify((perawatan ?? []).slice(0, 100))}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        tool_choice: { type: "function", function: { name: "render_summary_cards" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Batas penggunaan tercapai. Coba lagi nanti." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`AI gateway error: ${t}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;
    const toolCall = choice?.tool_calls?.[0];

    let summary: any = null;
    if (toolCall?.function?.arguments) {
      try {
        summary = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("parse tool args failed", e);
      }
    }

    if (!summary) {
      summary = {
        intro: choice?.content ?? "Tidak ada jawaban.",
        cards: [],
      };
    }

    return new Response(JSON.stringify({ summary }), {
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
