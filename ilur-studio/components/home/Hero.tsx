"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { Logo } from "@/components/ui/Logo";

/**
 * Hero plein écran : photo du shooting + « ILUR » géant (≈ 40vw).
 * Au scroll, le mot rétrécit et vient se ranger à la place du logo de la nav (ScrollTrigger + scrub).
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  // Classes sur <html> pour masquer le logo de la nav tant que le mot n'est pas « rangé »
  useEffect(() => {
    const html = document.documentElement;
    return () => html.classList.remove("hero-active", "logo-docked");
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const html = document.documentElement;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        html.classList.add("hero-active");

        // Position/échelle cible = logo de la nav. Mesures indépendantes des transforms (wrapper fixe + offsetHeight).
        const target = () => document.querySelector<HTMLElement>("[data-nav-logo] .bubble, [data-nav-logo] img");
        const delta = () => {
          const t = target()?.getBoundingClientRect();
          const w = wrap.current!.getBoundingClientRect();
          if (!t) return { x: 0, y: -w.top, s: 0.1 };
          return {
            x: t.left + t.width / 2 - (w.left + w.width / 2),
            y: t.top + t.height / 2 - (w.top + w.height / 2),
            s: t.height / word.current!.offsetHeight,
          };
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "75% top",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => html.classList.toggle("logo-docked", self.progress > 0.985),
            onLeave: () => html.classList.add("logo-docked"),
          },
        });
        tl.to(word.current, { x: () => delta().x, y: () => delta().y, scale: () => delta().s, ease: "power1.inOut" }, 0)
          .to(".hero-bg", { scale: 1.12, yPercent: 8, ease: "none" }, 0)
          .to(".hero-shade", { opacity: 0.85, ease: "none" }, 0);

        return () => html.classList.remove("hero-active", "logo-docked");
      });

      // Entrée après le preloader
      // Le titre reste visible (élément LCP) : l'entrée ne joue que sur le transform.
      gsap.set(".hero-reveal", { autoAlpha: 0 });
      const off = onIntroDone(() => {
        gsap.fromTo(inner.current, { yPercent: 14, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1.1, ease: "power4.out" });
        gsap.fromTo(".hero-reveal", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, delay: 0.35, ease: "power3.out" });
      });
      return () => {
        off();
        mm.revert();
      };
    },
    { scope: section },
  );

  return (
    <section ref={section} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-ink" aria-label="ILUR — Drop 01">
      <Image
        src="/images/shooting-01.jpg"
        alt="Deux modèles en coupe-vents ILUR dans un parking souterrain en béton"
        fill
        priority
        sizes="100vw"
        quality={75}
        className="hero-bg object-cover object-center brightness-[0.7] grayscale-[45%]"
      />
      <div className="hero-shade absolute inset-0 bg-ink opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-transparent to-ink" />

      {/* Tube néon du parking qui grésille au chargement */}
      <div aria-hidden className="neon-tube absolute left-1/2 top-[calc(var(--header-h)+12px)] h-[3px] w-[64vw] max-w-[760px] -translate-x-1/2 rounded-full" />

      {/* Mot géant : fixe pendant le scroll pour pouvoir rejoindre la nav */}
      <div ref={wrap} className="hero-word-wrap pointer-events-none fixed inset-x-0 top-1/2 z-40 flex -translate-y-1/2 justify-center">
        <div ref={word} className="hero-word origin-center will-change-transform">
          <div ref={inner}>
            <h1 className="text-[min(40vw,58svh)]">
              <Logo className="glow-pulse" />
              <span className="sr-only"> — ILUR.STUDIO, streetwear</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-[var(--gutter)] pb-10 text-center md:flex-row md:items-end md:justify-between md:pb-12 md:text-left">
        <p className="hero-reveal mono max-w-xs text-[11px] leading-relaxed text-bone/70">
          DROP 01 — COUPE-VENTS OVERSIZE
          <br />
          SHOOTÉ AU NIVEAU -2 · STOCK LIMITÉ
        </p>
        <a href="#drop" className="hero-reveal btn-pink">
          Découvrir le drop <span aria-hidden>↓</span>
        </a>
        <p className="hero-reveal mono hidden text-[11px] text-bone/50 md:block">SCROLL ↓</p>
      </div>
    </section>
  );
}
