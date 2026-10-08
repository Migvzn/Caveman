"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollApi = { lock: () => void; unlock: () => void; lenis: () => Lenis | null };

const ScrollContext = createContext<ScrollApi>({ lock: () => {}, unlock: () => {}, lenis: () => null });
export const useScroll = () => useContext(ScrollContext);

/** Smooth scroll Lenis synchronisé avec GSAP ScrollTrigger. Désactivé si prefers-reduced-motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: true }); // décalage via scroll-margin-top (CSS)
    lenisRef.current = lenis;
    if (locks.current > 0) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Changement de page : retour en haut, ou vers l'ancre (ex. /#lookbook)
  useEffect(() => {
    const lenis = lenisRef.current;
    const hash = window.location.hash;
    const raf = requestAnimationFrame(() => {
      lenis?.resize(); // la hauteur de la nouvelle page n'est pas encore connue de Lenis
      ScrollTrigger.refresh();
      const target = hash ? document.querySelector<HTMLElement>(hash) : null;
      if (target) {
        if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
        else target.scrollIntoView();
      } else {
        lenis?.scrollTo(0, { immediate: true, force: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const api: ScrollApi = {
    lock: () => {
      locks.current += 1;
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
    },
    unlock: () => {
      locks.current = Math.max(0, locks.current - 1);
      if (locks.current === 0) {
        lenisRef.current?.start();
        document.documentElement.style.overflow = "";
      }
    },
    lenis: () => lenisRef.current,
  };

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
