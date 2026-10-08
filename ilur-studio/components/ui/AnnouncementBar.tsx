const TEXT = "ILUR EST DE RETOUR — DROP 01 — STOCK LIMITÉ — ";

export function AnnouncementBar() {
  const group = (
    <span className="flex shrink-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="whitespace-pre pr-1">
          {TEXT}
        </span>
      ))}
    </span>
  );
  return (
    <div className="label relative flex h-8 items-center overflow-hidden bg-pink text-[11px] text-ink">
      <p className="sr-only">ILUR est de retour. Drop 01, stock limité.</p>
      <div className="marquee-track flex w-max" aria-hidden>
        {group}
        {group}
      </div>
    </div>
  );
}
