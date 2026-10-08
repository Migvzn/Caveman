import Image from "next/image";
import { site } from "@/lib/site";

/** Logo ILUR : fichier officiel si `site.logoSrc` est défini, sinon lettrage bubble CSS. */
export function Logo({ className = "", glow = true }: { className?: string; glow?: boolean }) {
  if (site.logoSrc) {
    return (
      <span className={`relative inline-block aspect-[2.4/1] h-[0.9em] ${className}`}>
        <Image src={site.logoSrc} alt="ILUR" fill sizes="50vw" className={glow ? "bubble-glow object-contain" : "object-contain"} priority />
      </span>
    );
  }
  return (
    <span className={`bubble inline-block select-none ${glow ? "bubble-glow" : ""} ${className}`}>
      <span className="sr-only">ILUR</span>
      <span aria-hidden>ILUR</span>
    </span>
  );
}
