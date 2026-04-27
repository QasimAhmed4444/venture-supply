export interface Notification {
  id: string;
  enTitle: string;
  arTitle: string;
  enBody: string;
  arBody: string;
  type: "order" | "promo" | "account";
  read: boolean;
  at: string;
}

const today = new Date(2026, 3, 27);
const ago = (h: number) => {
  const d = new Date(today);
  d.setHours(d.getHours() - h);
  return d.toISOString();
};

export const notifications: Notification[] = [
  { id: "n-1", type: "order", read: false, at: ago(2),
    enTitle: "Order VS-O-1042 is out for delivery", arTitle: "طلب VS-O-1042 في الطريق إليك",
    enBody: "Estimated arrival within 4 hours.", arBody: "الوصول المتوقع خلال 4 ساعات." },
  { id: "n-2", type: "promo", read: false, at: ago(20),
    enTitle: "Ramadan 20% off Recipe Mix", arTitle: "خصم 20٪ على خلطات الوصفات في رمضان",
    enBody: "Use code RAMADAN20 at checkout.", arBody: "استخدم الكود RAMADAN20 عند إتمام الطلب." },
  { id: "n-3", type: "order", read: true, at: ago(72),
    enTitle: "Order VS-O-1031 delivered", arTitle: "تم تسليم طلب VS-O-1031",
    enBody: "We hope you enjoy your purchase.", arBody: "نتمنى أن تكون سعيدًا بطلبك." },
  { id: "n-4", type: "account", read: true, at: ago(120),
    enTitle: "Welcome to Venture Supply", arTitle: "أهلاً بك في فينتشر سبلاي",
    enBody: "Get started with our most-loved essentials.", arBody: "ابدأ مع أكثر منتجاتنا حبًا لدى عملائنا." },
];
