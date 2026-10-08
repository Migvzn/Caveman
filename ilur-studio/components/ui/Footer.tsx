import Link from "next/link";
import { site } from "@/lib/site";
import { EmailForm } from "./EmailForm";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-asphalt bg-ink">
      <div className="grid gap-12 px-[var(--gutter)] pb-10 pt-16 md:grid-cols-[1.3fr_1fr_1fr] md:pt-24">
        <div className="max-w-md">
          <p className="label mb-2 text-xs text-pink">Newsletter</p>
          <p className="label mb-6 text-2xl leading-tight md:text-3xl">Les drops arrivent sans prévenir. Sauf pour toi.</p>
          <EmailForm source="newsletter" cta="S'inscrire" />
        </div>
        <div>
          <p className="mono mb-4 text-[11px] text-bone/50">Suivre</p>
          <ul className="label space-y-3 text-sm">
            <li>
              <a href={site.socials.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-pink-soft">
                Instagram <span className="mono text-[11px] text-bone/50">{site.socials.instagram.handle}</span>
              </a>
            </li>
            <li>
              <a href={site.socials.tiktok.url} target="_blank" rel="noopener noreferrer" className="hover:text-pink-soft">
                TikTok <span className="mono text-[11px] text-bone/50">{site.socials.tiktok.handle}</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mono mb-4 text-[11px] text-bone/50">Infos</p>
          <ul className="label space-y-3 text-sm">
            <li><Link href="/shop" className="hover:text-pink-soft">Shop</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-pink-soft">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-pink-soft">CGV</Link></li>
          </ul>
        </div>
      </div>
      <div className="mono flex flex-wrap justify-between gap-2 px-[var(--gutter)] text-[11px] text-bone/40">
        <span>© {new Date().getFullYear()} ILUR.STUDIO — Tous droits réservés</span>
        <span>Né dans le béton. Fait pour la rue.</span>
      </div>
      {/* Logo géant qui déborde du cadre */}
      <div aria-hidden className="pointer-events-none -mb-[8vw] mt-10 flex justify-center leading-none">
        <Logo className="text-[36vw]" glow={false} />
      </div>
    </footer>
  );
}
