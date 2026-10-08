"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/** Curseur rond rose qui grossit et affiche un label (ex. « VOIR ») sur les éléments [data-cursor]. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current) return;
    const el = dot.current;
    document.documentElement.classList.add("has-cursor");
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let visible = false;

    const move = (e: PointerEvent) => {
      if (!visible) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.2 });
        visible = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const view = target.closest<HTMLElement>("[data-cursor]");
      const interactive = target.closest("a, button, [role='button'], label, select");
      setLabel(view?.dataset.cursor ?? null);
      gsap.to(el, { scale: view ? 1 : interactive ? 0.45 : 0.22, duration: 0.35, ease: "power3.out" });
    };
    const leave = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
      visible = false;
    };

    gsap.set(el, { scale: 0.22, autoAlpha: 0, xPercent: -50, yPercent: -50 });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[120] flex h-20 w-20 items-center justify-center rounded-full bg-pink mix-blend-normal shadow-[0_0_30px_rgb(255_10_140/0.6)]"
    >
      <span className={`label text-[11px] text-ink transition-opacity duration-200 ${label ? "opacity-100" : "opacity-0"}`}>{label}</span>
    </div>
  );
}
