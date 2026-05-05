CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_petani_id UUID NOT NULL,
  receiver_petani_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_pair ON public.chat_messages (sender_petani_id, receiver_petani_id, created_at DESC);
CREATE INDEX idx_chat_messages_receiver ON public.chat_messages (receiver_petani_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public can insert chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update chat_messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Public can delete chat_messages" ON public.chat_messages FOR DELETE USING (true);

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;