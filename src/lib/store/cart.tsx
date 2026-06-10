import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "@/lib/mock/data";

export interface CartItem {
  productId: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "nobs.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === productId);
      if (found) return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { productId, qty }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, qty } : i))));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal, shipping } = useMemo(() => {
    let count = 0, subtotal = 0, shipping = 0;
    for (const it of items) {
      const p = getProduct(it.productId);
      if (!p) continue;
      count += it.qty;
      subtotal += p.price * it.qty;
      shipping += p.shippingPrice;
    }
    return { count, subtotal, shipping };
  }, [items]);

  const value: CartContextValue = { items, add, remove, setQty, clear, count, subtotal, shipping, total: subtotal + shipping };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
