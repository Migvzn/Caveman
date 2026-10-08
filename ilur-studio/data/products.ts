// Catalogue produits. Structure pensée pour être remplacée plus tard par
// Shopify Storefront API ou Stripe (voir README).

export type Category = "vestes" | "hauts" | "bas" | "accessoires";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "TU";
export type Badge = "LIMITÉ" | "SOLD OUT" | "NOUVEAU";

export type Product = {
  slug: string;
  name: string;
  ref: string;
  category: Category;
  price: number; // en euros
  badge?: Badge;
  featured?: boolean;
  releasedAt: string; // utilisé pour le tri « nouveautés »
  colorway: string;
  /** Première image = photo produit, deuxième = photo portée (utilisée au survol). */
  images: { src: string; alt: string }[];
  /** `false` = produit masqué du site (prêt à être publié plus tard). */
  published?: boolean;
  /** Stock par taille. 0 = taille épuisée. */
  sizes: Partial<Record<Size, number>>;
  description: string;
  composition: string[];
  care: string[];
};

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "vestes", label: "Vestes" },
  { value: "hauts", label: "Hauts" },
  { value: "bas", label: "Bas" },
  { value: "accessoires", label: "Accessoires" },
];

export const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL", "TU"];

const img = (slug: string, name: string) => [
  { src: `/images/products/${slug}-1.jpg`, alt: `${name} — photo produit` },
  { src: `/images/products/${slug}-2.jpg`, alt: `${name} — portée dans le parking` },
];

const CARE_NYLON = [
  "Lavage en machine à 30 °C, à l'envers, zip fermé.",
  "Ne pas utiliser d'adoucissant ni de javel.",
  "Séchage à l'air libre, pas de sèche-linge.",
  "Ne pas repasser la broderie.",
];

const CARE_COTTON = [
  "Lavage en machine à 30 °C, à l'envers.",
  "Séchage à plat, pas de sèche-linge.",
  "Repassage doux sur l'envers.",
];

const catalog: Product[] = [
  {
    slug: "coupe-vent-camo-rose",
    name: "Coupe-vent Camo Rose",
    ref: "ILR-D01-001",
    category: "vestes",
    price: 129, // [PRIX À CONFIRMER]
    badge: "LIMITÉ",
    featured: true,
    releasedAt: "2026-10-01",
    colorway: "Camo rose pâle / framboise / blanc",
    images: img("coupe-vent-camo-rose", "Coupe-vent Camo Rose"),
    sizes: { XS: 4, S: 12, M: 18, L: 14, XL: 6, XXL: 0 },
    description:
      "La pièce du retour. Coupe-vent à capuche, coupe oversize, imprimé camouflage rose pâle, framboise et blanc. Zip noir pleine longueur, logo ILUR noir brodé côté cœur. Fait pour traîner dans le béton et se faire remarquer.",
    composition: ["Extérieur : 100 % polyamide ripstop déperlant", "Doublure : 100 % polyester mesh", "Zip et tirettes noirs mats"],
    care: CARE_NYLON,
  },
  {
    slug: "coupe-vent-noir-ilur-studio",
    name: "Coupe-vent Noir ILUR.STUDIO",
    ref: "ILR-D01-002",
    category: "vestes",
    price: 129, // [PRIX À CONFIRMER]
    badge: "LIMITÉ",
    featured: true,
    releasedAt: "2026-10-01",
    published: false, // en attente des photos produit — passe à `true` (ou supprime la ligne) pour le mettre en ligne
    colorway: "Noir mat / anthracite",
    images: img("coupe-vent-noir-ilur-studio", "Coupe-vent Noir ILUR.STUDIO"),
    sizes: { XS: 2, S: 9, M: 15, L: 11, XL: 7, XXL: 3 },
    description:
      "Coupe-vent à capuche noir mat, panneaux noir et anthracite, inscription « ILUR.STUDIO » blanche côté cœur. Coupe oversize, épaules tombantes. Discret de loin, net de près.",
    composition: ["Extérieur : 100 % polyamide mat", "Panneaux : polyamide anthracite", "Doublure : 100 % polyester mesh"],
    care: CARE_NYLON,
  },
];

/** Produits visibles sur le site. */
export const products = catalog.filter((p) => p.published !== false);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const isSoldOut = (p: Product) => p.badge === "SOLD OUT" || Object.values(p.sizes).every((q) => !q);
