import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { bumpUnread, ME_KEY } from "@/lib/chatUnread";

interface Petani {
  id: string;
  nama: string;
  foto_url: string | null;
}

const ChatNotifier = () => {
  const location = useLocation();

  useEffect(() => {
    const meId = localStorage.getItem(ME_KEY);
    if (!meId) return;

    let petaniMap: Record<string, Petani> = {};
    supabase
      .from("petani")
      .select("id,nama,foto_url")
      .then(({ data }) => {
        (data ?? []).forEach((p: any) => (petaniMap[p.id] = p));
      });

    const channel = supabase
      .channel(`chat-notify-${meId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `receiver_petani_id=eq.${meId}` },
        (payload) => {
          const m = payload.new as any;
          // Skip if user is currently chatting with this sender
          const inChatRoute = location.pathname.startsWith("/chat");
          const activeId = sessionStorage.getItem("chat-active-id");
          if (inChatRoute && activeId === m.sender_petani_id) return;

          bumpUnread(m.sender_petani_id);
          const sender = petaniMap[m.sender_petani_id];
          toast.message(`💬 ${sender?.nama ?? "Petani"}`, {
            description: m.content.length > 60 ? m.content.slice(0, 60) + "..." : m.content,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.pathname]);

  return null;
};

export default ChatNotifier;
