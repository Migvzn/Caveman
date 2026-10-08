"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useScroll } from "@/components/providers/SmoothScroll";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/#lookbook", label: "Lookbook" },
  { href: "/#manifeste", label: "À propos" },
];

export function Header() {
  const { count, open } = useCart();
  const { lock, unlock } = useScroll();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    if (!menu) return;
    lock();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", esc);
    return () => {
      unlock();
      window.removeEventListener("keydown", esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu]);

  const solid = scrolled || pathname !== "/" || menu;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />
      <nav
        aria-label="Navigation principale"
        className={`relative z-10 grid h-16 grid-cols-[1fr_auto_1fr] items-center px-[var(--gutter)] transition-colors duration-500 ${
          solid ? "bg-ink/70 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <Link href="/" className="nav-logo flex justify-self-start text-[42px] leading-none transition-opacity duration-300" data-nav-logo>
          <Logo glow priority sizes="48px" />
          <span className="sr-only"> — accueil</span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`label inline-block py-3 text-[11px] transition-colors hover:text-pink-soft ${pathname.startsWith(l.href) && l.href !== "/" ? "text-pink" : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 justify-self-end">
          <button onClick={open} className="label flex h-11 items-center gap-2 px-2 text-[11px] hover:text-pink-soft">
            Panier
            <span className={`mono flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] ${count ? "bg-pink text-ink" : "bg-asphalt text-bone"}`}>{count}</span>
            <span className="sr-only">article{count > 1 ? "s" : ""}, ouvrir le panier</span>
          </button>
          <button
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span className={`h-0.5 w-6 bg-bone transition-transform ${menu ? "translate-y-1 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-bone transition-transform ${menu ? "-translate-y-1 -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menu && (
          <m.div
            id="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-0 flex flex-col justify-between bg-ink px-[var(--gutter)] pb-10 pt-[calc(var(--header-h)+40px)] md:hidden"
          >
            <ul className="space-y-2">
              {LINKS.map((l, i) => (
                <m.li key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
                  <Link href={l.href} onClick={() => setMenu(false)} className="label block py-2 text-5xl font-black hover:text-pink">
                    {l.label}
                  </Link>
                </m.li>
              ))}
            </ul>
            <p className="mono text-xs text-bone/50">ILUR.STUDIO — DROP 01 — STOCK LIMITÉ</p>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
