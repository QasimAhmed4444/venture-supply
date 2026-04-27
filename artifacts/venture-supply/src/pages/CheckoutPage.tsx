import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Truck, MapPin, CreditCard, Building2, Banknote, Wallet } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { PriceTag } from "@/components/PriceTag";

export function CheckoutPage() {
  const { items, subtotal, vat, total, clear } = useCart();
  const { t, isRTL, language } = useLanguage();
  const { role, customer } = useRole();
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

  const deliveryCharge = orderType === "pickup" ? 0 : isB2B ? 0 : subtotal >= 200 ? 0 : 25;
  const grandTotal = +(total + deliveryCharge).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingId = `VS-O-${Math.floor(2000 + Math.random() * 8000)}`;
    const summary = {
      trackingId,
      total: grandTotal,
      orderType,
      paymentMethod,
      address: orderType === "pickup" ? "Pickup — Riyadh Hub" : `${address}, ${city}`,
      itemCount: items.length,
    };
    sessionStorage.setItem("vs.lastOrder", JSON.stringify(summary));
    clear();
    setLocation(`/order-success?id=${trackingId}`);
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
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.subtotal")}</span><PriceTag amount={subtotal} size="sm" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("common.vat")}</span><PriceTag amount={vat} size="sm" /></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.delivery_charge")}</span>
                {deliveryCharge === 0 ? <span className="text-emerald-700 font-semibold">{t("common.free")}</span> : <PriceTag amount={deliveryCharge} size="sm" />}
              </div>
              <Separator />
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold">{t("common.total")}</span>
                <PriceTag amount={grandTotal} size="xl" />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90" data-testid="button-place-order">
              {t("checkout.place_order")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
