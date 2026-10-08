"use client";

import { AnimatePresence, m } from "framer-motion";
import { useMemo, useState } from "react";
import { CATEGORIES, isSoldOut, products, type Category } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

type Sort = "nouveautes" | "prix-asc" | "prix-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];

export function ShopGrid() {
  const [category, setCategory] = useState<Category | "tout">("tout");
  const [sort, setSort] = useState<Sort>("nouveautes");

  const list = useMemo(() => {
    const filtered = category === "tout" ? products : products.filter((p) => p.category === category);
    return [...filtered].sort((a, b) => {
      // Les pièces épuisées passent toujours en fin de liste
      const so = Number(isSoldOut(a)) - Number(isSoldOut(b));
      if (so) return so;
      if (sort === "prix-asc") return a.price - b.price;
      if (sort === "prix-desc") return b.price - a.price;
      return b.releasedAt.localeCompare(a.releasedAt);
    });
  }, [category, sort]);

  const chips = [{ value: "tout" as const, label: "Tout" }, ...CATEGORIES.filter((c) => products.some((p) => p.category === c.value))];

  return (
    <>
      <div className="sticky top-[var(--header-h)] z-20 -mx-[var(--gutter)] mb-8 flex flex-col gap-3 border-y border-asphalt bg-ink/85 px-[var(--gutter)] py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)]" role="group" aria-label="Filtrer par catégorie">
          {chips.map((c) => {
            const active = category === c.value;
            const count = c.value === "tout" ? products.length : products.filter((p) => p.category === c.value).length;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                aria-pressed={active}
                className={`label flex h-10 shrink-0 items-center gap-2 border px-4 text-[10px] transition-colors ${
                  active ? "border-pink bg-pink text-ink" : "border-asphalt hover:border-pink-soft hover:text-pink-soft"
                }`}
              >
                {c.label}
                <span className="mono opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-3">
          <span className="mono text-[11px] text-bone/50">TRIER</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="label h-10 border border-asphalt bg-ink px-3 text-[10px] focus:border-pink focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {list.length} produit{list.length > 1 ? "s" : ""}
      </p>

      <m.ul layout className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <m.li
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={p} priority={i < 2} />
            </m.li>
          ))}
        </AnimatePresence>
      </m.ul>
    </>
  );
}
