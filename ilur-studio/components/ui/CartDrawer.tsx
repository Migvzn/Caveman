"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getProduct } from "@/data/products";
import { formatPrice, site } from "@/lib/site";
import { useCart } from "@/components/providers/CartProvider";
import { useScroll } from "@/components/providers/SmoothScroll";

export function CartDrawer() {
  const { isOpen, close, lines, subtotal, setQty, remove, count } = useCart();
  const { lock, unlock } = useScroll();
  const panel = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    lock();
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a, button:not(:disabled), input");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      setNotice(false);
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const checkout = () => {
    if (site.checkoutUrl) window.location.href = site.checkoutUrl;
    else setNotice(true);
  };

  const remaining = Math.max(0, site.freeShippingFrom - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]">
          <m.button
            aria-label="Fermer le panier"
            tabIndex={-1}
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-asphalt bg-ink outline-none"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-asphalt px-6 py-5">
              <h2 id="cart-title" className="label text-sm">
                Panier <span className="mono text-pink">({count})</span>
              </h2>
              <button onClick={close} className="label h-11 px-2 text-[11px] hover:text-pink-soft">
                Fermer ✕
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                <p className="label text-lg">Ton panier est vide.</p>
                <p className="text-sm text-bone/60">Le drop part vite. Ne traîne pas.</p>
                <Link href="/shop" onClick={close} className="btn-pink">
                  Voir le drop
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-asphalt overflow-y-auto px-6">
                  {lines.map((l) => {
                    const p = getProduct(l.slug)!;
                    const stock = p.sizes[l.size] ?? 0;
                    return (
                      <li key={`${l.slug}-${l.size}`} className="flex gap-4 py-5">
                        <Link href={`/shop/${p.slug}`} onClick={close} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-concrete">
                          <Image src={p.images[0].src} alt={p.images[0].alt} fill sizes="96px" className="object-cover" />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <p className="label text-xs leading-snug">{p.name}</p>
                            <p className="label text-xs">{formatPrice(p.price * l.qty)}</p>
                          </div>
                          <p className="mono mt-1 text-[11px] text-bone/50">
                            {p.ref} · TAILLE {l.size}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-asphalt">
                              <button className="h-9 w-9 hover:text-pink" onClick={() => setQty(l.slug, l.size, l.qty - 1)} aria-label={`Retirer un ${p.name}`}>
                                −
                              </button>
                              <span className="mono w-8 text-center text-sm" aria-live="polite">
                                {l.qty}
                              </span>
                              <button
                                className="h-9 w-9 hover:text-pink disabled:opacity-30"
                                onClick={() => setQty(l.slug, l.size, l.qty + 1)}
                                disabled={l.qty >= stock}
                                aria-label={`Ajouter un ${p.name}`}
                              >
                                +
                              </button>
                            </div>
                            <button onClick={() => remove(l.slug, l.size)} className="mono text-[11px] text-bone/50 underline-offset-4 hover:text-pink hover:underline">
                              Retirer
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="space-y-4 border-t border-asphalt px-6 py-6">
                  <p className="mono text-[11px] text-bone/60">
                    {remaining > 0 ? `PLUS QUE ${formatPrice(remaining)} POUR LA LIVRAISON OFFERTE` : "LIVRAISON OFFERTE ✓"}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="label text-xs">Sous-total</span>
                    <span className="label text-xl">{formatPrice(subtotal)}</span>
                  </div>
                  <button onClick={checkout} className="btn-pink w-full">
                    Commander
                  </button>
                  {notice && (
                    <p role="status" className="mono text-[11px] text-pink-soft">
                      LE PAIEMENT OUVRE AVEC LE DROP. TON PANIER EST GARDÉ SUR CET APPAREIL.
                    </p>
                  )}
                  <p className="text-center text-[11px] text-bone/40">Taxes incluses. Frais de port calculés à l&apos;étape suivante.</p>
                </div>
              </>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
