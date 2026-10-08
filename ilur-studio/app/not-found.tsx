import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-[var(--gutter)] pt-[var(--header-h)] text-center">
      <p className="mono text-xs text-pink">ERREUR 404 — NIVEAU -3</p>
      <h1 className="bubble bubble-glow text-[30vw] md:text-[18vw]">404</h1>
      <p className="label max-w-md text-sm">Cette page s&apos;est perdue dans le parking.</p>
      <Link href="/" className="btn-pink">
        Retour à la surface
      </Link>
    </section>
  );
}
