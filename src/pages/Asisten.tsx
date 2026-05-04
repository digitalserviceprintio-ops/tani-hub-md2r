import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Trophy, TrendingUp, Wrench, Wallet, Info } from "lucide-react";
import { toast } from "sonner";

interface CardItem {
  label: string;
  value?: string;
}
interface SummaryCard {
  type: "top_blok" | "tren_tonase" | "rekomendasi_perawatan" | "pendapatan" | "info";
  title: string;
  metric?: string;
  metric_label?: string;
  items?: CardItem[];
  note?: string;
}
interface Summary {
  intro: string;
  cards: SummaryCard[];
}
interface Msg {
  role: "user" | "assistant";
  content: string; // for user msgs
  summary?: Summary; // for assistant msgs
}

const SUGGESTIONS = [
  "Estimasi pendapatan dari total tonase panen",
  "Blok mana yang paling produktif?",
  "Ringkas aktivitas perawatan bulan ini",
  "Tren panen 7 hari terakhir",
];

const ICONS: Record<SummaryCard["type"], any> = {
  top_blok: Trophy,
  tren_tonase: TrendingUp,
  rekomendasi_perawatan: Wrench,
  pendapatan: Wallet,
  info: Info,
};

const COLORS: Record<SummaryCard["type"], string> = {
  top_blok: "text-harvest bg-harvest/10",
  tren_tonase: "text-primary bg-primary/10",
  rekomendasi_perawatan: "text-blue-600 bg-blue-500/10",
  pendapatan: "text-success bg-success/10",
  info: "text-muted-foreground bg-muted",
};

const SummaryCardView = ({ card }: { card: SummaryCard }) => {
  const Icon = ICONS[card.type] ?? Info;
  const color = COLORS[card.type] ?? COLORS.info;
  return (
    <div className="native-card p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <h3 className="font-semibold text-sm">{card.title}</h3>
      </div>

      {card.metric && (
        <div className="mb-2">
          <div className="font-bold text-2xl tabular-nums leading-tight">{card.metric}</div>
          {card.metric_label && (
            <div className="text-xs text-muted-foreground">{card.metric_label}</div>
          )}
        </div>
      )}

      {card.items && card.items.length > 0 && (
        <ul className="space-y-1.5 mt-1">
          {card.items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-muted/50 text-sm"
            >
              <span className="text-foreground/90 flex-1 min-w-0 truncate">{it.label}</span>
              {it.value && (
                <span className="font-semibold tabular-nums text-foreground shrink-0">{it.value}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {card.note && (
        <p className="text-[11px] text-muted-foreground mt-2.5 italic">{card.note}</p>
      )}
    </div>
  );
};

const Asisten = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = next.map((m) =>
        m.role === "user"
          ? { role: "user", content: m.content }
          : { role: "assistant", content: m.summary?.intro ?? m.content ?? "" }
      );
      const { data, error } = await supabase.functions.invoke("asisten-analisis", {
        body: { messages: apiMessages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([
        ...next,
        { role: "assistant", content: data.summary?.intro ?? "", summary: data.summary },
      ]);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat jawaban");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 && (
          <div className="native-card p-5 text-center">
            <div className="size-12 mx-auto rounded-2xl gradient-leaf flex items-center justify-center mb-3">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <h2 className="font-bold text-base">Asisten Analisis</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Tanya seputar pendapatan, tonase panen, dan perawatan kebun.
            </p>
            <div className="mt-4 space-y-2 text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-sm py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted press-effect"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="bg-primary text-primary-foreground max-w-[85%] ml-auto px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap"
            >
              {m.content}
            </div>
          ) : (
            <div key={i} className="space-y-2.5">
              {m.summary?.intro && (
                <div className="bg-muted text-foreground max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm">
                  {m.summary.intro}
                </div>
              )}
              {m.summary?.cards?.map((c, idx) => (
                <SummaryCardView key={idx} card={c} />
              ))}
            </div>
          )
        )}

        {loading && (
          <div className="bg-muted max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 pt-2 border-t border-border bg-background"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya sesuatu..."
          className="h-11 rounded-xl bg-muted/50 border-0"
          disabled={loading}
        />
        <Button type="submit" size="icon" className="size-11 rounded-xl shrink-0" disabled={loading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
};

export default Asisten;
