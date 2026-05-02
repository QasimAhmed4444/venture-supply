import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import type { Customer } from "@/data/customers";

interface Props { mode?: "login" | "register"; }

export function AuthPage({ mode = "login" }: Props) {
  const { t } = useLanguage();
  const { setRole, setRoleWithCustomer } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ── shared state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"login" | "register">(mode);
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2c");
  const [isLoading, setIsLoading] = useState(false);

  // ── login state ───────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");

  // ── register state ────────────────────────────────────────────────────────
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBizName, setRegBizName] = useState("");
  const [regCR, setRegCR] = useState("");
  const [regVAT, setRegVAT] = useState("");

  // ── helpers ───────────────────────────────────────────────────────────────
  function redirectAfterAuth(role: string) {
    if (role === "admin") setLocation("/admin");
    else if (role === "sales") setLocation("/sales");
    else setLocation("/account");
  }

  const demoLogin = (role: UserRole) => {
    setRole(role);
    redirectAfterAuth(role);
    toast({ title: t("auth.welcome_back") });
  };

  // ── login submit ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.includes("@")) {
      setStep("otp");
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiFetch<{
        ok: boolean; role: string; name: string;
        salespersonId?: string; customer?: Customer | null;
      }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (result.ok) {
        if (result.customer) {
          setRoleWithCustomer(result.role as UserRole, result.customer);
        } else {
          setRole(result.role as UserRole);
        }
        redirectAfterAuth(result.role);
        toast({ title: t("auth.welcome_back"), description: result.name });
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message ?? "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = () => {
    if (otp.length < 4) {
      toast({ title: "OTP", description: t("auth.otp_hint"), variant: "destructive" });
      return;
    }
    setRole(accountType);
    setLocation("/account");
    toast({ title: t("auth.welcome_back") });
  };

  // ── register submit ───────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) return;
    setIsLoading(true);
    try {
      const result = await apiFetch<{
        ok: boolean; role: string; name: string; customer: Customer;
      }>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          type: accountType,
          businessName: accountType === "b2b" ? regBizName : undefined,
          crNumber: accountType === "b2b" ? regCR : undefined,
          vatNumber: accountType === "b2b" ? regVAT : undefined,
        }),
      });
      if (result.ok) {
        setRoleWithCustomer(result.role as UserRole, result.customer);
        setLocation("/account");
        toast({ title: t("auth.welcome_back"), description: result.name });
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message ?? "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/"><Logo size="lg" /></Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setStep("form"); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" onClick={() => setLocation("/login")}>{t("auth.tab_login")}</TabsTrigger>
                <TabsTrigger value="register" onClick={() => setLocation("/register")}>{t("auth.tab_register")}</TabsTrigger>
              </TabsList>

              {/* ── Login tab ─────────────────────────────────────────── */}
              <TabsContent value="login" className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("auth.welcome_back")}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.login_subtitle")}</p>
                </div>

                {step === "form" ? (
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                      <Label>{t("common.phone")} / Email</Label>
                      <Input
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="+966 5X XXX XXXX or admin@example.com"
                        required
                        data-testid="input-login-phone"
                      />
                    </div>
                    <div>
                      <Label>{t("common.password")}</Label>
                      <Input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                      data-testid="button-login-submit"
                    >
                      {isLoading
                        ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Signing in…</>
                        : loginEmail.includes("@") ? "Sign In" : t("auth.send_otp")}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>{t("auth.otp_label")}</Label>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={4}
                        className="text-center text-2xl tracking-widest font-mono"
                        placeholder="••••"
                        data-testid="input-otp"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t("auth.otp_hint")}</p>
                    </div>
                    <Button onClick={verifyOtp} className="w-full bg-primary hover:bg-primary/90" data-testid="button-verify-otp">
                      {t("auth.verify_otp")}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setStep("form")}
                    >
                      ← Back
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-secondary hover:underline"
                    onClick={() => toast({ title: t("auth.forgot"), description: t("common.feature_coming_soon") })}
                  >
                    {t("auth.forgot")}
                  </button>
                </div>
              </TabsContent>

              {/* ── Register tab ──────────────────────────────────────── */}
              <TabsContent value="register" className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("auth.create_account")}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.register_subtitle")}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">{t("auth.account_type")}</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)} className="grid grid-cols-2 gap-3">
                    {[{ v: "b2c", l: t("auth.account.b2c") }, { v: "b2b", l: t("auth.account.b2b") }].map((o) => (
                      <Label
                        key={o.v}
                        className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer hover-elevate ${accountType === o.v ? "border-primary bg-primary/5" : ""}`}
                      >
                        <RadioGroupItem value={o.v} />
                        <span className="text-sm font-medium">{o.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <form className="space-y-3" onSubmit={handleRegister}>
                  <div><Label>{t("common.name")}</Label><Input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Ahmed Al-Qahtani" required /></div>
                  <div><Label>{t("common.email")}</Label><Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.sa" required /></div>
                  <div><Label>{t("common.phone")}</Label><Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+966 5X XXX XXXX" required /></div>
                  {accountType === "b2b" && (
                    <>
                      <div><Label>{t("checkout.business_name")}</Label><Input value={regBizName} onChange={(e) => setRegBizName(e.target.value)} placeholder="Restaurant LLC" required /></div>
                      <div><Label>{t("checkout.cr_number")}</Label><Input value={regCR} onChange={(e) => setRegCR(e.target.value)} placeholder="1010 234 567" /></div>
                      <div><Label>{t("checkout.vat_number")}</Label><Input value={regVAT} onChange={(e) => setRegVAT(e.target.value)} placeholder="300 123 456 7800003" /></div>
                    </>
                  )}
                  <div><Label>{t("common.password")}</Label><Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" minLength={6} required /></div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                    data-testid="button-register-submit"
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Creating account…</>
                      : t("common.register")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground uppercase tracking-wider font-semibold">Demo quick login</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => demoLogin("b2c")} data-testid="button-demo-b2c">{t("auth.demo_login_b2c")}</Button>
                <Button variant="outline" size="sm" onClick={() => demoLogin("b2b")} data-testid="button-demo-b2b">{t("auth.demo_login_b2b")}</Button>
                <Button variant="outline" size="sm" onClick={() => demoLogin("admin")} data-testid="button-demo-admin">{t("auth.demo_login_admin")}</Button>
                <Button variant="outline" size="sm" onClick={() => demoLogin("sales")} data-testid="button-demo-sales">{t("auth.demo_login_sales")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/"><span className="hover:text-foreground cursor-pointer">{t("common.back")} {t("nav.home").toLowerCase()}</span></Link>
        </p>
      </div>
    </div>
  );
}
