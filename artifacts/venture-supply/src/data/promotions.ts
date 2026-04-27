export type PromoType = "percent" | "amount" | "free-delivery";

export interface Promotion {
  id: string;
  code: string;
  enTitle: string;
  arTitle: string;
  enDescription: string;
  arDescription: string;
  type: PromoType;
  value: number;
  audience: "b2c" | "b2b" | "both";
  startsAt: string;
  endsAt: string;
  status: "active" | "scheduled" | "ended";
  banner: string;
}

export const promotions: Promotion[] = [
  {
    id: "pr-001",
    code: "RAMADAN20",
    enTitle: "Ramadan 20% off Recipe Mix",
    arTitle: "خصم 20٪ على خلطات الوصفات في رمضان",
    enDescription: "Save 20% on all Recipe Mix products. Limited time only.",
    arDescription: "وفّر 20٪ على جميع خلطات الوصفات. لفترة محدودة.",
    type: "percent",
    value: 20,
    audience: "b2c",
    startsAt: "2026-04-01",
    endsAt: "2026-05-15",
    status: "active",
    banner: "https://images.unsplash.com/photo-1599735734820-5f76b88a4146?w=1600&q=80&auto=format&fit=crop",
  },
  {
    id: "pr-002",
    code: "B2B500",
    enTitle: "SAR 500 off bulk orders over 5,000",
    arTitle: "خصم 500 ر.س على طلبات الجملة فوق 5,000",
    enDescription: "B2B exclusive — SAR 500 off any order over SAR 5,000.",
    arDescription: "حصري لعملاء الأعمال — خصم 500 ر.س على أي طلب يتجاوز 5,000 ر.س.",
    type: "amount",
    value: 500,
    audience: "b2b",
    startsAt: "2026-04-10",
    endsAt: "2026-06-30",
    status: "active",
    banner: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&q=80&auto=format&fit=crop",
  },
  {
    id: "pr-003",
    code: "FREESHIP",
    enTitle: "Free delivery on orders over 200",
    arTitle: "توصيل مجاني للطلبات فوق 200 ر.س",
    enDescription: "All B2C orders over SAR 200 ship free across the Kingdom.",
    arDescription: "جميع طلبات الأفراد فوق 200 ر.س بتوصيل مجاني في جميع أنحاء المملكة.",
    type: "free-delivery",
    value: 0,
    audience: "b2c",
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
    status: "active",
    banner: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=1600&q=80&auto=format&fit=crop",
  },
  {
    id: "pr-004",
    code: "NEWYEAR15",
    enTitle: "15% off Vital Tea range",
    arTitle: "خصم 15٪ على شاي فيتال",
    enDescription: "Premium loose-leaf and bagged teas — 15% off this month.",
    arDescription: "شاي فيتال الفاخر — خصم 15٪ هذا الشهر.",
    type: "percent",
    value: 15,
    audience: "both",
    startsAt: "2026-04-15",
    endsAt: "2026-05-15",
    status: "active",
    banner: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=1600&q=80&auto=format&fit=crop",
  },
];

export const getActivePromotions = () => promotions.filter((p) => p.status === "active");
