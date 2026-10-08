"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { INTRO_KEY, markIntroDone } from "@/lib/intro";
import { useScroll } from "@/components/providers/SmoothScroll";
import { Logo } from "./Logo";

/**
 * Intro (≤ 2 s) : compteur 000 → 100, logo qui s'allume comme un néon, ouverture verticale.
 * Ignoré si déjà vu dans la session (classe `intro-seen` posée par un script inline dans <head>).
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const { lock, unlock } = useScroll();

  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains("intro-seen")) {
      setDone(true);
      markIntroDone();
      return;
    }
    lock();
    let finished = false;
    const release = () => {
      if (!finished) unlock();
      finished = true;
    };
    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {}
      release();
      setDone(true);
      markIntroDone();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(root);
    if (reduced) {
      if (counter.current) counter.current.textContent = "100";
      gsap.set(logo.current, { opacity: 1 });
      const t = gsap.to(root.current, { opacity: 0, duration: 0.3, delay: 0.4, onComplete: finish });
      return () => {
        t.kill();
        release();
      };
    }

    const obj = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(obj, {
      v: 100,
      duration: 1.05,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counter.current) counter.current.textContent = String(Math.round(obj.v)).padStart(3, "0");
      },
    })
      // néon : 3 grésillements puis allumage
      .set(logo.current, { opacity: 1 }, 0.55)
      .set(logo.current, { opacity: 0.1 }, 0.62)
      .set(logo.current, { opacity: 1 }, 0.7)
      .set(logo.current, { opacity: 0.25 }, 0.76)
      .set(logo.current, { opacity: 1 }, 0.84)
      .fromTo(logo.current, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "power3.out" }, 0.55)
      .to(q(".pl-ui"), { opacity: 0, duration: 0.2 }, 1.2)
      .to(q(".pl-top"), { yPercent: -100, duration: 0.65, ease: "power4.inOut" }, 1.25)
      .to(q(".pl-bottom"), { yPercent: 100, duration: 0.65, ease: "power4.inOut" }, 1.25);

    return () => {
      tl.kill();
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="preloader fixed inset-0 z-[100]" role="status" aria-label="Chargement">
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
      <div className="pl-ui absolute inset-0">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Visible dès le premier rendu (néon « éteint ») : c'est l'élément LCP pendant l'intro. */}
          <div ref={logo} className="opacity-[0.12]">
            <Logo className="glow-pulse text-[30vw] md:text-[14vw]" sizes="(min-width: 768px) 13vw, 27vw" priority />
          </div>
        </div>
        <div className="mono absolute bottom-6 left-[var(--gutter)] text-xs text-bone/60">ILUR.STUDIO / DROP 01</div>
        <span ref={counter} className="mono absolute bottom-5 right-[var(--gutter)] text-4xl text-bone tabular-nums md:text-6xl">
          000
        </span>
      </div>
    </div>
  );
}
