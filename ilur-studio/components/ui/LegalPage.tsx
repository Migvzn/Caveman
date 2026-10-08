import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-[var(--gutter)] pb-24 pt-[calc(var(--header-h)+56px)]">
      <p className="mono mb-3 text-[11px] text-pink">DERNIÈRE MISE À JOUR — {updated}</p>
      <h1 className="label mb-12 text-4xl font-black leading-[0.95] md:text-6xl">{title}</h1>
      <div className="space-y-10 text-sm leading-relaxed text-bone/75 [&_h2]:label [&_h2]:mb-3 [&_h2]:text-xs [&_h2]:text-bone [&_p+p]:mt-3">{children}</div>
    </article>
  );
}
