import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, MapPin, Layers, Building2, Mail, Phone, Globe2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { promotions } from "@/data/promotions";

export function AboutPage() {
  const { t, isRTL } = useLanguage();
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">{t("about.title")}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t("about.lead")}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-3">{t("about.mission.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.mission.text")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-3">{t("about.vision.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.vision.text")}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── WHY VENTURE SUPPLY ─────────────────────────── */}
      <section className="bg-slate-50 border border-border/40 rounded-2xl py-12 px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            {isRTL ? "لماذا فينتشر سبلاي" : "Why Venture Supply"}
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
            {t("about.differentiators")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Award, title: t("about.diff.brands.title"), text: t("about.diff.brands.text") },
            { icon: MapPin, title: t("about.diff.location.title"), text: t("about.diff.location.text") },
            { icon: Layers, title: t("about.diff.range.title"), text: t("about.diff.range.text") },
            {
              icon: Globe2,
              title: isRTL ? "تغطية وطنية" : "Nationwide reach",
              text: isRTL
                ? "نخدم تجار التجزئة وقطاع الضيافة في جميع أنحاء المملكة العربية السعودية."
                : "Serving retail and HORECA partners across the entire Kingdom of Saudi Arabia.",
            },
          ].map((card, i) => (
            <Card key={i} className="border-border/60 hover:shadow-md transition-all bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#085890" }}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-primary text-base">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="p-8 grid md:grid-cols-3 gap-6 text-center">
          <div><p className="text-4xl font-bold text-secondary">2019</p><p className="text-sm text-primary-foreground/80 mt-1">{isRTL ? "تأسست" : "Founded"}</p></div>
          <div><p className="text-4xl font-bold text-secondary">3</p><p className="text-sm text-primary-foreground/80 mt-1">{isRTL ? "علامات داخلية" : "In-house brands"}</p></div>
          <div><p className="text-4xl font-bold text-secondary">9</p><p className="text-sm text-primary-foreground/80 mt-1">{isRTL ? "أقسام رئيسية" : "Main categories"}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContactPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t("contact.send_message"), description: t("request.success") });
    (e.target as HTMLFormElement).reset();
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold">{t("contact.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("contact.subtitle")}</p>
      </header>
      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>{t("common.name")}</Label><Input required /></div>
                <div><Label>{t("common.email")}</Label><Input type="email" required /></div>
              </div>
              <div><Label>{t("common.phone")}</Label><Input required /></div>
              <div><Label>{t("contact.message")}</Label><Textarea rows={5} required /></div>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="button-send-message">{t("contact.send_message")}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-secondary" /> {t("contact.office")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("footer.address")}</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-secondary" /> {t("contact.phone_label")}</h3>
              <p className="text-sm text-muted-foreground mt-1">+966 14 826 9000</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-secondary" /> {t("contact.email_label")}</h3>
              <p className="text-sm text-muted-foreground mt-1">info@venturesupply.sa</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OffersPage() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold">{t("offers.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("offers.subtitle")}</p>
      </header>
      <div className="grid md:grid-cols-2 gap-5">
        {promotions.map((p) => (
          <Card key={p.id} className="overflow-hidden hover-elevate">
            <div className="aspect-[16/7] overflow-hidden">
              <img src={p.banner} alt={isRTL ? p.arTitle : p.enTitle} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-lg leading-tight">{isRTL ? p.arTitle : p.enTitle}</h2>
                <span className="text-xs font-mono bg-secondary/15 text-secondary px-2 py-1 rounded font-semibold">{p.code}</span>
              </div>
              <p className="text-sm text-muted-foreground">{isRTL ? p.arDescription : p.enDescription}</p>
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-muted-foreground">{p.audience.toUpperCase()}</span>
                <span className="text-muted-foreground">{new Date(p.startsAt).toLocaleDateString()} – {new Date(p.endsAt).toLocaleDateString()}</span>
              </div>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90" onClick={() => toast({ title: p.code, description: t("common.feature_coming_soon") })}>
                {t("common.see_more")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RequestProductPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: t("request.submit"), description: t("request.success") });
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">{t("request.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("request.subtitle")}</p>
      </header>
      <Card>
        <CardContent className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <p className="font-semibold text-lg text-emerald-700">{t("request.success")}</p>
              <Button className="mt-4" variant="outline" onClick={() => setSubmitted(false)}>{t("common.add")} {t("request.title").toLowerCase()}</Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div><Label>{t("request.product_name")}</Label><Input required data-testid="input-request-product" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>{t("request.brand")}</Label><Input /></div>
                <div><Label>{t("request.qty")}</Label><Input type="number" min={1} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>{t("common.email")}</Label><Input type="email" required /></div>
                <div><Label>{t("common.phone")}</Label><Input required /></div>
              </div>
              <div><Label>{t("request.notes")}</Label><Textarea rows={4} /></div>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="button-submit-request">{t("request.submit")}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
