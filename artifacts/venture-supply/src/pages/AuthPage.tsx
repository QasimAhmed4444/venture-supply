import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setSessionToken } from "@/lib/api";
import type { Customer } from "@/data/customers";

interface Props { mode?: "login" | "register"; }

export function AuthPage({ mode = "login" }: Props) {
  const { t } = useLanguage();
  const { setRole, setRoleWithCustomer } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"login" | "register">(mode);
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2c");
  const [loginType, setLoginType] = useState<"b2c" | "b2b">("b2c");
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const as = params.get("as");
    if (as === "b2b" || as === "b2c") {
      setLoginType(as);
      setAccountType(as);
    }
  }, []);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBizName, setRegBizName] = useState("");
  const [regCR, setRegCR] = useState("");
  const [regVAT, setRegVAT] = useState("");

  function redirectAfterAuth(role: string) {
    if (role === "admin") setLocation("/admin");
    else if (role === "sales") setLocation("/sales");
    else setLocation("/account");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await apiFetch<{
        ok: boolean; role: string; name: string; token?: string;
        salespersonId?: string; customer?: Customer | null;
      }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (result.ok) {
        if (result.token) setSessionToken(result.token);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) return;
    setIsLoading(true);
    try {
      const result = await apiFetch<{
        ok: boolean; role: string; name: string; token?: string; customer: Customer;
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
        if (result.token) setSessionToken(result.token);
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
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex cursor-pointer" data-testid="link-home-logo">
            <Logo size="lg" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" onClick={() => setLocation("/login")}>{t("auth.tab_login")}</TabsTrigger>
                <TabsTrigger value="register" onClick={() => setLocation("/register")}>{t("auth.tab_register")}</TabsTrigger>
              </TabsList>

              {/* Login tab */}
              <TabsContent value="login" className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("auth.welcome_back")}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.login_subtitle")}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">{t("auth.account_type")}</Label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-md">
                    {(["b2c", "b2b"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setLoginType(opt)}
                        className={`text-sm font-semibold py-2 rounded-sm transition-colors ${
                          loginType === opt
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-login-type-${opt}`}
                      >
                        {t(`auth.account.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <Label>{t("common.email")}</Label>
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.sa"
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <div>
                    <Label>{t("common.password")}</Label>
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
                      : "Sign In"}
                  </Button>
                </form>

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

              {/* Register tab */}
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
                  <div><Label>{t("common.password")}</Label><Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} minLength={6} required /></div>
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
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/">
            <span className="hover:text-foreground cursor-pointer inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
