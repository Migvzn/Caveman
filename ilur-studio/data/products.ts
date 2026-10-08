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

export const products: Product[] = [
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
    colorway: "Noir mat / anthracite",
    images: img("coupe-vent-noir-ilur-studio", "Coupe-vent Noir ILUR.STUDIO"),
    sizes: { XS: 2, S: 9, M: 15, L: 11, XL: 7, XXL: 3 },
    description:
      "Coupe-vent à capuche noir mat, panneaux noir et anthracite, inscription « ILUR.STUDIO » blanche côté cœur. Coupe oversize, épaules tombantes. Discret de loin, net de près.",
    composition: ["Extérieur : 100 % polyamide mat", "Panneaux : polyamide anthracite", "Doublure : 100 % polyester mesh"],
    care: CARE_NYLON,
  },
  // ↓ Pièces d'exemple : à remplacer par la vraie collection. [À COMPLÉTER]
  {
    slug: "hoodie-bubble-logo",
    name: "Hoodie Bubble Logo",
    ref: "ILR-D01-003",
    category: "hauts",
    price: 89,
    badge: "NOUVEAU",
    releasedAt: "2026-10-05",
    colorway: "Noir / logo blanc contour rose",
    images: img("hoodie-bubble-logo", "Hoodie Bubble Logo"),
    sizes: { XS: 5, S: 10, M: 20, L: 16, XL: 8, XXL: 4 },
    description:
      "Hoodie épais coupe boxy, gros logo ILUR en lettrage bubble blanc contour rose fluo sur la poitrine. Capuche doublée, poche kangourou.",
    composition: ["80 % coton biologique, 20 % polyester recyclé", "Molleton gratté 450 g/m²"],
    care: CARE_COTTON,
  },
  {
    slug: "t-shirt-ilur-studio",
    name: "T-shirt ILUR.STUDIO",
    ref: "ILR-D01-004",
    category: "hauts",
    price: 45,
    releasedAt: "2026-09-20",
    colorway: "Blanc cassé / noir",
    images: img("t-shirt-ilur-studio", "T-shirt ILUR.STUDIO"),
    sizes: { XS: 8, S: 20, M: 25, L: 22, XL: 10, XXL: 6 },
    description: "T-shirt lourd coupe oversize, col côtelé épais, « ILUR.STUDIO » imprimé côté cœur. La base de toutes les tenues.",
    composition: ["100 % coton biologique", "Jersey 240 g/m²"],
    care: CARE_COTTON,
  },
  {
    slug: "pantalon-baggy-noir",
    name: "Pantalon Baggy Noir",
    ref: "ILR-D01-005",
    category: "bas",
    price: 95,
    badge: "SOLD OUT",
    releasedAt: "2026-09-15",
    colorway: "Noir",
    images: img("pantalon-baggy-noir", "Pantalon Baggy Noir"),
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    description: "Pantalon large tombant, taille élastiquée avec cordon, poches cargo plates. Le bas qui va avec tout le drop.",
    composition: ["65 % coton, 35 % polyamide", "Toile sergé 280 g/m²"],
    care: CARE_COTTON,
  },
  {
    slug: "bonnet-camo-rose",
    name: "Bonnet Camo Rose",
    ref: "ILR-D01-006",
    category: "accessoires",
    price: 35,
    badge: "LIMITÉ",
    releasedAt: "2026-10-01",
    colorway: "Camo rose / étiquette noire",
    images: img("bonnet-camo-rose", "Bonnet Camo Rose"),
    sizes: { TU: 30 },
    description: "Bonnet à revers en maille jacquard camo rose, étiquette ILUR tissée noire. Assorti au coupe-vent.",
    composition: ["100 % acrylique doux"],
    care: ["Lavage à la main à froid.", "Séchage à plat."],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const isSoldOut = (p: Product) => p.badge === "SOLD OUT" || Object.values(p.sizes).every((q) => !q);
