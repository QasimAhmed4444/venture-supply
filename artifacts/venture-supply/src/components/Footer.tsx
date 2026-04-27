import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { categories } from "@/data/categories";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t("footer.newsletter_cta"), description: t("common.feature_coming_soon") });
  };

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Logo variant="light" />
          <p className="text-sm text-primary-foreground/80 leading-relaxed">{t("footer.about_text")}</p>
          <div className="space-y-2 text-sm text-primary-foreground/80">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
              <span>{t("footer.address")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-secondary" />
              <span>+966 14 826 9000</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-secondary" />
              <span>info@venturesupply.sa</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">{t("footer.shop")}</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/categories/${c.slug}`}><span className="hover:text-secondary transition-colors">{t(`category.${c.id}`)}</span></Link></li>
            ))}
            <li><Link href="/products"><span className="hover:text-secondary transition-colors">{t("listing.all_products")}</span></Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">{t("footer.company")}</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href="/about"><span className="hover:text-secondary transition-colors">{t("nav.about")}</span></Link></li>
            <li><Link href="/contact"><span className="hover:text-secondary transition-colors">{t("nav.contact")}</span></Link></li>
            <li><Link href="/offers"><span className="hover:text-secondary transition-colors">{t("nav.offers")}</span></Link></li>
            <li><Link href="/request-product"><span className="hover:text-secondary transition-colors">{t("nav.request_product")}</span></Link></li>
            <li><Link href="/account"><span className="hover:text-secondary transition-colors">{t("common.account")}</span></Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">{t("footer.support")}</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80 mb-4">
            <li><span className="hover:text-secondary transition-colors cursor-pointer">{t("footer.help")}</span></li>
            <li><span className="hover:text-secondary transition-colors cursor-pointer">{t("footer.faq")}</span></li>
            <li><span className="hover:text-secondary transition-colors cursor-pointer">{t("footer.terms")}</span></li>
            <li><span className="hover:text-secondary transition-colors cursor-pointer">{t("footer.privacy")}</span></li>
          </ul>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <p className="text-xs text-primary-foreground/80">{t("footer.newsletter")}</p>
            <div className="flex gap-2">
              <Input type="email" placeholder={t("footer.email_placeholder")} required className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm" data-testid="input-newsletter-email" />
              <Button type="submit" variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0">{t("footer.newsletter_cta")}</Button>
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-2 text-xs text-primary-foreground/70">
          <span>{t("footer.copyright")}</span>
          <span>VAT 300 123 456 7800003 · CR 4650 123456</span>
        </div>
      </div>
    </footer>
  );
}
