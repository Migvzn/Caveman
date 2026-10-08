"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { getProduct, type Size } from "@/data/products";

export type CartLine = { slug: string; size: Size; qty: number };

type Action =
  | { type: "add"; slug: string; size: Size }
  | { type: "setQty"; slug: string; size: Size; qty: number }
  | { type: "remove"; slug: string; size: Size }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "ilur-cart-v1";
const same = (l: CartLine, slug: string, size: Size) => l.slug === slug && l.size === size;

function reducer(lines: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "hydrate":
      return a.lines.filter((l) => getProduct(l.slug));
    case "add": {
      const stock = getProduct(a.slug)?.sizes[a.size] ?? 0;
      const existing = lines.find((l) => same(l, a.slug, a.size));
      if (existing) {
        return lines.map((l) => (same(l, a.slug, a.size) ? { ...l, qty: Math.min(l.qty + 1, stock) } : l));
      }
      return stock > 0 ? [...lines, { slug: a.slug, size: a.size, qty: 1 }] : lines;
    }
    case "setQty": {
      const stock = getProduct(a.slug)?.sizes[a.size] ?? 0;
      if (a.qty <= 0) return lines.filter((l) => !same(l, a.slug, a.size));
      return lines.map((l) => (same(l, a.slug, a.size) ? { ...l, qty: Math.min(a.qty, stock) } : l));
    }
    case "remove":
      return lines.filter((l) => !same(l, a.slug, a.size));
  }
}

type CartApi = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, size: Size) => void;
  setQty: (slug: string, size: Size, qty: number) => void;
  remove: (slug: string, size: Size) => void;
};

const CartContext = createContext<CartApi | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", lines: JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const add = useCallback((slug: string, size: Size) => {
    dispatch({ type: "add", slug, size });
    setOpen(true);
  }, []);

  const value = useMemo<CartApi>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);
    return {
      lines,
      count,
      subtotal,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQty: (slug, size, qty) => dispatch({ type: "setQty", slug, size, qty }),
      remove: (slug, size) => dispatch({ type: "remove", slug, size }),
    };
  }, [lines, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
