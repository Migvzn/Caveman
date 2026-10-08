"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { useScroll } from "@/components/providers/SmoothScroll";

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode };

export function Modal({ open, onClose, title, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const { lock, unlock } = useScroll();

  useEffect(() => {
    if (!open) return;
    lock();
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center md:items-center">
          <m.button
            tabIndex={-1}
            aria-label="Fermer"
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            data-lenis-prevent
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[85svh] w-full max-w-2xl overflow-y-auto border border-asphalt bg-ink p-6 outline-none md:p-10"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="label text-lg">{title}</h2>
              <button onClick={onClose} className="label -mr-2 -mt-2 h-11 px-2 text-[11px] hover:text-pink-soft">
                Fermer ✕
              </button>
            </div>
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
