import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  productId: string;
  enName: string;
  arName: string;
  packSize: string;
  unitPrice: number;
  qty: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  vat: number;
  total: number;
  addItem: (item: CartItem) => void;
  updateQty: (productId: string, packSize: string, qty: number) => void;
  removeItem: (productId: string, packSize: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "vs.cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === item.productId && p.packSize === item.packSize);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  };

  const updateQty = (productId: string, packSize: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => !(p.productId === productId && p.packSize === packSize))
        : prev.map((p) => (p.productId === productId && p.packSize === packSize ? { ...p, qty } : p))
    );
  };

  const removeItem = (productId: string, packSize: string) =>
    setItems((prev) => prev.filter((p) => !(p.productId === productId && p.packSize === packSize)));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = +items.reduce((s, i) => s + i.unitPrice * i.qty, 0).toFixed(2);
  const vat = +(subtotal * 0.15).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);

  return (
    <CartContext.Provider value={{ items, count, subtotal, vat, total, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
