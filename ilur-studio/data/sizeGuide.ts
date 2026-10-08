// Guides des tailles (en cm). [À AJUSTER avec les vraies mesures des pièces]
import type { Category } from "./products";

type Guide = { columns: string[]; rows: (string | number)[][]; note: string };

const TOPS: Guide = {
  columns: ["Taille", "Largeur poitrine", "Longueur dos", "Longueur manche"],
  rows: [
    ["XS", 62, 70, 60],
    ["S", 65, 72, 61],
    ["M", 68, 74, 62],
    ["L", 71, 76, 63],
    ["XL", 74, 78, 64],
    ["XXL", 77, 80, 65],
  ],
  note: "Coupe oversize : prends ta taille habituelle pour l'effet ample, une taille en dessous pour un tombé plus près du corps.",
};

const BOTTOMS: Guide = {
  columns: ["Taille", "Tour de taille", "Longueur", "Largeur bas"],
  rows: [
    ["XS", 70, 100, 26],
    ["S", 74, 102, 27],
    ["M", 78, 104, 28],
    ["L", 82, 106, 29],
    ["XL", 86, 108, 30],
    ["XXL", 90, 110, 31],
  ],
  note: "Coupe baggy : taille élastiquée avec cordon, prends ta taille habituelle.",
};

export const sizeGuides: Partial<Record<Category, Guide>> = { vestes: TOPS, hauts: TOPS, bas: BOTTOMS };
