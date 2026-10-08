"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";

// Vrai après la première hydratation : seules les navigations suivantes sont animées.
let hydrated = false;

/**
 * Transition de page : volet rose qui se retire + fondu du contenu.
 * Uniquement de l'opacité sur le conteneur (un transform casserait les éléments `fixed` et le pin GSAP).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => typeof window !== "undefined" && hydrated);
  useEffect(() => {
    hydrated = true;
  }, []);
  return (
    <>
      {animate && (
        <m.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70] origin-top bg-pink"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        />
      )}
      <m.div initial={animate ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}>
        {children}
      </m.div>
    </>
  );
}
