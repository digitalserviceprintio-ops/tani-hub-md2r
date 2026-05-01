import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sprout, Users, MapPin, BarChart3, Plus, LogOut, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-earth flex items-center justify-center shadow-soft">
              <Sprout className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-serif font-bold text-lg leading-none text-primary">TaniHub</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{title}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-primary gap-1.5">
            <LogOut className="size-4" />
            <span className="text-xs">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-5 pb-28 animate-fade-in">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-card">
        <div className="max-w-2xl mx-auto px-2 py-2 grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                  item.isCta
                    ? "gradient-leaf text-success-foreground shadow-cta scale-110 -mt-5 size-14 self-center"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )
              }
            >
              <item.icon className={cn(item.isCta ? "size-6" : "size-5")} strokeWidth={2.2} />
              {!item.isCta && <span className="text-[10px] font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
