export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "packed"
  | "out-for-delivery"
  | "delivered"
  | "ready-for-pickup"
  | "cancelled";

export type PaymentMethod = "cod" | "bank" | "card" | "credit";
export type OrderType = "delivery" | "pickup";

export interface OrderItem {
  productId: string;
  enName: string;
  arName: string;
  packSize: string;
  unitPrice: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  trackingId: string;
  customerId: string;
  customerName: string;
  customerType: "b2c" | "b2b";
  salespersonId?: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  placedAt: string;
  estimatedAt: string;
  deliveryAddress: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  deliveryCharge: number;
  total: number;
  notes?: string;
  cancellationReason?: string;
  history: Array<{ status: OrderStatus; at: string }>;
}

const today = new Date(2026, 3, 27); // April 27, 2026
const ago = (days: number, hours = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};
const inDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const calc = (items: OrderItem[], orderType: OrderType, customerType: "b2c" | "b2b") => {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const vat = +(subtotal * 0.15).toFixed(2);
  const deliveryCharge = orderType === "pickup" ? 0 : customerType === "b2b" ? 0 : subtotal >= 200 ? 0 : 25;
  const total = +(subtotal + vat + deliveryCharge).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), vat, deliveryCharge, total };
};

const tracker = (id: string) => `VS-${id.toUpperCase()}`;

const buildHistory = (placedAt: string, status: OrderStatus): Array<{ status: OrderStatus; at: string }> => {
  const flow: OrderStatus[] = ["new", "confirmed", "preparing", "packed", "out-for-delivery", "delivered"];
  if (status === "cancelled") return [{ status: "new", at: placedAt }, { status: "cancelled", at: placedAt }];
  if (status === "ready-for-pickup")
    return [{ status: "new", at: placedAt }, { status: "confirmed", at: placedAt }, { status: "preparing", at: placedAt }, { status: "ready-for-pickup", at: placedAt }];
  const idx = flow.indexOf(status);
  return flow.slice(0, idx + 1).map((s) => ({ status: s, at: placedAt }));
};

const items1: OrderItem[] = [
  { productId: "p-chef-1121-sella", enName: "Chef Rice 1121 Sella Basmati", arName: "أرز شِف 1121 سيلا بسمتي", packSize: "5kg", unitPrice: 84, qty: 2, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },
  { productId: "p-mlk-pink-salt", enName: "Malka Himalayan Pink Salt", arName: "ملكة ملح هيمالايا الوردي", packSize: "1kg", unitPrice: 28, qty: 1, image: "https://images.unsplash.com/photo-1518110925495-b37653e00ee9?w=400&q=80" },
  { productId: "p-vit-450", enName: "Vital Tea 450g Jar", arName: "شاي فيتال 450 جم برطمان", packSize: "450g", unitPrice: 32, qty: 2, image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80" },
];

const items2: OrderItem[] = [
  { productId: "p-rm-biryani", enName: "Chef Biryani Masala", arName: "خلطة برياني شِف", packSize: "1kg", unitPrice: 18, qty: 3, image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80" },
  { productId: "p-spc-fried-onion-400", enName: "Fried Onion 400g", arName: "بصل مقلي 400 جم", packSize: "400g", unitPrice: 18, qty: 2, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80" },
];

const itemsB2B1: OrderItem[] = [
  { productId: "p-chef-1121-sella", enName: "Chef Rice 1121 Sella Basmati", arName: "أرز شِف 1121 سيلا بسمتي", packSize: "40kg", unitPrice: 540, qty: 20, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },
  { productId: "p-chef-oil-17l", enName: "Chef Cooking Oil 17L", arName: "زيت طهي شِف 17 لتر", packSize: "17L", unitPrice: 72, qty: 30, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { productId: "p-mlk-garam", enName: "Malka Garam Masala", arName: "ملكة جرام ماسالا", packSize: "10kg", unitPrice: 195, qty: 5, image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80" },
];

const itemsB2B2: OrderItem[] = [
  { productId: "p-vit-loose-5kg", enName: "Vital Loose Tea 5kg", arName: "شاي فيتال سائب 5 كجم", packSize: "5kg", unitPrice: 240, qty: 12, image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80" },
  { productId: "p-pls-red-lentils", enName: "Red Lentils", arName: "عدس أحمر", packSize: "15kg", unitPrice: 95, qty: 10, image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&q=80" },
];

interface OrderSpec {
  id: string;
  customerId: string;
  customerName: string;
  customerType: "b2c" | "b2b";
  salespersonId?: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  placedAt: string;
  estimatedAt: string;
  city: string;
  deliveryAddress: string;
  items: OrderItem[];
  cancellationReason?: string;
}

const specs: OrderSpec[] = [
  // B2C — Ahmed
  { id: "o-1042", customerId: "c-001", customerName: "Ahmed Al-Qahtani", customerType: "b2c", status: "out-for-delivery", orderType: "delivery", paymentMethod: "cod", placedAt: ago(0, 4), estimatedAt: inDays(0), city: "Riyadh", deliveryAddress: "King Fahd Rd, Al Olaya District, Building 24, Apt 4", items: items1 },
  { id: "o-1031", customerId: "c-001", customerName: "Ahmed Al-Qahtani", customerType: "b2c", status: "delivered", orderType: "delivery", paymentMethod: "card", placedAt: ago(8), estimatedAt: ago(6), city: "Riyadh", deliveryAddress: "King Fahd Rd, Al Olaya District, Building 24, Apt 4", items: items2 },
  { id: "o-1018", customerId: "c-001", customerName: "Ahmed Al-Qahtani", customerType: "b2c", status: "delivered", orderType: "pickup", paymentMethod: "bank", placedAt: ago(22), estimatedAt: ago(20), city: "Riyadh", deliveryAddress: "Pickup — Riyadh Hub, Al Sulay", items: items1 },
  // B2C — Fatima
  { id: "o-1040", customerId: "c-002", customerName: "Fatima Al-Saud", customerType: "b2c", status: "preparing", orderType: "delivery", paymentMethod: "card", placedAt: ago(0, 7), estimatedAt: inDays(1), city: "Jeddah", deliveryAddress: "Al Tahlia St, Al Andalus District", items: items2 },
  { id: "o-1023", customerId: "c-002", customerName: "Fatima Al-Saud", customerType: "b2c", status: "delivered", orderType: "delivery", paymentMethod: "card", placedAt: ago(15), estimatedAt: ago(13), city: "Jeddah", deliveryAddress: "Al Tahlia St, Al Andalus District", items: items1 },
  // B2C — Noura
  { id: "o-1037", customerId: "c-004", customerName: "Noura Al-Rashid", customerType: "b2c", status: "ready-for-pickup", orderType: "pickup", paymentMethod: "bank", placedAt: ago(1), estimatedAt: inDays(0), city: "Dammam", deliveryAddress: "Pickup — Dammam Hub", items: items2 },
  { id: "o-1004", customerId: "c-010", customerName: "Layla Al-Otaibi", customerType: "b2c", status: "cancelled", orderType: "delivery", paymentMethod: "cod", placedAt: ago(5), estimatedAt: ago(3), city: "Makkah", deliveryAddress: "Aziziyah, Building 12", items: items1, cancellationReason: "Customer requested cancellation — duplicate order" },

  // B2B — Al Andalus Group
  { id: "o-2018", customerId: "c-005", customerName: "Al Andalus Restaurant Group", customerType: "b2b", salespersonId: "sp-001", status: "out-for-delivery", orderType: "delivery", paymentMethod: "credit", placedAt: ago(1, 3), estimatedAt: inDays(0), city: "Riyadh", deliveryAddress: "Industrial Area Phase 3, Warehouse 24", items: itemsB2B1 },
  { id: "o-2014", customerId: "c-005", customerName: "Al Andalus Restaurant Group", customerType: "b2b", salespersonId: "sp-001", status: "delivered", orderType: "delivery", paymentMethod: "credit", placedAt: ago(11), estimatedAt: ago(9), city: "Riyadh", deliveryAddress: "Industrial Area Phase 3, Warehouse 24", items: itemsB2B2 },

  // B2B — Hilal Mart
  { id: "o-2019", customerId: "c-006", customerName: "Hilal Mart Chain", customerType: "b2b", salespersonId: "sp-002", status: "confirmed", orderType: "delivery", paymentMethod: "credit", placedAt: ago(0, 2), estimatedAt: inDays(2), city: "Jeddah", deliveryAddress: "Al Khumrah Industrial Zone", items: itemsB2B1 },
  { id: "o-2007", customerId: "c-006", customerName: "Hilal Mart Chain", customerType: "b2b", salespersonId: "sp-002", status: "delivered", orderType: "delivery", paymentMethod: "bank", placedAt: ago(20), estimatedAt: ago(18), city: "Jeddah", deliveryAddress: "Al Khumrah Industrial Zone", items: itemsB2B2 },

  // B2B — Madinah Hospitality (sales sp-001)
  { id: "o-2017", customerId: "c-007", customerName: "Madinah Hospitality Group", customerType: "b2b", salespersonId: "sp-001", status: "preparing", orderType: "delivery", paymentMethod: "credit", placedAt: ago(0, 9), estimatedAt: inDays(2), city: "Madinah", deliveryAddress: "Quba Rd, Hilton Tower", items: itemsB2B2 },
  { id: "o-2010", customerId: "c-007", customerName: "Madinah Hospitality Group", customerType: "b2b", salespersonId: "sp-001", status: "delivered", orderType: "delivery", paymentMethod: "credit", placedAt: ago(18), estimatedAt: ago(16), city: "Madinah", deliveryAddress: "Quba Rd, Hilton Tower", items: itemsB2B1 },

  // B2B — Saffron Catering
  { id: "o-2016", customerId: "c-008", customerName: "Saffron Catering Co.", customerType: "b2b", salespersonId: "sp-003", status: "packed", orderType: "delivery", paymentMethod: "card", placedAt: ago(2), estimatedAt: inDays(1), city: "Dammam", deliveryAddress: "Al Khobar Industrial Area", items: itemsB2B2 },

  // B2B — Riyadh Wholesale
  { id: "o-2015", customerId: "c-009", customerName: "Riyadh Wholesale Foods", customerType: "b2b", salespersonId: "sp-004", status: "new", orderType: "delivery", paymentMethod: "credit", placedAt: ago(0, 1), estimatedAt: inDays(3), city: "Riyadh", deliveryAddress: "Al Sulay Industrial Area", items: itemsB2B1 },

  // B2C — Mohammad
  { id: "o-1029", customerId: "c-003", customerName: "Mohammad Al-Ghamdi", customerType: "b2c", status: "delivered", orderType: "delivery", paymentMethod: "card", placedAt: ago(12), estimatedAt: ago(10), city: "Madinah", deliveryAddress: "Quba Rd, Al Aziziyah", items: items2 },
];

export const orders: Order[] = specs.map((s) => {
  const totals = calc(s.items, s.orderType, s.customerType);
  return {
    ...s,
    trackingId: tracker(s.id),
    history: buildHistory(s.placedAt, s.status),
    ...totals,
  };
});

export const getOrdersByCustomer = (customerId: string) => orders.filter((o) => o.customerId === customerId);
export const getOrdersBySalesperson = (spId: string) => orders.filter((o) => o.salespersonId === spId);
export const getOrderById = (id: string) => orders.find((o) => o.id === id);
export const getOrderByTracking = (tid: string) => orders.find((o) => o.trackingId === tid);

export const ORDER_STATUSES: OrderStatus[] = [
  "new", "confirmed", "preparing", "packed", "out-for-delivery", "delivered", "ready-for-pickup", "cancelled",
];
