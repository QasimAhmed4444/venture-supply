import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setSessionToken } from "@/lib/api";

export function AdminLoginPage() {
  const { t } = useLanguage();
  const { setRole } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await apiFetch<{
        ok: boolean; role: string; name: string; salespersonId?: string; token?: string;
      }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (result.ok) {
        if (result.role !== "admin" && result.role !== "sales") {
          toast({
            title: "Access Denied",
            description: "This portal is for staff only. Please use the main login.",
            variant: "destructive",
          });
          return;
        }
        if (result.token) setSessionToken(result.token);
        setRole(result.role as UserRole);
        if (result.role === "admin") setLocation("/admin");
        else setLocation("/sales");
        toast({ title: `Welcome back, ${result.name}` });
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message ?? "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-[#0c3d6e] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 space-y-3">
          <Link href="/">
            <div className="inline-block bg-white rounded-xl px-6 py-3">
              <Logo size="lg" />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Staff Portal</span>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-7">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-primary">Staff Sign In</h1>
              <p className="text-sm text-muted-foreground mt-1">Admin &amp; Salesperson access only</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@venturesupply.sa"
                  required
                  autoComplete="email"
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  data-testid="input-admin-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 mt-2"
                disabled={isLoading}
                data-testid="button-admin-login-submit"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Signing in…</>
                  : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/60 mt-5">
          <Link href="/">
            <span className="hover:text-white cursor-pointer inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to storefront
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
