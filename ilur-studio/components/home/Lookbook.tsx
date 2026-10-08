"use client";

import Image from "next/image";
import { useRef } from "react";
import { looks } from "@/data/lookbook";
import { gsap, useGSAP } from "@/lib/gsap";

/** Lookbook : section épinglée, le scroll vertical fait défiler les photos à l'horizontale (desktop). Swipe natif sur mobile. */
export function Lookbook() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(viewport.current, { overflow: "visible" });
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const el = section.current?.querySelector<HTMLElement>(".lb-progress");
              if (el) el.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="lookbook" className="relative scroll-mt-0 overflow-hidden bg-[#111] md:h-[100svh]" aria-labelledby="lookbook-title">
      <div ref={viewport} className="no-scrollbar h-full snap-x snap-mandatory scroll-px-[var(--gutter)] overflow-x-auto" tabIndex={0} aria-label="Photos du lookbook, défilement horizontal">
        <div ref={track} className="flex h-full w-max items-center gap-4 px-[var(--gutter)] pb-16 pt-[calc(var(--header-h)+24px)] md:gap-8 md:pb-14">
          <div className="flex w-[78vw] shrink-0 snap-start flex-col justify-between self-stretch md:w-[34vw]">
            <div>
              <p className="mono mb-4 text-[11px] text-pink">LOOKBOOK — DROP 01</p>
              <h2 id="lookbook-title" className="label text-5xl font-black leading-[0.9] md:text-[5.5vw]">
                Niveau
                <br />
                -2
              </h2>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-bone/70">
              Un parking souterrain, un tube néon, deux coupe-vents. Puis le toit, à ciel ouvert. Shooting brut, sans retouche, là où ILUR est né.
            </p>
          </div>
          {looks.map((l, i) => (
            <figure key={l.src} className="shrink-0 snap-center">
              <div className="relative h-[62svh] overflow-hidden bg-asphalt md:h-[68svh]" style={{ aspectRatio: `${l.w} / ${l.h}` }}>
                <Image src={l.src} alt={l.alt} fill sizes="(min-width: 768px) 60vw, 85vw" className="object-cover" />
              </div>
              <figcaption className="mono mt-3 flex justify-between gap-6 text-[11px] text-bone/70">
                <span>{l.caption}</span>
                <span className="text-bone/40">
                  {String(i + 1).padStart(2, "0")}/{String(looks.length).padStart(2, "0")}
                </span>
              </figcaption>
            </figure>
          ))}
          <div className="w-[10vw] shrink-0" aria-hidden />
        </div>
      </div>
      <div aria-hidden className="absolute inset-x-[var(--gutter)] bottom-6 hidden h-px bg-bone/15 md:block">
        <div className="lb-progress h-full origin-left scale-x-0 bg-pink" />
      </div>
    </section>
  );
}
