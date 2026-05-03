import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ShieldCheck, UserCog, Briefcase } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setSessionToken } from "@/lib/api";

const PORTAL_LABELS = {
  admin: {
    emailLabel: "Admin Email",
    emailPlaceholder: "admin@venturesupply.sa",
    passwordLabel: "Admin Password",
    buttonText: "Sign in as Admin",
  },
  sales: {
    emailLabel: "Salesperson Email",
    emailPlaceholder: "salesperson@venturesupply.sa",
    passwordLabel: "Salesperson Password",
    buttonText: "Sign in as Salesperson",
  },
} as const;

export function AdminLoginPage() {
  const { t } = useLanguage();
  const { setRoleWithSalespersonId } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [portal, setPortal] = useState<"admin" | "sales">("admin");

  const labels = PORTAL_LABELS[portal];

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
        if (result.role !== portal) {
          toast({
            title: "Wrong portal",
            description: `Your account is a ${result.role} account. Please pick the matching portal.`,
            variant: "destructive",
          });
          return;
        }
        if (result.token) setSessionToken(result.token);
        setRoleWithSalespersonId(result.role as UserRole, result.salespersonId ?? null);
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
            <div className="mb-5">
              <h1 className="text-xl font-bold text-primary">Staff Sign In</h1>
              <p className="text-sm text-muted-foreground mt-1">Choose your portal to continue</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5" role="tablist">
              {([
                { v: "admin", label: "Admin", icon: UserCog },
                { v: "sales", label: "Salesperson", icon: Briefcase },
              ] as const).map((opt) => {
                const active = portal === opt.v;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPortal(opt.v)}
                    data-testid={`tab-portal-${opt.v}`}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="admin-email">{labels.emailLabel}</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={labels.emailPlaceholder}
                  required
                  autoComplete="email"
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">{labels.passwordLabel}</Label>
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
                  : labels.buttonText}
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
