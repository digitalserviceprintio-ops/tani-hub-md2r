import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sprout, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Masuk · TaniHub";
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email atau password salah" : error.message);
    } else {
      toast.success("Berhasil masuk");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Email sudah terdaftar, silakan masuk");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Akun berhasil dibuat!");
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="size-20 rounded-3xl gradient-earth flex items-center justify-center shadow-cta mb-5">
            <Sprout className="size-10 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-3xl tracking-tight">TaniHub</h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen Panen Plasma Sawit</p>
        </div>

        {/* Auth Card */}
        <div className="native-card p-5">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-5 h-10 bg-muted rounded-lg p-0.5">
              <TabsTrigger value="login" className="rounded-md text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">Masuk</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <Input id="login-email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base" disabled={loading}>
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Masuk"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <Input id="signup-email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <Input id="signup-password" type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base" disabled={loading}>
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Buat Akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Dengan masuk, Anda menyetujui ketentuan penggunaan TaniHub
        </p>
      </div>
    </div>
  );
};

export default Auth;
