// Réglages globaux de la marque : modifie ici la date du drop, les réseaux, etc.
export const site = {
  name: "ILUR.STUDIO",
  title: "ILUR.STUDIO — Streetwear",
  description:
    "ILUR est de retour. Drop 01 : coupe-vent oversize, camo rose, stock limité. Né dans le béton, fait pour la rue.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // Date du prochain drop (format ISO avec fuseau horaire). [À COMPLÉTER]
  dropDate: "2026-11-14T18:00:00+01:00",
  dropNumber: "01",

  // Chemin du logo officiel (ex. "/images/logo.png" ou "/images/logo.svg").
  // Laisse `null` pour utiliser le lettrage bubble généré en CSS.
  logoSrc: null as string | null,

  socials: {
    instagram: { handle: "@ilur.studio", url: "https://instagram.com/ilur.studio" }, // [À COMPLÉTER]
    tiktok: { handle: "@ilur.studio", url: "https://tiktok.com/@ilur.studio" }, // [À COMPLÉTER]
  },

  // URL de paiement (Shopify checkout, Stripe Payment Link…). `null` = paiement pas encore branché.
  checkoutUrl: null as string | null,

  currency: "EUR",
  freeShippingFrom: 150,
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: site.currency, maximumFractionDigits: 0 }).format(value);
