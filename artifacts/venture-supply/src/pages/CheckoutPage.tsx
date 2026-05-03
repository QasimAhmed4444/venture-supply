import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, CreditCard, Building2, Banknote, Wallet, Loader2, Tag, X, ShieldCheck, Lock } from "lucide-react";
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

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);

  const baseDelivery = orderType === "pickup" ? 0 : isB2B ? 0 : subtotal >= 200 ? 0 : 25;
  const deliveryCharge = appliedCoupon?.freeDelivery ? 0 : baseDelivery;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const grandTotal = +(total + deliveryCharge - couponDiscount).toFixed(2);

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

    if (paymentMethod === "card") {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 13) {
        toast({ title: language === "ar" ? "رقم البطاقة غير صحيح" : "Invalid card number", variant: "destructive" });
        return;
      }
      if (!cardExpiry.match(/^\d{2}\s*\/\s*\d{2}$/)) {
        toast({ title: language === "ar" ? "تاريخ انتهاء غير صحيح" : "Invalid expiry date", variant: "destructive" });
        return;
      }
      if (cardCvc.length < 3) {
        toast({ title: language === "ar" ? "CVC غير صحيح" : "Invalid CVC", variant: "destructive" });
        return;
      }
    }

    const id = `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const trackingId = `VS-O-${Math.floor(1000 + Math.random() * 9000)}`;
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

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

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
                  <div><Label>{t("common.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required data-testid="input-phone" /></div>
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
                  <div><Label>{t("checkout.cr_number")}</Label><Input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} required /></div>
                  <div><Label>{t("checkout.vat_number")}</Label><Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required /></div>
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
                  { v: "card", label: t("checkout.payment.card"), icon: CreditCard },
                  { v: "bank", label: t("checkout.payment.bank"), icon: Banknote },
                  ...(isB2B ? [{ v: "credit", label: t("checkout.payment.credit"), icon: Building2 }] : []),
                ].map((p) => (
                  <Label key={p.v} className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer hover-elevate ${paymentMethod === p.v ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value={p.v} data-testid={`radio-payment-${p.v}`} />
                    <p.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{p.label}</span>
                  </Label>
                ))}
              </RadioGroup>

              {paymentMethod === "card" && (
                <div className="mt-2 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "بيانات البطاقة" : "Card Details"}
                  </p>
                  <div>
                    <Label>{language === "ar" ? "رقم البطاقة" : "Card Number"}</Label>
                    <Input
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                      }}
                      required={paymentMethod === "card"}
                      data-testid="input-card-number"
                      className="font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{language === "ar" ? "تاريخ الانتهاء" : "Expiry (MM / YY)"}</Label>
                      <Input
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setCardExpiry(v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v);
                        }}
                        required={paymentMethod === "card"}
                        data-testid="input-card-expiry"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label>CVC</Label>
                      <Input
                        placeholder="123"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        required={paymentMethod === "card"}
                        data-testid="input-card-cvc"
                        type="password"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "ar" ? "بياناتك محمية ومشفرة بالكامل" : "Your card info is encrypted and secure."}
                  </p>
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
              disabled={createOrder.isPending}
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
