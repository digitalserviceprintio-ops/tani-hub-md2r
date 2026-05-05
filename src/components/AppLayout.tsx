import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sprout, Users, MapPin, BarChart3, Plus, LogOut, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatFab from "./ChatFab";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/petani", icon: Users, label: "Petani" },
  { to: "/input", icon: Plus, label: "Panen", isCta: true },
  { to: "/blok", icon: MapPin, label: "Blok" },
  { to: "/perawatan", icon: Wrench, label: "Rawat" },
  { to: "/laporan", icon: BarChart3, label: "Laporan" },
];

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/input": "Input Panen",
  "/petani": "Petani Plasma",
  "/blok": "Data Blok",
  "/perawatan": "Perawatan",
  "/rekap-perawatan": "Rekap Perawatan",
  "/asisten": "Asisten Analisis",
  "/chat": "Live Chat Petani",
  "/laporan": "Laporan & Rekap",
};

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] ?? "TaniHub";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* iOS-style header */}
      <header className="safe-top sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg gradient-earth flex items-center justify-center">
              <Sprout className="size-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-base leading-none tracking-tight">{title}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      {/* iOS-style tab bar */}
      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 bg-card/90 backdrop-blur-xl border-t border-border/60">
        <div className="max-w-lg mx-auto px-1 pt-1.5 pb-1 grid grid-cols-6">
          {navItems.map((item) => {
            if (item.isCta) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center py-1"
                >
                  <div className="size-11 rounded-full gradient-leaf flex items-center justify-center shadow-cta -mt-4 press-effect">
                    <Plus className="size-5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors press-effect",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="size-5" strokeWidth={1.8} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      <ChatFab />
    </div>
  );
};

export default AppLayout;
