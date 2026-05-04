import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Estimasi pendapatan dari total tonase panen",
  "Blok mana yang paling produktif?",
  "Ringkas aktivitas perawatan bulan ini",
  "Tren panen 7 hari terakhir",
];

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
      const { data, error } = await supabase.functions.invoke("asisten-analisis", {
        body: { messages: next },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.reply }]);
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

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="bg-muted text-foreground max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
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
