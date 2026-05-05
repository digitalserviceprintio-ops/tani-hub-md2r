import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chat-fab-pos";

const ChatFab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPos(JSON.parse(saved));
        return;
      } catch {}
    }
    setPos({ x: window.innerWidth - 72, y: window.innerHeight - 160 });
  }, []);

  const clamp = (x: number, y: number) => {
    const size = 56;
    const pad = 8;
    return {
      x: Math.max(pad, Math.min(window.innerWidth - size - pad, x)),
      y: Math.max(pad + 56, Math.min(window.innerHeight - size - 80, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    const rect = btnRef.current!.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    btnRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const next = clamp(e.clientX - offset.current.x, e.clientY - offset.current.y);
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 1) moved.current = true;
    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    btnRef.current!.releasePointerCapture(e.pointerId);
    if (pos) localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    if (!moved.current) navigate("/chat");
  };

  if (!pos || location.pathname === "/auth" || location.pathname.startsWith("/chat")) return null;

  return (
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: pos.x, top: pos.y }}
      className={cn(
        "fixed z-40 size-14 rounded-full gradient-leaf shadow-cta",
        "flex items-center justify-center text-primary-foreground",
        "touch-none select-none active:scale-95 transition-transform"
      )}
      aria-label="Live Chat Petani"
    >
      <Sprout className="size-6" strokeWidth={2.2} />
      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-destructive border-2 border-background" />
    </button>
  );
};

export default ChatFab;
