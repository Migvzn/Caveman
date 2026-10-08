# ILUR.STUDIO — site e-commerce

![Aperçu](docs/apercu.jpg)

Site du drop 01 d'ILUR : Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, animations GSAP/ScrollTrigger, smooth scroll Lenis, transitions Framer Motion.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # version production
```

Node 20+ recommandé.

---

## Ce qu'il y a dedans

| Page | Contenu |
|---|---|
| `/` | Preloader (compteur 000 → 100, logo néon, ouverture verticale) · barre d'annonce défilante · hero avec « ILUR » géant qui se range dans la nav au scroll · compte à rebours du drop + « Préviens-moi » · produits phares · lookbook horizontal épinglé · manifeste révélé mot par mot · footer avec logo géant |
| `/shop` | Grille filtrable (vestes, hauts, bas, accessoires) + tri (nouveautés, prix croissant/décroissant) |
| `/shop/[slug]` | Galerie (photo produit + photo portée), tailles XS → XXL avec stock, guide des tailles en modale, « Ajouter au panier », accordéons description / composition / entretien / livraison & retours |
| Panier | Tiroir latéral, quantités, sous-total, « Commander ». Sauvegardé dans le navigateur (localStorage). |
| `/mentions-legales`, `/cgv` | Modèles à compléter |

Effets globaux : grain animé, curseur rose « VOIR » sur les produits (souris uniquement), glow néon pulsé, transitions de page (volet rose).

---

## Les images

Toutes les images sont dans `public/images/` (photos du shooting, compressées pour le web) :

| Fichier | Où il apparaît |
|---|---|
| `shooting-01.jpg` | Hero (plein écran sur mobile, au centre du triptyque sur ordinateur) |
| `shooting-03.jpg`, `shooting-06.jpg` | Hero ordinateur (gauche et droite du triptyque) |
| `shooting-02/04/05/03/07.jpg` | Lookbook (ordre et légendes dans `data/lookbook.ts`) |
| `og.jpg` | Image de partage (Instagram, WhatsApp, iMessage…), 1200 × 630 |
| `products/<slug>-1.jpg` / `-2.jpg` | Fiche produit : 1re image + image affichée au survol (format 4:5). Actuellement : recadrages du shooting |
| `logo.png` | Monogramme iS blanc contour rose (fond transparent), utilisé partout |
| `logo-noir.png` | Monogramme noir, pour fonds clairs (non utilisé sur le site pour l'instant) |

Pour changer une photo : remplace le fichier en gardant le même nom (JPG en ~1200 px de large, moins de ~400 Ko), ou ajoute-en une nouvelle et modifie le chemin dans `data/lookbook.ts`, `data/products.ts` ou `components/home/Hero.tsx`. `next/image` génère automatiquement l'AVIF/WebP aux bonnes tailles.

> Si tu remplaces un fichier pendant que le serveur tourne et que l'ancienne image reste affichée : arrête le serveur, supprime `.next/cache/images`, relance.

### Le logo

Le monogramme officiel est réglé dans `lib/site.ts` (`logoSrc`, `logoAspect` = largeur / hauteur). Mets `logoSrc: null` pour revenir au lettrage bubble « ILUR » dessiné en CSS. Le favicon (`app/icon.png`, `app/apple-icon.png`) est le même monogramme sur fond noir.

---

## Modifier les produits

Tout est dans **`data/products.ts`**. Chaque produit :

```ts
{
  slug: "coupe-vent-camo-rose",        // URL : /shop/coupe-vent-camo-rose (et nom des images)
  name: "Coupe-vent Camo Rose",
  ref: "ILR-D01-001",                  // référence affichée en monospace
  category: "vestes",                  // vestes | hauts | bas | accessoires
  price: 129,                          // en euros
  badge: "LIMITÉ",                     // "LIMITÉ" | "SOLD OUT" | "NOUVEAU" (optionnel)
  featured: true,                      // affiché dans « Le drop du retour » sur l'accueil
  releasedAt: "2026-10-01",            // tri « nouveautés »
  sizes: { XS: 4, S: 12, M: 18, L: 14, XL: 6, XXL: 0 },  // stock par taille, 0 = barré. Accessoires : { TU: 30 }
  ...
}
```

- Une pièce dont toutes les tailles sont à 0 (ou avec le badge `SOLD OUT`) passe automatiquement en « Sold out ».
- **En ligne pour l'instant :** le Coupe-vent Camo Rose uniquement. Le Coupe-vent Noir ILUR.STUDIO est prêt mais masqué (`published: false`) en attente de ses photos produit : supprime cette ligne pour le publier. Prix de 129 € à confirmer.
- `published: false` masque un produit partout (boutique, accueil, sitemap, URL en 404) sans le supprimer.
- Le guide des tailles (mesures en cm) est dans `data/sizeGuide.ts` — mesures indicatives à remplacer par celles de ton atelier.

---

## Changer la date du drop (et les autres réglages)

Dans **`lib/site.ts`** :

```ts
dropDate: "2026-11-14T18:00:00+01:00",   // date + heure + fuseau (+01:00 = heure d'hiver Paris, +02:00 = été)
dropNumber: "01",
socials: { instagram: {...}, tiktok: {...} },   // @ à compléter
checkoutUrl: null,                       // lien de paiement (voir ci-dessous)
freeShippingFrom: 150,                   // seuil livraison offerte
```

Quand la date est passée, le compte à rebours affiche « Le drop est live » avec un bouton vers le shop.

Les textes de la barre d'annonce sont dans `components/ui/AnnouncementBar.tsx`, le manifeste dans `components/home/Manifesto.tsx`.

---

## Brancher la suite

**E-mails (Préviens-moi + newsletter)** — les deux formulaires envoient vers `app/api/notify/route.ts`, qui valide l'adresse puis l'écrit dans les logs. Remplace le `TODO` par un appel à ton outil (Klaviyo, Brevo, Mailchimp…), avec la clé d'API dans une variable d'environnement (`.env.local`). Le champ `source` vaut `"drop"` ou `"newsletter"` pour les mettre dans deux listes différentes.

**Paiement** — le panier est déjà complet côté site. Deux options :
- *Le plus rapide :* un lien Stripe Payment Link ou un checkout Shopify dans `checkoutUrl`.
- *Le plus propre :* Shopify Storefront API — remplacer le contenu de `data/products.ts` par une requête Storefront et créer un `cart` Shopify au clic sur « Commander ». Les types `Product` / `CartLine` sont pensés pour se mapper facilement (slug = handle, sizes = variantes).

Tant que `checkoutUrl` vaut `null`, « Commander » affiche un message indiquant que le paiement ouvre avec le drop.

**Domaine** — en production, définis `NEXT_PUBLIC_SITE_URL=https://ilur.studio` (sert aux balises Open Graph et au sitemap).

---

## Performance, accessibilité, SEO

- **Preloader** affiché une seule fois par session (sessionStorage) : il est sauté si on revient sur le site dans la même session.
- **Mobile d'abord** : sur téléphone, le lookbook passe en swipe natif (pas de scroll épinglé), le curseur custom est désactivé, menu plein écran.
- **`prefers-reduced-motion`** : coupe le grain animé, le flicker du néon, le marquee, le scroll épinglé, le smooth scroll et l'animation du hero ; le manifeste est affiché directement.
- **Accessibilité** : navigation clavier (lien d'évitement, focus rose visible, tiroir et modale avec Échap et focus piégé), libellés ARIA, contrastes sur fond noir.
- **SEO** : titre « ILUR.STUDIO — Streetwear », meta description, Open Graph + Twitter avec `og.jpg`, données structurées Product sur chaque fiche, `sitemap.xml` et `robots.txt` générés.

Mesures Lighthouse (mobile, build de production en local, vraies photos) :

| Mode | Performance | Accessibilité | Bonnes pratiques | SEO | LCP |
|---|---|---|---|---|---|
| Throttling DevTools (réel) | 90 | 96 | 100 | 100 | 1,8 s |
| Throttling simulé (par défaut) | 85–86 | 96 | 100 | 100 | ~4 s* |

\* Dans un vrai navigateur (CPU ×4), le LCP est le logo du preloader, visible dès le premier rendu en « néon éteint » (~0,5 s). Le mode simulé de Lighthouse compte tout le JavaScript (React, GSAP) et l'image du logo sur une 4G lente modélisée. À savoir : Chrome ignore comme élément LCP les images très simples affichées en grand (comme le logo du hero) et les photos plein écran ; c'est pour ça que le logo du preloader ne démarre pas à opacité 0. Les 4 points d'accessibilité manquants viennent du manifeste (mots volontairement estompés avant leur révélation au scroll) et des petits textes monospace de 10–11 px.

---|---|---|---|---|---|
| Throttling DevTools (réel) | 92 | 96 | 96 | 100 | 1,8 s |
| Throttling simulé (par défaut) | 89 | 96 | 96 | 100 | 3,5 s* |

\* En navigateur réel, le titre du hero (élément LCP) s'affiche dès le premier rendu (~0,3 s avec CPU ×4). Le mode simulé de Lighthouse compte tout le JavaScript (React, GSAP) téléchargé avant ce rendu sur une 4G lente modélisée. Les 4 points d'accessibilité manquants viennent du manifeste (mots volontairement estompés avant leur révélation au scroll) et des petits textes monospace de 10–11 px. Refais la mesure une fois les vraies photos en place : vise des JPG de moins de ~400 Ko chacun.

---

## Structure

```
app/                  pages (accueil, shop, fiche produit, légal), layout, API e-mail, sitemap
components/home/      Hero, Countdown, FeaturedProducts, Lookbook, Manifesto
components/shop/      ShopGrid, ProductGallery, ProductInfo
components/ui/        Header, AnnouncementBar, CartDrawer, Preloader, Cursor, Grain, Logo, Modal…
components/providers/ Lenis (SmoothScroll), panier (CartProvider), Framer Motion (LazyMotion)
data/                 products.ts, lookbook.ts, sizeGuide.ts
lib/site.ts           date du drop, réseaux, logo, paiement
public/images/        photos du shooting, logo, image de partage
```

Couleurs (dans `app/globals.css`, `:root`) : `--ink #0A0A0A`, `--concrete #D9D7D2`, `--asphalt #2B2B2B`, `--bone #F4F2EE`, `--pink #FF0A8C`, `--pink-soft #F7B8D6`, `--pink-deep #E0287A`. Utilisables en Tailwind : `bg-ink`, `text-pink`, `border-asphalt`…
