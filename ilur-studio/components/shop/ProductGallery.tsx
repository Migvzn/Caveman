"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Product } from "@/data/products";

/** Mobile : carrousel swipe avec compteur. Desktop : images empilées (la colonne d'infos reste collante). */
export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:flex-col md:gap-3 md:overflow-visible"
        aria-label="Galerie photos"
        tabIndex={0}
      >
        {product.images.map((img, i) => (
          <div key={img.src} className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-concrete">
            <Image src={img.src} alt={img.alt} fill priority={i === 0} sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="mono pointer-events-none absolute bottom-3 right-3 bg-ink/80 px-2 py-1 text-[11px] md:hidden" aria-hidden>
        {String(index + 1).padStart(2, "0")}/{String(product.images.length).padStart(2, "0")}
      </div>
    </div>
  );
}
