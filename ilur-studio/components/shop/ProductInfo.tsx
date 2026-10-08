"use client";

import { useState } from "react";
import { isSoldOut, SIZE_ORDER, type Product, type Size } from "@/data/products";
import { sizeGuides } from "@/data/sizeGuide";
import { formatPrice, site } from "@/lib/site";
import { useCart } from "@/components/providers/CartProvider";
import { AccordionItem } from "@/components/ui/Accordion";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ProductCard";

export function ProductInfo({ product }: { product: Product }) {
  const { add } = useCart();
  const sizes = SIZE_ORDER.filter((s) => s in product.sizes);
  const single = sizes.length === 1 ? sizes[0] : null;
  const [size, setSize] = useState<Size | null>(single && product.sizes[single] ? single : null);
  const [error, setError] = useState(false);
  const [guide, setGuide] = useState(false);
  const soldOut = isSoldOut(product);
  const sizeGuide = sizeGuides[product.category];
  const stock = size ? (product.sizes[size] ?? 0) : 0;

  const addToCart = () => {
    if (!size) {
      setError(true);
      return;
    }
    add(product.slug, size);
  };

  return (
    <div className="md:sticky md:top-[calc(var(--header-h)+24px)]">
      <div className="mb-4 flex items-center gap-3">
        <Badge product={product} />
        <span className="mono text-[11px] text-bone/50">{product.ref}</span>
      </div>
      <h1 className="label text-3xl font-black leading-[0.95] md:text-5xl">{product.name}</h1>
      <p className="label mt-4 text-xl">{formatPrice(product.price)}</p>
      <p className="mono mt-2 text-[11px] text-bone/50">COLORIS — {product.colorway.toUpperCase()}</p>

      {/* Tailles */}
      <fieldset className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <legend className="label text-[11px]">
            Taille {size && <span className="mono text-pink">— {size}</span>}
          </legend>
          {sizeGuide && (
            <button onClick={() => setGuide(true)} className="mono text-[11px] text-bone/60 underline underline-offset-4 hover:text-pink-soft">
              Guide des tailles
            </button>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {sizes.map((s) => {
            const qty = product.sizes[s] ?? 0;
            const active = size === s;
            return (
              <button
                key={s}
                type="button"
                disabled={!qty}
                aria-pressed={active}
                aria-label={`Taille ${s}${qty ? "" : ", épuisée"}`}
                onClick={() => {
                  setSize(s);
                  setError(false);
                }}
                className={`mono h-12 border text-xs transition-colors ${single ? "col-span-6" : ""} ${
                  active
                    ? "border-pink bg-pink text-ink"
                    : qty
                      ? "border-asphalt hover:border-pink-soft hover:text-pink-soft"
                      : "cursor-not-allowed border-asphalt/50 text-bone/25 line-through"
                }`}
              >
                {s === "TU" ? "TAILLE UNIQUE" : s}
              </button>
            );
          })}
        </div>
        <p role="status" aria-live="polite" className="mono mt-3 min-h-5 text-[11px]">
          {error ? <span className="text-pink">CHOISIS TA TAILLE.</span> : size && stock <= 3 ? <span className="text-pink-soft">PLUS QUE {stock} EN STOCK.</span> : null}
        </p>
      </fieldset>

      <button onClick={addToCart} disabled={soldOut} className="btn-pink mt-2 w-full">
        {soldOut ? "Sold out" : "Ajouter au panier"}
      </button>
      <p className="mono mt-3 text-center text-[11px] text-bone/40">LIVRAISON OFFERTE DÈS {formatPrice(site.freeShippingFrom)} · RETOURS 14 JOURS</p>

      <div className="mt-10 border-t border-asphalt">
        <AccordionItem title="Description" defaultOpen>
          <p>{product.description}</p>
        </AccordionItem>
        <AccordionItem title="Composition">
          <ul className="space-y-1">
            {product.composition.map((c) => (
              <li key={c}>— {c}</li>
            ))}
          </ul>
        </AccordionItem>
        <AccordionItem title="Entretien">
          <ul className="space-y-1">
            {product.care.map((c) => (
              <li key={c}>— {c}</li>
            ))}
          </ul>
        </AccordionItem>
        <AccordionItem title="Livraison & retours">
          <p>
            Expédition sous 48 h ouvrées depuis la France. Livraison en 2 à 4 jours en France métropolitaine, offerte dès {formatPrice(site.freeShippingFrom)}. Retours
            acceptés sous 14 jours, pièce non portée avec étiquettes. Les pièces des drops limités ne sont ni échangées ni restockées.
          </p>
        </AccordionItem>
      </div>

      {sizeGuide && (
        <Modal open={guide} onClose={() => setGuide(false)} title="Guide des tailles">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <caption className="mono mb-4 text-left text-[11px] text-bone/50">MESURES À PLAT, EN CENTIMÈTRES</caption>
              <thead>
                <tr className="border-b border-asphalt">
                  {sizeGuide.columns.map((c) => (
                    <th key={c} scope="col" className="label py-3 pr-4 text-[10px]">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeGuide.rows.map((r) => (
                  <tr key={r[0]} className={`border-b border-asphalt/60 ${r[0] === size ? "text-pink" : ""}`}>
                    {r.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="mono py-3 pr-4 text-sm">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className="mono py-3 pr-4 text-sm">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-bone/70">{sizeGuide.note}</p>
        </Modal>
      )}
    </div>
  );
}
