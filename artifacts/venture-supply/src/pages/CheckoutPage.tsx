import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, CreditCard, Building2, Banknote, Wallet, Loader2, Tag, X, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder } from "@/hooks/useOrders";
import { PriceTag } from "@/components/PriceTag";
import { apiFetch } from "@/lib/api";

interface ValidatedCoupon {
  code: string;
  enTitle: string;
  arTitle: string;
  type: string;
  value: number;
  discount: number;
  freeDelivery: boolean;
}

export function CheckoutPage() {
  const { items, subtotal, vat, total, clear } = useCart();
  const { t, isRTL, language } = useLanguage();
  const { role, customer } = useRole();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const isB2B = role === "b2b";

  // ── Guest guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role === "guest") {
      try { sessionStorage.setItem("vs.returnTo", "/checkout"); } catch {}
      setLocation("/login");
    }
  }, [role, setLocation]);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<string>(isB2B ? "credit" : "cod");
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [city, setCity] = useState(customer?.city ?? "Riyadh");
  const [address, setAddress] = useState(customer?.addresses[0]?.fullAddress ?? "");
  const [notes, setNotes] = useState("");
  const [businessName, setBusinessName] = useState(customer?.business?.name ?? "");
  const [businessType, setBusinessType] = useState<string>(customer?.business?.type ?? "retailer");
  const [crNumber, setCrNumber] = useState(customer?.business?.crNumber ?? "");
  const [vatNumber, setVatNumber] = useState(customer?.business?.vatNumber ?? "");

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);

  const baseDelivery = orderType === "pickup" ? 0 : isB2B ? 0 : subtotal >= 200 ? 0 : 25;
  const deliveryCharge = appliedCoupon?.freeDelivery ? 0 : baseDelivery;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const grandTotal = +(total + deliveryCharge - couponDiscount).toFixed(2);

  // ── Saudi-specific validation ──────────────────────────────────────────────
  // Accept Saudi mobile (5xxxxxxxx) AND landline (1xxxxxxxx … 9xxxxxxxx, e.g. Riyadh +966 11 …).
  const saudiPhoneOk = (v: string) => /^(?:\+?966|0)?[1-9]\d{8}$/.test(v.replace(/[\s\-]/g, ""));
  const crOk = (v: string) => /^\d{10}$/.test(v.replace(/\s/g, ""));
  // KSA VAT TIN: 15 digits ending in "03". Tolerate seed data with extra trailing digit (16).
  const vatOk = (v: string) => {
    const d = v.replace(/\s/g, "");
    return /^\d{12}03\d$/.test(d) || /^\d{13}03\d$/.test(d);
  };

  const phoneInvalid = !!phone && !saudiPhoneOk(phone);
  const crInvalid = isB2B && !!crNumber && !crOk(crNumber);
  const vatInvalid = isB2B && !!vatNumber && !vatOk(vatNumber);

  // ── Credit gating ──────────────────────────────────────────────────────────
  const biz = customer?.business;
  const allowCredit = !!biz?.allowCredit;
  const approvalStatus = biz?.approvalStatus ?? (allowCredit ? "approved" : "pending");
  const creditLimit = biz?.creditLimit ?? 0;
  const creditUsed = biz?.creditUsed ?? 0;
  const creditAvailable = Math.max(0, (creditLimit ?? 0) - creditUsed);
  const creditApproved = isB2B && allowCredit && approvalStatus === "approved";
  const creditExceeded = paymentMethod === "credit" && grandTotal > creditAvailable;
  const creditBlocked = paymentMethod === "credit" && (!creditApproved || creditExceeded);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const result = await apiFetch<ValidatedCoupon>(
        `/coupons/validate?code=${encodeURIComponent(code)}&total=${grandTotal}&audience=${isB2B ? "b2b" : "b2c"}`
      );
      setAppliedCoupon(result);
      toast({
        title: language === "ar" ? "تم تطبيق الكوبون" : "Coupon applied",
        description: result.type === "free_delivery"
          ? (language === "ar" ? "شحن مجاني!" : "Free delivery!")
          : (language === "ar" ? `وفّرت ${result.discount.toFixed(2)} ر.س` : `You save SAR ${result.discount.toFixed(2)}`),
      });
    } catch (err: any) {
      toast({
        title: language === "ar" ? "كوبون غير صالح" : "Invalid coupon",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderType === "delivery" && phoneInvalid) {
      toast({
        title: language === "ar" ? "رقم جوال غير صحيح" : "Invalid Saudi mobile number",
        description: language === "ar" ? "يرجى إدخال رقم بصيغة 05xxxxxxxx أو ‎+966" : "Use format 05xxxxxxxx or +966 5xxxxxxxx",
        variant: "destructive",
      });
      return;
    }
    if (isB2B) {
      if (crInvalid) {
        toast({
          title: language === "ar" ? "رقم السجل التجاري غير صحيح" : "Invalid CR number",
          description: language === "ar" ? "يجب أن يتكوّن من 10 أرقام" : "CR must be exactly 10 digits",
          variant: "destructive",
        });
        return;
      }
      if (vatInvalid) {
        toast({
          title: language === "ar" ? "رقم ضريبي غير صحيح" : "Invalid VAT number",
          description: language === "ar" ? "يجب أن يتكوّن من 15 رقماً وينتهي بـ 03" : "VAT must be 15 digits and end with 03",
          variant: "destructive",
        });
        return;
      }
      if (paymentMethod === "credit") {
        if (!creditApproved) {
          toast({
            title: language === "ar" ? "حساب الائتمان غير معتمد" : "Credit account not approved",
            description: language === "ar" ? "يرجى التواصل مع مدير حسابك" : "Please contact your account manager",
            variant: "destructive",
          });
          return;
        }
        if (creditExceeded) {
          toast({
            title: language === "ar" ? "تجاوز حد الائتمان" : "Exceeds credit limit",
            description: language === "ar"
              ? `المتاح: ${creditAvailable.toFixed(2)} ر.س`
              : `Available: SAR ${creditAvailable.toFixed(2)}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const id = `o-${crypto.randomUUID()}`;
    const trackingId = `VS-O-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const placedAt = new Date().toISOString();
    const estDays = orderType === "pickup" ? 1 : isB2B ? 4 : 2;
    const estimatedAt = new Date(Date.now() + estDays * 86_400_000).toISOString();
    const deliveryAddress =
      orderType === "pickup"
        ? "Pickup — Riyadh Hub, Al Sulay"
        : `${address}, ${city}`;

    createOrder.mutate(
      {
        id,
        trackingId,
        customerId: customer?.id ?? `guest-${Date.now()}`,
        customerName: name || customer?.name || "Guest",
        customerType: isB2B ? "b2b" : "b2c",
        salespersonId: customer?.assignedSalespersonId ?? null,
        status: "new",
        orderType,
        paymentMethod,
        placedAt,
        estimatedAt,
        deliveryAddress,
        city: orderType === "pickup" ? "Riyadh" : city,
        notes: notes.trim() || null,
        couponCode: appliedCoupon?.code ?? null,
        discount: couponDiscount,
        items,
        subtotal,
        vat,
        deliveryCharge,
        total: grandTotal,
        history: [{ status: "new", at: placedAt }],
      },
      {
        onSuccess: (saved) => {
          sessionStorage.setItem(
            "vs.lastOrder",
            JSON.stringify({
              trackingId: saved.trackingId,
              total: saved.total,
              orderType: saved.orderType,
              paymentMethod: saved.paymentMethod,
              address: saved.deliveryAddress,
              itemCount: items.length,
              estimatedAt: saved.estimatedAt,
            })
          );
          clear();
          setLocation(`/order-success?id=${saved.trackingId}`);
        },
        onError: (err: Error) => {
          toast({
            title: language === "ar" ? "فشل تقديم الطلب" : "Failed to place order",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/cart");
    }
  }, [items.length, setLocation]);

  if (items.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("checkout.title")}</h1>
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 font-semibold"><Truck className="w-4 h-4" /> {t("checkout.order_type")}</div>
              <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as any)} className="grid grid-cols-2 gap-3">
                {[
                  { v: "delivery", label: t("checkout.delivery"), icon: Truck },
                  { v: "pickup", label: t("checkout.pickup"), icon: MapPin },
                ].map((o) => (
                  <Label key={o.v} className={`flex items-center gap-3 border rounded-md p-4 cursor-pointer hover-elevate ${orderType === o.v ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value={o.v} data-testid={`radio-order-type-${o.v}`} />
                    <o.icon className="w-4 h-4" />
                    <span className="font-medium">{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {orderType === "delivery" && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 font-semibold"><MapPin className="w-4 h-4" /> {t("checkout.delivery_address")}</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>{t("checkout.full_name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-name" /></div>
                  <div>
                    <Label>{t("common.phone")}</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="05xxxxxxxx"
                      aria-invalid={phoneInvalid || undefined}
                      className={phoneInvalid ? "border-red-400 focus-visible:ring-red-300" : ""}
                      data-testid="input-phone"
                    />
                    {phoneInvalid && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {language === "ar" ? "صيغة سعودية صحيحة (مثل 05xxxxxxxx أو ‎+966 11…)" : "Saudi format: 05xxxxxxxx, +966 5xxxxxxxx, or +966 1xxxxxxxx"}
                      </p>
                    )}
                  </div>
                  <div><Label>{t("common.city")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required data-testid="input-city" /></div>
                  <div className="sm:col-span-2"><Label>{t("checkout.full_address")}</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} required data-testid="input-address" /></div>
                  <div className="sm:col-span-2"><Label>{t("checkout.additional_notes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {isB2B && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 font-semibold"><Building2 className="w-4 h-4" /> {t("checkout.business_details")}</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>{t("checkout.business_name")}</Label><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required /></div>
                  <div>
                    <Label>{t("checkout.business_type")}</Label>
                    <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full h-9 px-3 border rounded-md bg-background">
                      <option value="retailer">{t("checkout.business_type.retailer")}</option>
                      <option value="wholesaler">{t("checkout.business_type.wholesaler")}</option>
                      <option value="horeca">{t("checkout.business_type.horeca")}</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t("checkout.cr_number")}</Label>
                    <Input
                      value={crNumber}
                      onChange={(e) => setCrNumber(e.target.value)}
                      required
                      inputMode="numeric"
                      placeholder="1010234567"
                      aria-invalid={crInvalid || undefined}
                      className={crInvalid ? "border-red-400 focus-visible:ring-red-300" : ""}
                      data-testid="input-cr"
                    />
                    {crInvalid && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {language === "ar" ? "10 أرقام بالضبط" : "Exactly 10 digits"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>{t("checkout.vat_number")}</Label>
                    <Input
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      required
                      inputMode="numeric"
                      placeholder="3001234567800003"
                      aria-invalid={vatInvalid || undefined}
                      className={vatInvalid ? "border-red-400 focus-visible:ring-red-300" : ""}
                      data-testid="input-vat"
                    />
                    {vatInvalid && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {language === "ar" ? "15 رقماً مع 03 قبل الرقم الأخير" : "15 digits with 03 before the last digit"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 font-semibold"><CreditCard className="w-4 h-4" /> {t("checkout.payment")}</div>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid sm:grid-cols-2 gap-3">
                {[
                  { v: "cod", label: t("checkout.payment.cod"), icon: Wallet },
                  { v: "bank", label: t("checkout.payment.bank"), icon: Banknote },
                  ...(isB2B ? [{ v: "credit", label: t("checkout.payment.credit"), icon: Building2, disabled: !creditApproved }] : []),
                ].map((p: any) => (
                  <Label
                    key={p.v}
                    className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer hover-elevate ${paymentMethod === p.v ? "border-primary bg-primary/5" : ""} ${p.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <RadioGroupItem value={p.v} data-testid={`radio-payment-${p.v}`} disabled={!!p.disabled} />
                    <p.icon className="w-4 h-4" />
                    <span className="font-medium text-sm flex-1">{p.label}</span>
                    {p.v === "credit" && isB2B && !creditApproved && (
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {language === "ar" ? "بانتظار الموافقة" : "Pending approval"}
                      </span>
                    )}
                  </Label>
                ))}
              </RadioGroup>

              {isB2B && paymentMethod === "credit" && creditApproved && (
                <div className={`mt-2 rounded-md border p-3 text-xs ${creditExceeded ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {creditExceeded ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      {creditExceeded
                        ? (language === "ar" ? "تجاوز حد الائتمان" : "Exceeds credit limit")
                        : (language === "ar" ? "شروط الدفع الآجل (Net 30)" : "Net 30 credit terms")}
                    </span>
                    <span>{biz?.paymentTerms ?? "Net 30"}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px]">
                    <div><div className="text-muted-foreground">{language === "ar" ? "الحد" : "Limit"}</div><div className="font-semibold">SAR {(creditLimit ?? 0).toFixed(0)}</div></div>
                    <div><div className="text-muted-foreground">{language === "ar" ? "المستخدم" : "Used"}</div><div className="font-semibold">SAR {creditUsed.toFixed(0)}</div></div>
                    <div><div className="text-muted-foreground">{language === "ar" ? "المتاح" : "Available"}</div><div className="font-semibold">SAR {creditAvailable.toFixed(0)}</div></div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-32">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-bold text-lg">{t("checkout.summary")}</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((it) => {
                const itName = language === "ar" ? it.arName : it.enName;
                return (
                  <div key={`${it.productId}-${it.packSize}`} className="flex gap-3 text-sm">
                    <img src={it.image} alt={itName} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug line-clamp-2">{itName}</p>
                      <p className="text-xs text-muted-foreground">{it.packSize} × {it.qty}</p>
                    </div>
                    <PriceTag amount={it.unitPrice * it.qty} size="sm" />
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={language === "ar" ? "أدخل كود الخصم" : "Coupon code"}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="h-9 text-sm font-mono uppercase"
                  disabled={!!appliedCoupon}
                  data-testid="input-coupon"
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 text-rose-600"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    data-testid="button-apply-coupon"
                  >
                    {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              {appliedCoupon && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{appliedCoupon.code}</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs ms-auto">
                    {appliedCoupon.freeDelivery
                      ? (language === "ar" ? "شحن مجاني" : "Free delivery")
                      : `- SAR ${appliedCoupon.discount.toFixed(2)}`}
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={subtotal} size="sm" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={vat} size="sm" /></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.delivery_charge")}</span>
                {deliveryCharge === 0 ? <span className="text-emerald-700 font-semibold">{t("common.free")}</span> : <PriceTag amount={deliveryCharge} size="sm" />}
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>{language === "ar" ? "خصم الكوبون" : "Coupon discount"}</span>
                  <span className="font-semibold">- SAR {couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold">{t("common.total")}</span>
                <PriceTag amount={Math.max(0, grandTotal)} size="xl" />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createOrder.isPending || phoneInvalid || crInvalid || vatInvalid || creditBlocked}
              data-testid="button-place-order"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {language === "ar" ? "جارٍ تقديم الطلب…" : "Placing order…"}
                </>
              ) : t("checkout.place_order")}
            </Button>

            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-muted-foreground">
              <div className="flex flex-col items-center gap-1 text-center">
                <Lock className="w-4 h-4 text-secondary" />
                <span>{language === "ar" ? "دفع آمن" : "Secure payment"}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>{language === "ar" ? "ضمان الجودة" : "Quality guaranteed"}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="w-4 h-4 text-secondary" />
                <span>{language === "ar" ? "توصيل موثوق" : "Reliable delivery"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
