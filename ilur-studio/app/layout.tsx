import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Rubik_Bubbles, Space_Grotesk, Unbounded } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { Cursor } from "@/components/ui/Cursor";
import { Footer } from "@/components/ui/Footer";
import { Grain } from "@/components/ui/Grain";
import { Header } from "@/components/ui/Header";
import { Preloader } from "@/components/ui/Preloader";
import { INTRO_KEY } from "@/lib/intro";
import { site } from "@/lib/site";
import "./globals.css";

const bubbles = Rubik_Bubbles({ weight: "400", subsets: ["latin"], variable: "--font-rubik-bubbles", display: "swap" });
const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — ILUR.STUDIO" },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "Shooting ILUR dans un parking souterrain" }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: ["/images/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#0A0A0A", width: "device-width", initialScale: 1 };

// Exécuté avant le premier rendu : saute le preloader si déjà vu dans la session.
const introScript = `try{if(sessionStorage.getItem('${INTRO_KEY}'))document.documentElement.classList.add('intro-seen')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${bubbles.variable} ${unbounded.variable} ${grotesk.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <SmoothScroll>
          <MotionProvider>
            <CartProvider>
              <a href="#contenu" className="label sr-only z-[200] bg-pink px-4 py-3 text-xs text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
                Aller au contenu
              </a>
              <Preloader />
              <Header />
              <main id="contenu">{children}</main>
              <Footer />
              <CartDrawer />
              <Cursor />
              <Grain />
            </CartProvider>
          </MotionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
