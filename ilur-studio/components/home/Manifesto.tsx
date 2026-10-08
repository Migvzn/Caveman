"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const LINES = [["Né", "dans", "le", "béton."], ["Fait", "pour", "la", "rue."], ["ILUR", "revient."]];

/** Manifeste révélé mot par mot au scroll. */
export function Manifesto() {
  const section = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".manifest-word", {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: ".manifest-text", start: "top 80%", end: "bottom 45%", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="manifeste" className="px-[var(--gutter)] py-28 md:py-44" aria-labelledby="manifeste-title">
      <h2 id="manifeste-title" className="mono mb-10 text-[11px] text-pink">
        MANIFESTE — À PROPOS
      </h2>
      <p className="manifest-text label max-w-6xl text-[clamp(2.4rem,8.5vw,8.5rem)] font-black leading-[0.95]">
        {LINES.map((line, i) => (
          <span key={i} className="block">
            {line.map((w) => (
              <span key={w} className={`manifest-word inline-block pr-[0.25em] ${w === "ILUR" ? "bubble bubble-glow pr-[0.3em] font-normal" : ""}`}>
                {w}
              </span>
            ))}
          </span>
        ))}
      </p>
      <div className="mt-16 grid gap-8 md:ml-auto md:max-w-3xl md:grid-cols-2">
        <p className="text-sm leading-relaxed text-bone/70">
          ILUR.STUDIO revient avec un premier drop pensé dans les parkings souterrains : des coupe-vents oversize, un camo rose qui refuse de se fondre dans le
          décor, et des pièces produites en séries limitées.
        </p>
        <p className="text-sm leading-relaxed text-bone/70">
          Pas de restock. Pas de soldes. Quand c&apos;est parti, c&apos;est parti. Le gris du béton pour le fond, le rose pour l&apos;attitude.
        </p>
      </div>
    </section>
  );
}
