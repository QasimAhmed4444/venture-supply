import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Globe, Facebook, Instagram, Linkedin } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t("footer.newsletter_cta"), description: t("common.feature_coming_soon") });
  };

  return (
    <footer
      className="text-white mt-16"
      style={{ background: "linear-gradient(180deg, #06243f 0%, #052238 100%)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
        {/* Brand block */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white/95 inline-flex p-3 rounded-md shadow-md">
            <Logo size="xl" />
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {t("footer.about_text")}
          </p>
          <div className="space-y-2 text-sm text-white/85">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#18B8E0" }} />
              <span>{t("footer.address")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" style={{ color: "#18B8E0" }} />
              <a href="tel:+966547206862" className="hover:text-white">+966 54 720 6862</a>
              <span className="text-white/40">·</span>
              <a href="tel:+966546110852" className="hover:text-white">+966 54 611 0852</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" style={{ color: "#18B8E0" }} />
              <a href="mailto:info@venturesupply.sa" className="hover:text-white">info@venturesupply.sa</a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0" style={{ color: "#18B8E0" }} />
              <a href="https://www.venturesupply.sa" target="_blank" rel="noreferrer" className="hover:text-white">www.venturesupply.sa</a>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[Facebook, Instagram, Linkedin].map((Ic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toast({ title: t("common.feature_coming_soon") })}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors"
                aria-label="social"
              >
                <Ic className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="lg:col-span-2">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{ color: "#18B8E0" }}>
            {t("footer.company")}
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            <li><Link href="/about"><span className="hover:text-white transition-colors">{t("nav.about")}</span></Link></li>
            <li><Link href="/contact"><span className="hover:text-white transition-colors">{t("nav.contact")}</span></Link></li>
            <li><Link href="/offers"><span className="hover:text-white transition-colors">{t("nav.offers")}</span></Link></li>
            <li><Link href="/request-product"><span className="hover:text-white transition-colors">{t("nav.request_product")}</span></Link></li>
            <li><Link href="/account"><span className="hover:text-white transition-colors">{t("common.account")}</span></Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="lg:col-span-3">
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{ color: "#18B8E0" }}>
            {t("footer.shop")}
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/categories/${c.slug}`}><span className="hover:text-white transition-colors">{t(`category.${c.id}`)}</span></Link></li>
            ))}
            <li><Link href="/products"><span className="hover:text-white transition-colors font-semibold">{t("listing.all_products")} →</span></Link></li>
          </ul>
        </div>

        {/* Brands + Newsletter */}
        <div className="lg:col-span-3 space-y-5">
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider" style={{ color: "#18B8E0" }}>
              {t("home.brands.title")}
            </h3>
            <div className="grid grid-cols-3 gap-2 bg-white/95 rounded-md p-3">
              {brands.map((b) => (
                <Link key={b.id} href={`/brands/${b.id}`}>
                  <div className="aspect-square flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
                    <img src={b.logo} alt={b.name} className="max-h-12 w-auto object-contain" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <p className="text-xs text-white/85 font-semibold uppercase tracking-wider">{t("footer.newsletter")}</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("footer.email_placeholder")}
                required
                className="bg-white/10 border-white/25 text-white placeholder:text-white/50 text-sm"
                data-testid="input-newsletter-email"
              />
              <Button
                type="submit"
                className="text-white hover:opacity-90 shrink-0 font-semibold"
                style={{ backgroundColor: "#18B8E0" }}
              >
                {t("footer.newsletter_cta")}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap justify-between items-center gap-2 text-xs text-white/70">
          <span>© 2026 Venture Supply · التوريد الريادي · All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">{t("footer.terms")}</span>
            <span className="hover:text-white cursor-pointer">{t("footer.privacy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
