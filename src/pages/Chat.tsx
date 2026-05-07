import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { clearUnread, getUnreadMap, onUnreadChange, ME_KEY } from "@/lib/chatUnread";

interface Petani {
  id: string;
  nama: string;
  foto_url: string | null;
}

interface Msg {
  id: string;
  sender_petani_id: string;
  receiver_petani_id: string;
  content: string;
  created_at: string;
}



const Chat = () => {
  const [petaniList, setPetaniList] = useState<Petani[]>([]);
  const [meId, setMeId] = useState<string>(() => localStorage.getItem(ME_KEY) ?? "");
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("petani").select("id,nama,foto_url").order("nama").then(({ data }) => {
      setPetaniList((data as Petani[]) ?? []);
    });
  }, []);

  const me = petaniList.find((p) => p.id === meId);
  const active = petaniList.find((p) => p.id === activeId);

  // Load messages for active conversation
  useEffect(() => {
    if (!meId || !activeId) return;
    supabase
      .from("chat_messages")
      .select("*")
      .or(
        `and(sender_petani_id.eq.${meId},receiver_petani_id.eq.${activeId}),and(sender_petani_id.eq.${activeId},receiver_petani_id.eq.${meId})`
      )
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Msg[]) ?? []));
  }, [meId, activeId]);

  // Realtime
  useEffect(() => {
    if (!meId || !activeId) return;
    const channel = supabase
      .channel(`chat-${meId}-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Msg;
        const isPair =
          (m.sender_petani_id === meId && m.receiver_petani_id === activeId) ||
          (m.sender_petani_id === activeId && m.receiver_petani_id === meId);
        if (isPair) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const filtered = useMemo(
    () => petaniList.filter((p) => p.id !== meId && p.nama.toLowerCase().includes(search.toLowerCase())),
    [petaniList, meId, search]
  );

  const send = async () => {
    if (!input.trim() || !meId || !activeId) return;
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      sender_petani_id: meId,
      receiver_petani_id: activeId,
      content,
    });
    if (error) toast.error("Gagal mengirim pesan");
  };

  const pickMe = (id: string) => {
    setMeId(id);
    localStorage.setItem(ME_KEY, id);
  };

  // Step 1: pilih identitas
  if (!meId) {
    return (
      <div className="space-y-3">
        <div className="native-card p-4">
          <h2 className="font-semibold mb-1">Pilih identitas Anda</h2>
          <p className="text-xs text-muted-foreground">Pilih nama petani untuk mulai live chat.</p>
        </div>
        <div className="space-y-2">
          {petaniList.map((p) => (
            <button
              key={p.id}
              onClick={() => pickMe(p.id)}
              className="w-full native-card p-3 flex items-center gap-3 press-effect text-left"
            >
              <Avatar className="size-10">
                {p.foto_url && <AvatarImage src={p.foto_url} />}
                <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{p.nama}</span>
            </button>
          ))}
          {petaniList.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Belum ada data petani.</p>
          )}
        </div>
      </div>
    );
  }

  // Step 2: chat room
  if (activeId && active) {
    return (
      <div className="flex flex-col h-[calc(100dvh-9rem)]">
        <div className="native-card p-3 flex items-center gap-3 mb-2">
          <button onClick={() => setActiveId("")} className="p-1 -ml-1">
            <ArrowLeft className="size-5" />
          </button>
          <Avatar className="size-10">
            {active.foto_url && <AvatarImage src={active.foto_url} />}
            <AvatarFallback>{active.nama.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{active.nama}</div>
            <div className="text-[10px] text-muted-foreground">Online</div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 px-1 py-2">
          {messages.map((m) => {
            const mine = m.sender_petani_id === meId;
            const sender = mine ? me : active;
            return (
              <div key={m.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
                {!mine && (
                  <Avatar className="size-7 mt-auto">
                    {sender?.foto_url && <AvatarImage src={sender.foto_url} />}
                    <AvatarFallback className="text-[10px]">{sender?.nama.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words",
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {!mine && <div className="text-[10px] font-semibold opacity-70 mb-0.5">{sender?.nama}</div>}
                  {m.content}
                  <div className={cn("text-[9px] mt-1 opacity-60", mine ? "text-right" : "")}>
                    {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">Belum ada pesan. Sapa duluan!</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tulis pesan..."
            className="flex-1"
          />
          <Button onClick={send} size="icon" className="shrink-0">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: daftar kontak
  return (
    <div className="space-y-3">
      <div className="native-card p-3 flex items-center gap-3">
        <Avatar className="size-10">
          {me?.foto_url && <AvatarImage src={me.foto_url} />}
          <AvatarFallback>{me?.nama.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-muted-foreground">Masuk sebagai</div>
          <div className="font-semibold truncate">{me?.nama}</div>
        </div>
        <button onClick={() => pickMe("")} className="text-xs text-primary">
          Ganti
        </button>
      </div>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari petani..."
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className="w-full native-card p-3 flex items-center gap-3 press-effect text-left"
          >
            <Avatar className="size-11">
              {p.foto_url && <AvatarImage src={p.foto_url} />}
              <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.nama}</div>
              <div className="text-xs text-muted-foreground truncate">Ketuk untuk chat</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Tidak ada petani ditemukan.</p>
        )}
      </div>
    </div>
  );
};

export default Chat;
