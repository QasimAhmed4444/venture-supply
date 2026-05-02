import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Props { mode?: "login" | "register"; }

export function AuthPage({ mode = "login" }: Props) {
  const { t } = useLanguage();
  const { setRole } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<"b2c" | "b2b">("b2c");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const demoLogin = (role: UserRole) => {
    setRole(role);
    if (role === "admin") setLocation("/admin");
    else if (role === "sales") setLocation("/sales");
    else setLocation("/account");
    toast({ title: t("auth.welcome_back") });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOrEmail.includes("@")) {
      setIsLoading(true);
      try {
        const result = await apiFetch<{ ok: boolean; role: string; name: string; salespersonId?: string }>(
          "/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: phoneOrEmail, password }),
          }
        );
        if (result.ok) {
          setRole(result.role as UserRole);
          if (result.role === "admin") setLocation("/admin");
          else if (result.role === "sales") setLocation("/sales");
          else setLocation("/account");
          toast({ title: t("auth.welcome_back"), description: result.name });
        }
      } catch {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep("otp");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/"><Logo size="lg" /></Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue={mode}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" onClick={() => setLocation("/login")}>{t("auth.tab_login")}</TabsTrigger>
                <TabsTrigger value="register" onClick={() => setLocation("/register")}>{t("auth.tab_register")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("auth.welcome_back")}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.login_subtitle")}</p>
                </div>

                {step === "form" ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <Label>{t("common.phone")} / Email</Label>
                      <Input
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        placeholder="+966 5X XXX XXXX or admin@example.com"
                        required
                        data-testid="input-login-phone"
                      />
                    </div>
                    <div>
                      <Label>{t("common.password")}</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-login-submit">
                      {isLoading ? "Signing in…" : phoneOrEmail.includes("@") ? "Sign In" : t("auth.send_otp")}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>{t("auth.otp_label")}</Label>
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} className="text-center text-2xl tracking-widest font-mono" placeholder="••••" data-testid="input-otp" />
                      <p className="text-xs text-muted-foreground mt-1">{t("auth.otp_hint")}</p>
                    </div>
                    <Button onClick={verifyOtp} className="w-full bg-primary hover:bg-primary/90" data-testid="button-verify-otp">{t("auth.verify_otp")}</Button>
                  </div>
                )}

                <div className="text-center">
                  <button className="text-sm text-secondary hover:underline" onClick={() => toast({ title: t("auth.forgot"), description: t("common.feature_coming_soon") })}>
                    {t("auth.forgot")}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{t("auth.create_account")}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{t("auth.register_subtitle")}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">{t("auth.account_type")}</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as any)} className="grid grid-cols-2 gap-3">
                    {[{ v: "b2c", l: t("auth.account.b2c") }, { v: "b2b", l: t("auth.account.b2b") }].map((o) => (
                      <Label key={o.v} className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer hover-elevate ${accountType === o.v ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value={o.v} />
                        <span className="text-sm font-medium">{o.l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setRole(accountType); setLocation("/account"); toast({ title: t("auth.welcome_back") }); }}>
                  <div><Label>{t("common.name")}</Label><Input placeholder="Ahmed Al-Qahtani" required /></div>
                  <div><Label>{t("common.email")}</Label><Input type="email" placeholder="you@example.sa" required /></div>
                  <div><Label>{t("common.phone")}</Label><Input placeholder="+966 5X XXX XXXX" required /></div>
                  {accountType === "b2b" && (
                    <>
                      <div><Label>{t("checkout.business_name")}</Label><Input placeholder="Restaurant LLC" required /></div>
                      <div><Label>{t("checkout.cr_number")}</Label><Input placeholder="1010 234 567" required /></div>
                    </>
                  )}
                  <div><Label>{t("common.password")}</Label><Input type="password" placeholder="••••••••" required /></div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" data-testid="button-register-submit">{t("common.register")}</Button>
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
