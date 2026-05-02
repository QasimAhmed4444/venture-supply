import { ReactNode } from "react";
import { DemoSwitcher } from "@/components/DemoSwitcher";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

export function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollToTop />
      <DemoSwitcher />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
