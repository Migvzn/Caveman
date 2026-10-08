import Image from "next/image";
import { site } from "@/lib/site";

type Props = { className?: string; glow?: boolean; priority?: boolean; sizes?: string };

/** Logo : fichier officiel si `site.logoSrc` est défini (hauteur = 1em), sinon lettrage bubble CSS. */
export function Logo({ className = "", glow = true, priority = false, sizes = "50vw" }: Props) {
  if (site.logoSrc) {
    return (
      <span className={`relative inline-block h-[1em] align-top ${className}`} style={{ aspectRatio: site.logoAspect }}>
        <Image src={site.logoSrc} alt="ILUR" fill sizes={sizes} priority={priority} className={`object-contain ${glow ? "bubble-glow" : ""}`} />
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
