"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { EmailForm } from "@/components/ui/EmailForm";

const target = new Date(site.dropDate).getTime();

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { v: Math.floor(s / 86400), l: "Jours" },
    { v: Math.floor((s % 86400) / 3600), l: "Heures" },
    { v: Math.floor((s % 3600) / 60), l: "Min" },
    { v: s % 60, l: "Sec" },
  ];
}

const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(
  new Date(site.dropDate),
);

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const live = now !== null && now >= target;
  const values = now === null ? null : parts(target - now);

  return (
    <section id="countdown" className="concrete px-[var(--gutter)] py-20 md:py-28" aria-labelledby="countdown-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="countdown-title" className="label text-sm">
            Prochain drop <span className="mono text-pink-deep">#{site.dropNumber}</span>
          </h2>
          <p className="mono text-[11px] text-ink/60">{dateLabel.toUpperCase()} — PARIS</p>
        </div>

        {live ? (
          <div className="space-y-8">
            <p className="label text-5xl font-black md:text-8xl">Le drop est live.</p>
            <Link href="/shop" className="btn-pink">
              Accéder au shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 md:gap-6" role="timer" aria-live="off">
            {(values ?? parts(0)).map((p, i) => (
              <div key={p.l} className="relative border-t-2 border-ink pt-3">
                <span className="mono block text-[clamp(2.6rem,14vw,10rem)] font-bold leading-none tabular-nums tracking-tighter">
                  {values ? String(p.v).padStart(2, "0") : "--"}
                </span>
                <span className="mono mt-2 block text-[10px] text-ink/60 md:text-xs">{p.l}</span>
                {i < 3 && <span aria-hidden className="absolute -right-1 top-3 hidden h-3 w-3 rounded-full bg-pink md:-right-4 md:block" />}
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 grid gap-8 md:grid-cols-2 md:items-end">
          <p className="label max-w-md text-xl leading-tight md:text-2xl">
            Accès anticipé : la liste reçoit le lien <span className="text-pink-deep">1 h avant</span> tout le monde.
          </p>
          <EmailForm source="drop" cta="Préviens-moi" tone="light" />
        </div>
      </div>
    </section>
  );
}
