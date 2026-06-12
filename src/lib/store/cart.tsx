import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  listingId: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (listingId: string, qty?: number) => void;
  remove: (listingId: string) => void;
  setQty: (listingId: string, qty: number) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "nobs.cart.v2";

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

  const add = useCallback((listingId: string, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.listingId === listingId);
      if (found) return prev.map((i) => (i.listingId === listingId ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { listingId, qty }];
    });
  }, []);

  const remove = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const setQty = useCallback((listingId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.listingId !== listingId)
        : prev.map((i) => (i.listingId === listingId ? { ...i, qty } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  const value: CartContextValue = { items, add, remove, setQty, clear, count };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
