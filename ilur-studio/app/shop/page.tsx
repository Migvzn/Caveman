import type { Metadata } from "next";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Tout le drop 01 ILUR.STUDIO : coupe-vents oversize, hauts, bas et accessoires en séries limitées.",
};

export default function ShopPage() {
  return (
    <div className="px-[var(--gutter)] pb-24 pt-[calc(var(--header-h)+48px)] md:pt-[calc(var(--header-h)+72px)]">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <div>
          <p className="mono mb-3 text-[11px] text-pink">DROP 01 — {String(products.length).padStart(2, "0")} PIÈCES</p>
          <h1 className="label text-5xl font-black leading-[0.9] md:text-8xl">Shop</h1>
        </div>
        <p className="mono max-w-xs text-[11px] leading-relaxed text-bone/50">SÉRIES LIMITÉES. PAS DE RESTOCK. LIVRAISON OFFERTE DÈS 150 €.</p>
      </div>
      <ShopGrid />
    </div>
  );
}
