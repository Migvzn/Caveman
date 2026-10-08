"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () => import("@/lib/motion-features").then((m) => m.default);

/** Framer Motion en chargement différé (composants `m.*`) + respect de prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
