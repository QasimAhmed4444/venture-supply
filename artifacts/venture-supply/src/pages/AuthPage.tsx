import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, ChevronDown, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setSessionToken } from "@/lib/api";
import { useBusinessTypes } from "@/hooks/useBusinessTypes";
import type { Customer } from "@/data/customers";

function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function StatCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const count = useCountUp(target);
  return (
    <div className="text-center">
      <div className="text-5xl font-extrabold text-white tabular-nums tracking-tight">
        {count}{suffix}
      </div>
      <div className="text-sm font-semibold text-white/70 mt-1 uppercase tracking-widest">{label}</div>
    </div>
  );
}

interface Props { mode?: "login" | "register"; }

export function AuthPage({ mode = "login" }: Props) {
  const { t, language } = useLanguage();
  const { setRole, setRoleWithCustomer } = useRole();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const ar = language === "ar";

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
  const [regPhoneLocal, setRegPhoneLocal] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBizName, setRegBizName] = useState("");
  const [regCR, setRegCR] = useState("");
  const [regVAT, setRegVAT] = useState("");
  const [regBusinessTypeIds, setRegBusinessTypeIds] = useState<string[]>([]);
  const [btDropdownOpen, setBtDropdownOpen] = useState(false);

  const { data: businessTypes = [] } = useBusinessTypes();

  function redirectAfterAuth(role: string) {
    if (role === "admin") { setLocation("/admin"); return; }
    if (role === "sales") { setLocation("/sales"); return; }
    let returnTo = "/";
    try {
      const stored = sessionStorage.getItem("vs.returnTo");
      if (stored && !stored.startsWith("/login") && !stored.startsWith("/register")) {
        returnTo = stored;
      }
      sessionStorage.removeItem("vs.returnTo");
    } catch {}
    setLocation(returnTo);
  }

  const validateName = (name: string): string | null => {
    if (!name || name.trim().length < 2)
      return ar ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters";
    if (!/^[\u0600-\u06FFa-zA-Z\s'-]+$/.test(name.trim()))
      return ar ? "الاسم يجب أن يحتوي على أحرف فقط، بدون أرقام" : "Name must contain letters only, no numbers";
    return null;
  };

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
        if (result.role === "admin" || result.role === "sales") {
          toast({ title: "Please choose the correct login type.", variant: "destructive" });
          return;
        }
        if (result.role !== loginType) {
          toast({ title: "Please choose the correct login type.", variant: "destructive" });
          return;
        }
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
    const nameErr = validateName(regName);
    if (nameErr) { toast({ title: nameErr, variant: "destructive" }); return; }
    if (!regEmail || !regPhoneLocal || !regPassword) return;
    if (accountType === "b2b" && regBusinessTypeIds.length === 0) {
      toast({ title: "Business Type required", description: "Please select at least one business type.", variant: "destructive" });
      return;
    }
    const fullPhone = `+966${regPhoneLocal.replace(/\D/g, "")}`;
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
          phone: fullPhone,
          password: regPassword,
          type: accountType,
          businessName: accountType === "b2b" ? regBizName : undefined,
          businessTypeIds: accountType === "b2b" ? regBusinessTypeIds : undefined,
          crNumber: accountType === "b2b" ? regCR : undefined,
          vatNumber: accountType === "b2b" ? regVAT : undefined,
        }),
      });
      if (result.ok) {
        if (result.token) setSessionToken(result.token);
        setRoleWithCustomer(result.role as UserRole, result.customer);
        redirectAfterAuth(result.role);
        toast({ title: t("auth.welcome_back"), description: result.name });
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message ?? "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel: brand visual ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden flex-col">
        {/* Hero image */}
        <img
          src={`${(import.meta.env.BASE_URL ?? "").replace(/\/$/, "")}/auth-hero.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-primary/70" />
        {/* Subtle dot texture on top */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,_#ffffff_1px,transparent_1px)] bg-[length:32px_32px]" />
        <div className="relative z-10 p-10 flex flex-col h-full">
          <Link href="/" className="self-start">
            <div className="bg-white rounded-2xl px-6 py-4 hover:bg-white/90 transition-colors shadow-lg">
              <Logo size="xl" />
            </div>
          </Link>
          <div className="flex-1 flex flex-col justify-center mt-12">
            <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-5">
              {ar ? "أهلاً بك في\nفينتشر سبلاي" : <>Your Trusted<br />Wholesale Partner</>}
            </h2>
            <p className="text-white/80 text-lg font-medium max-w-sm leading-relaxed">
              {ar
                ? "منصتك الموثوقة للمواد الغذائية بالجملة في المملكة العربية السعودية"
                : "Premium wholesale food supply for businesses and households across Saudi Arabia"}
            </p>
            <div className="mt-14 grid grid-cols-3 gap-6">
              <StatCounter target={500} suffix="+" label={ar ? "منتج" : "Products"} />
              <StatCounter target={50} suffix="+" label={ar ? "علامة تجارية" : "Brands"} />
              <div className="text-center">
                <div className="text-5xl font-extrabold text-white tracking-tight">24/7</div>
                <div className="text-sm font-semibold text-white/70 mt-1 uppercase tracking-widest">{ar ? "دعم" : "Support"}</div>
              </div>
            </div>
          </div>
          <p className="text-white/30 text-xs mt-10">© 2026 Venture Supply. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background min-h-screen lg:min-h-0 overflow-y-auto">
        <div className="lg:hidden mb-6">
          <Link href="/"><Logo size="lg" /></Link>
        </div>

        <div className="w-full max-w-md">
          {/* Tab bar */}
          <div className="flex border-b border-border mb-7">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setLocation("/login"); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "login" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("auth.tab_login")}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("register"); setLocation("/register"); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "register" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("auth.tab_register")}
            </button>
          </div>

          {/* ── LOGIN ── */}
          {activeTab === "login" && (
            <div className="space-y-5">
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
                      className={`text-sm font-semibold py-2 rounded-sm transition-colors ${loginType === opt ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
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
                    ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {ar ? "جارٍ الدخول…" : "Signing in…"}</>
                    : (ar ? "تسجيل الدخول" : "Sign In")}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-secondary hover:underline"
                  onClick={() => setLocation("/reset-password")}
                >
                  {t("auth.forgot")}
                </button>
              </div>
            </div>
          )}

          {/* ── REGISTER ── */}
          {activeTab === "register" && (
            <div className="space-y-4">
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
                {/* Name */}
                <div>
                  <Label>{t("common.name")} <span className="text-rose-500">*</span></Label>
                  <Input value={regName} onChange={(e) => setRegName(e.target.value)} required minLength={2} />
                </div>

                {/* Email */}
                <div>
                  <Label>{t("common.email")} <span className="text-rose-500">*</span></Label>
                  <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>

                {/* Phone — two-box (+966 | local) */}
                <div>
                  <Label>{t("common.phone")} <span className="text-rose-500">*</span></Label>
                  <div className="flex mt-1">
                    <div className="flex items-center px-3 bg-muted border border-border border-r-0 rounded-l-md text-sm font-medium text-muted-foreground select-none shrink-0 h-9">
                      +966
                    </div>
                    <Input
                      value={regPhoneLocal}
                      onChange={(e) => setRegPhoneLocal(e.target.value.replace(/\D/g, ""))}
                      className="rounded-l-none"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                {accountType === "b2b" && (
                  <>
                    {/* Business Name */}
                    <div>
                      <Label>{t("checkout.business_name")} <span className="text-rose-500">*</span></Label>
                      <Input value={regBizName} onChange={(e) => setRegBizName(e.target.value)} required />
                    </div>

                    {/* Business Type dropdown */}
                    <div>
                      <Label>
                        Business Type <span className="text-rose-500">*</span>{" "}
                        <span className="text-xs text-muted-foreground font-normal">(select all that apply)</span>
                      </Label>
                      {(() => {
                        const activeTypes = businessTypes.filter((bt) => bt.status === "active");
                        const allSelected = activeTypes.length > 0 && regBusinessTypeIds.length === activeTypes.length;
                        return (
                          <div
                            className="relative mt-1.5"
                            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setBtDropdownOpen(false); }}
                          >
                            <button
                              type="button"
                              className="w-full h-9 px-3 border rounded-md bg-background text-sm text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                              onClick={() => setBtDropdownOpen((o) => !o)}
                            >
                              <span className={regBusinessTypeIds.length ? "text-foreground" : "text-muted-foreground"}>
                                {regBusinessTypeIds.length
                                  ? activeTypes.filter((bt) => regBusinessTypeIds.includes(bt.id)).map((bt) => bt.name).join(", ")
                                  : "Select business types…"}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${btDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            {btDropdownOpen && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 border rounded-md bg-popover shadow-lg">
                                <div className="p-1.5 border-b">
                                  <button
                                    type="button"
                                    tabIndex={0}
                                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-muted rounded flex items-center gap-2 font-medium"
                                    onClick={() => setRegBusinessTypeIds(allSelected ? [] : activeTypes.map((bt) => bt.id))}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${allSelected ? "bg-primary border-primary" : "border-border"}`}>
                                      {allSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                    {allSelected ? "Deselect All" : "Select All"}
                                  </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto p-1">
                                  {activeTypes.map((bt) => {
                                    const checked = regBusinessTypeIds.includes(bt.id);
                                    return (
                                      <label key={bt.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm" tabIndex={0}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                                          {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                        <input
                                          type="checkbox"
                                          className="sr-only"
                                          checked={checked}
                                          onChange={(e) => setRegBusinessTypeIds(
                                            e.target.checked ? [...regBusinessTypeIds, bt.id] : regBusinessTypeIds.filter((id) => id !== bt.id)
                                          )}
                                        />
                                        {bt.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* CR Number (optional) */}
                    <div>
                      <Label>
                        {t("checkout.cr_number")}{" "}
                        <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input value={regCR} onChange={(e) => setRegCR(e.target.value)} />
                    </div>

                    {/* VAT Number */}
                    <div>
                      <Label>{t("checkout.vat_number")}</Label>
                      <Input value={regVAT} onChange={(e) => setRegVAT(e.target.value)} />
                    </div>
                  </>
                )}

                {/* Password */}
                <div>
                  <Label>{t("common.password")} <span className="text-rose-500">*</span></Label>
                  <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} minLength={6} required />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                  data-testid="button-register-submit"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {ar ? "جارٍ الإنشاء…" : "Creating account…"}</>
                    : t("common.register")}
                </Button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/">
              <span className="hover:text-foreground cursor-pointer inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> {ar ? "العودة للرئيسية" : "Back to Home"}
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
