# MIGMODS — Charte de design et d'intégration

**Version 1.0 — 22 octobre 2026.** C'est la **seule référence** pour tous les développeurs du thème (`migmods/theme`), de l'outillage (`migmods/tools`) et du configurateur (`migmods/configurator`). Elle remplace les audits et les trois directions proposées. En cas de contradiction entre un audit et ce document, **ce document l'emporte**. En cas de doute sur un point qui n'y figure pas, on applique la solution la plus sobre et on la signale dans le champ « requests ».

Vocabulaire : **DOIT** = obligatoire ; **NE DOIT PAS** = interdit ; **PEUT** = autorisé, sans plus.

---

## Sommaire

0. Décision artistique (notes, base retenue, greffes, rejets)
1. Principes de la maison
2. Architecture technique, migration et propriété des fichiers
3. Tokens (code complet)
4. Typographie
5. Grille, mise en page, espacements
6. Composants
7. Mouvement et lumière
8. Socle global : layout, fond, en-tête, méga-menu, menu mobile, pied de page
9. Plan page par page, section par section
10. Nouvelles sections, snippets et outils
11. Textes clés
12. Téléphone et iOS
13. Accessibilité
14. Performance
15. SEO et partage
16. Contenu, prix, marques, juridique
17. Recette : définition de « terminé »
18. Demandes hors thème
Annexe A — Limites du simulateur
Annexe B — Index des classes, attributs, événements

---

## 0. Décision artistique

### 0.1 Notes des trois directions (sur 10)

| Direction | Fidélité DA | Haut de gamme | Téléphone | Faisabilité | Conversion | **Note** |
|---|---|---|---|---|---|---|
| **Chrome & Lumière : l'écrin réactif** | 9,5 | 9 | 8,5 | 8 | 8,5 | **8,8** |
| Édition Noire : haute horlogerie éditoriale | 9 | 9 | 8,5 | 8,5 | 8 | 8,5 |
| L'Établi chromé : atelier ouvert, chemin direct | 8 | 7,5 | 8,5 | 8,5 | 9,5 | 8,0 |

- **Chrome & Lumière** sublime la matière imposée (le chrome sur le noir) au lieu de l'encadrer. C'est la seule direction qui a **corrigé et prouvé** les deux défauts bloquants : les accents de Cormorant (correctif fontTools validé visuellement) et le contraste AA des boutons chromés (bande sombre `#4f545b` à 2,63:1 sous le libellé, remplacée par une bande à 6,22:1). Ses rendus « Créations signature » existent déjà. Risques : effets de lumière qui tournent au gadget, coût GPU. Ils sont bornés au chapitre 7.
- **Édition Noire** apporte la discipline éditoriale la plus rigoureuse (une idée par écran, grille asymétrique, règles d'usage de Cormorant, disque de date, 404 arrêtée à 4 h 04). Elle a bien diagnostiqué les accents, mais n'y répond que par des règles d'usage, et elle garde la bande sombre du chrome.
- **L'Établi chromé** a le meilleur système de conversion (un seul verbe, prix d'entrée calculé, bon d'atelier, engagements, vérificateur de code postal, mentions légales). Mais son diagnostic des polices est faux, sa pastille flottante et ses douze sections d'accueil tirent le site vers le « e-commerce » plus que vers la maison horlogère.

### 0.2 Base retenue : « Chrome & Lumière »

Une seule lumière d'établi éclaire tout ce qui est en métal : boutons chromés, mots en italique chromé, montres, grand logo du pied de page. Sur ordinateur, elle suit le pointeur avec discrétion. Sur iPhone, c'est le défilement qui fait office de poignet. Au repos, rien ne clignote.

### 0.3 Greffes

| Idée greffée | Venue de | Où elle s'applique |
|---|---|---|
| Discipline éditoriale : une idée par écran, alternance texte/objet sur la grille de 12 | Édition Noire | Chapitre 5 et plan de l'accueil |
| `--chrome-text` (dégradé sans bande sombre) pour tout texte chromé | Édition Noire et Chrome & Lumière | Tokens, composants |
| Chiffres clés en « disque de date » | Édition Noire | Section `stats`, bande des délais |
| Cadran SVG arrêté à 4 h 04 pour la 404, horloge de l'atelier à l'heure de Paris | Édition Noire, Établi | Snippet `watch-dial` |
| Sommaire des créations (liste numérotée + grande scène) | Édition Noire et Chrome & Lumière | Section `signature-showcase` |
| Un seul verbe d'action : **« Créer ma montre »** | Établi | Tout le site |
| Prix d'entrée calculé « dès 229 € » | Établi | Héros, CTA configurateur, méga-menu |
| Bon d'atelier `.recipe` (liste composant / valeur / prix) | Établi | Panier, fiche produit, légendes |
| Engagements `.proof` et section `proof-strip` | Établi | Atelier, configurateur |
| Poinçon `.hallmark` | Établi | Atelier, pied de page |
| Vérificateur de code postal avec messages distincts Eure / Rouen / France | Établi | `local-delivery` |
| Attribut de suivi `data-cta-origin` | Établi | Tous les liens vers le configurateur |
| Phase 0 « prérequis bloquants » avant tout embellissement | Établi | Chapitre 2.5 |
| Mention du droit de rétractation pour les pièces personnalisées (à valider) | Établi | Panier, chapitre 16 |
| Carte « cadran » des zones de livraison (anneaux de distance, Évreux au centre) | Synthèse | `local-delivery` |

### 0.4 Rejets explicites (à ne pas réintroduire)

- **Pastille flottante « Créer ma montre »** : elle encombre le bas de l'écran iPhone, entre en conflit avec la barre de Safari et le bandeau cookies, et fait « promo ». La règle des deux écrans (§1) suffit.
- **Numéros de chapitre** sur les surtitres de l'accueil : trop de chiffres avec les étapes et les créations.
- **Bandeau défilant** (`marquee`) : remplacé par la réglette statique `spec-rail`.
- **Rails qui défilent seuls** (vignettes de cadrans, créations sur mobile) : aucun défilement automatique hors la scène des créations sur ordinateur, qui a un bouton Pause.
- **Flou animé** (`filter: blur` dans les apparitions et le fond), **boucle `chrome-flow`**, **carte qui se soulève**, **zoom au survol**, **décalage des lignes au survol**.
- **Noms de créations empruntés à des marques** (Pepsi, Batman, Starbucks, Root Beer, Submariner, Nautilus, Royal Oak, Day-Date…).
- **Toute image** de watchmodcustom.com ou goteia.fr.

---

## 1. Principes de la maison

1. **La montre est un bijou.** Elle est toujours détourée sur le noir, posée sur un halo (`--halo`) et une ombre au sol (`--floor`), avec le filigrane MigMods. Jamais de fond gris, de cadre ni de carte autour.
2. **Le chrome se mérite.** Chrome plein = l'action principale, **un seul bouton chromé visible par hauteur d'écran**. Chrome en italique = **un seul `em` par titre**. Filet chromé = un repère, au plus trois par page. Aucun chrome décoratif ailleurs.
3. **Une seule lumière.** Les reflets ont tous la même direction (110°) et la même teinte froide (`--cool`). Un reflet de passage se joue **une fois**, jamais en boucle.
4. **Une idée par écran.** Chaque section tient en **1,5 écran d'iPhone au plus**. Pas de pile interminable : un rail horizontal remplace une liste de plus de quatre éléments sur téléphone.
5. **Le vide se présente comme de la rareté.** Une collection vide est « à l'établi ». Les **Créations signature** (de vraies compositions du moteur) remplacent le stock absent. Aucune page ne se termine sans issue.
6. **Règle des deux écrans.** Sur téléphone, un chemin vers le configurateur apparaît au moins tous les deux écrans, sous une forme différente à chaque fois : bouton chromé, lien fléché, carte cliquable.
7. **Règle du pouce.** Sur iPhone, l'action principale d'un écran se trouve dans les 40 % du bas ou dans une barre fixe.
8. **Lent, rare, mécanique.** On n'anime que `transform` et `opacity`. Apparitions de 700 ms, filets de 1,2 s. Pas de rebond, pas de flou animé.
9. **Rien de faux.** Pas de faux avis, de faux stock, de prix saisi à la main, de durée de garantie inventée, de promesse non validée. Tout texte qui contient `[À COMPLÉTER` ou `[À VÉRIFIER` est invisible pour le public et absent du JSON-LD.
10. **La voix de l'artisan.** Vouvoiement envers le client ; l'artisan parle en « je » (« j'assemble », « je vous la remets ») ; la marque s'écrit **MigMods** dans les textes et **Migmods** n'existe que dans le logo.

---

## 2. Architecture technique, migration et propriété des fichiers

### 2.1 Navigateurs cibles

- **Base garantie** : Safari iOS 15.4 et plus (support de `@layer`, `<dialog>`, `:has()`), Chrome et Edge 111+, Firefox 115+, Samsung Internet 22+.
- **Amélioration progressive**, toujours sous `@supports` ou détection JS, avec un rendu statique correct sans elle : `animation-timeline`, `::details-content`, `interpolate-size`, `field-sizing`, `@view-transition`, `backdrop-filter`, `text-wrap`.

### 2.2 CSS

**Ordre des couches**, déclaré **une seule fois**, en première ligne du `<style>` du snippet `css-variables` (donc avant toute feuille) :

```css
@layer legacy, reset, base, components, sections, utilities;
```

| Fichier | Contenu | Enveloppe obligatoire | Chargé par |
|---|---|---|---|
| `snippets/css-variables.liquid` | `@layer` (ordre), `@font-face`, `:root` (tokens) | aucune (pas de règles de mise en forme) | `layout/theme.liquid`, `layout/password.liquid`, `templates/gift_card.liquid`, dans `<head>` |
| `assets/theme.css` | reset, base (typographie, liens, fond, `.page-width`, `.section`, `.grid`), composants globaux (chapitre 6), utilitaires | `@layer reset {}`, `@layer base {}`, `@layer components {}`, `@layer utilities {}` | les 3 layouts, dans `<head>` |
| `assets/component-<nom>.css` | un composant rendu par un snippet et partagé par plusieurs sections | `@layer components {}` | **chaque section** qui rend ce snippet, en tête de section |
| `assets/section-<nom>.css` | tout ce qui est propre à `sections/<nom>.liquid` (`<nom>` = nom exact du fichier sans `.liquid`) | `@layer sections {}` | la section elle-même, **première ligne** : `{{ 'section-<nom>.css' \| asset_url \| stylesheet_tag }}` |
| `assets/legacy.css` | anciennes règles globales de `base.css` et `migmods-ui.css`, en attente de suppression | `@layer legacy {}` | `layout/theme.liquid`, jusqu'à sa suppression (§2.5) |
| `assets/migmods-configurator.css` | CSS du configurateur, **généré, jamais édité, non layeré** | aucune | `sections/migmods-configurator.liquid` |

Règles :

- **Une section = une feuille** `assets/section-<nom>.css` (exemples : `section-header.css`, `section-hero-video.css`, `section-main-product.css`, `section-migmods-configurator.css`). Une section sans style propre n'a pas de feuille.
- Le CSS non layeré du configurateur passe **au-dessus** de tout le CSS du thème : c'est voulu. Le thème **NE DOIT** jamais cibler une classe `.mm-*` ni `[data-migmods-configurator]`, sauf dans `section-migmods-configurator.css` et dans le `<style>` en ligne de `sections/migmods-configurator.liquid` (propriété du lot outillage).
- Le balisage tiers de Shopify (`.shopify-payment-button__*`, `.shopify-challenge__*`, `#shopify-pc__banner*`, `.shopify-policy__*`) est non layeré par nature. Pour le restyler, on écrit les règles **hors couche**, dans un bloc final commenté `/* Shopify — hors couche */` de la feuille de la section concernée (ou de `theme.css` pour le bandeau cookies). C'est le seul cas de règles hors couche.
- `!important` est interdit, sauf dans le bloc global de mouvement réduit (§7.12) et dans les classes utilitaires `.visually-hidden` et `[hidden]`.
- Nommage **BEM** : `.bloc`, `.bloc__element`, `.bloc--variante`. États : `.is-*` (`is-active`, `is-open`, `is-in`, `is-scrolled`, `is-hidden`, `is-loading`, `is-done`, `is-error`, `is-logo-hidden`). Classe racine d'une section = nom de son fichier (`.hero-video`, `.signature-showcase`, `.main-product`…), plus `.section` si elle suit le rythme standard.
- Aucune couleur, taille de police, durée ou rayon en dur dans une feuille : uniquement les tokens du chapitre 3. Exceptions : les valeurs listées dans ce document pour un composant précis (par exemple 44 px de cible tactile).
- Pas de `@import`, pas de CDN, pas de police distante, pas de bibliothèque.

### 2.3 JavaScript

- **Vanilla uniquement**, sans dépendance, chargé avec `defer`. Pas de jQuery, three.js, GSAP, React.
- `assets/theme.js` (lot socle) contient **uniquement** l'API commune `window.Mig` et les comportements globaux. Rien de propre à une section.
- `assets/section-<nom>.js` (ou `component-<nom>.js`) contient le comportement d'une section sous forme d'**élément personnalisé** préfixé `mig-` :

```js
if (!customElements.get('mig-signature-showcase')) {
  customElements.define('mig-signature-showcase', class extends HTMLElement {
    connectedCallback() { /* init */ }
    disconnectedCallback() { /* nettoyer IO, timers, écouteurs */ }
  });
}
```

Les éléments personnalisés se réinitialisent seuls dans l'éditeur de thème. Chargement : `<script src="{{ 'section-<nom>.js' | asset_url }}" defer="defer"></script>` en fin de section.

**API `window.Mig`** (définie par `theme.js`, noms figés) :

| Membre | Rôle |
|---|---|
| `Mig.reduced` | `true` si `prefers-reduced-motion: reduce` (mis à jour sur `change`) |
| `Mig.fine` | `true` si `(hover: hover) and (pointer: fine)` |
| `Mig.isStill()` | `true` si `html.is-still` (pause globale) ou mouvement réduit |
| `Mig.setStill(bool)` | pose ou retire `html.is-still`, mémorise `localStorage['mig-still']` (try/catch), émet `mig:still` |
| `Mig.reveal(root)` | observe les `[data-reveal]` contenus dans `root` |
| `Mig.money(cents)` | formate selon `window.MigConfig.moneyFormat`, sans zéros inutiles, avec U+00A0 avant « € » |
| `Mig.sections(ids, url?)` | appelle la Section Rendering API (`?sections=a,b`) et renvoie `Promise<{id: html}>` |
| `Mig.cart.add(formDataOuItems)` | `POST /cart/add.js`, puis `GET /cart.js`, émet `mig:cart` avec le panier |
| `Mig.cart.change({ line \| id, quantity })` | `POST /cart/change.js`, émet `mig:cart` |
| `Mig.cart.update(updates)` | `POST /cart/update.js` (retrait groupé d'une montre configurée), émet `mig:cart` |
| `Mig.cart.get()` | `GET /cart.js` |
| `Mig.dialog.open(dialogEl, opener)` / `Mig.dialog.close(dialogEl)` | `showModal()`, `html.has-dialog` (blocage du défilement), focus rendu à `opener` à la fermeture |
| `Mig.announce(texte)` | écrit dans la région `#mig-live` (`aria-live="polite"`, rendue par le layout) |

**Événements** (sur `document`) : `mig:cart` (`detail` = panier `/cart.js`), `mig:still` (`detail.still` booléen). Tout appel `fetch` vérifie `res.ok`, gère l'erreur (message visible + `Mig.announce`) et ne laisse jamais un bouton bloqué en chargement.

**`window.MigConfig`** (script en ligne dans les layouts, avant `theme.js`) : `{ moneyFormat: {{ shop.money_format | json }}, routes: { cart: …, cartAdd: …, cartChange: …, cartUpdate: …, search: …, predictive: {{ routes.predictive_search_url | json }} }, freeLocalThreshold: 30000 }`.

### 2.4 Liquid et schémas (règles Shopify obligatoires)

- Jamais `"default": null`. Un réglage `url` n'a **pas de valeur par défaut**, sauf `"/collections"` ou `"/collections/all"` ; le repli se fait dans le Liquid : `{{ section.settings.link | default: '/pages/configurateur' }}`. `tools/build-theme.mjs` refuse le thème sinon.
- Identifiants de réglages uniques dans une section ; **preset** pour toute section ajoutable ; types de blocs existants conservés (`qa`, `step`, `stat`, `zone`, `quote`, `post`, `menu`, `legal`, `newsletter`).
- Templates JSON et groupes : chaque clé de `"sections"` est dans `"order"` et inversement ; chaque réglage utilisé existe dans le schéma.
- Un réglage `inline_richtext` sert à tout titre qui porte un `em` chromé ; sa valeur par défaut est du HTML valide (`<em>` seulement).
- Garde-fou de contenu provisoire, partout où un texte saisi est affiché :

```liquid
{%- liquid
  assign draft = false
  if texte contains '[À COMPL' or texte contains '[À VÉRIF'
    assign draft = true
  endif
-%}
{%- if draft == false -%}…afficher…{%- elsif request.design_mode -%}<span class="draft-badge">À compléter</span>{%- endif -%}
```

- Un snippet ne renvoie pas de valeur. Pour un test, on capture sa sortie : `{% capture tech %}{% render 'is-technical', product: product %}{% endcapture %}{% if tech == '1' %}…{% endif %}`.
- Images : toujours `width` et `height` ; `loading="lazy"` sous la ligne de flottaison ; `fetchpriority="high"` uniquement sur l'élément LCP de la page ; `sizes` juste ; `alt` calculé **avant** `image_tag` (`assign alt = media.alt | default: product.title`).
- Jamais `href=""` : si l'URL est vide, on n'affiche pas le lien.
- Textes en français, vouvoiement. Aucun texte en dur en anglais.

### 2.5 Migration (ordre imposé)

**Phase 0 — Socle, seul, avant tout autre lot.**

1. Créer `snippets/css-variables.liquid` (chapitre 3) et l'appeler dans les trois layouts.
2. Découper mécaniquement `assets/base.css` et `assets/migmods-ui.css` :
   - chaque règle propre à une section est déplacée **dans `assets/section-<nom>.css` de cette section, enveloppée dans `@layer legacy { }`**, et la section reçoit sa ligne `stylesheet_tag` ;
   - les règles globales vont dans `assets/legacy.css` (`@layer legacy { }`) ;
   - puis `base.css` et `migmods-ui.css` sont **supprimés**.
3. Écrire `assets/theme.css` (reset, base, tous les composants du chapitre 6, utilitaires).
4. Réécrire `assets/theme.js` avec l'API `Mig` et les comportements globaux ; déplacer le code propre aux sections (en-tête, vidéo, filtres, variantes, panier) dans `assets/section-<nom>.js` de la section concernée, tel quel.
5. Polices corrigées (fournies par le lot outillage, §4.1) branchées dans `css-variables`.
6. Correctifs bloquants immédiats : débordement du méga-menu, en-tête transparent sur l'accueil, `--ann-h` calculé en JS supprimé, garde-fou `[À COMPLÉTER` sur `settings.warranty`.
7. Captures des 13 templates (ordinateur et téléphone) : le site doit être **au moins aussi correct qu'avant**, Theme Check à 0 erreur.

**Phase 1 — Lots en parallèle.** Chaque lot réécrit ses sections avec les nouvelles classes, puis **supprime le bloc `@layer legacy { }` de ses propres feuilles** dès qu'il n'est plus utile. Le lot outillage produit les assets générés en tout début de phase 1 (polices en phase 0).

**Phase 2 — Finition (socle).** Supprimer `assets/legacy.css`, sa balise et le nom `legacy` de l'ordre des couches quand `grep` ne trouve plus aucune ancienne classe utilisée ; supprimer les alias de tokens marqués « legacy » ; recette complète (chapitre 17).

### 2.6 Lots et propriété des fichiers

Chaque fichier a **un seul propriétaire**. Un développeur ne modifie que les fichiers de son lot. Tout autre changement passe par le champ « requests » de sa réponse, avec **le fichier et le changement exact**.

| Lot | Code |
|---|---|
| Socle | `socle` |
| En-tête et pied de page | `entete-pied` |
| Accueil | `accueil` |
| Parcours d'achat | `commerce` |
| Pages de contenu | `pages` |
| Configurateur et outillage | `outillage` |

**Table de propriété** (les fichiers de style et de script d'une section appartiennent au propriétaire de la section) :

| Fichier | Propriétaire | Statut |
|---|---|---|
| `layout/theme.liquid` | socle | modifié |
| `config/settings_schema.json`, `config/settings_data.json` | socle | modifiés |
| `locales/*` | socle | inchangés sauf besoin |
| `snippets/css-variables.liquid` | socle | **nouveau** |
| `assets/theme.css`, `assets/theme.js` | socle | **nouveau** / réécrit |
| `assets/legacy.css` | socle | temporaire (phase 0 → 2) |
| `assets/base.css`, `assets/migmods-ui.css` | socle | **supprimés** en phase 0 |
| `snippets/icon.liquid`, `snippets/logo.liquid`, `snippets/meta-tags.liquid` | socle | réécrits |
| `snippets/jsonld-site.liquid`, `snippets/section-head.liquid`, `snippets/typo-fr.liquid`, `snippets/watch-dial.liquid`, `snippets/family-visual.liquid`, `snippets/hallmark.liquid` | socle | **nouveaux** |
| `assets/inter.woff2` | socle | inchangé |
| `sections/header.liquid`, `sections/header-group.json`, `assets/section-header.css`, `assets/section-header.js` | entete-pied | réécrits / nouveaux |
| `sections/footer.liquid`, `sections/footer-group.json`, `assets/section-footer.css`, `assets/section-footer.js` | entete-pied | réécrits / nouveaux |
| `templates/index.json` | accueil | réécrit |
| `sections/hero-video.liquid` + `section-hero-video.css/.js` | accueil | réécrits |
| `sections/spec-rail.liquid` + `section-spec-rail.css` | accueil | **nouveau** (remplace `marquee`) |
| `sections/marquee.liquid` | accueil | **supprimé** |
| `sections/hero.liquid` | accueil | **supprimé** (doublon de `hero-video`, inutilisé) |
| `sections/signature-showcase.liquid` + `section-signature-showcase.css/.js` | accueil | **nouveau** |
| `sections/featured-collection.liquid`, `cta-configurator.liquid`, `process.liquid`, `stats.liquid`, `image-with-text.liquid`, `local-delivery.liquid`, `testimonials.liquid`, `social.liquid` + leurs `section-*.css/.js` | accueil | réécrits |
| `snippets/signature-card.liquid`, `snippets/config-price.liquid`, `assets/component-sig-card.css` | accueil | **nouveaux** |
| `assets/migmods-waves.js` | accueil | corrigé |
| `templates/product.json`, `collection.json`, `cart.json`, `search.json`, `list-collections.json` | commerce | modifiés |
| `sections/main-product.liquid`, `main-collection.liquid`, `main-list-collections.liquid`, `main-cart.liquid`, `main-search.liquid` + leurs `section-*.css/.js` | commerce | réécrits |
| `snippets/product-card.liquid`, `price.liquid`, `watermark.liquid`, `cart-count.liquid` + `assets/component-card.css` | commerce | réécrits |
| `snippets/is-technical.liquid`, `snippets/empty-atelier.liquid`, `assets/component-empty-atelier.css` | commerce | **nouveaux** |
| `templates/page.json`, `page.atelier.json`, `page.faq.json`, `page.livraison.json`, `page.contact.json`, `404.json`, `blog.json`, `article.json`, `password.json` | pages | modifiés |
| `sections/main-page.liquid`, `faq.liquid`, `contact-form.liquid`, `rich-text.liquid`, `main-404.liquid`, `main-blog.liquid`, `main-article.liquid`, `main-password.liquid` + leurs `section-*.css/.js` | pages | réécrits |
| `sections/proof-strip.liquid`, `atelier-exploded.liquid`, `calibres.liquid` + leurs `section-*.css/.js` | pages | **nouveaux** |
| `sections/usp.liquid` | pages | **supprimé** (remplacé par `proof-strip`) |
| `snippets/page-header.liquid`, `assets/component-page-header.css` | pages | **nouveaux** |
| `layout/password.liquid`, `templates/gift_card.liquid` | pages | réécrits |
| `sections/migmods-configurator.liquid`, `assets/section-migmods-configurator.css`, `templates/page.configurateur.json` | outillage | modifiés / nouveau |
| `migmods/configurator/**` (dont `signatures.json`, nouveau) | outillage | — |
| `migmods/tools/**` (dont `render-signatures.mjs`, `make-brand-assets.py`, `patch-fonts.py`, nouveaux) | outillage | — |
| `migmods/shopify-setup/**` | outillage | — |
| **Générés** : `snippets/signature-list.liquid`, `snippets/catalogue-facts.liquid` | outillage (script) | jamais édités à la main |
| **Générés** : `assets/sig-*.webp`, `assets/logo-migmods-320.webp`, `-640.webp`, `-1100.webp`, `assets/migmods-og.jpg`, `assets/apple-touch-icon.png`, `assets/favicon-32.png`, `assets/migmods-glow.webp`, `assets/migmods-grain.png`, `assets/migmods-hero-poster-land.jpg`, `assets/cormorant-garamond-300.woff2`, `-500.woff2`, `-400-italic.woff2` | outillage (script) | jamais édités à la main |
| **Générés par `build-theme.mjs`** : `assets/mm-*.png`, `assets/migmods-configurator.js`, `assets/migmods-configurator.css`, `assets/migmods-components.json` | outillage (script) | **jamais édités** |
| `assets/logo-migmods.png`, `assets/logo-migmods-480.png`, `assets/migmods-hero-poster.jpg` | outillage | conservés (source du filigrane du configurateur et des dérivés) |
| `migmods/DESIGN-SYSTEM.md` | direction artistique | ce document |

### 2.7 Règles de travail

- Aucun `git commit` ni `push`.
- Après chaque changement de Liquid ou de schéma : `(cd /tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/tc && node run.cjs /home/user/Caveman/migmods/theme)` doit afficher `TOTAL n errors 0`. **Le chemin absolu est obligatoire** : un chemin relatif affiche 0 sans rien vérifier.
- Captures : `node /tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/snap.mjs <template> <ton-nom> both` et lecture des PNG. **Après tout changement global** (layout, `theme.css`, `theme.js`, en-tête, pied de page, tokens) : `snap.mjs page.configurateur <ton-nom> both` et comparaison avec la capture précédente. Toute différence sur le configurateur téléphone bloque la livraison.
- Si le simulateur casse un rendu à cause de ses limites (annexe A), on **ne dégrade pas le thème** : on le signale.

---

## 3. Tokens

`snippets/css-variables.liquid` contient **exactement** les noms ci-dessous. Une variable absente de cette liste n'existe pas (exception : variables locales d'un composant, préfixées par le nom du composant, par exemple `--card-pad`).

```liquid
{%- comment -%} Tokens MigMods — voir DESIGN-SYSTEM.md §3. Rendu par les 3 layouts. {%- endcomment -%}
<style>
  @layer legacy, reset, base, components, sections, utilities;

  @font-face { font-family: "Cormorant Garamond"; src: url("{{ 'cormorant-garamond-300.woff2' | asset_url }}") format("woff2"); font-weight: 300; font-style: normal; font-display: swap; }
  @font-face { font-family: "Cormorant Garamond"; src: url("{{ 'cormorant-garamond-500.woff2' | asset_url }}") format("woff2"); font-weight: 500; font-style: normal; font-display: swap; }
  @font-face { font-family: "Cormorant Garamond"; src: url("{{ 'cormorant-garamond-400-italic.woff2' | asset_url }}") format("woff2"); font-weight: 400; font-style: italic; font-display: swap; }
  @font-face { font-family: "Inter"; src: url("{{ 'inter.woff2' | asset_url }}") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; }

  :root {
    color-scheme: dark;

    /* ——— Couleurs pilotées par les réglages ——— */
    --c-bg: {{ settings.color_bg }};            /* #050505 */
    --c-surface: {{ settings.color_surface }};  /* #0E0E0F : <dialog>, feuilles, plaque carte cadeau */
    --c-ink: {{ settings.color_ink }};          /* #F3F4F6 — 18,5:1 sur #050505, 12,9:1 sur #2B2B2B */
    --c-stone: {{ settings.color_stone }};      /* #9CA0A7 — 7,8:1, 5,4:1 au pire sur le fond animé */

    /* ——— Couleurs fixes ——— */
    --c-void: #000;
    --c-ink-2: #C9CDD3;                 /* chapôs, valeurs secondaires — 12,8:1 / 8,9:1 */
    --c-faint: #6E7279;                 /* décor seulement (aria-hidden ou ≥ 24 px non informatif) — 4,2:1 */
    --c-line: rgba(255,255,255,.10);    /* filets */
    --c-line-strong: rgba(255,255,255,.20);
    --c-field-border: rgba(255,255,255,.45); /* bord de champ — 4,5:1 (WCAG 1.4.11 ≥ 3:1) */
    --c-fill: rgba(255,255,255,.04);    /* champs, puces au repos */
    --c-fill-2: rgba(255,255,255,.08);  /* survol */
    --c-glass: rgba(5,5,5,.72);         /* en-tête défilé, barres fixes */
    --c-glass-strong: rgba(10,10,11,.92); /* méga-menu, feuilles */
    --c-scrim: rgba(0,0,0,.6);          /* ::backdrop des dialogues */
    --c-focus: #E8ECF1;                 /* 17,2:1 */
    --c-ok: #9FE0B4;                    /* 13,4:1 */
    --c-error: #FF9B8F;                 /* 10,0:1 */
    --cool: 200 220 255;                /* teinte de la lumière : rgb(var(--cool) / .28) */

    /* ——— Chrome ——— */
    --chrome: linear-gradient(180deg,#fff 0%,#eceef1 18%,#b4b9c0 40%,#8a9098 52%,#d3d7dc 64%,#f6f7f8 86%,#fff 100%);
                                        /* boutons : bande la plus sombre #8a9098 = 6,2:1 sous #07080a */
    --chrome-text: linear-gradient(180deg,#fff 0%,#e8eaed 34%,#9ea3ab 56%,#f1f2f4 76%,#c3c7cd 100%);
                                        /* tout texte chromé : arrêt le plus sombre 8,0:1 / 5,6:1 */
    --chrome-edge: linear-gradient(135deg,#fff,#7d838b 30%,#f2f3f5 50%,#6c7179 70%,#fff);
    --chrome-line: linear-gradient(90deg,transparent,rgba(255,255,255,.5) 30%,#fff 50%,rgba(255,255,255,.5) 70%,transparent);
    --spec: linear-gradient(110deg,transparent 35%,rgba(255,255,255,.9) 48%,rgb(var(--cool) / .55) 52%,transparent 65%);
    --halo: radial-gradient(50% 50% at 50% 45%,rgba(255,255,255,.09),rgba(255,255,255,.03) 45%,transparent 70%);
    --halo-hot: radial-gradient(50% 50% at 50% 45%,rgba(255,255,255,.14),rgba(255,255,255,.04) 45%,transparent 70%);
    --floor: radial-gradient(50% 50% at 50% 50%,rgba(0,0,0,.9),transparent 70%);
    --veil-top: linear-gradient(rgba(0,0,0,.55),transparent);

    /* ——— Typographie ——— */
    --f-serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;
    --f-sans: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    --t-display: clamp(40px, 25.33px + 4.074vw, 84px);  /* H1 du héros — 41 px sur iPhone 15 Pro */
    --t-h1:      clamp(40px, 29.33px + 2.963vw, 72px);  /* H1 des pages, 404, mot de passe */
    --t-h2:      clamp(32px, 24px + 2.222vw, 56px);     /* toujours plus petit que --t-display */
    --t-h3:      clamp(24px, 21.33px + .741vw, 32px);
    --t-h4:      clamp(20px, 18.67px + .37vw, 24px);    /* titres de cartes, questions de FAQ */
    --t-num:     clamp(56px, 40px + 4.444vw, 104px);    /* chiffres clés */
    --t-sig:     clamp(28px, 22.67px + 1.481vw, 44px);  /* noms du sommaire des créations */
    --t-lead:    clamp(18px, 17px + .278vw, 21px);
    --t-body:    clamp(16px, 15.67px + .093vw, 17px);
    --t-small: 14px;
    --t-caption: 13px;
    --t-micro: 12px;                    /* plancher absolu : aucun texte sous 12 px */
    --lh-display: .98; --lh-h1: 1; --lh-h2: 1.06; --lh-h3: 1.15; --lh-h4: 1.2;
    --lh-lead: 1.5; --lh-body: 1.65; --lh-small: 1.5; --lh-ui: 1.2;
    --ls-title: -.01em;                 /* display, h1, h2, chiffres clés */
    --ls-caps: .16em;                   /* boutons, navigation, libellés, badges en capitales */
    --ls-eyebrow: .24em;                /* surtitres */
    --measure: 62ch; --measure-lead: 52ch; --measure-title: 18ch;

    /* ——— Espacements (base 4/8) ——— */
    --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px;
    --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px; --s-10: 128px;
    --section-y: clamp(80px, 56px + 6.667vw, 152px);       /* écart entre deux sections (82 px iPhone, 152 px à 1440) */
    --section-y-tight: clamp(48px, 40px + 2.222vw, 72px);  /* bandes : spec-rail, proof-strip */
    --head-gap: clamp(32px, 26.67px + 1.481vw, 48px);      /* en-tête de section → contenu */

    /* ——— Grille et largeurs ——— */
    --page-max: {{ settings.page_width }}px;  /* 1360 */
    --page-wide: 1600px;
    --page-text: 720px;
    --page-form: 560px;
    --gutter: clamp(20px, 8px + 3.333vw, 56px);  /* 21 px sur iPhone 15 Pro, 56 px à 1440 */
    --col-gap: 16px;

    /* ——— En-tête ——— */
    --ann-h: 32px;      /* bandeau d'annonce */
    --bar-h: 60px;      /* barre (76 px à partir de 1280 px) */
    --bar-h-min: 60px;  /* barre compacte (défilement, configurateur) */
    --header-h: 92px;   /* = --ann-h + --bar-h ; lu par le configurateur */

    /* ——— Rayons ——— */
    --r-pill: 999px; --r-1: 8px; --r-2: 14px; --r-3: 24px;

    /* ——— Ombres ——— */
    --sh-btn: inset 0 1px 0 rgba(255,255,255,.95), inset 0 -1px 1px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.18), 0 10px 30px -10px rgba(0,0,0,.9);
    --sh-btn-hot: inset 0 1px 0 #fff, inset 0 -1px 1px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.32), 0 14px 34px -14px rgba(0,0,0,.9), 0 0 32px -6px rgb(var(--cool) / .28);
    --sh-btn-press: inset 0 2px 6px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.22);
    --sh-float: 0 -24px 48px -24px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06);
    --sh-watch: drop-shadow(0 28px 32px rgba(0,0,0,.7));
    --ring: 0 0 0 2px #000, 0 0 0 4px var(--c-focus);  /* focus visible sur noir comme sur chrome */

    /* ——— Mouvement ——— */
    --ease-out: cubic-bezier(.16,1,.3,1);     /* apparitions, glissements */
    --ease-io: cubic-bezier(.65,0,.35,1);     /* fondus enchaînés, fermetures, transitions de page */
    --ease-ui: cubic-bezier(.2,0,0,1);        /* pression, couleurs */
    --ease-light: cubic-bezier(.22,.61,.36,1);/* déplacement des reflets */
    --dur-1: 120ms;   /* pression */
    --dur-2: 240ms;   /* couleur, petits états */
    --dur-3: 450ms;   /* survols, menus, soulignés, accordéons */
    --dur-4: 700ms;   /* apparitions, fondus d'images */
    --dur-5: 1200ms;  /* filets qui se tracent, reflet de passage des titres */
    --dur-sweep: 900ms; /* reflet de passage des boutons */
    --stagger: 70ms;  /* décalage par enfant, 6 enfants au plus */
    --rise: 16px;     /* translation d'apparition */

    /* ——— Calques ——— */
    --z-bg: -1; --z-raise: 1; --z-sticky: 20; --z-header: 30; --z-progress: 31;
    /* Le configurateur téléphone (.mm-layout) est à 40 : aucun élément fixe du thème ne dépasse 35.
       Les dialogues passent par la top layer (showModal) et n'ont pas de z-index. */

    /* ——— Alias legacy : supprimés en phase 2 ——— */
    --c-brass: {{ settings.color_brass }};
    --c-surface-2: color-mix(in srgb, {{ settings.color_surface }} 92%, #fff);
    --c-muted: var(--c-ink-2);
    --page-width: var(--page-max);
  }
  @media (min-width: 600px)  { :root { --col-gap: 20px; } }
  @media (min-width: 900px)  { :root { --col-gap: 24px; } }
  @media (min-width: 1280px) { :root { --col-gap: 32px; --bar-h: 76px; --header-h: 108px; } }
</style>
```

**Réglages à modifier** (lot socle) : défaut et valeur de `color_stone` → `#9CA0A7` dans `settings_schema.json` et `settings_data.json` ; `color_line` n'est plus lu (garder le réglage pour compatibilité) ; `color_brass` n'est plus lu après la phase 2.

**Page configurateur** : la classe de `body` est `template-page template-page-configurateur`. Le lot outillage pose dans `section-migmods-configurator.css` :

```css
@layer sections { body.template-page-configurateur { --ann-h: 0px; --bar-h: 60px; --header-h: 60px; } }
```

---

## 4. Typographie

### 4.1 Fichiers de police (lot outillage, phase 0)

Le défaut des accents de Cormorant (circonflexes géants, accent aigu décalé, grave quasi vertical en italique) **vient du dessin d'origine de la fonte**, pas du sous-ensemble : le fichier actuel, la variable Google Fonts et la statique Fontsource 5.3.0 sont identiques. Refaire un sous-ensemble ne corrige rien. On corrige les glyphes.

- **Source** : paquet `@fontsource/cormorant-garamond@5.3.0`, fichiers `cormorant-garamond-latin-300-normal.woff2`, `cormorant-garamond-latin-500-normal.woff2`, `cormorant-garamond-latin-400-italic.woff2`, versionnés avec leur licence OFL dans `migmods/tools/fonts-src/`.
- **Outil** : `migmods/tools/patch-fonts.py` (fontTools + brotli), repris de `/tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/cd-chrome2/patch.py` : accents des minuscules `àáâäèéêëìíîïòóôöùúûüÿœ` ramenés à **62 %** de leur hauteur et 92 % de leur largeur ; graves (`àèìòù`) de l'italique redressés avec un cisaillement de **−0,6**. Les capitales (É, À…) ne sont pas touchées.
  - `python3 tools/patch-fonts.py tools/fonts-src/cormorant-garamond-latin-300-normal.woff2 theme/assets/cormorant-garamond-300.woff2 0.62`
  - idem pour `500-normal` → `cormorant-garamond-500.woff2`
  - `python3 tools/patch-fonts.py tools/fonts-src/cormorant-garamond-latin-400-italic.woff2 theme/assets/cormorant-garamond-400-italic.woff2 0.62 -0.6`
- **Résultat attendu** : environ 22, 23,4 et 23,8 Ko. Fonctions OpenType présentes : `lnum`, `tnum`, `liga`, `ccmp`, `locl`, `frac`. Glyphes présents : U+00A0, €, ’, œ. **Absents : U+202F (espace fine insécable) et → (U+2192)** : on ne les utilise jamais.
- Après bascule, l'ancien `assets/cormorant-garamond.woff2` (variable) est supprimé.
- **Préchargement** (layout, toutes pages) : `cormorant-garamond-300.woff2` et `inter.woff2` uniquement.
- Contrôle visuel obligatoire : planche « vôtre, fenêtre, île, Réserve, Évreux, pièce, à, là, Œuvre, 21 600, NH35 » en 20, 32, 56 et 84 px, romain 300, 500 et italique.

### 4.2 Rôles typographiques

| Rôle | Police | Taille | Interligne | Graisse | Interlettrage | Couleur |
|---|---|---|---|---|---|---|
| H1 du héros | Cormorant | `--t-display` | `--lh-display` | 300 | `--ls-title` | `--c-ink` |
| H1 de page | Cormorant | `--t-h1` | `--lh-h1` | 300 | `--ls-title` | `--c-ink` |
| H2 de section | Cormorant | `--t-h2` | `--lh-h2` | 300 | `--ls-title` | `--c-ink` |
| H3 | Cormorant | `--t-h3` | `--lh-h3` | 500 | 0 | `--c-ink` |
| H4, titre de carte, question | Cormorant | `--t-h4` | `--lh-h4` | 500 | 0 | `--c-ink` |
| `em` dans un titre | Cormorant italique | hérité | hérité | 400 | 0 | `--chrome-text` (texte découpé) |
| Chiffres clés | Cormorant | `--t-num` | .9 | 300 | `--ls-title` | `--chrome-text` |
| Nom du sommaire des créations | Cormorant | `--t-sig` | 1.05 | 300 | 0 | `--c-ink` ; actif : italique 400 `--chrome-text` |
| Chapô | Inter | `--t-lead` | `--lh-lead` | 400 | 0 | `--c-ink-2` |
| Texte courant | Inter | `--t-body` | `--lh-body` | 400 | 0 | `--c-ink-2` (`--c-ink` pour les textes courts) |
| Petit texte | Inter | `--t-small` | `--lh-small` | 400 | 0 | `--c-ink-2` |
| Légende, méta | Inter | `--t-caption` | 1.4 | 400 | 0 | `--c-stone` |
| Surtitre `.eyebrow` | Inter | `--t-micro` | 1.3 | 500 | `--ls-eyebrow`, capitales | `--c-stone` |
| Bouton, navigation, libellé | Inter | 12 px (13 px pour `--lg`) | 1 | 500 | `--ls-caps`, capitales | selon composant |
| Badge | Inter | 12 px | 1 | 500 | `--ls-caps`, capitales | selon variante |
| Prix | Inter | 15 px (carte), 22 px (fiche), 28 px (sous-total) | `--lh-ui` | 500 | 0 | `--c-ink` |
| Unité d'un chiffre clé (« Mohs », « h », « alt/h ») | Inter | 13 px, capitales | 1 | 500 | `--ls-caps` | `--c-stone` |
| Auteur d'un avis | Inter | 12 px, capitales | 1.3 | 500 | `--ls-caps` | `--c-stone` |

### 4.3 Règles

- **Cormorant : deux graisses romaines seulement, 300 et 500, plus l'italique 400.** Jamais 400 romain, 600 ou 700 (aucune graisse synthétique). Jamais de Cormorant sous 20 px. Toute taille de Cormorant de 20 à 33 px est en 500.
- **Chiffres** : `h1, h2, h3, h4, summary, .t-num { font-variant-numeric: lining-nums; }` et `.price, .stat__value, .recipe dd, .counter, .clock, .rail__count { font-variant-numeric: lining-nums tabular-nums; }`. « 41 » ne doit jamais se lire « 4I ».
- `font-variant: small-caps` est interdit (aucune police n'a de petites capitales) : les « petites capitales » sont de l'Inter 12 px en capitales espacées.
- Titres : `text-wrap: balance` ; paragraphes : `text-wrap: pretty` ; `hyphens: manual` partout. Largeurs maximales : titres `--measure-title`, chapôs `--measure-lead`, texte `--measure`.
- `-webkit-font-smoothing: antialiased` sur `body`. `font-synthesis: none` sur `html`.
- **Texte chromé** (`em` des titres, `.chrome-text`) : `background: var(--chrome-text); -webkit-background-clip: text; background-clip: text; color: transparent;` avec `background-size: 100% 300%`. **Jamais** de `transform`, `will-change` ni `filter` sur l'élément qui porte `background-clip: text` (bug WebKit) : on anime son parent.

### 4.4 Typographie française

- **Espace insécable U+00A0** (jamais U+202F, absente des polices) : avant « : ; ? ! », à l'intérieur des guillemets « », entre un nombre et son unité ou symbole (`300 €`, `48 h`, `200 m`, `40 mm`, `2 à 3 semaines` : entre « 2 », « à », « 3 »), dans les milliers (`21 600`), dans « N° 01 ».
- **Apostrophe typographique ’** (U+2019) dans tous les textes, obligatoirement dans les titres serif (l'apostrophe droite y devient un trait vertical). Guillemets « » ; tiret demi-cadratin – pour les intervalles, cadratin — pour les incises ; points de suspension … (U+2026).
- **Snippet `typo-fr`** (socle) : `{% render 'typo-fr', text: texte %}` renvoie le texte avec U+00A0 devant « ? ! : ; » et « € », et ’ à la place de ' hors balises HTML. À appliquer à tout texte saisi par le marchand affiché dans un titre, un chapô ou un bouton. Les textes par défaut des schémas sont écrits directement avec ces caractères.
- Majuscules accentuées : « Évreux », « À vous », « État ».

---

## 5. Grille, mise en page, espacements

### 5.1 Points de rupture (mobile d'abord)

| Requête | Usage |
|---|---|
| base (< 600 px) | téléphone : une colonne, gouttière `--gutter` (20 à 21 px) |
| `(min-width: 600px)` | grand téléphone et tablette portrait : grille de 8 colonnes |
| `(min-width: 900px)` | grille de 12 colonnes ; **même seuil que le configurateur (899/900 px), à ne pas déplacer** |
| `(min-width: 1280px)` | navigation complète dans l'en-tête, barre de 76 px |
| `(min-width: 1440px)` | grand écran : grilles produit à 4 colonnes |
| `(orientation: landscape) and (max-height: 500px)` | téléphone en paysage (héros en deux colonnes, annonce masquée) |
| `(max-height: 620px)` | téléphone court (iPhone SE) : héros compacté |

### 5.2 Conteneurs

```css
.page-width { width: 100%; max-width: calc(var(--page-max) + 2 * var(--gutter)); margin-inline: auto;
  padding-inline: max(var(--gutter), env(safe-area-inset-left)) max(var(--gutter), env(safe-area-inset-right)); }
.page-width--wide { max-width: calc(var(--page-wide) + 2 * var(--gutter)); }
.page-width--text { max-width: calc(var(--page-text) + 2 * var(--gutter)); }
.page-width--form { max-width: calc(var(--page-form) + 2 * var(--gutter)); }
.grid { display: grid; column-gap: var(--col-gap); grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (min-width: 600px) { .grid { grid-template-columns: repeat(8, minmax(0, 1fr)); } }
@media (min-width: 900px) { .grid { grid-template-columns: repeat(12, minmax(0, 1fr)); } }
```

- **Un seul axe gauche** : tout contenu aligné à gauche commence sur la colonne 1 de `.page-width`, au même x que le logo de l'en-tête sur téléphone et que le premier lien de navigation sur ordinateur. Aucune colonne étroite centrée ne se mélange à la pleine largeur dans une même page, sauf `.page-width--text` pour les textes longs (mentions légales, article) et les blocs centrés (CTA, états vides, 404).
- **Axes éditoriaux sur ordinateur (≥ 900 px)**, alternés d'une section à l'autre :
  - « A » : texte en colonnes 1 à 5, objet en 7 à 12 ;
  - « B » : objet en 1 à 6, texte en 8 à 12 ;
  - « Texte long » : colonnes 3 à 10.
- Un objet (montre, roue de cadrans, carte) **peut** déborder jusqu'au bord de `.page-width--wide`, jamais au-delà de l'écran (aucun débordement horizontal).

### 5.3 Rythme vertical

```css
.section { padding-block: calc(var(--section-y) / 2); }   /* 41 px de chaque côté sur iPhone : deux sections s'écartent de --section-y */
.section--tight { padding-block: calc(var(--section-y-tight) / 2); }
.section--flush { padding-block: 0; }
main { padding-bottom: calc(var(--section-y) / 2); }
```

- On n'utilise **pas** `.section + .section` (chaque section est enveloppée par Shopify dans `.shopify-section`).
- Dans une section : surtitre → 16 px → titre → 20 px → chapô → `--head-gap` → contenu → 32 px → action.
- Espacements internes uniquement avec `--s-1` à `--s-10`.

### 5.4 Hauteur de l'en-tête et décalage du contenu

- L'en-tête est **fixe** (`position: fixed`). Hors accueil : `main { padding-top: var(--header-h); }`. Sur l'accueil : `padding-top: 0`, le héros passe sous l'en-tête transparent.
- Éléments collants dans le contenu : `top: calc(var(--bar-h-min) + var(--s-5))` (l'annonce est masquée dès qu'on défile).
- Ancres : `html { scroll-padding-top: calc(var(--bar-h-min) + var(--s-4)); }`.

---

## 6. Composants

Tous les composants de ce chapitre vivent dans `assets/theme.css` (`@layer components`), sauf mention d'un fichier `component-*.css`. Leur nom de classe est **figé**.

### 6.1 Boutons `.btn`

```html
<a class="btn btn--chrome" href="/pages/configurateur" data-cta-origin="hero" data-light>
  <span class="btn__label">Créer ma montre</span>
  {% render 'icon', name: 'arrow-right', class: 'btn__icon' %}
</a>
```

- **Base** : `display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 52px; padding-inline: 28px; border-radius: var(--r-pill); font: 500 12px/1 var(--f-sans); letter-spacing: var(--ls-caps); text-transform: uppercase; position: relative; overflow: hidden; isolation: isolate; touch-action: manipulation; -webkit-tap-highlight-color: transparent;`. Icône SVG de 14 px. **Pas de `will-change`** au repos.
- **Tailles** : `.btn--sm` 44 px de haut, `padding-inline: 20px` ; défaut 52 px ; `.btn--lg` 60 px, `padding-inline: 36px`, texte 13 px. `.btn--block` : `width: 100%`.

| Variante | Repos | Survol (uniquement `@media (hover: hover) and (pointer: fine)`) | Pression `:active` | Focus `:focus-visible` | Désactivé |
|---|---|---|---|---|---|
| `.btn--chrome` (principal, **un seul par écran**) | `background: var(--chrome) 50% 0 / 100% 220%; color: #07080a; box-shadow: var(--sh-btn); text-shadow: 0 1px 0 rgba(255,255,255,.55)` ; `::before` = lumière du pointeur (§7.2) | `background-position: 50% 100%` en `--dur-4` ; `box-shadow: var(--sh-btn-hot)` ; `::after` = `var(--spec)` qui passe de `translateX(-130%)` à `translateX(130%)` en `--dur-sweep` `--ease-light` ; icône `translateX(4px)` en `--dur-3` | `transform: scale(.98)` en `--dur-1` `--ease-ui` ; `box-shadow: var(--sh-btn-press)` | `box-shadow: var(--sh-btn), var(--ring)` + même reflet | `opacity: .4; pointer-events: none`, sans reflet |
| `.btn--ghost` (secondaire) | bord 1 px en `--chrome-edge` (technique `background: linear-gradient(var(--c-bg),var(--c-bg)) padding-box, var(--chrome-edge) border-box; border: 1px solid transparent`) ; fond intérieur `rgba(5,5,5,.35)` ; texte `--c-ink` | fond intérieur `--c-fill-2` | `scale(.98)` | `box-shadow: var(--ring)` | idem |
| `.btn--glass` (posé sur la vidéo) | 44 px ; fond `rgba(5,5,5,.55)` ; `@supports (backdrop-filter: blur(1px))` → `backdrop-filter: blur(12px)`, sinon `rgba(5,5,5,.85)` ; bord 1 px `--c-line-strong` | bord `--c-focus` | `scale(.96)` | `var(--ring)` | — |
| `.btn--icon` (combinable avec `--ghost` ou `--glass`) | 44 × 44, rond, `padding: 0`, icône 20 px, **`aria-label` obligatoire** | fond `--c-fill-2` | `scale(.94)` | `var(--ring)` | idem |

- **États métier** (JS) :
  - `.is-loading` + `aria-busy="true"` : largeur figée (`min-width` mesurée avant l'appel), libellé à `opacity: 0`, anneau de 16 px (trait 1,5 px) qui tourne en 800 ms linéaire ; en mouvement réduit, trois points fixes « … ».
  - `.is-done` : l'icône devient une coche SVG (fondu 240 ms) et le libellé « Ajoutée » pendant 1 600 ms, puis retour.
  - `aria-disabled="true"` pour une pièce vendue.
- Sur écran tactile : aucun effet de survol ; le reflet `::after` se joue une fois sur `:active` (500 ms).

### 6.2 Liens

- **`.link-arrow`** (action tertiaire) : Inter 500 12 px, capitales, `--ls-caps`, couleur `--c-ink`, icône `arrow-right` de 14 px ; soulignement chromé de 1 px (`background: var(--chrome-edge) 0 100% / 100% 1px no-repeat`) ; `padding-block: 14px` (cible de 44 px). Survol : le soulignement se rétracte vers la droite puis renaît à gauche (`background-size` 100 % → 0 → 100 %, `--dur-3`, `--ease-out`) et l'icône avance de 4 px.
- **Liens dans le texte** (`.rte a`) : `color: var(--c-ink); text-decoration: underline 1px rgba(255,255,255,.4); text-underline-offset: .22em;` ; survol : `text-decoration-color: var(--c-focus)`. Lien externe : icône `arrow-up-right` de 10 px + `<span class="visually-hidden">(nouvel onglet)</span>`.
- **Navigation** : un seul trait chromé de 1 px (`.site-nav__ink`) sous le lien actif ou survolé, qui glisse d'un lien à l'autre (`transform: translateX() scaleX()`, `--dur-3`).

### 6.3 Surtitre `.eyebrow`

`font: 500 var(--t-micro)/1.3 var(--f-sans); letter-spacing: var(--ls-eyebrow); text-transform: uppercase; color: var(--c-stone); display: flex; align-items: center; gap: 12px;` et `::before` : `content: ""; inline-size: 24px; block-size: 1px; background: var(--chrome-edge); flex: none;`. **Toujours sur une ligne** (prévoir une version courte sur téléphone). `.eyebrow--plain` : sans le filet (dans le H1 du héros).

### 6.4 En-tête de section `.section-head` (snippet `section-head`)

```liquid
{% render 'section-head',
  eyebrow: section.settings.eyebrow, title: section.settings.heading, lead: section.settings.lead,
  link_label: section.settings.link_label, link_url: link, tag: 'h2', align: 'left', origin: 'signatures', id: 'titre-creations' %}
```

```html
<header class="section-head section-head--left">
  <p class="eyebrow">Créations signature</p>
  <h2 class="section-head__title" id="titre-creations" data-light>Six montres pour commencer. <em>La vôtre</em> ensuite.</h2>
  <p class="section-head__lead">…</p>
  <a class="link-arrow section-head__action" href="…" data-cta-origin="signatures">…</a>
</header>
```

- Titre : `--t-h2`, `max-width: var(--measure-title)`, un seul `em`. Chapô : `--t-lead`, `--c-ink-2`, `max-width: var(--measure-lead)`, 20 px au-dessus. Lien : 24 px sous le chapô.
- Variantes : `--left` (défaut) ; `--center` (CTA, états vides, 404 : tout centré, filet du surtitre conservé à gauche du texte) ; `--split` (≥ 900 px : titre en colonnes 1 à 6, chapô et lien en 8 à 12, alignés sur la ligne de base de la dernière ligne du titre ; sur téléphone, identique à `--left`).
- Le paramètre `tag` vaut `h2` (défaut) ou `h1` (section qui ouvre une page).
- La section porte `aria-labelledby` vers l'`id` du titre.

### 6.5 Texte chromé `.chrome-text`

Utilitaire pour un chiffre ou un mot hors titre (chiffres clés, numéros d'étape, montant de la carte cadeau). Mêmes règles que l'`em` (§4.3). Le reflet de passage à l'apparition et la lumière de défilement s'appliquent (§7).

### 6.6 Filets `.rule`

| Classe | Rendu | Usage |
|---|---|---|
| `.rule` | 1 px, `width: min(40%, 480px)`, centré, `background: var(--chrome-line)`, `opacity: .5` | entre deux grands chapitres, **3 par page au plus**, jamais juste sous le héros |
| `.rule--start` | 96 px, part de la gauche | sous un titre de page (`page-header`) |
| `.rule--hair` | 100 %, `background: var(--c-line)` | rangées de listes, accordéons, tableaux, bon d'atelier |
| `.rule--v` | vertical 1 px, `linear-gradient(transparent, var(--c-line-strong) 20%, var(--c-line-strong) 80%, transparent)` | colonnes des chiffres clés |

`.rule[data-reveal]` et `.rule--start[data-reveal]` se tracent de `scaleX(0)` à `scaleX(1)` en `--dur-5` (`transform-origin: left` pour `--start`, `center` pour `.rule`).

### 6.7 Écrin `.ecrin` (montre posée sur le noir)

```html
<figure class="ecrin ecrin--card">
  <img class="ecrin__img" src="…" width="800" height="800" alt="…" loading="lazy">
  {% render 'watermark', … %}
</figure>
```

- `.ecrin` : `position: relative; display: grid; place-items: center; isolation: isolate;` ; `::before` = halo (`inset: 6% 10% 18%; background: var(--halo); border-radius: 50%; z-index: -1`) ; `::after` = ombre au sol (`left: 24%; right: 24%; bottom: 10%; height: 5%; background: var(--floor); z-index: -1`).
- `.ecrin__img` : `width: 78%; height: auto; filter: var(--sh-watch);` (le filtre est statique, jamais animé).
- `.ecrin--card` : boîte `aspect-ratio: 1`, image à 84 %.
- `.ecrin--stage` (scène des créations, atelier) : `aspect-ratio: 1`, image à 78 %, `data-light` ; à partir de 900 px seulement, reflet au sol décoratif `-webkit-box-reflect: below -6% linear-gradient(transparent 72%, rgba(255,255,255,.16))` (non standard, décoratif) ; calque spéculaire `.ecrin__spec` masqué par l'image (§7.2).
- **Interdits** : fond gris, bordure, rayon sur le contenant, `box-shadow` de boîte.

### 6.8 Carte produit `.card` (`snippets/product-card.liquid` + `assets/component-card.css`, lot commerce)

```html
<article class="card">
  <div class="card__media ecrin ecrin--card">
    <img class="card__img" …><img class="card__img card__img--alt" … aria-hidden="true">
    <span class="badge badge--chrome card__badge">Pièce unique</span>
    {% render 'watermark' … %}
  </div>
  <div class="card__body">
    <p class="card__meta">Sub · 40 mm · NH35</p>
    <h3 class="card__title"><a class="card__link" href="…">Abysse</a></h3>
    {% render 'price', product: product, context: 'card' %}
  </div>
</article>
```

- Média en `aspect-ratio: 4 / 5`, `object-fit: contain`, `padding: 6%`, sur `--halo`. Filigrane réduit : `--wm-size: 16%; --wm-opacity: .6`.
- `.card__link::after { content: ""; position: absolute; inset: 0; }` : toute la carte est cliquable par un seul lien. Focus : `:focus-visible` sur le lien → `outline: 2px solid var(--c-focus); outline-offset: 6px; border-radius: var(--r-2)` porté par `.card:has(.card__link:focus-visible) .card__media`.
- Méta : 13 px `--c-stone`, tirée des métachamps `custom.diametre` et `custom.mouvement` (masquée si vide). Titre : h3, Cormorant 500 `--t-h4`, deux lignes au plus. Prix : Inter 500 15 px tabulaire + « TTC » en 12 px capitales `--c-stone`.
- Survol (pointeur fin uniquement) : seconde vue en fondu de 600 ms `--ease-io` ; halo `--halo-hot`. **Ni soulèvement, ni zoom.** Pression : `.card__media` en `scale(.985)` (`--dur-1`).
- Badges (un seul par carte, à 12 px du coin haut gauche) tirés des étiquettes du produit : `piece-unique` → « Pièce unique » (`--chrome`), `nouveau` → « Nouveau » (`--edge`), épuisé → « Vendue » (`--muted`, carte à 60 % d'opacité).
- Variante `.card--create` (tuile « Créer la vôtre ») : même gabarit, rendu `sig-abysse-480.webp` à 55 % de luminosité, titre « Créer la vôtre », `link-arrow` « Créer ma montre », `data-cta-origin="tile"`.
- Toute grille de cartes est précédée d'un `<h2 class="visually-hidden">Montres</h2>`.

### 6.9 Carte de création `.sig-card` (`snippets/signature-card.liquid` + `assets/component-sig-card.css`, lot accueil)

```html
<li class="sig-card" data-sig="abysse" data-sig-href="/pages/configurateur?c=…" data-sig-src="…/sig-abysse-800.webp" data-sig-name="Abysse">
  <figure class="sig-card__media ecrin ecrin--card"><img class="ecrin__img" … loading="lazy"></figure>
  <p class="sig-card__index">N° 01</p>
  <h3 class="sig-card__title"><a class="sig-card__link" href="…" data-cta-origin="signatures">Abysse</a></h3>
  <p class="sig-card__legend">Sub acier 40 mm · cadran bleu soleillé · lunette noire · Oyster acier</p>
  <p class="sig-card__price"><span class="price">249 €</span> <span class="sig-card__note">telle que présentée</span></p>
  <span class="link-arrow sig-card__action" aria-hidden="true">Personnaliser celle-ci</span>
</li>
```

- Index : **Inter 500 12 px, capitales, `--ls-caps`, `--c-stone`** (« N° 01 », avec U+00A0). Pas de Cormorant à cette taille (§4.3).
- Titre : Cormorant 500 24 px. Légende : Inter 13 px `--c-ink-2`, deux lignes au plus. Prix : Inter 500 15 px tabulaire ; note 12 px `--c-stone`.
- Toute la carte est cliquable via `.sig-card__link::after` ; le pseudo-lien « Personnaliser celle-ci » est décoratif (`aria-hidden`).
- Dispositions (paramètre `layout` du snippet) : `card` (grille ou rail), `row` (ligne du sommaire, §9.1.4), `stage` (grande image de la scène), `mini` (vignette 120 px du méga-menu : image + nom + prix).

### 6.10 Vignettes `.thumb`

Cadran ou boîtier rond `mm-thumbs-*.png` (180 px, 7 à 13 Ko). 56 px sur téléphone, 72 px sur ordinateur. Anneau au repos `box-shadow: 0 0 0 1px var(--c-line)`. Sélectionnée : `0 0 0 1.5px var(--c-focus), 0 0 0 4px var(--c-bg), 0 0 18px rgb(var(--cool) / .18)`. Cible tactile de 44 px au minimum.

### 6.11 Badges `.badge`

24 px de haut, `padding-inline: 10px`, rayon pilule, Inter 500 12 px, capitales, `--ls-caps`.
- `.badge--chrome` : fond `--chrome`, texte `#07080a`.
- `.badge--edge` : bord `--chrome-edge`, fond `rgba(5,5,5,.6)`, texte `--c-ink`.
- `.badge--muted` : bord `--c-line-strong`, texte `--c-stone` (« Vendue », « Bientôt »).

### 6.12 Puces et pastilles

- **`.chip`** (interactif : filtre, suggestion de recherche, catégorie de FAQ) : 44 px de haut, `padding-inline: 18px`, rayon pilule, Inter 500 14 px, fond `--c-fill`, bord 1 px `--c-line-strong`. Sélectionnée (`aria-pressed="true"`, `aria-current="true"` ou radio cochée) : fond `--chrome`, texte `#07080a`. Choix multiples : `<fieldset class="chips"><legend>…</legend>` avec radios ou cases natives visuellement masquées.
- **`.pill-note`** (information, non interactive) : 32 px de haut, `padding-inline: 14px`, rayon pilule, Inter 13 px `--c-ink-2`, bord 1 px `--c-line-strong`, icône de 16 px. Exemple : « Main propre · Eure et Rouen ».

### 6.13 Formulaires

```html
<div class="field">
  <label class="field__label" for="contact-email">Votre e-mail</label>
  <input class="input" id="contact-email" type="email" autocomplete="email" inputmode="email" enterkeyhint="next" required aria-describedby="contact-email-error">
  <p class="field__error" id="contact-email-error" hidden>{% render 'icon', name: 'alert' %} Adresse e-mail incomplète : il manque le @ ou le domaine.</p>
</div>
```

- `.field__label` : Inter 500 13 px `--c-ink-2`, 8 px au-dessus du champ. « (facultatif) » en `--c-stone` ; pas d'astérisque.
- `.input` : 52 px de haut, `padding-inline: 18px`, **16 px de texte partout** (zoom iOS), rayon `--r-2`, fond `--c-fill`, bord 1 px `--c-field-border`. Survol : bord `rgba(255,255,255,.6)`. Focus : `outline: none; border-color: var(--c-focus); box-shadow: 0 0 0 4px rgb(232 236 241 / .14);`. Erreur : `aria-invalid="true"` → bord `--c-error` ; `.field__error` en 13 px `--c-error` avec icône.
- `textarea.input` : rayon `--r-2`, `min-height: 144px`, `field-sizing: content` sous `@supports`, sinon agrandissement en JS.
- `.select` (enveloppe d'un `<select class="input">`) : `appearance: none`, chevron SVG de 12 px à 18 px du bord droit, `padding-right: 44px`. Au-delà de 5 options seulement ; sinon des `.chip`.
- `.check` (case) et `.radio` : 20 px, bord `--c-field-border` ; cochée : fond `--chrome` et coche SVG noire.
- **Capsule** `.capsule` (newsletter, recherche, code postal, « Me prévenir ») : une pilule de 56 px (`.capsule__input` transparent, 16 px) avec un `.btn--chrome.btn--sm` intégré à droite, à 6 px du bord (`.capsule__btn`). Focus : anneau sur `.capsule:focus-within`.
- **Quantité** `.qty` : boutons − et + de 44 × 44 autour d'un champ de 44 px (`inputmode="numeric"`), masqué quand le stock est de 1 ou moins.
- Attributs systématiques : `autocomplete`, `inputmode`, `enterkeyhint`, `required` quand nécessaire. Messages de succès en `role="status"`.

### 6.14 Accordéon `.accordion` (`<details>`)

```html
<details class="accordion accordion--serif" name="faq" id="faq-{{ block.id }}">
  <summary class="accordion__summary"><span class="accordion__title">…</span><span class="accordion__icon" aria-hidden="true"></span></summary>
  <div class="accordion__body rte">…</div>
</details>
```

- Filet `.rule--hair` en haut de chaque accordéon (et en bas du dernier). `summary` : `min-height: 64px`, `list-style: none`, `::-webkit-details-marker { display: none }`.
- `.accordion--serif` (FAQ) : titre Cormorant 500 `--t-h4`. `.accordion--ui` (fiche produit, panier) : Inter 500 13 px capitales `--ls-caps`.
- Icône : deux traits de 12 × 1,25 px dessinés en CSS ; le vertical pivote de 90° en `--dur-3` à l'ouverture. Question ouverte : titre en `--chrome-text`.
- Ouverture fluide en amélioration progressive : `@supports (interpolate-size: allow-keywords) { :root { interpolate-size: allow-keywords; } .accordion::details-content { block-size: 0; overflow: clip; transition: block-size var(--dur-3) var(--ease-out), content-visibility var(--dur-3) allow-discrete; } .accordion[open]::details-content { block-size: auto; } }`.
- Accordéon exclusif via l'attribut `name`.

### 6.15 Feuilles et dialogues `.sheet` (`<dialog>`)

```html
<dialog class="sheet sheet--bottom" id="sheet-filtres" aria-labelledby="sheet-filtres-titre">
  <div class="sheet__handle" aria-hidden="true"></div>
  <header class="sheet__head"><h2 class="sheet__title" id="sheet-filtres-titre">Filtrer et trier</h2>
    <button class="btn btn--icon btn--ghost sheet__close" type="button" aria-label="Fermer" data-sheet-close>{% render 'icon', name: 'close' %}</button></header>
  <div class="sheet__body">…</div>
  <footer class="sheet__foot">…</footer>
</dialog>
```

- Ouverture **uniquement** par `Mig.dialog.open(el, opener)` (`showModal()` : focus retenu, fond inerte, Échap natif). Fermeture : bouton, Échap, clic sur le fond, glissement vers le bas de plus de 80 px sur la poignée (téléphone). Le focus revient au déclencheur.
- `.sheet--bottom` (téléphone, < 900 px) : en bas, rayon `--r-3 --r-3 0 0`, `max-height: 88dvh`, `padding-bottom: max(24px, env(safe-area-inset-bottom))`, poignée 36 × 4 px. À partir de 900 px, devient centrée (largeur 560 px, rayon `--r-3`).
- `.sheet--center` : toujours centrée (confirmation d'ajout, zoom). `.sheet--full` : plein écran (menu mobile, plein écran de galerie).
- Fond : `background: var(--c-glass-strong)` + `backdrop-filter: blur(20px) saturate(140%)` sous `@supports` ; `::backdrop { background: var(--c-scrim); }`.
- Animation : entrée `translateY(100%) → 0` en 360 ms `--ease-out` (bottom) ou `opacity + scale(.98)` en 240 ms (center) ; sortie 240 ms `--ease-io` ; fondu de 1 ms en mouvement réduit.

### 6.16 Fil d'Ariane `.crumbs`

`<nav class="crumbs" aria-label="Fil d'Ariane"><ol>…</ol></nav>` : Inter 12 px, capitales, `--ls-caps`, `--c-stone` ; séparateur « / » en `--c-faint` (`aria-hidden`) ; page courante en `--c-ink-2` avec `aria-current="page"` ; liens avec `padding-block: 14px` (44 px). Sur téléphone : seul le lien parent, sous la forme « ← Montres prêtes » (icône `arrow-left`). JSON-LD `BreadcrumbList` (§15).

### 6.17 Bon d'atelier `.recipe`

```html
<dl class="recipe">
  <div class="recipe__row"><dt>Boîtier</dt><dd>Sub acier 40 mm</dd><dd class="recipe__price">249 €</dd></div>
  …
</dl>
```

- Grille `grid-template-columns: minmax(96px, 34%) 1fr auto`, rangées de 44 px au minimum, `padding-block: 12px`, séparées par `--c-line`.
- `dt` : Inter 500 12 px, capitales, `--ls-caps`, `--c-stone`. `dd` : Inter 15 px `--c-ink`. `.recipe__price` : Inter 15 px tabulaire `--c-ink-2`, aligné à droite (colonne absente si aucun prix).
- **Jamais** de `dt` masqué ni de lien à l'intérieur du `dl` (c'est la cause du bug actuel du panier). Les liens (« Modifier la composition ») se placent sous le `dl`.
- Usages : caractéristiques de la fiche produit, composition d'une montre configurée dans le panier, étiquettes de la vue éclatée sur téléphone.

### 6.18 Engagements `.proof`

`.proofs` (liste `ul`) en grille de 4 colonnes à partir de 900 px, 2 × 2 sur téléphone (écarts 24 et 16 px). `.proof` : icône de 24 px au trait chromé (`stroke: url(#mig-chrome-stroke)`, dégradé SVG défini **une fois** dans le layout), titre Inter 500 15 px `--c-ink`, détail 14 px `--c-stone`, 12 px d'écart. Un bloc qui contient `[À COMPL` est masqué.

### 6.19 Prix `.price` (`snippets/price.liquid`, lot commerce)

- Format : `money_without_trailing_zeros`, puis l'espace avant « € » remplacée par U+00A0 (« 429 € »). Inter 500, `lining-nums tabular-nums`.
- `.price__from` « dès » (12 px `--c-stone`) ; `.price__now` ; `.price__was` (barré, `--c-stone`, précédé de `<span class="visually-hidden">Prix habituel</span>`) ; badge `.badge--edge` « −8 % » ; `.price__tax` « TTC » (12 px capitales `--c-stone`).
- Paramètre `context` : `card` (15 px), `product` (22 px, `.price--lg`), `bar` (17 px), `total` (28 px).

### 6.20 Poinçon `.hallmark` (snippet `hallmark`)

SVG en ligne de 64 px : cercle chromé de 1 px, texte sur un tracé circulaire « ASSEMBLÉE À LA MAIN · ÉVREUX · » (Inter 500 7,5 px, capitales, décoratif), au centre un « M » en Cormorant italique 22 px en `--chrome-text`. `aria-hidden="true"` + phrase équivalente en `.visually-hidden` (« Assemblée à la main à Évreux »). **Un seul par écran** : section atelier, ligne légale du pied de page, sous le bouton d'achat de la fiche produit.

### 6.21 Cadran SVG `.watch-dial` (snippet `watch-dial`) et horloge `.clock`

- `{% render 'watch-dial', mode: 'live', size: 120, dial: 'sub-bleu-soleille' %}` ou `{% render 'watch-dial', mode: 'stopped', time: '4:04', date: '404', size: 280 %}`.
- Contenu : lunette (cercle chromé en `--chrome-edge`), 60 index en filet (12 marqués), image facultative du cadran (`mm-thumbs-dial-<dial>.png`, 180 px, affichée au plus à 120 px) sous les aiguilles, aiguilles des heures, minutes et trotteuse en SVG, guichet de date facultatif (Inter tabulaire).
- Mode `live` : `theme.js` calcule une fois l'heure de Paris (`Intl.DateTimeFormat`, `Europe/Paris`) et pose `--h`, `--m`, `--s` (en secondes écoulées) ; les aiguilles tournent en CSS : heures `mig-turn 43200s linear infinite`, minutes `mig-turn 3600s linear infinite`, trotteuse `mig-turn 60s steps(360) infinite` (6 battements par seconde, comme un NH35), avec `animation-delay` négatif calculé. En pause (`html.is-still`) ou mouvement réduit : `animation-play-state: paused`.
- Mode `stopped` (404) : aiguilles fixées à 4 h 04 ; la trotteuse tente un pas puis revient (`mig-tick-back`, toutes les 2 s) ; figée en mouvement réduit.
- `.clock` + `[data-clock]` : texte « 14:32 » (heure de Paris, HH:MM, mis à jour toutes les 15 s), Inter tabulaire. Formule d'usage : « Atelier d’Évreux · <span class="clock" data-clock>14:32</span> ».

### 6.22 Rail horizontal `.rail` (`[data-rail]`, comportement global dans `theme.js`)

```html
<div class="rail" data-rail>
  <ol class="rail__track" tabindex="0" aria-label="Créations signature">…<li class="rail__item">…</li>…</ol>
  <div class="rail__nav"><span class="rail__count" data-rail-count aria-hidden="true">01 / 06</span><span class="rail__dots" data-rail-dots aria-hidden="true"></span></div>
</div>
```

- `.rail__track` : `display: grid; grid-auto-flow: column; grid-auto-columns: var(--rail-w, 82vw); gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: var(--gutter); padding-inline: var(--gutter); overscroll-behavior-x: contain; scrollbar-width: none;` ; chaque `.rail__item` en `scroll-snap-align: start`. La piste est focalisable (`tabindex="0"`) pour le défilement au clavier.
- Le rail déborde jusqu'aux bords de l'écran (marges négatives égales à la gouttière) **sans** créer de défilement horizontal de la page (`.rail { overflow: clip; }` sur le parent).
- Compteur « 01 / 06 » (tabulaire) et points (6 × 1 px de 24 px, actif en `--c-ink`) mis à jour par IntersectionObserver. Aucun défilement automatique.

### 6.23 État vide `.empty-atelier` (`snippets/empty-atelier.liquid` + `assets/component-empty-atelier.css`, lot commerce)

- Paramètres : `context` (`collection` | `search` | `cart` | `list`), `title`, `text`, `handle` (pour l'alerte), `signatures` (ids séparés par des virgules, par défaut `abysse,meteorite,instrument`).
- Ordinateur : texte en colonnes 1 à 5 (surtitre, titre `--t-h2` avec un `em`, phrase en `--c-ink-2`, bouton chromé « Créer ma montre », `link-arrow` « Être prévenu(e) » qui déplie le formulaire d'alerte), rendu signature de 380 à 460 px en écrin en colonnes 7 à 12. Dessous : rangée de 3 `.pill-note` puis 3 `.sig-card`.
- Téléphone : rendu à 72vw, puis texte, bouton pleine largeur, pastilles, rail de 3 `.sig-card`.
- Formulaire d'alerte : `{% form 'customer' %}` avec `contact[tags]` = `alerte,alerte-{{ handle }}`, capsule « Votre e-mail » + « Me prévenir », succès « C’est noté : je vous écris dès qu’une pièce est prête. » en `role="status"`.

### 6.24 En-tête de page `.page-header` (`snippets/page-header.liquid` + `assets/component-page-header.css`, lot pages)

Surtitre en fil d'Ariane (« MigMods · L’atelier ») ; H1 `--t-h1` dont un mot ou groupe peut être en `em` ; chapô `--t-lead` 52ch au plus ; `.rule--start[data-reveal]` qui se trace. Aligné à gauche sur l'axe de la page ; `padding-top: calc(var(--section-y) / 2)`. Paramètres : `eyebrow`, `title` (HTML autorisé), `lead`, `align` (`left` | `center`).

### 6.25 Icônes (`snippets/icon.liquid`, lot socle)

`{% render 'icon', name: 'arrow-right', class: '…', size: 20 %}`. Grille de 24, trait de 1,25, extrémités arrondies, `fill="none" stroke="currentColor"`, `aria-hidden="true" focusable="false"`. Jeu complet : `arrow-right`, `arrow-left`, `arrow-up-right`, `chevron-down`, `chevron-left`, `chevron-right`, `plus`, `minus`, `close`, `check`, `alert`, `search`, `bag`, `user`, `menu`, `sound-on`, `sound-off`, `play`, `pause`, `expand`, `copy`, `share`, `mail`, `pin`, `clock`, `hand` (main propre), `car`, `parcel`, `drop` (étanchéité), `gauge` (chronocomparateur), `shield` (garantie), `return` (retours : flèche en boucle), `instagram`, `tiktok`. **Les glyphes « → », « + », « – », « ✦ », « ▶ » ne sont plus jamais utilisés comme icônes.**

### 6.26 Utilitaires (`@layer utilities`)

`.visually-hidden` (avec `!important`), `.skip-link` (visible au focus, en haut à gauche, fond `--c-surface`, `var(--ring)`), `[hidden] { display: none !important; }`, `.draft-badge` (éditeur seulement : bord pointillé 1 px `--c-error`, 12 px, « À compléter »), `.no-js` (le contenu `[data-reveal]` reste visible sans JS).

---

## 7. Mouvement et lumière

Principe : **le geste d'une trotteuse — précis, court, jamais gratuit.** On n'anime que `transform`, `opacity` (et `clip-path` pour les menus, `background-position` pour un reflet ponctuel). Aucun `filter` animé, aucun `box-shadow` animé en boucle.

### 7.1 Apparitions `[data-reveal]` (global, `theme.js`)

```html
<div data-reveal style="--i: 2">…</div>
```

```css
html.reveal-ready [data-reveal]:not(.is-in) { opacity: 0; transform: translate3d(0, var(--rise), 0); }
html.reveal-ready [data-reveal] { transition: opacity var(--dur-4) var(--ease-out), transform var(--dur-4) var(--ease-out);
  transition-delay: calc(min(var(--i, 0), 6) * var(--stagger)); }
```

```js
// theme.js — ce qui est déjà à l'écran n'est jamais caché ; sans JS, tout reste visible
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
  { threshold: .15, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => el.getBoundingClientRect().top < innerHeight ? el.classList.add('is-in') : io.observe(el));
document.documentElement.classList.add('reveal-ready');
```

- **`filter: blur()` est supprimé définitivement.**
- Ordre dans une section : surtitre (`--i: 0`), titre (1), filet (2, se trace en `--dur-5`), chapô (3), action (4). Les cartes d'une grille arrivent une par une (`--i` = index, plafonné à 6).
- **Rien au-dessus de la ligne de flottaison n'utilise `data-reveal`.** Le héros a sa propre entrée en CSS pur (§9.1.1).
- Les filets `.rule` et `.rule--start` portent `data-reveal` et se tracent en `scaleX`.
- Images différées : classe `.is-loaded` posée au `load` → fondu `opacity` 0 → 1 en 400 ms (`img[loading="lazy"]` dans `.ecrin`, `.card`, `.sig-card`).

### 7.2 Lumière au pointeur `[data-light]` (ordinateur, `theme.js`)

```js
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const lit = new Set();
const lio = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting ? lit.add(e.target) : lit.delete(e.target)), { rootMargin: '10%' });
document.querySelectorAll('[data-light]').forEach((el) => lio.observe(el));
let px = 0, py = 0, raf = 0;
addEventListener('pointermove', (e) => { if (!fine.matches || Mig.isStill()) return; px = e.clientX; py = e.clientY; raf ||= requestAnimationFrame(paint); }, { passive: true });
function paint() { raf = 0; for (const el of lit) { const r = el.getBoundingClientRect();
  el.style.setProperty('--lx', Math.max(-.5, Math.min(1.5, (px - r.left) / r.width)).toFixed(3));
  el.style.setProperty('--ly', Math.max(-.5, Math.min(1.5, (py - r.top) / r.height)).toFixed(3)); } }
```

- Les variables sont écrites **sur les éléments visibles seulement**, jamais sur `:root`.
- Porteurs de `data-light` (liste fermée) : `.btn--chrome`, `.section-head__title` qui contient un `em`, `.page-header__title` qui contient un `em`, `.ecrin--stage`, `.footer-logo`.
- **Bouton chromé** : `::before { content: ""; position: absolute; inset: 0; background: radial-gradient(140px 70px at calc(var(--lx, .3) * 100%) calc(var(--ly, 0) * 100%), rgba(255,255,255,.7), transparent 70%); mix-blend-mode: soft-light; opacity: 0; transition: opacity var(--dur-3); }` et `opacity: 1` au survol.
- **Titre chromé** : `.section-head__title em { background-position: 50% calc(var(--ly, .5) * 100%); transition: background-position var(--dur-4) var(--ease-light); }`.
- **Montre en scène** : le **parent** `.ecrin--stage .ecrin__tilt` reçoit `transform: perspective(1200px) rotateX(calc((var(--ly, .5) - .5) * -6deg)) rotateY(calc((var(--lx, .5) - .5) * 8deg))` en `--dur-4`. Calque `.ecrin__spec` : `background: radial-gradient(40% 30% at calc(var(--lx, .5) * 100%) calc(var(--ly, .3) * 100%), rgba(255,255,255,.2), transparent 70%); mix-blend-mode: soft-light;` **masqué par l'image de la montre** (`-webkit-mask: var(--spec-mask) center / 78% no-repeat; mask: var(--spec-mask) center / 78% no-repeat;` avec `style="--spec-mask: url('{{ url_absolue_de_l_image }}')"`) : la lumière ne tombe que sur le métal.
- Bornes : inclinaison ±3° en X et ±4° en Y, opacité du spéculaire ≤ .2, un seul reflet de passage à la fois par écran.

### 7.3 Lumière au défilement (téléphone, CSS seul)

```css
@supports (animation-timeline: view()) {
  @media (hover: none) and (prefers-reduced-motion: no-preference) {
    html:not(.is-still) .section-head__title em, html:not(.is-still) .chrome-text {
      animation: mig-light-y linear both; animation-timeline: view(); animation-range: cover 10% cover 90%; }
    html:not(.is-still) .ecrin--stage .ecrin__tilt {
      animation: mig-tilt linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
  }
}
@keyframes mig-light-y { from { background-position: 50% 0%; } to { background-position: 50% 100%; } }
@keyframes mig-tilt { from { transform: perspective(1200px) rotateX(3deg) translateY(12px); } to { transform: perspective(1200px) rotateX(-3deg) translateY(-12px); } }
```

Sans prise en charge : rendu statique, correct.

### 7.4 Reflet de passage (une fois)

- Titres et `.chrome-text` : quand l'élément révélé reçoit `.is-in`, `background-position` passe de `50% 0%` à `50% 100%` en `--dur-5` `--ease-light` (sauf si la lumière de défilement s'applique).
- Grand logo du pied de page : balayage `mask-image: linear-gradient(110deg, #000 40%, rgba(0,0,0,.35) 50%, #000 60%)` qui glisse de −100 % à 100 % en 1 600 ms `--ease-io`, **une seule fois**, à 40 % de visibilité.
- La boucle `chrome-flow` est **supprimée**.

### 7.5 Signatures horlogères

- **Disque de date** (`[data-disc]`, `theme.js`) : chaque chiffre est une colonne masquée (`overflow: clip; height: 1em; line-height: 1`) contenant 0 à 9 ; la colonne glisse en `translateY(calc(var(--n) * -1em))` en 900 ms `--ease-out`, décalée de 60 ms par chiffre, à l'entrée dans l'écran. Les espaces et séparateurs restent fixes. La partie animée est `aria-hidden="true"` ; la valeur finale est écrite en dur dans un `<span class="visually-hidden">`. En mouvement réduit ou sans JS : valeur finale affichée directement. **Le compteur actuel (`data-count`) est supprimé.**
- **Trotteuse à 6 battements par seconde** : `steps(360)` sur 60 s (§6.21).
- **404 à 4 h 04** : §9.13.

### 7.6 Survols et pressions

- Survols **uniquement** sous `@media (hover: hover) and (pointer: fine)` : reflet des boutons (`--dur-sweep`), soulignés (`--dur-3`), seconde vue des cartes (600 ms), halo des écrins (`--dur-4`), flèches +4 px (`--dur-3`), trait de navigation (`--dur-3`).
- Pression (tous appareils) : `:active { transform: scale(.98) }` en `--dur-1` `--ease-ui` sur boutons et puces ; `.985` sur les médias de cartes.
- **Interdits** : soulèvement de carte, zoom d'image au survol, décalage de mise en page, effet « magnétique » (`data-magnetic` est supprimé).

### 7.7 Pause globale `html.is-still` (WCAG 2.2.2)

- Déclencheurs : bouton Pause du héros (`[data-still-toggle]`), bouton Pause de la scène des créations, préférence mémorisée `localStorage['mig-still'] === '1'` (lecture et écriture dans un try/catch), et d'office si `prefers-reduced-motion: reduce`.
- Effets : vidéo en pause, vagues figées sur une image, fond `.site-bg` figé, scène des créations sans rotation automatique, trotteuses arrêtées, rotation de l'annonce arrêtée (premier message), lumière au pointeur et au défilement coupée.
- Tout composant animé écoute `mig:still` et vérifie `Mig.isStill()` avant de lancer une boucle.

### 7.8 Vidéo du héros (section `hero-video`)

- Lecture automatique (muette, en boucle, `playsinline`) **seulement si** : pas de mouvement réduit, pas de `navigator.connection.saveData`, pas de `html.is-still`. Sinon : `preload="none"`, poster fixe, bouton Pause en état « pressé » (`aria-pressed="true"`, icône `play`).
- Si la promesse de `play()` est rejetée (mode économie d'énergie d'iOS), même état que ci-dessus.
- Pause automatique sous 10 % de visibilité (IntersectionObserver). `visibilitychange` ne relance la vidéo que si elle est dans l'écran **et** que l'utilisateur ne l'a pas mise en pause.
- Apparition de la vidéo par-dessus le poster : `opacity` 0 → 1 en 400 ms au premier événement `playing`.
- **Son** : bouton à libellé fixe « Son » (`aria-pressed`, icônes `sound-off` / `sound-on`). À l'activation, le volume monte de 0 à 1 en 400 ms (rAF).

### 7.9 Vagues WebGL (`assets/migmods-waves.js`, lot accueil)

- Canvas rendu à **0,6 ×** la taille du conteneur, agrandi en CSS ; `devicePixelRatio` plafonné à 1 (l'effet est flou par nature).
- 30 images/s si `(pointer: coarse)`, 60 sinon.
- `resize` temporisé à 150 ms, et seulement si la largeur change de plus de 2 px (la barre d'adresse d'iOS ne réalloue plus le canvas).
- État mémorisé : `visible = !document.hidden && heroVisible` (`heroVisible` vient de l'IntersectionObserver). `visibilitychange` respecte cet état.
- `webglcontextlost` : arrêt et repli sur un dégradé statique ; `webglcontextrestored` : reprise.
- Une seule image en mouvement réduit ou sous `html.is-still`. Contexte `powerPreference: 'low-power'` conservé.

### 7.10 Fond animé `.site-bg` (lot socle)

- Même rendu (lueur conique noir et blanc qui tourne lentement), coût divisé par environ 20 :
  - `.site-bg` : `position: fixed; inset: 0; z-index: var(--z-bg); background: var(--c-void); pointer-events: none; contain: strict; overflow: hidden;`.
  - `.site-bg::before` : un seul calque de `36vmax × 36vmax` centré, `background: url('migmods-glow.webp') center / cover` (texture 256 × 256 pré-floutée, ≈ 4 Ko, générée par l'outillage à partir du dégradé conique actuel), `transform: translate(-50%, -50%) scale(4) rotate(0)` animé jusqu'à `rotate(1turn)` en **140 s** linéaire, `will-change: transform` (le calque est rastérisé petit puis agrandi par le GPU : le flou est gratuit), `opacity: .9`.
  - `.site-bg::after` : grain anti-bandes `migmods-grain.png` (64 × 64, ≈ 2 Ko) en mosaïque, `opacity: .035`, statique.
- **Aucun `filter: blur`.** Validation par captures avant/après : le rendu doit rester le même à l'œil.
- Figé en mouvement réduit, sous `html.is-still`, quand l'onglet est masqué (`html.tab-hidden` posé par `theme.js` sur `visibilitychange`) et quand le réglage `settings.motion_bg` est faux (classe `html.bg-still` posée par le layout).
- Masqué sur la page configurateur sous 900 px (`body.template-page-configurateur .site-bg { display: none; }` dans `section-migmods-configurator.css`).

### 7.11 Transitions entre pages

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
  ::view-transition-old(root) { animation: 180ms var(--ease-io) both mig-fade-out; }
  ::view-transition-new(root) { animation: 320ms var(--ease-out) both mig-fade-up; } /* opacity 0→1, translateY 8px→0 */
  .site-header:not(.is-logo-hidden) .site-logo { view-transition-name: site-logo; }
}
```

- Le logo reste immobile d'une page à l'autre. Aucun autre `view-transition-name` permanent (deux noms identiques annulent la transition).
- Pas de transition vers ou depuis la page configurateur (`body.template-page-configurateur` : `@view-transition { navigation: none; }` dans sa feuille).

### 7.12 Mouvement réduit (bloc unique, fin de `theme.css`, `@layer utilities`)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important;
    transition-duration: 1ms !important; scroll-behavior: auto !important; }
  html.reveal-ready [data-reveal] { opacity: 1; transform: none; }
}
```

S'y ajoutent, dans les composants : vidéo non lue (poster + bouton), vagues sur une image, `.site-bg` figé, disque de date à la valeur finale, trotteuses arrêtées, rotation de l'annonce arrêtée, lumière au pointeur et au défilement coupée, indicateur de défilement masqué, `.scroll-line` masquée, menus et feuilles en fondu de 1 ms, accordéons instantanés, pas de transition de page, pastille d'Évreux fixe.

### 7.13 Garde-fous

- **Au plus 2 animations continues à l'écran** à un instant donné : sur l'accueil, le fond et les vagues + vidéo dans le héros ; ailleurs, le fond seul (plus la trotteuse d'un cadran si visible).
- Toute animation continue s'arrête hors écran (IntersectionObserver), onglet masqué, `is-still`.
- `will-change` posé par classe pendant l'animation seulement (sauf `.site-bg::before`).
- `backdrop-filter` **uniquement** sur : `.site-header.is-scrolled`, `.mega`, `.sheet`, `.buybar`, `.btn--glass`.
- Défilement : écouteur passif, regroupé par rAF, qui n'écrit **que des classes sur `.site-header`**. Plus aucune écriture de variable sur `:root` au défilement.
- `.scroll-line` (barre de progression, 2 px en haut, `--chrome-line`, `animation-timeline: scroll(root)` sous `@supports`, z-index `--z-progress`) : conservée, masquée sur la page configurateur et en mouvement réduit.

---

## 8. Socle global

### 8.1 `layout/theme.liquid` (lot socle)

Dans `<head>`, dans cet ordre :
1. `meta charset`, `viewport` (`width=device-width, initial-scale=1, viewport-fit=cover`), `theme-color` = `--c-bg`. **Supprimer `X-UA-Compatible`.**
2. `title`, `meta description`, `canonical`, favicon (`settings.favicon` sinon `favicon-32.png`), `apple-touch-icon.png` (180 px).
3. `{% render 'meta-tags' %}` puis `{% render 'jsonld-site' %}`.
4. Préchargements : `cormorant-garamond-300.woff2`, `inter.woff2` ; sur l'accueil seulement, le poster du héros (`<link rel="preload" as="image" fetchpriority="high">`, version portrait `media="(max-width: 899px)"`, version paysage `media="(min-width: 900px)"`).
5. `{% render 'css-variables' %}`.
6. `<script>` en ligne : remplacement de `no-js` par `js` sur `<html>`, lecture de `localStorage['mig-still']` (try/catch) pour poser `is-still` avant le premier rendu, `window.MigConfig`.
7. `theme.css`, `legacy.css` (jusqu'à la phase 2), `theme.js` (`defer`), `migmods-waves.js` (`defer`, **uniquement** si le template est `index` ou `password`).
8. `{{ content_for_header }}`.

Dans `<body class="template-{{ template.name }}{% if template.suffix %} template-{{ template.name }}-{{ template.suffix }}{% endif %}">` :
1. `<div class="site-bg" aria-hidden="true"></div>` et `<div class="scroll-line" aria-hidden="true"></div>`.
2. `<a class="skip-link" href="#main">Aller au contenu</a>`.
3. `<svg width="0" height="0" aria-hidden="true" style="position:absolute">` avec le dégradé `<linearGradient id="mig-chrome-stroke">` (icônes chromées).
4. `{% sections 'header-group' %}`, `<main id="main" tabindex="-1">`, `{% sections 'footer-group' %}`.
5. `<div id="mig-live" class="visually-hidden" aria-live="polite"></div>`.
6. Produits techniques : `<meta name="robots" content="noindex,nofollow">` dans `<head>` si `template.name == 'product'` et `is-technical` renvoie `1`.

**Classes à conserver absolument** (le `<style>` en ligne du configurateur les masque sous 900 px) : `.announcement`, `.site-header`, `.site-footer`, `.scroll-line`.

### 8.2 En-tête (`sections/header.liquid`, lot entete-pied)

**Structure** : un seul bloc fixe qui contient l'annonce et la barre.

```html
<header class="site-header site-header--overlay" data-header>
  <div class="announcement">…</div>
  <div class="site-header__bar">
    <div class="site-header__inner page-width">
      <div class="site-header__start">burger (< 1280) | <nav class="site-nav"> (≥ 1280)</div>
      <a class="site-header__logo site-logo" href="/">{% render 'logo', context: 'header' %}</a>
      <div class="site-header__end">recherche · compte (≥ 900) · panier · bouton (≥ 900)</div>
    </div>
    <div class="mega" id="mega-collections" hidden>…</div>
  </div>
  <dialog class="sheet sheet--full menu-sheet" id="menu-sheet" aria-label="Menu">…</dialog>
</header>
```

- `position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-header);` hauteur `var(--header-h)`. Le positionnement est **uniquement en CSS** (fin du `--ann-h` calculé en JS et du saut au chargement).
- **Annonce** `.announcement` : `--ann-h` (32 px), fond `--c-void`, filet bas `--c-line`, Inter 400 12 px, interlettrage 0, `--c-ink-2`, **une seule ligne** (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`). Trois messages (blocs `announcement` : `text`, `text_short`, `link`, limite 3) en fondu toutes les 5 s (fondu 400 ms + `translateY(6px)`), en pause au survol et au focus, premier message seul sous `is-still`. Sous 430 px, `text_short` remplace `text`. Le lien éventuel a une zone cliquable étendue (`::after { inset: -6px 0; }`) pour atteindre 44 px. Masquée en paysage court (`max-height: 500px`).
- **Barre** `.site-header__bar` : `--bar-h` (60 px, puis 76 px dès 1280 px). Grille `grid-template-columns: 1fr auto 1fr; align-items: center;`.
  - Téléphone et tablette (< 1280 px) : burger `.btn--icon` 44 px à gauche (`aria-controls="menu-sheet" aria-expanded="false"`), logo centré (**112 px** de large sous 900 px, 150 px au-delà), à droite recherche (lien vers `/search`, 44 px) et panier (44 px) ; à partir de 900 px s'ajoutent compte (44 px) et `.btn--chrome.btn--sm` « Créer ma montre ».
  - Ordinateur (≥ 1280 px) : `nav.site-nav` à gauche avec **au plus 4 liens** (le 5e et les suivants ne vont que dans le menu mobile ; le lien dont l'URL vaut `cta_link` est retiré automatiquement, ce qui supprime le doublon « Créer ma montre ») ; Inter 500 12 px capitales `--ls-caps`, écart 28 px, `--c-stone` → `--c-ink` au survol, trait `.site-nav__ink`. Logo 150 px au centre. À droite : recherche, compte, panier (44 × 44) et `.btn--chrome.btn--sm` « Créer ma montre ». **Au moins 48 px** entre le dernier lien et le logo à 1280, 1366 et 1440 px (vérifié par capture).
- **Panier** : lien `aria-label="Panier, {{ n }} article(s)"` mis à jour sur `mig:cart` ; pastille `.cart-count` 18 px, fond `--chrome`, Inter 600 11 px tabulaire, texte `#07080a` (exception de taille admise : chiffre décoratif doublé par l'`aria-label`). Le nombre exclut les composants (`snippets/cart-count.liquid`).
- **États** (posés par `section-header.js`, défilement en rAF) :
  - `.site-header--overlay` (accueil, réglage `overlay_home`) : barre transparente, voile `--veil-top` sur 140 px derrière l'annonce et les icônes.
  - `.is-scrolled` (au-delà de 24 px) : bloc entier en `translateY(calc(-1 * var(--ann-h)))` (l'annonce disparaît), barre en `--c-glass` + `backdrop-filter: blur(16px) saturate(140%)`, filet bas `--c-line`, barre à `--bar-h-min` (60 px) dès 1280 px. Transition `--dur-3`.
  - `.is-hidden` (**téléphone uniquement**, < 900 px, en descendant au-delà de 400 px) : `translateY(-100%)` ; réapparition dès qu'on remonte de 2 px. Jamais quand le méga-menu ou un dialogue est ouvert.
  - `.is-logo-hidden` (accueil) : le logo de l'en-tête est en `opacity: 0; visibility: hidden` tant que le logo de la vidéo est visible (IntersectionObserver sur `.hero-video__media`, seuil .35), puis apparaît en `opacity` 0 → 1 et `scale(.96)` → 1 en 480 ms `--ease-out`. Un seul logo à l'écran.
  - `.site-header--compact` (page configurateur) : pas d'annonce (non rendue), barre 60 px en `--c-glass` dès le départ, jamais masquée.

### 8.3 Méga-menu « Collections » (lot entete-pied)

- Correctifs : `.site-nav__item.has-mega { position: static; }` ; `.mega { position: absolute; left: 0; right: 0; top: 100%; white-space: normal; }` (référence : `.site-header__bar`, en `position: relative`). Fermé : `hidden` (donc `display: none` : plus aucun débordement horizontal).
- Ouverture : survol avec intention de 120 ms, fermeture après 240 ms ; clic ou Entrée sur le déclencheur (`button`, `aria-expanded`, `aria-controls="mega-collections"`) ; Échap ferme et rend le focus ; `focusout` hors du panneau ferme. Animation : `clip-path: inset(0 0 100% 0)` → `inset(0)` en `--dur-3`, liens en cascade de 40 ms.
- Panneau pleine largeur, fond `--c-glass-strong` + flou 24 px, filet bas `--c-line`, grille de 12 colonnes dans `.page-width`, `padding-block: 40px` :
  1. **Colonnes 1 à 5** — `.mega__list` : collections enfants du lien, numérotées 01 à 0n (Inter 12 px `--c-stone`), titre Cormorant 300 32 px ; à droite « 8 pièces » (Inter 13 px `--c-stone`) ou `.badge--muted` « Bientôt » si `products_count == 0`.
  2. **Colonnes 6 à 8** — `.mega__visual` : visuel de la collection survolée ou focalisée, rendu par `{% render 'family-visual', collection: c, size: 240 %}` (image de la collection, sinon première image produit, sinon boîtier de la famille, §10.6), chargé à l'ouverture seulement.
  3. **Colonnes 9 à 12** — `.mega__feature` : carte « Créer la vôtre » avec `watch-dial` en mode `live` (120 px, cadran `sub-bleu-soleille`), surtitre « Configurateur », titre Cormorant 300 32 px « Créez <em>la vôtre</em> », texte « Plus de 80 cadrans, 33 boîtiers. Le prix suit chaque choix. », prix d'entrée « dès 229 € », `link-arrow` « Créer ma montre » (`data-cta-origin="mega"`).

### 8.4 Menu mobile `.menu-sheet` (lot entete-pied)

- `<dialog class="sheet sheet--full menu-sheet">` ouvert par `Mig.dialog.open()` : focus retenu, fond inerte, Échap natifs. Fermeture au clic sur un lien, sur Échap, et sur `pageshow` avec `persisted` (retour arrière de Safari).
- Fond opaque `#030303`. Entrée : `clip-path: circle(0 at <centre du burger>)` → `circle(150% at …)` en 560 ms `--ease-out`, liens en cascade de 60 ms (8 au plus) ; sortie inverse en 320 ms. Fondu de 1 ms en mouvement réduit.
- Contenu, de haut en bas (respect de `env(safe-area-inset-top)` et `-bottom`) :
  1. Barre de 60 px : Fermer (44 px, `aria-label="Fermer le menu"`), logo, panier (44 px).
  2. `.capsule` de recherche (formulaire vers `/search`, champ 16 px, « Rechercher une montre »).
  3. Liens principaux en Cormorant 300 32 px, lignes de 56 px séparées par `.rule--hair`, numéro 01–0n en Inter 12 px `--c-stone` : Montres prêtes, Collections (accordéon : `grid-template-rows` 0fr → 1fr en `--dur-3`, chevron qui pivote, sous-liens Inter 16 px de 48 px), L’atelier, Livraison, FAQ, Contact.
  4. Liens secondaires de 48 px : Mon compte, Instagram (si réglé).
  5. Pied collant : `.btn--chrome.btn--block` « Créer ma montre » (`data-cta-origin="menu"`), deux `.pill-note` (« Main propre · Eure et Rouen », « Colissimo suivi offert »), « Atelier d’Évreux · <span class="clock" data-clock>14:32</span> ».

### 8.5 Pied de page (`sections/footer.liquid`, lot entete-pied)

`<footer class="site-footer">`, de haut en bas :

1. **Bande signature** `.footer-band` (réglages `band_show`, `band_heading`, `band_button`, `band_link`) : centrée, `padding-block: calc(var(--section-y) / 2)`, titre `--t-h1` « Une montre se choisit. <em>La vôtre se compose.</em> », `.btn--chrome` « Créer ma montre » (`data-cta-origin="footer-band"`), `.rule[data-reveal]`. **Non rendue** sur `cart` et sur la page configurateur.
2. **Lettre de l'atelier** `.newsletter` (bloc `newsletter`) : surtitre « La lettre de l’atelier », titre `--t-h3`, phrase, `.capsule` (champ e-mail 16 px + bouton « M’inscrire »), ligne RGPD 12 px `--c-stone`, succès en `role="status"` (la capsule se fond et une coche chromée se trace en 600 ms).
3. **Colonnes** `.footer-grid` (grille de 12) : bloc `atelier` (nouveau : « L’atelier », « Évreux, Normandie », horloge `data-clock`, e-mail `settings.contact_email`, Instagram et TikTok selon les réglages) en colonnes 1 à 4 ; blocs `menu` (« Boutique », « Aide ») ; bloc `legal` (« Informations » : politiques `shop.policies` + page de mentions légales) — **une colonne sans lien n'est pas rendue, titre compris**. Liens Inter 15 px `--c-ink-2`, `padding-block: 12px` (44 px). Sur téléphone : atelier, puis newsletter, puis colonnes en `<details class="accordion accordion--ui">` de 56 px.
4. **Ligne légale** `.footer-legal` (12 px `--c-stone`) : « © {{ 'now' | date: '%Y' }} MigMods · Montres Seiko mod assemblées à la main à Évreux », poinçon `.hallmark`, moyens de paiement (`payment_type_svg_tag`, 24 px de haut, en gris), mention de non-affiliation (réglage `disclaimer`).
5. **Grand logo final** `.footer-logo` : `{% render 'logo', context: 'footer' %}` (WebP 640w et 1100w, `sizes="(min-width: 1180px) 1100px, 92vw"`, `loading="lazy"`, `decoding="async"`, `fetchpriority="low"`), largeur `min(1100px, 92vw)`, masque en fondu vers le bas, reflet de passage une fois (§7.4), `data-light`. **Le petit logo du pied de page est supprimé.**
- Réglages supprimés : `wordmark` (en-tête et pied). Le réglage `logo` de l'en-tête est supprimé au profit de `settings.brand_logo` (un seul logo).

### 8.6 Bandeau cookies Shopify (lot socle, `theme.css`, hors couche)

Fond `--c-glass-strong`, texte `--c-ink`, boutons restylés en `.btn--chrome` (accepter) et `.btn--ghost` (refuser), 44 px. Ne jamais le masquer.

### 8.7 Logo (`snippets/logo.liquid`, lot socle)

- Paramètre `context` : `header` (largeur 112 px sous 900 px, 150 px au-delà, `sizes="(min-width: 900px) 150px, 112px"`, `srcset` `logo-migmods-320.webp 320w, logo-migmods-640.webp 640w`, `loading="eager"`, classe `site-logo__img`) ; `footer` (`srcset` 640w et 1100w) ; `plain` (pages mot de passe et carte cadeau, 200 px).
- Si `settings.brand_logo` est renseigné : `image_url` avec les mêmes largeurs (Shopify choisit le format).
- `width`/`height` calculés selon le ratio 1109 / 394 ; `alt="{{ shop.name }}"` (ou `alt=""` si un texte voisin nomme déjà la marque).
- **`logo-migmods.png` (609 Ko) n'est plus jamais référencé par une page.**

---

## 9. Plan page par page, section par section

Pour chaque section : classe racine = nom du fichier ; feuille `assets/section-<nom>.css` ; script `assets/section-<nom>.js` si besoin. Les textes exacts sont au chapitre 11.

### 9.1 Accueil (`templates/index.json`, lot accueil)

**Ordre** (clés identiques dans `sections` et `order`) :

```json
"order": ["hero", "specs", "featured", "signatures", "cta", "process", "stats", "atelier", "local", "faq", "reviews", "social"]
```

| Clé | Type | Rôle |
|---|---|---|
| `hero` | `hero-video` | ouverture, H1 |
| `specs` | `spec-rail` (nouveau) | réglette des caractéristiques |
| `featured` | `featured-collection` | montres prêtes ; **ne rend rien si la collection est vide** |
| `signatures` | `signature-showcase` (nouveau) | Créations signature, ancre `#creations` |
| `cta` | `cta-configurator` | le configurateur, roue de cadrans |
| `process` | `process` | de la commande à votre poignet (4 étapes) |
| `stats` | `stats` | chiffres clés |
| `atelier` | `image-with-text` | l'atelier |
| `local` | `local-delivery` | remise en main propre |
| `faq` | `faq` | « Avant de commander » (4 questions) |
| `reviews` | `testimonials` | masquée sans vrais avis |
| `social` | `social` | « Suivez l'atelier » |

Contrôle de longueur : **13 écrans d'iPhone 15 Pro au plus**, pied de page compris. Chemins vers le configurateur : héros (bouton), créations (cartes), CTA (bouton), process (lien), atelier (lien), livraison (lien), pied de page (bande).

#### 9.1.1 `hero-video`

**Schéma** : `video` (video), `video_url` (text), `video_desktop` (video, facultative, paysage), `poster` (image_picker), `poster_desktop` (image_picker), `waves` (checkbox, true), `waves_gain` (range 20–100, pas 5, 60), `eyebrow` (text), `eyebrow_short` (text), `heading` (inline_richtext), `button_1` (text), `link_1` (url), `button_2` (text), `link_2` (url), `button_2_empty` (text), `ready_collection` (collection), `show_from_price` (checkbox, true), `proof_text` (text).

**Balisage** :

```html
<section class="hero-video" aria-labelledby="hero-title" data-hero-video>
  <div class="hero-video__waves" data-waves data-waves-gain="0.6" aria-hidden="true"></div>
  <div class="hero-video__media"><video class="hero-video__el" muted loop playsinline preload="metadata" poster="…">…</video></div>
  <div class="hero-video__shade" aria-hidden="true"></div>
  <div class="hero-video__content page-width">
    <h1 class="hero-video__title" id="hero-title">
      <span class="eyebrow eyebrow--plain hero-video__eyebrow"><span class="hero-video__eyebrow-long">Seiko mods assemblées à la main à Évreux</span><span class="hero-video__eyebrow-short">Assemblées à la main à Évreux</span></span>
      La montre que <em>personne d’autre</em> ne porte
    </h1>
    <div class="hero-video__actions">…</div>
    <p class="hero-video__proof">Dès 229 € · prix affiché à chaque choix</p>
  </div>
  <div class="hero-video__controls">
    <button class="btn btn--icon btn--glass" type="button" aria-pressed="false" data-sound>…<span class="visually-hidden">Son</span></button>
    <button class="btn btn--icon btn--glass" type="button" aria-pressed="false" data-still-toggle>…<span class="visually-hidden">Pause</span></button>
  </div>
  <a class="hero-video__scroll" href="#creations" aria-label="Découvrir"><span></span></a>
</section>
```

- Le surtitre fait partie du H1 (mot-clé « Seiko mods »). `.hero-video__eyebrow-short` remplace la version longue sous 430 px. Couleur du surtitre : `--c-ink-2` (pas de blanc à 65 %).
- **Hauteur** : `min-height: max(560px, 100svh)` ; l'en-tête est superposé, donc rien n'est coupé.
- **Calques** (z croissant) : vagues → vidéo (`mix-blend-mode: screen` et masque radial conservés) → voile `.hero-video__shade` → contenu → commandes.
- **Voile de lecture** : `radial-gradient(120% 60% at 50% 100%, rgba(0,0,0,.78), rgba(0,0,0,.4) 50%, transparent 75%)` sur téléphone ; `radial-gradient(60% 45% at 50% 82%, rgba(0,0,0,.7), transparent 75%)` à partir de 900 px. Le bas du héros se fond par `mask-image: linear-gradient(#000 82%, transparent)` sur `.hero-video__media` (plus de raccord gris).
- **Téléphone (< 900 px)** : `.hero-video__media` occupe le haut (`inset: 0 0 auto 0; height: 74%`, `object-position: 50% 40%` — valeurs à ajuster par capture pour que le bas du logo de la vidéo soit **au moins 24 px au-dessus** du surtitre). Contenu calé en bas, aligné à gauche, `padding-bottom: calc(max(16px, env(safe-area-inset-bottom)) + 8px)`. Pile : H1 (2 à 3 lignes), 20 px, `.btn--chrome.btn--block` « Créer ma montre », 4 px, `.link-arrow` secondaire, 8 px, ligne de preuve 12 px `--c-stone`. Commandes Son et Pause en haut à droite à `top: calc(var(--header-h) + 12px)`. Pas d'indicateur de défilement.
- **Téléphone court** (`max-height: 620px`) : H1 à 36 px, ligne de preuve masquée, lien secondaire masqué.
- **Paysage court** (`orientation: landscape` et `max-height: 500px`) : deux colonnes, vidéo à gauche (45 %), texte à droite, annonce masquée, commandes en bas à droite.
- **Ordinateur (≥ 900 px)** : `.hero-video__media` limitée à `width: min(100%, 1200px)` et centrée (moins d'agrandissement, logo plus net) ; vagues sur toute la largeur. Bloc centré à 12vh du bas, H1 `--t-display` sur deux lignes, `.btn--chrome.btn--lg` + `.btn--ghost.btn--lg` côte à côte (écart 16 px), ligne de preuve dessous. Commandes Son et Pause en bas à droite (`bottom: 32px`). Indicateur `.hero-video__scroll` : filet vertical de 48 × 1 px traversé par une goutte de lumière, 3 passages puis arrêt ; masqué en mouvement réduit.
- **Entrée** (CSS pur, pas de `data-reveal`) : `@keyframes mig-rise { from { opacity: 0; transform: translateY(12px); } }` sur le titre, les actions et la preuve, 700 ms `--ease-out`, délais 120, 200, 320 ms. Le H1 est donc peint dès le premier rendu.
- **Bouton secondaire intelligent** : si `ready_collection` (repli `collections['montres-pretes']`) a au moins une pièce → `button_2` vers `link_2` (repli `/collections/montres-pretes`) ; sinon → `button_2_empty` (« Voir les créations ») vers `#creations`.
- **Ligne de preuve** : « Dès » + `{% render 'catalogue-facts', fact: 'from_price' %}` + « · » + `proof_text`.
- **Médias** : poster portrait (`migmods-hero-poster.jpg`, 1080 × 1920) sous 900 px, poster paysage (`poster_desktop`, sinon `migmods-hero-poster-land.jpg`, 1600 × 900) au-delà ; `<source media="(min-width: 900px)">` pour `video_desktop` si renseignée. Le poster est préchargé par le layout (accueil seulement).
- **JS** `section-hero-video.js` : `<mig-hero-video>` ou `[data-hero-video]` (§7.8), son, bouton Pause relié à `Mig.setStill()`, masquage du logo de l'en-tête (pose `.is-logo-hidden` sur `[data-header]`).

#### 9.1.2 `spec-rail` (nouveau, remplace `marquee`)

- Schéma : `heading` (text, « Caractéristiques », rendu en `h2.visually-hidden`), `items` (textarea, un élément par ligne). Preset « Réglette de caractéristiques ».
- Rendu : `<ul class="spec-rail__list">`, une ligne centrée (retour à la ligne centré sur téléphone, 2 à 3 lignes), Cormorant italique 400, `clamp(20px, 18.67px + .37vw, 24px)`, `--chrome-text` ; séparateur `li + li::before` : point de 4 px `--c-stone`, marge 16 px. `.section--tight`. **Statique, aucun défilement.**

#### 9.1.3 `featured-collection`

- Schéma : `heading` (inline_richtext), `eyebrow`, `collection`, `limit` (range 2–8, 4), `columns` (select 2/3/4, 4), `link_label` (text), `empty_fallback` (select `none` | `signatures`, défaut `none`).
- Collection vide : ne rend **rien** hors éditeur si `empty_fallback == 'none'` ; rend `{% render 'signature-list', layout: 'card', limit: 3, origin: 'related' %}` sous un titre « Créations signature » si `signatures`. Dans l'éditeur, un message explicatif en `.draft-badge`.
- Avec des produits : `section-head--split`, grille de `.card` (2 colonnes < 900 px, 3 à partir de 900, `columns` à partir de 1440), cartes en `data-reveal` avec `--i`, `link-arrow` « Toutes les montres prêtes (n) ». Produits techniques exclus (`is-technical`).

#### 9.1.4 `signature-showcase` (nouveau, cœur de l'accueil)

- Schéma : `eyebrow`, `heading` (inline_richtext), `lead` (text), `ids` (text, info « identifiants séparés par des virgules ; vide = toutes »), `limit` (range 3–6, 6), `autoplay` (checkbox, true), `note` (text), `button_label` (text), `start_label` (text). Preset « Créations signature ». Pas de réglage `url` (liens construits par le snippet).
- Racine : `<section class="section signature-showcase" id="creations" aria-labelledby="…">` contenant `<mig-signature-showcase>`.
- **Ordinateur (≥ 900 px)** : `section-head--split` ; dessous, grille de 12 :
  - colonnes 1 à 7 : **scène** `.signature-showcase__stage` (`.ecrin.ecrin--stage`, carré, montre à 78 %, halo, ombre au sol, reflet, inclinaison et spéculaire liés au pointeur). Deux `<img>` superposées (A/B) pour le fondu enchaîné. Rendue par `{% render 'signature-list', layout: 'stage', limit: 1, ids: … %}` (première création). `aria-hidden="true"` : la scène est un aperçu, la liste porte le sens.
  - colonnes 8 à 12 : **sommaire** `<ol class="signature-showcase__list">` de lignes `.sig-card` en disposition `row` : numéro (Inter 12 px tabulaire), nom en Cormorant 300 `--t-sig`, prix à droite (Inter 500 15 px), légende 13 px `--c-stone` sous le nom, filets `.rule--hair`. La ligne active (`.is-active`) passe le nom en italique 400 `--chrome-text` et affiche un filet de 24 px à gauche. Les images 480 des lignes sont `display: none` sur ordinateur (donc non chargées).
  - sous le sommaire : `.btn--chrome` « Personnaliser celle-ci » (lien vers la composition active, `data-cta-origin="signatures"`), `.link-arrow` « Partir de zéro » (vers `/pages/configurateur`), note 12 px `--c-stone`, bouton Pause 44 px (`.btn--icon.btn--ghost`, `aria-pressed`) et 6 repères (traits de 24 × 1 px, actif en `--c-ink`).
  - **Interaction** : survol ou focus d'une ligne → la scène affiche cette création (fondu enchaîné de 700 ms `--ease-io` + `scale(.98 → 1)`, reflet de passage sur la nouvelle montre), le bouton pointe vers elle ; clic sur une ligne → configurateur (la ligne est un lien). **Défilement automatique** toutes les 6 s **uniquement** si la section est visible, ni survolée ni focalisée, `autoplay` vrai, pas `Mig.isStill()`.
- **Téléphone (< 900 px)** : pas de scène. Le même `<ol>` devient un `.rail` (`--rail-w: 82vw`) de `.sig-card` (image 480, index, nom, légende, prix, « Personnaliser celle-ci ») ; compteur « 01 / 06 » et points ; dessous, `.btn--chrome.btn--block` « Créer ma montre ». Aucun défilement automatique.
- Images : toutes `loading="lazy"`, `sizes="(min-width: 900px) 58vw, 82vw"`, `width`/`height` 800 ou 480.

#### 9.1.5 `cta-configurator`

- Schéma : `eyebrow`, `heading_line_1` (text), `heading_line_2` (inline_richtext), `text` (text), `show_facts` (checkbox, true), `button` (text), `link` (url, repli `/pages/configurateur`), `dials` (textarea : 24 identifiants de cadrans, un par ligne), `center` (text, défaut `abysse`).
- Titre : `<h2>` avec deux `<span class="cta-configurator__line">` en `display: block` (« Plus de 80 cadrans. » / « Une seule montre : <em>la vôtre.</em> »), U+00A0 dans « 80 cadrans ». Ce H2 reste plus petit que le H1 du héros.
- Faits : `{% render 'catalogue-facts', fact: 'dials' %} cadrans · … boîtiers · … bracelets · 5 calibres Seiko` en Inter 13 px capitales `--ls-caps` `--c-stone`, chiffres tabulaires.
- **Roue de cadrans** `.dial-wheel` (décorative, `aria-hidden="true"`, aucun lien) : 24 vignettes `mm-thumbs-dial-<id>.png` posées sur un cercle (`transform: rotate(calc(var(--k) * 15deg)) translateY(calc(var(--r) * -1)) rotate(calc(var(--k) * -15deg))`), au centre le rendu `sig-<center>-480.webp` en écrin (46 % du diamètre). La roue tourne de 0 à 60° avec le défilement (`animation-timeline: view()` sous `@supports`, sinon statique) ; aucune rotation continue.
  - Ordinateur : texte en colonnes 1 à 5 (axe A), roue de 520 px (vignettes de 72 px) en colonnes 6 à 12.
  - Téléphone : roue de `min(100%, 360px)` (vignettes de 40 px) **au-dessus** du texte, centrée ; texte et `.btn--chrome.btn--block` dessous.
- Vignettes `loading="lazy"`, `width="72" height="72"`.

#### 9.1.6 `process`

- Schéma : `eyebrow`, `heading` (inline_richtext), `mobile_layout` (select `frise` | `rail`, défaut `frise`), `link_label` (text), `link` (url, repli `/pages/atelier`), blocs `step` (`title`, `text`). Le preset ne contient **aucun** « [À COMPLÉTER ». Une étape dont le titre ou le texte contient un marqueur provisoire est masquée hors éditeur ; la numérotation suit les étapes visibles.
- Numéros 01 à 0n : Cormorant 300 72 px (48 px sur téléphone), chiffres alignés, `.chrome-text`.
- Ordinateur : n colonnes égales reliées par un filet chromé de 1 px qui se remplit au défilement (`scaleX`, `animation-timeline: view()`, plage `entry 20% cover 60%` ; sinon plein et statique).
- Téléphone, `frise` : liste verticale, filet de 1 px à gauche qui se remplit (`scaleY`), étapes compactes (numéro 48 px à gauche, titre Cormorant 500 22 px, texte 15 px). `rail` : `.rail` de cartes à 85vw avec compteur « 02 / 05 ».
- Fin : `link-arrow` (« Voir l’atelier en détail », `data-cta-origin="process"`).

#### 9.1.7 `stats`

- Schéma : `eyebrow`, `heading` (inline_richtext), blocs `stat` (`value`, `unit`, `label`, `text`).
- Balisage : `<dl class="stats__list">` ; chaque bloc `<div class="stat"><dt class="stat__label">…</dt><dd class="stat__value" data-disc>…</dd><dd class="stat__text">…</dd></div>`. L'unité est un `<span class="stat__unit">` en Inter (§4.2).
- Valeur : Cormorant 300 `--t-num`, `.chrome-text`, `lining-nums tabular-nums`, disque de date (§7.5).
- Ordinateur : 4 colonnes égales sur la grille de 12 (3 colonnes chacune), séparées par `.rule--v`, titre au-dessus sur toute la largeur.
- Téléphone : une colonne ; chaque rangée = valeur à gauche (40 %), libellé (12 px capitales) et texte (15 px) à droite, séparées par `.rule--hair`.

#### 9.1.8 `image-with-text` (atelier)

- Schéma : `eyebrow`, `heading` (inline_richtext), `heading_tag` (select `h2` | `h1`, défaut `h2`), `text` (richtext), `points` (textarea, un engagement par ligne), `image` (image_picker), `fallback_signature` (text, défaut `abysse`), `image_position` (select `left` | `right`), `text_first_mobile` (checkbox, true), `show_hallmark` (checkbox, false), `signature_line` (text), `link_label` (text), `link` (url, repli `/pages/atelier`). Réglage `fallback_dial` supprimé.
- Visuel : `image` si renseignée (photo de l'établi, `object-fit: cover`, rayon `--r-2`), sinon le rendu `sig-<fallback_signature>-800.webp` en `.ecrin.ecrin--stage` (boîte 1:1, largeur maximale 460 px) — **le cadran flou de 200 px et les 190 px de vide disparaissent**.
- Ordinateur : axe B (visuel en colonnes 1 à 6, texte en 8 à 12) ; léger parallaxe du visuel au défilement (`translateY(24px → -24px)`, `@supports`).
- Texte : `section-head` (`tag` = `heading_tag`), texte riche, liste `points` en `.recipe`-like simple (`ul.image-with-text__points`, lignes à filets, icônes `hand`, `drop`, `gauge`), signature en Cormorant italique 22 px `--c-stone` (« — L’atelier MigMods, Évreux »), poinçon si `show_hallmark`, `link-arrow`. Le bouton contour est supprimé. Textes provisoires masqués.

#### 9.1.9 `local-delivery`

- Schéma : `layout` (select `home` | `page`), `eyebrow`, `heading` (inline_richtext), `text` (richtext), `show_map` (checkbox, true), `show_checker` (checkbox, true), `codes` (textarea, vide par défaut ; s'il est vide, la section lit `settings.hand_delivery_codes` : ligne `27*` pour tout code commençant par 27, puis les codes 76 de la métropole, un par ligne), `msg_eure`, `msg_rouen`, `msg_france`, `msg_invalid` (text), `link_label`, `link` (url, repli `/pages/livraison`), `button_label`, `button_link` (url, repli `/pages/configurateur`), blocs `zone` (`zone`, `detail`, `price_note`), blocs `delay` (`value`, `label`) pour la disposition `page`.
- **Carte-cadran** `.delivery-map` (SVG en ligne ≤ 3 Ko, `aria-hidden="true"`) : Évreux au centre (point chromé de 8 px avec halo qui pulse 3 fois en 2,4 s puis s'arrête ; fixe en mouvement réduit), anneaux concentriques à 15, 30, 45 et 60 km (traits `--c-line`, graduations comme un rehaut de cadran), point « Rouen » à **47 km au nord** (relèvement 355°), anneau « Eure (27) » légendé, flèche fine sortante « Partout en France ». Aucune prétention cartographique : c'est un schéma de distances.
- **Zones** : grille fixe `grid-template-columns: minmax(0, 5fr) minmax(0, 7fr)` (zone | détail), filets `.rule--hair`, aucun retour à la ligne aléatoire, **aucun décalage au survol**. Accueil : deux lignes (« Eure (27) et métropole de Rouen », « Partout en France »).
- **Vérificateur** `<mig-postcode-check>` : `.capsule` « Votre code postal » (`inputmode="numeric"`, `pattern="[0-9]{5}"`, `maxlength="5"`, `autocomplete="postal-code"`, `enterkeyhint="go"`) + bouton « Vérifier » ; résultat en `aria-live="polite"`, fondu 240 ms : préfixe 27 → `msg_eure` ; code listé → `msg_rouen` ; autre → `msg_france` ; invalide → `msg_invalid`. Sans JS : le formulaire n'est pas rendu (`<template>` activé par le script).
- Disposition `home` : axe A (texte en colonnes 1 à 5 avec zones, vérificateur et `link-arrow` ; carte en 7 à 12). Téléphone : texte, carte (280 px), zones, vérificateur, lien.
- Disposition `page` : voir §9.10.

#### 9.1.10 `faq` sur l'accueil

Réglages : `eyebrow` « Avant de commander », `heading` « Les questions <em>qu’on me pose</em> », `limit` 4, `show_categories` faux, `jsonld` faux, `show_more_link` « Toutes les questions » vers `/pages/faq`. Blocs : délais, main propre, étanchéité, lien avec Seiko (repris des réponses existantes). Voir §9.9 pour le composant.

#### 9.1.11 `testimonials`

- Masquée hors éditeur tant qu'aucun bloc n'a de citation réelle (filtre `[À COMPL` et citation vide conservé).
- Citations en Cormorant italique 400 `--t-h3`, guillemets « » suspendus (`hanging-punctuation: first`), auteur en Inter 12 px capitales `--ls-caps` `--c-stone`. Note : 5 étoiles SVG `aria-hidden` + `<span class="visually-hidden">Note : 5 sur 5</span>` (plus d'`aria-label` sur un `<p>`). Téléphone : `.rail` ; ordinateur : 3 colonnes.

#### 9.1.12 `social`

- Sans images : bande sobre centrée `.section--tight` : titre Cormorant 300 `--t-h3` « Suivez l’atelier », phrase, boutons `.btn--ghost` « Instagram » et « TikTok » (rendus seulement si `settings.social_instagram` / `social_tiktok` sont renseignés), `<span class="visually-hidden">(nouvel onglet)</span>`. Si aucun réseau n'est renseigné : rien.
- Avec images : grille 2 × 3 (téléphone) / 6 colonnes (ordinateur), `alt` propre à chaque image (réglage `alt` ajouté au bloc `post`), `href` omis s'il est vide.

### 9.2 Fiche produit (`templates/product.json`, `sections/main-product.liquid`, lot commerce)

**Template** : `["main", "related"]` — `main` = `main-product`, `related` = `featured-collection` (`empty_fallback: signatures`, `heading` « Vous aimerez aussi »). La section `related` exclut la pièce en cours.

**Produit technique** (`is-technical` = `1`) : aucun formulaire ; panneau centré sans cadre : surtitre « Atelier en ligne », H1 `--t-h1` « Cette montre se compose <em>pièce par pièce</em> », phrase, `.btn--chrome` « Créer ma montre » (`data-cta-origin="technical"`). `noindex` posé par le layout.

**Téléphone (< 900 px)**, de haut en bas :
1. Lien parent `.crumbs` (« ← Montres prêtes », 44 px).
2. **Galerie** `<mig-gallery>` : carrousel `scroll-snap` 1:1 sur halo (**plus de fond gris** : `.gallery__item` sans `background`), filigrane conservé, hauteur 62 à 70svh au plus ; compteur « 1 / 4 » en pastille `--c-glass` en bas à droite ; points `aria-current`. Toucher → plein écran (`.sheet--full`, image haute définition, `touch-action: pinch-zoom`, Fermer 44 px, filigrane). `fetchpriority="high"` et `loading="eager"` sur la première image seulement.
3. Surtitre « Pièce unique · N° 007 » (métachamp `custom.numero`, masqué si vide ; sinon titre de la collection).
4. H1 `--t-h1` (Cormorant 300).
5. Méta « Sub 40 mm · Seiko NH35 · Verre saphir » (métachamps, 13 px `--c-stone`).
6. Prix `price--lg` (22 px) + « TTC » ; si prix ≥ 300 € : « · remise en main propre offerte (Eure, Rouen) ».
7. Variantes en `.chips` (`fieldset`/`legend`, radios), libellé « Vendue » pour une variante épuisée. Quantité `.qty` masquée si le stock est ≤ 1.
8. `.btn--chrome.btn--block` « Ajouter au panier — 429 € » (`[data-add-button]`), états `is-loading` (« Ajout… ») et `is-done` (« Ajoutée »).
9. Paiement accéléré `{{ form | payment_button }}` restylé (hors couche) en ghost chromé de 52 px, ou masqué par le réglage de section `show_dynamic_checkout` (défaut vrai).
10. Engagements (lignes à filets avec icônes) : « Expédiée sous 48 h » (**seulement si disponible**, réglage `lead_ready`), « Remise en main propre · Eure et Rouen », « Colissimo suivi offert », retours (réglage `returns`, icône `return`), garantie (réglage `warranty`, **masquée si provisoire**).
11. Accordéons `.accordion--ui` : Description, Caractéristiques (`.recipe` tiré du métachamp multi-ligne « Clé : valeur », `th`/`td` remplacés par `dt`/`dd`), Livraison et remise en main propre, Garantie et entretien, Retours.
12. `.rule--hair` puis `link-arrow` « Composer une variante de cette montre » vers `/pages/configurateur?c=…` (métachamp `custom.config`, lien masqué si vide), `data-cta-origin="product"`.
13. Poinçon `.hallmark`.
14. **Barre d'achat** `.buybar` : fixe en bas (`z-index: var(--z-sticky)`), 72 px + `env(safe-area-inset-bottom)`, fond `--c-glass` + flou 16 px, `box-shadow: var(--sh-float)` ; miniature 40 px, titre Cormorant 500 17 px sur une ligne, prix 15 px, `.btn--chrome.btn--sm` « Ajouter — 429 € ». Elle apparaît (`translateY(100% → 0)`, 320 ms `--ease-out`) quand le bouton principal sort de l'écran et disparaît quand il revient (IntersectionObserver). Masquée quand un dialogue est ouvert.

**Ordinateur (≥ 900 px)** : grille de 12. Galerie éditoriale en colonnes 1 à 7 (une grande vue, deux demi-vues, une grande vue ; miniatures remplacées par des `<button aria-label="Vue 2 sur 4">` qui font défiler sans ancre ni saut). Informations en colonnes 9 à 12, `position: sticky; top: calc(var(--bar-h-min) + var(--s-6))` **seulement sous `@media (min-height: 860px)`**. Fil d'Ariane complet. Pas de barre d'achat.

**Ajout au panier** (`section-main-product.js`) : `Mig.cart.add()` → `<dialog class="sheet sheet--center">` de confirmation (miniature, titre, total, « Voir le panier » chromé, « Continuer » ghost), `Mig.announce("Ajoutée à votre panier")`, mise à jour du compteur via `mig:cart`. Erreur : message sous le bouton en `--c-error`, bouton réactivé.

**Variante** : changer de variante met à jour prix, prix barré, badge, image (défilement vers le média de la variante), disponibilité, libellé du bouton et URL (`history.replaceState`), et annonce le nouveau prix.

**Pièce vendue** : badge « Vendue », bouton remplacé par `.btn--chrome` « Créer une montre similaire » (`?c=` du métachamp, sinon `/pages/configurateur`) et `link-arrow` « Être prévenu(e) d’une pièce proche » (formulaire client, étiquette `alerte-{{ product.handle }}`).

### 9.3 Collection (`sections/main-collection.liquid`, lot commerce)

- **En-tête** : `.crumbs`, surtitre « Collection · 8 pièces » (« Collection · bientôt » si vide ; pas de nombre sur `all`), H1 `--t-h1` (titre de la collection), description en chapô 52ch ; `collection.image` en fond masqué en dégradé (`mask-image: linear-gradient(#000, transparent)`, opacité .35) si elle existe.
- **Collection vide sans filtre actif** : pas de barre d'outils ; `{% render 'empty-atelier', context: 'collection', handle: collection.handle %}`.
- **Filtres sans résultat** (`filter.active_values` non vide) : « Aucune montre avec ces filtres. » + puces des filtres actifs + « Tout effacer ».
- **Avec produits** :
  - Ordinateur : barre de 56 px, filtres et tri en `.select` de 44 px **en 16 px**, puces des filtres actifs supprimables, « Tout effacer ».
  - Téléphone : bouton `.btn--ghost.btn--sm` « Filtrer et trier (2) » qui ouvre une `.sheet--bottom` : `.chips` pour les filtres `list` et `boolean`, deux champs pour `price_range`, tri en `.chips`, puces actives, « Tout effacer », `.btn--chrome.btn--block` « Voir 8 montres ».
  - Grille : 2 colonnes (écart 16 px, rangées 40 px) < 900 px, 3 à partir de 900, 4 à partir de 1440. `.card--create` en 3e position. `<h2 class="visually-hidden">Montres</h2>`.
  - Pagination : « Voir plus de montres » (`.btn--ghost`, 52 px, chargement par Section Rendering API) ; repli sans JS : liens « Précédent / 1 2 3 / Suivant » de 44 px.
- Produits techniques exclus de la boucle. Images : les 2 premières cartes en `loading="eager"` (première rangée sur téléphone), toutes les autres en `lazy` ; aucun `fetchpriority`.
- JS `<mig-facets>` : soumission automatique, nettoyage des paramètres vides avec `Array.from(params.keys())` (corrige le bug actuel), mise à jour par Section Rendering API, `Mig.announce("8 montres")`.

### 9.4 Liste des collections (`main-list-collections`, lot commerce)

- H1 « Les <em>collections</em> ». Première tuile : `.card--create` « Créer ma montre ».
- Tuiles en grille 1 (< 600) / 2 / 3 (≥ 900) : visuel par `{% render 'family-visual', collection: c, size: 600 %}` en écrin 4:5 (**plus jamais l'illustration générique de Shopify**), titre Cormorant 500 `--t-h3`, légende « 8 pièces » ou « Bientôt · à composer dès maintenant », `link-arrow`.
- Survol (pointeur fin) : rotation de 2° du visuel, allongement de la flèche.
- Exclusion des collections `frontpage`, `all` et de toute collection dont le titre ou le handle contient `composant` ou `technique`. `sizes="(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"`.

### 9.5 Panier (`sections/main-cart.liquid`, lot commerce)

- H1 « Votre panier » + nombre d'articles (montres configurées comptées une fois).
- **Jauge** `.cart-gauge` (filet de 2 px, remplissage `--chrome`, `role="progressbar"` avec `aria-valuenow`) : « Plus que 51 € pour la remise en main propre offerte (Eure, Rouen) », puis « Remise en main propre offerte (Eure, Rouen) » avec coche. Toujours dessous : « Colissimo suivi offert partout en France ». Seuil : `settings.free_local_threshold` (300 €).
- **Ligne de montre configurée** (`_role = montre`, regroupement par `_config_id` conservé tel quel) :
  - aperçu (propriété `Aperçu`) 96 px (téléphone) / 160 px (ordinateur) en écrin ;
  - titre « Votre montre sur-mesure » qui renvoie vers la propriété « Lien de la configuration » (**jamais vers la fiche à 0 €**) ;
  - résumé en une ligne (« Sub · Météorite · Jubilé · NH35 ») ;
  - « Assemblée sous 2 à 3 semaines » (propriété `_lead` ou réglage `lead_custom`) ;
  - `<details class="accordion accordion--ui">` « Composition (7) » contenant un `.recipe` avec le prix de chaque composant (montant de chaque ligne `_role = composant`) ; fichiers envoyés (logo) en lien ;
  - **sous** le `dl` : « Modifier la composition » (`link-arrow`) et « Retirer » (bouton texte de 44 px, retrait groupé conservé) ;
  - mention : « Pièce fabriquée selon vos choix » (voir §16).
- **Montre prête** : miniature, titre vers la fiche, `.qty` (masquée si stock ≤ 1), « Retirer ».
- **Ligne de composant isolée** (cas anormal) : sans lien.
- Téléphone : grille `96px 1fr`, prix aligné à droite du titre, actions sur une ligne. **Le bug du `<dl>` (lien dans la liste) est corrigé par construction** (§6.17).
- **Récapitulatif** sans boîte ni fond (filets) : sous-total `price` `total` (28 px), remises de commande (`cart.cart_level_discount_applications`) et de ligne (`line_level_discount_allocations`) affichées, « Taxes incluses. Livraison calculée à l'étape suivante. », garantie (si renseignée et non provisoire), note pour l'atelier dans un `<details>` (« Une précision pour l’atelier ? (gravure, créneau de remise…) »), `.btn--chrome.btn--block` « Passer commande », moyens de paiement, « Paiement sécurisé ». Sur téléphone, le bouton « Passer commande » est dans une barre fixe `.buybar` (« Passer commande — 458 € ») quand le récapitulatif n'est pas à l'écran.
- **Mises à jour sans rechargement** (`<mig-cart>`) : `Mig.cart.change()` / `Mig.cart.update()` puis `Mig.sections(['main-cart'])` ; `aria-live` sur le sous-total : « Panier mis à jour : 2 articles, 707 €. » ; état de chargement sur la ligne (`opacity: .5`, `aria-busy`).
- **Panier vide** : `{% render 'empty-atelier', context: 'cart' %}` (« Votre écrin <em>est vide</em> », « Créer ma montre », lien « Voir les créations » vers `/#creations`). Le bouton « Voir les montres prêtes » n'apparaît que si `montres-pretes` contient des pièces ; il pointe vers `/collections/montres-pretes` (**jamais** vers `/collections/all`).

### 9.6 Recherche (`sections/main-search.liquid`, lot commerce)

- H1 « Rechercher » ; après recherche : « Résultats pour « sub » » (U+00A0 dans les guillemets).
- Formulaire : `.capsule` de 56 px avec bouton-icône chromé `search`, `type="search"`, `enterkeyhint="search"`, `autocomplete="off"`, champ caché `type=product,page,article`, `options[prefix]=last`.
- **Suggestions en direct** `<mig-predictive-search>` : `GET {{ routes.predictive_search_url }}?q=…&resources[type]=product,page,collection&section_id=…` ou `.json`, délai 200 ms, liste en combobox ARIA (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, `role="listbox"`, flèches et Entrée), produits techniques filtrés.
- Avant toute recherche : « Recherches fréquentes » en `.chip` : Sub · Naut · Météorite · Squelette · Jour-date · Or rose ; puis 3 `.sig-card`.
- Résultats : produits non techniques en grille de `.card` ; pages et articles en lignes éditoriales (titre Cormorant 500 `--t-h4`, extrait 2 lignes, `link-arrow`) séparées par `.rule--hair`.
- Aucun résultat : « Rien pour « x »… <em>pour l’instant</em> », phrase, puces de suggestions, `{% render 'empty-atelier', context: 'search' %}` compact (sans formulaire d'alerte).

### 9.7 Page générique (`templates/page.json`, `main-page`, lot pages)

- `main-page` : réglages `eyebrow` (text), `heading` (inline_richtext, remplace `page.title` s'il est renseigné), `lead` (text), `align` (select), `show_title` (checkbox, true), `show_content` (checkbox, true). En-tête par `page-header`.
- Contenu `.rte` en `.page-width--text` : h2 Cormorant 300 32 px, h3 Cormorant 500 24 px, paragraphes `--t-body` `--c-ink-2`, listes à tiret chromé (`li::marker { content: "— "; color: var(--c-stone); }`), liens soulignés (§6.2), `blockquote` avec filet chromé à gauche et Cormorant italique 24 px, tableaux à filets `--c-line` avec chiffres tabulaires, `hr` = `.rule`. Convient aux mentions légales et CGV.

### 9.8 L'atelier (`templates/page.atelier.json`, lot pages)

Ordre : `["main", "intro", "exploded", "process", "calibres", "proofs", "quality"]`
1. `main` (`main-page`, `show_content` faux) : surtitre « MigMods · L’atelier », H1 « Assemblée à la main, <em>pièce par pièce</em> », chapô « Un établi à Évreux, des mouvements Seiko, et le temps qu’il faut. ».
2. `intro` (`image-with-text`, `heading_tag: h2`, `text_first_mobile: true`, `show_hallmark: true`) : texte du marchand (masqué tant qu'il est provisoire ; dans ce cas la section n'affiche que le titre et le visuel).
3. `exploded` (`atelier-exploded`, nouveau, §10.3).
4. `process` (`mobile_layout: rail`, 5 étapes). Dans `page.atelier.json`, le lot pages retire la partie provisoire des étapes 3 et 4, qui gardent leur première phrase (« Contrôle sous pression avant fermeture définitive. », « Mesure au chronocomparateur puis réglage de la marche. ») ; voir §16.2.
5. `calibres` (nouveau, §10.4).
6. `proofs` (`proof-strip`, nouveau, §10.2).
7. `quality` (`rich-text`, masqué tant que son texte est provisoire).

### 9.9 FAQ (`templates/page.faq.json`, `sections/faq.liquid`, lot pages)

- Ordre : `["main", "faq"]` — `main` (`main-page`, `show_content` faux) : H1 « Questions <em>fréquentes</em> », chapô « Mouvements, étanchéité, délais, livraison : l’essentiel avant de créer votre montre. ».
- Section `faq` — schéma : `eyebrow`, `heading` (inline_richtext), `heading_tag` (select `h2` | `h1`), `lead`, `limit` (range 0–20, 0 = toutes), `show_categories` (checkbox), `jsonld` (checkbox, **faux par défaut ; vrai seulement sur `page.faq`**), `show_more_label`, `show_more_link` (url, repli `/pages/faq`), `show_end` (checkbox) ; blocs `category` (`title`) et `qa` (`question`, `answer`).
- Rendu : pastilles de catégories `.chip` (ancres, rail horizontal sur téléphone, collantes sous l'en-tête à partir de 900 px) ; `.accordion.accordion--serif` avec `name="faq"` et `id="faq-{{ block.id }}"` ; ouverture automatique de la question visée par le hash ; bouton « Copier le lien » (`.btn--icon.btn--ghost`, icône `copy`, `aria-label`, puis « Lien copié » annoncé) ; bloc final `show_end` « Vous ne trouvez pas votre réponse ? » + `.btn--ghost` « M’écrire » (`/pages/contact`) + `.btn--chrome` « Créer ma montre ».
- JSON-LD `FAQPage` : seulement si `jsonld`, sans les blocs provisoires, **omis s'il n'y a aucun bloc**.
- Catégories proposées : Mouvements · Étanchéité et entretien · Commande et délais · Livraison · Garantie et retours.

### 9.10 Livraison (`templates/page.livraison.json`, lot pages)

- Ordre : `["main", "local", "faq"]`.
- `main` (`main-page`, **`show_content` faux** : fin de la triple répétition) : H1 « Livraison et <em>remise en main propre</em> », chapô « Je livre moi-même dans l’Eure et à Rouen. Partout ailleurs, Colissimo suivi, offert. ».
- `local` (`local-delivery`, `layout: page`) :
  - trois colonnes sans cadre (≥ 900 px ; empilées sur téléphone) : « En main propre · Eure (27) », « En main propre · Rouen et métropole », « Colissimo suivi · France », chacune avec un mot chromé (« Offerte dès 300 € », « Offerte dès 300 € », « Offert ») et un détail ;
  - bande des délais (blocs `delay`) en chiffres clés avec disque de date : « 48 h » — « Montres prêtes : expédiées sous 48 h » ; « 2 à 3 sem. » — « Montres configurées : assemblage, test, réglage » ;
  - vérificateur de code postal, carte-cadran, `.btn--chrome` « Créer ma montre ».
- `faq` : 3 questions (main propre, délais, retours), `jsonld` faux.

### 9.11 Contact (`templates/page.contact.json`, `contact-form`, lot pages)

- Ordre : `["form"]` (le `main-page` est retiré ; la section porte le H1).
- `contact-form` — schéma : `heading` (inline_richtext, « Parlons de <em>votre montre</em> »), `heading_tag` (select, `h1`), `lead`, `show_channels` (checkbox), blocs `subject` (`label`, `value`).
- Ordinateur, axe A : colonnes 1 à 5 = H1, chapô, canaux directs (e-mail `settings.contact_email`, Instagram), « Réponse sous 24 à 48 h », « Atelier d’Évreux · il est <span data-clock>14:32</span> » ; colonnes 7 à 12 = formulaire.
- Formulaire : sujets en `.chips` radio (blocs), champs « Prénom et nom », « E-mail », « Téléphone (facultatif) — pour convenir d’un créneau par SMS », « Votre message » (zone qui s'agrandit) ; pré-remplissage depuis l'URL `?sujet=sur-mesure&config=…` (le lien de configuration est ajouté au message dans un champ caché `contact[Configuration]`) ; `.btn--chrome` (pleine largeur sur téléphone) « Envoyer », état « Envoi… » ; erreurs avec `aria-invalid` et `aria-describedby` ; succès (`form.posted_successfully?`) : panneau avec coche chromée « Message reçu. Je vous réponds sous 24 à 48 h. » + `link-arrow` « En attendant, créez votre montre » ; ligne RGPD « Vos coordonnées servent uniquement à vous répondre. ».
- Voix unique à la première personne (« Écrivez-moi »). Plus de doublon « Nous écrire ».

### 9.12 Blog et article — « Le journal de l'atelier » (lot pages)

- `main-blog` : H1 = titre du blog ; premier article en grand (image 16:9 rayon `--r-2`, titre `--t-h2`, extrait, date `<time datetime>`, temps de lecture = mots / 200 arrondi), puis grille 1 / 2 / 3 ; `sizes` corrects (100vw / 50vw / 33vw) ; pagination en liens de 44 px. État vide : « Le journal de l’atelier ouvre bientôt. » + `link-arrow` « Créer ma montre ».
- `main-article` : `page-header` (catégorie, H1, chapô = extrait, date et temps de lecture), image d'en-tête `fetchpriority="high"`, corps `.rte` en `.page-width--text` avec lettrine Cormorant 300 en `--chrome-text` (3 lignes, `initial-letter: 3` sous `@supports`, sinon `float`), figures pleine largeur rayon `--r-2` avec légendes 13 px, JSON-LD `BlogPosting`, article précédent / suivant, partage (Web Share API, repli « Copier le lien »), `link-arrow` final « Créer ma montre ».

### 9.13 404 (`templates/404.json`, `main-404`, lot pages)

- Centrée : `watch-dial` en mode `stopped` (280 px ; 220 px sur téléphone), aiguilles à 4 h 04, « 404 » dans le guichet de date, trotteuse qui tente un pas puis revient.
- Surtitre « Erreur 404 », H1 `--t-h1` « Cette page <em>s’est arrêtée</em> », texte, `.btn--chrome` « Créer ma montre » (principal) et `.btn--ghost` « Retour à l’accueil », `.capsule` de recherche, trois `link-arrow` (Créations signature `/#creations`, FAQ, Contact).

### 9.14 Configurateur (`templates/page.configurateur.json`, `sections/migmods-configurator.liquid`, lot outillage)

**Téléphone (< 900 px) : rien ne change dans l'application plein écran.** Seuls ajouts autorisés : masquer `.site-bg` et le contenu sous le configurateur, et la couleur du bouton.

- Ordre : `["configurator", "proofs", "faq"]` ; `proofs` (`proof-strip`) et `faq` (4 questions : délais, pièce sur-mesure, entretien, garantie si renseignée ; `jsonld` faux ; titre « Avant de créer <em>votre montre</em> ») **ne s'affichent qu'à partir de 900 px** (`body.template-page-configurateur .shopify-section:not(:first-of-type) { display: none; }` sous 900 px).
- En-tête `.site-header--compact`, sans annonce, jamais masqué (§8.2). `--header-h: 60px` (§3).
- **Squelette** `.config-skeleton` rendu côté serveur, frère de `[data-migmods-configurator]` dans `.mm-shopify`, retiré dès que l'application est montée (`.mm-shopify:has(.mm-layout) > .config-skeleton { display: none; }` + repli `animation: mig-skel-out 0s 8s forwards` qui le passe en `visibility: hidden`) :
  - ordinateur : `min-height: calc(100svh - var(--header-h))`, cercle de scène de 520 px sur halo, rail de 7 pastilles de 56 px en `--c-fill`, barre de total ;
  - téléphone : calque `position: fixed; inset: 0; z-index: 40` avec le même fond radial que l'application (aucun flash).
- Préchargements (dans la section) : `<link rel="preload" as="fetch" crossorigin href="{{ 'migmods-components.json' | asset_url }}">`, boîtier et cadran par défaut (`mm-case-sub-acier-40.png`, `mm-dial-sub-bleu-soleille.png`).
- **H1 et introduction rendus côté serveur** dans le squelette : « Créer ma montre » + « Composez votre Seiko mod pièce par pièce. Le prix suit chaque choix ; je l’assemble à Évreux sous 2 à 3 semaines. » (`visually-hidden` une fois l'application montée, pour garder un H1 dans le document). JSON-LD `Product` + `AggregateOffer` (`lowPrice` = prix d'entrée calculé, `priceCurrency: EUR`).
- **Bouton principal** : dans le `<style>` en ligne de la section, le dégradé de `.mm-shopify .mm-btn-primary` est remplacé par `var(--chrome)` (correction AA : 6,2:1 au lieu de 2,63:1), sans autre changement.
- **Garantie** : `texts.warranty` reçoit une chaîne vide si `settings.warranty` contient un marqueur provisoire (et `configurator.js` masque la ligne quand le texte est vide ou provisoire : demande au propriétaire de `configurator/`, qui est le même lot).
- `@view-transition { navigation: none; }` sur ce template ; `.scroll-line` masquée.

### 9.15 Mot de passe — pré-ouverture (`layout/password.liquid`, `templates/password.json`, lot pages)

- `layout/password.liquid` reçoit la **même tête** que `theme.liquid` (`css-variables`, `theme.css`, `theme.js`, `migmods-waves.js`, `meta-tags` avec `og:image`, `.site-bg`), titre « MigMods — Montres Seiko mod assemblées à la main à Évreux · Ouverture prochaine ».
- `password.json` : `["hero", "main"]` — `hero` = `hero-video` sans titre ni boutons (vidéo, vagues, Son, Pause : la section rend son H1 seulement si `heading` est renseigné), `main` = `main-password`.
- `main-password` : logo chromé (`context: plain`), H1 `--t-h1` « Ouverture <em>prochaine</em> », chapô, `.capsule` « Votre e-mail » + « Me prévenir » (`{% form 'customer' %}`, étiquette `prelancement`, erreurs **et** succès affichés), mention RGPD, rail de 3 `.sig-card` (sans lien vers le configurateur si la boutique est fermée : `layout: 'card'` avec `link: false`), lien Instagram, puis `<details class="password-admin">` « Accès gérant » avec chevron SVG (pas de triangle natif) contenant le formulaire de mot de passe.

### 9.16 Carte cadeau (`templates/gift_card.liquid`, lot pages)

`{% render 'css-variables' %}` + `theme.css`, `<meta name="robots" content="noindex">`. Plaque noire `--c-surface` avec liseré chromé (bord `--chrome-edge`), logo (`plain`), montant en Cormorant 300 64 px `--chrome-text` (chiffres alignés), code en Inter tabulaire avec `.btn--ghost` « Copier le code » (`navigator.clipboard`, annonce « Code copié »), QR code sur tuile blanche arrondie (`--r-2`, marge 12 px), solde et date d'expiration, bouton Wallet si disponible, `.btn--chrome` « Utiliser la carte ». Feuille d'impression : fond blanc, texte noir, sans fond animé.

---

## 10. Nouvelles sections, snippets et outils

### 10.1 Créations signature : données, rendus, prix (lot outillage + lot accueil)

**Source unique** : `migmods/configurator/signatures.json` (lot outillage) :

```json
[
  { "id": "abysse", "name": "Abysse",
    "config": "case:sub-acier-40|dial:sub-bleu-soleille|bezel_insert:sub-noir|hands:benz-acier|second_hand:benz-acier|strap:20-oyster-acier|caseback:plein",
    "legend": "Sub acier 40 mm · cadran bleu soleillé · lunette noire · Oyster acier",
    "text": "Le plongeur dans sa version la plus juste.",
    "movement": "NH35" }
]
```

**Les six créations retenues** (identifiants vérifiés dans `components.json` ; prix du catalogue au 22/10/2026, recalculés en Liquid à l'affichage) :

| N° | id | Nom | Configuration (complète : `readUrl` ne complète pas avec la composition par défaut) | Calibre | Prix |
|---|---|---|---|---|---|
| 01 | `abysse` | Abysse | `case:sub-acier-40\|dial:sub-bleu-soleille\|bezel_insert:sub-noir\|hands:benz-acier\|second_hand:benz-acier\|strap:20-oyster-acier\|caseback:plein` | NH35 | 249 € |
| 02 | `meteorite` | Météorite | `case:sub-acier-40\|dial:sub-meteorite\|bezel_insert:sub-stealth\|hands:benz-acier\|second_hand:benz-acier\|strap:20-jubilee-acier-poli\|caseback:transparent` | NH35 | 458 € |
| 03 | `lagon` | Lagon | `case:naut-acier-40-mm\|dial:baton-bleu-turquoise\|hands:naut-acier\|second_hand:naut-acier\|strap:naut-oyster-brosse\|caseback:transparent` | NH35 | 329 € |
| 04 | `nocturne` | Nocturne | `case:sub-noir-40\|dial:squelette-noir\|bezel_insert:sub-stealth\|hands:benz-full-noir\|second_hand:benz-full-noir\|strap:20-oyster-noir\|caseback:transparent` | NH72 | 318 € |
| 05 | `quantieme` | Quantième | `case:dj39-acier\|dial:day-date-disque-noir\|hands:baton-acier\|second_hand:baton-acier\|strap:dj-jubilee-acier\|caseback:plein` | NH36 | 269 € |
| 06 | `instrument` | Instrument | `case:pilot-noir-mat-pvd-38-mm\|dial:baton-noir\|hands:baton-acier\|second_hand:baton-acier\|strap:pilot-nylon-noir\|caseback:plein` | NH35 | 229 € |

- Légendes : voir §11.4. Ordre d'affichage = ordre du tableau.
- **Réserve** (si un rendu échoue au contrôle visuel) : Émeraude (`dial:sub-vert-soleille`, insert vert), Or rose (`case:sub-or-rose-40|dial:sub-or-rose|bezel_insert:ym-or-rose|hands:benz-or-rose|second_hand:benz-or-rose|strap:20-oyster-or-rose-poli|caseback:plein`, 279 €), Cœur ouvert (`case:dj39-acier|dial:oh-raye-blanc|hands:dolphin|second_hand:benz-acier|strap:dj-jubilee-acier|caseback:transparent`, 307 €, NH70), Squelette Oak (`case:oak-acier-40-mm|dial:squelette-bleu-oak|hands:naut-acier|second_hand:naut-acier|caseback:transparent`, 388 €, NH70). Les cadrans « Chiffres arabes » du catalogue portent des **chiffres arabes orientaux** : ne jamais les légender « chiffres arabes » sans le préciser.
- « Nocturne » : si les aiguilles noires sont illisibles sur le rendu, passer à `hands:benz-acier|second_hand:benz-acier` (même prix).

**Outil** `migmods/tools/render-signatures.mjs` (lot outillage), appelé par `tools/build-theme.mjs` **avant** la création du zip (option `--skip-render` pour s'en passer) :
1. Sert `theme/assets` en local et ouvre une page de rendu (Playwright, `/opt/node22/lib/node_modules/playwright`) avec `window.MIGMODS_OPTIONS = { assetBase: '/', stage: 'none', updateUrl: false, exportStage: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'], watermarkSrc: '/logo-migmods-480.png', scale: .96 }` (méthode éprouvée : `/tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/cd-chrome/sig.mjs`).
2. Pour chaque création : charge `?c=<config>`, vérifie que la sélection lue (`el._mm.sel`) contient exactement chaque `étape:id` demandé et qu'aucun `.mm-toast` d'incompatibilité n'apparaît ; **sinon l'outil s'arrête en erreur**.
3. Pour l'image seulement, `caseback:transparent` est remplacé par `caseback:plein` (l'incrustation du fond saphir chevauche sinon le filigrane). Le lien `?c=` garde la configuration réelle.
4. Exporte le PNG 1200 px (`el._mm.exportPng()`, filigrane MigMods inclus, logos des composants intacts), le convertit en WebP qualité 82 : `theme/assets/sig-<id>-800.webp` (**≤ 90 Ko**) et `sig-<id>-480.webp` (**≤ 35 Ko**). Échec si un fichier dépasse son budget.
5. Option `--layers abysse` : exporte les calques de la vue éclatée (§10.3).
6. Génère `theme/snippets/signature-list.liquid` et `theme/snippets/catalogue-facts.liquid`, en-tête `{%- comment -%} FICHIER GÉNÉRÉ par migmods/tools/render-signatures.mjs — ne pas éditer. {%- endcomment -%}`.
7. Vérifie que les identifiants de `templates/index.json` (réglages `ids`, `center`, `dials`, `fallback_signature`) existent ; avertissement sinon.
8. Écrit une planche de contrôle `migmods/tools/out/signatures-sheet.png` à valider à l'œil avant publication.

**`snippets/signature-list.liquid`** (généré) — paramètres : `layout` (`card` | `row` | `stage` | `mini`), `ids` (texte, vide = toutes), `limit` (défaut 6), `origin` (pour `data-cta-origin`), `link` (défaut vrai). Pour chaque création retenue, dans l'ordre, il appelle :

```liquid
{%- render 'signature-card', id: 'abysse', index: n, name: 'Abysse', config: '…', legend: '…', text: '…', movement: 'NH35',
     skus: 'case/sub-acier-40,dial/sub-bleu-soleille,…', prices: '249,0,0,0,0,0,0', layout: layout, origin: origin, link: link -%}
```

(`prices` = prix du catalogue de chaque composant, en euros, dans l'ordre des `skus` ; repli si la variante Shopify manque.)

**`snippets/signature-card.liquid`** (lot accueil) : rend la création selon `layout` (§6.9), lien `{{ '/pages/configurateur?c=' | append: config_encodé }}` (encodage `url_encode` de la configuration), `data-cta-origin`, images `sig-<id>-480.webp` / `-800.webp` avec `width`/`height`, `alt` = « Montre MigMods <nom> : <légende> ». **Pas de snippet `watermark`** sur ces images : le filigrane est déjà dans le rendu.

**`snippets/config-price.liquid`** (lot accueil) — même règle que le configurateur, « le prix de la variante l'emporte » :

```liquid
{%- liquid
  assign parts = all_products['composants-migmods']
  assign sku_list = skus | split: ','
  assign fb_list = prices | split: ','
  assign total = 0
  for sku in sku_list
    assign v = parts.variants | where: 'sku', sku | first
    if v
      assign total = total | plus: v.price
    else
      assign fb = fb_list[forloop.index0] | times: 100
      assign total = total | plus: fb
    endif
  endfor
  assign out = total | money_without_trailing_zeros | replace: ' €', ' €'
  echo out
-%}
```

(La seconde chaîne de `replace` contient une espace insécable U+00A0.) Mention toujours associée : « telle que présentée ». Le configurateur reste la référence du prix.

**`snippets/catalogue-facts.liquid`** (généré) — paramètre `fact` : `from_price` (minimum des variantes dont le SKU commence par `case/` ; repli = minimum du catalogue, 229 €), `dials` (82), `cases` (33), `straps` (68), `movements` (5). Sortie : texte seul (prix formaté avec U+00A0, ou nombre).

### 10.2 `sections/proof-strip.liquid` — « Engagements » (lot pages)

- Schéma : `heading` (text, défaut « Nos engagements »), `heading_visible` (checkbox, faux → `h2.visually-hidden`), blocs `proof` (limite 4 : `icon` select parmi `hand`, `drop`, `gauge`, `car`, `parcel`, `shield`, `pin` ; `title` ; `text` ; `link` url sans défaut, lien omis si vide). Preset avec 4 blocs : Assemblée à la main · Testée en étanchéité · Remise en main propre · Colissimo suivi offert (textes §11.9).
- Rendu : `.section--tight`, `ul.proofs` (§6.18). Bloc provisoire masqué hors éditeur, `.draft-badge` dans l'éditeur.

### 10.3 `sections/atelier-exploded.liquid` — « Anatomie » (lot pages, assets par le lot outillage)

- **Calques** : `render-signatures.mjs --layers abysse` exporte, sur la **même toile 800 × 800** et parfaitement alignés, chaque calque de la composition Abysse rendu seul par le moteur : `sig-layer-strap.webp`, `sig-layer-case.webp`, `sig-layer-bezel.webp`, `sig-layer-dial.webp`, `sig-layer-hands.webp`, `sig-layer-second.webp` (≤ 60 Ko chacun, logos des composants intacts). Si le moteur ne permet pas d'isoler un calque, le lot outillage le signale et la section utilise **le repli** : une seule image `sig-abysse-800.webp` avec les étiquettes en `.recipe`, sans animation.
- Schéma : `eyebrow`, `heading` (inline_richtext), `lead`, `caption` (text : ligne sur le mouvement), `button_label`, `link` (url, repli `/pages/configurateur`), blocs `layer` (`asset` text, `label` text, `detail` text, `offset` range 0–80 px). Preset de 6 blocs.
- **Ordinateur (≥ 900 px)** : section de `200vh` avec `view-timeline-name: --anatomie` ; scène collante (`position: sticky; top: calc(var(--bar-h-min) + var(--s-5))`), calques empilés en `position: absolute; inset: 0`. Au défilement (`animation-timeline: --anatomie; animation-range: contain 0% contain 100%`, sous `@supports`), chaque calque s'écarte verticalement de 0 à `±offset` (bracelet en bas, aiguilles en haut) avec `translateZ` de −40 à +40 px sous `perspective(1200px)`, puis se referme dans les 20 derniers pourcents. Étiquettes à droite (Inter 13 px `--c-ink-2`, titre en 12 px capitales `--c-stone`), reliées par un filet de 1 px `--c-line-strong`.
- **Téléphone (< 900 px)** et **sans prise en charge** : vue éclatée **statique** (écart fixe de 28 px entre calques), puis étiquettes en `.recipe`. Mouvement réduit : idem.
- Légende sous la scène : « Calibre Seiko NH35 automatique · 24 rubis · 21 600 alt/h · environ 41 h de réserve ». Fin : `.btn--chrome` « Créer ma montre » (`data-cta-origin="atelier"`).

### 10.4 `sections/calibres.liquid` — « Cinq calibres Seiko » (lot pages)

- Schéma : `eyebrow`, `heading` (inline_richtext, « Cinq calibres <em>Seiko</em> »), `common` (text), blocs `calibre` (`ref`, `function`, `note`). Preset de 5 blocs, textes tirés de `components.json` (`movements`) et de la FAQ :
  - NH35 — automatique, date ; NH36 — automatique, jour et date ; NH34 — automatique, GMT ; NH70 — automatique, squelette ou cœur ouvert ; NH72 — automatique, squelette noir.
- Rendu : liste à filets, référence en Cormorant 300 `--t-h3` chiffres alignés, fonction en Inter 15 px, note 13 px `--c-stone`. Ligne commune `common` (« 24 rubis · 21 600 alternances par heure · environ 41 h de réserve de marche ») au-dessus, en `.pill-note`.

### 10.5 Snippets transverses

| Snippet | Lot | Rôle et paramètres |
|---|---|---|
| `css-variables` | socle | tokens et polices (§3) |
| `section-head` | socle | en-tête de section (§6.4) : `eyebrow`, `title`, `lead`, `link_label`, `link_url`, `tag`, `align`, `origin`, `id` |
| `typo-fr` | socle | `text` → texte corrigé (§4.4) |
| `watch-dial` | socle | cadran SVG (§6.21) : `mode`, `time`, `date`, `size`, `dial` |
| `hallmark` | socle | poinçon (§6.20) |
| `family-visual` | socle | `collection`, `size` → `collection.image`, sinon première image produit, sinon boîtier de famille trouvé dans le handle : `sub` → `mm-case-sub-acier-40.png`, `naut` → `mm-case-naut-acier-40-mm.png`, `oak` → `mm-case-oak-acier-40-mm.png`, `dj` → `mm-case-dj39-acier.png`, `pilot` → `mm-case-pilot-acier-316l-38-mm.png`, `explorer` → `mm-case-explorer-acier-39-mm.png` ; sinon `sig-abysse-480.webp`. Toujours en écrin, `loading="lazy"` |
| `jsonld-site` | socle | §15.2 |
| `logo` | socle | §8.7 |
| `icon` | socle | §6.25 |
| `meta-tags` | socle | §15.1 |
| `page-header` | pages | §6.24 |
| `is-technical` | commerce | sortie `1` si `product.handle` vaut `montre-sur-mesure-migmods` ou `composants-migmods`, ou `product.type` vaut `Montre sur-mesure` ou `Composant`, ou étiquette `configurateur` ou `masque`, ou `product.id == settings.custom_watch_product.id` ; sinon rien |
| `empty-atelier` | commerce | §6.23 |
| `product-card`, `price`, `watermark`, `cart-count` | commerce | §6.8, §6.19 ; `watermark` : chaque type de `watermark_tags` est nettoyé (`strip`) après le découpage, taille et opacité lues depuis `--wm-size` / `--wm-opacity` |
| `signature-card`, `config-price` | accueil | §10.1 |
| `signature-list`, `catalogue-facts` | outillage (générés) | §10.1 |

### 10.6 Réglages du thème ajoutés (`config/settings_schema.json`, lot socle)

| Groupe | id | Type | Défaut |
|---|---|---|---|
| Couleurs | `color_stone` | color | **`#9CA0A7`** (modifié) |
| Atelier et contact | `atelier_city` | text | « Évreux, Normandie » |
| Atelier et contact | `contact_email` | text | (vide) |
| Livraison | `free_local_threshold` | range 100–600, pas 10, unité € | 300 |
| Livraison | `hand_delivery_codes` | textarea | `27*` puis la liste 76 de `shopify-setup/livraison-codes-postaux.md` (une ligne par code) — lu par `local-delivery` quand son propre réglage `codes` est vide |
| Mouvement | `motion_bg` | checkbox | vrai (fond animé ; faux = fond figé) |

Réglages supprimés : `wordmark` (en-tête, pied de page), `logo` et `logo_width` de l'en-tête (remplacés par `settings.brand_logo`), `dark` de `marquee` (section supprimée).

### 10.7 Outils et assets générés (lot outillage)

| Outil | Produit | Budget |
|---|---|---|
| `tools/patch-fonts.py` | `cormorant-garamond-300.woff2`, `-500.woff2`, `-400-italic.woff2` | ≈ 22–24 Ko chacun |
| `tools/render-signatures.mjs` | `sig-<id>-800.webp`, `sig-<id>-480.webp`, `sig-layer-*.webp`, `snippets/signature-list.liquid`, `snippets/catalogue-facts.liquid` | 90 / 35 / 60 Ko |
| `tools/make-brand-assets.py` (Pillow) | `logo-migmods-320.webp` (≤ 30 Ko), `logo-migmods-640.webp` (≤ 80 Ko), `logo-migmods-1100.webp` (≤ 200 Ko), `migmods-og.jpg` (1200 × 630, logo chromé sur noir avec vagues douces, ≤ 150 Ko), `apple-touch-icon.png` (180 px, ≤ 20 Ko), `favicon-32.png` (≤ 5 Ko), `migmods-glow.webp` (256 × 256, dégradé conique actuel flouté, ≤ 6 Ko), `migmods-grain.png` (64 × 64, ≤ 3 Ko), `migmods-hero-poster-land.jpg` (1600 × 900, image extraite de la vidéo, ≤ 150 Ko) | **aucun fichier ajouté au-delà de 300 Ko** |

- Préfixes autorisés pour les fichiers générés : `sig-`, `logo-migmods-`, `migmods-`, `cormorant-garamond-`, `apple-touch-icon`, `favicon-`. **Jamais `mm-`** : `build-theme.mjs` supprime tous les `assets/mm-*` à chaque build.
- Chaque outil échoue (code de sortie non nul) si un budget est dépassé.

---

## 11. Textes clés

Vouvoiement ; l'artisan dit « je » ; U+00A0 avant « : ; ? ! », dans « 300 € », « 48 h », « 21 600 » ; apostrophe ’ ; un seul verbe d'action : **« Créer ma montre »**. Verbes secondaires figés : « Personnaliser celle-ci » (création), « Modifier la composition » (panier), « Voir les créations ».

### 11.1 Annonce (3 blocs)

| Texte | Version courte (< 430 px) |
|---|---|
| Remise en main propre offerte dès 300 € · Eure et Rouen | Main propre offerte dès 300 € |
| Colissimo suivi offert partout en France | Colissimo suivi offert |
| Assemblées à la main à Évreux | Assemblées à la main à Évreux |

### 11.2 En-tête, menus

- Navigation : Montres prêtes · Collections · L’atelier · FAQ. Bouton : « Créer ma montre ».
- Menu mobile, en plus : Livraison · Contact · Mon compte · champ « Rechercher une montre » · « Fermer le menu » · pastilles « Main propre · Eure et Rouen » et « Colissimo suivi offert » · « Atelier d’Évreux · 14:32 ».
- Méga-menu : surtitre « Configurateur », titre « Créez <em>la vôtre</em> », texte « Plus de 80 cadrans, 33 boîtiers. Le prix suit chaque choix. », « dès 229 € », lien « Créer ma montre » ; collection vide : « Bientôt ».

### 11.3 Héros

- Surtitre (dans le H1) : « Seiko mods assemblées à la main à Évreux » (court : « Assemblées à la main à Évreux »).
- H1 : « La montre que <em>personne d’autre</em> ne porte ».
- Boutons : « Créer ma montre » · « Montres prêtes à porter » (avec stock) ou « Voir les créations » (sans stock).
- Preuve : « Dès 229 € · prix affiché à chaque choix ».
- Commandes : « Son », « Pause » (libellés fixes) ; indicateur : « Découvrir ».

### 11.4 Réglette et créations

- Réglette : « Verre saphir · Mouvements Seiko automatiques · Testée en étanchéité · Réglée au chronocomparateur · Assemblée à Évreux ».
- Surtitre « Créations signature » ; H2 « Six montres pour commencer. <em>La vôtre</em> ensuite. » ; chapô « Chaque création s’ouvre dans le configurateur, déjà composée. Gardez-la telle quelle ou changez une pièce : le prix suit en direct. »
- Bouton « Personnaliser celle-ci » ; lien « Partir de zéro » ; note « Prix de la composition présentée · assemblée sous 2 à 3 semaines ».

| Nom | Légende | Phrase |
|---|---|---|
| Abysse | Sub acier 40 mm · cadran bleu soleillé · lunette noire · Oyster acier | Le plongeur dans sa version la plus juste. |
| Météorite | Sub acier 40 mm · cadran météorite · lunette Stealth · Jubilé poli · fond transparent | Le cadran le plus minéral de l’atelier. |
| Lagon | Naut acier 40 mm · cadran bleu turquoise · Oyster brossé · fond transparent | L’été, toute l’année. |
| Nocturne | Sub noir 40 mm · cadran squelette noir · lunette Stealth · Oyster noir · calibre NH72 | Tout en noir, la mécanique à nu. |
| Quantième | DJ acier 39 mm · jour et date au cadran · aiguilles bâton · Jubilé acier · calibre NH36 | Le jour et la date, d’un coup d’œil. |
| Instrument | Pilot noir mat 38 mm · cadran noir à index bâtons · aiguilles bâton · nylon noir | La lisibilité d’un instrument de bord. |

### 11.5 Configurateur (section d'accueil)

- Surtitre « Le configurateur » ; titre « Plus de 80 cadrans. » / « Une seule montre : <em>la vôtre.</em> »
- Texte : « Boîtier, cadran, lunette, aiguilles, bracelet : vous composez, j’assemble. Le prix s’affiche à chaque pièce, sans surprise. Comptez 2 à 3 semaines. »
- Faits : « 82 cadrans · 33 boîtiers · 68 bracelets · 5 calibres Seiko » (générés) ; bouton « Créer ma montre » ; mention « dès 229 € ».

### 11.6 De la commande à votre poignet (accueil)

- Surtitre « La méthode » ; H2 « De la commande <em>à votre poignet</em> ».
- 01 Vous composez — « En ligne, pièce par pièce. Le prix suit chaque choix. »
- 02 J’assemble à Évreux — « Cadran, aiguilles, emboîtage, lunette, bracelet. Comptez 2 à 3 semaines. »
- 03 Je contrôle — « Test d’étanchéité avant fermeture, réglage au chronocomparateur. »
- 04 Je vous la remets — « En main propre dans l’Eure et à Rouen, ou en Colissimo suivi partout en France. »
- Lien « Voir l’atelier en détail ».

### 11.7 Chiffres clés

Titre « Ce que vous portez <em>au poignet</em> » ; les quatre blocs actuels conservés mot pour mot (9 Mohs ; 41 h ; 200 m « Sur les boîtiers Sub. Contrôlée avant chaque envoi. » ; 21 600 alt/h).

### 11.8 L'atelier (accueil)

- Surtitre « L’atelier » ; H2 « Assemblée à la main, <em>pièce par pièce</em> ».
- Texte : « Chaque montre passe entre mes mains : contrôle des pièces à réception, assemblage, test d’étanchéité, réglage. Pas de chaîne de montage : une montre, un établi, le temps qu’il faut. »
- Engagements : « Assemblée à la main » · « Testée en étanchéité » · « Réglée au chronocomparateur ».
- Signature « — L’atelier MigMods, Évreux » ; lien « Découvrir l’atelier ».

### 11.9 Livraison et engagements

- Surtitre « Remise en main propre » ; H2 « Je vous la remets <em>en main propre</em> ».
- Texte : « Dans l’Eure et la métropole de Rouen, j’apporte la montre moi-même et je règle le bracelet à votre poignet. Partout ailleurs, elle part en Colissimo suivi, contre signature et assurée. »
- Zones : « Eure (27) et métropole de Rouen » — « En main propre · bracelet réglé sur place · offerte dès 300 € » ; « Partout en France » — « Colissimo suivi, contre signature, assuré · offert ».
- Vérificateur : libellé « Votre code postal », exemple « 27000 », bouton « Vérifier ».
  - Eure : « Je viens jusqu’à vous : remise en main propre, offerte dès 300 €. Je vous écris pour convenir d’un créneau. »
  - Rouen : « Votre commune fait partie de ma tournée rouennaise : remise en main propre, offerte dès 300 €. Je vous confirme le créneau après la commande. »
  - France : « Elle vous sera envoyée en Colissimo suivi, contre signature et assurée. Livraison offerte. »
  - Invalide : « Saisissez les 5 chiffres de votre code postal. »
- Lien « Tout sur la livraison ».
- Engagements (`proof-strip`) : **Assemblée à la main** — « À mon établi d’Évreux, pièce par pièce. » ; **Testée en étanchéité** — « Chaque montre est contrôlée avant de partir. » ; **Remise en main propre** — « Dans l’Eure et à Rouen, offerte dès 300 €. » ; **Colissimo suivi offert** — « Partout en France, contre signature et assuré. »

### 11.10 FAQ (accueil et page)

- Accueil : surtitre « Avant de commander », H2 « Les questions <em>qu’on me pose</em> », lien « Toutes les questions ».
- Page : H1 « Questions <em>fréquentes</em> », chapô « Mouvements, étanchéité, délais, livraison : l’essentiel avant de créer votre montre. », fin « Vous ne trouvez pas votre réponse ? » / « Écrivez-moi, je réponds sous 24 à 48 h. » / « M’écrire » / « Créer ma montre », partage « Copier le lien » → « Lien copié ».

### 11.11 Réseaux, avis, pied de page

- Réseaux : « Suivez l’atelier » · « Les montres en cours d’assemblage, chaque semaine. » · « Instagram » · « TikTok ».
- Avis (avec du vrai contenu seulement) : surtitre « Ils la portent ».
- Bande : « Une montre se choisit. <em>La vôtre se compose.</em> » · « Créer ma montre ».
- Lettre : surtitre « La lettre de l’atelier », titre « Les nouvelles pièces, <em>une fois par mois</em> », texte « Séries limitées et nouveaux cadrans. Un e-mail par mois, rien d’autre. », champ « Votre adresse e-mail », bouton « M’inscrire », RGPD « Désinscription en un clic. Votre adresse n’est jamais partagée. », succès « Bienvenue à l’atelier. ».
- Atelier : « L’atelier » · « Évreux, Normandie » · « Il est 14:32 à l’atelier ».
- Bas : « © 2026 MigMods · Montres Seiko mod assemblées à la main à Évreux » ; non-affiliation : « MigMods n’est pas affilié à Seiko. Les montres sont assemblées avec des mouvements Seiko et des composants aftermarket. »

### 11.12 Commerce

- Fiche : « Ajouter au panier — 429 € » → « Ajout… » → « Ajoutée » ; dialogue « Ajoutée à votre panier » · « Voir le panier » · « Continuer » ; prix « 429 € TTC · remise en main propre offerte (Eure, Rouen) » ; accordéons « Description » · « Caractéristiques » · « Livraison et remise en main propre » · « Garantie et entretien » · « Retours » ; « Composer une variante de cette montre » ; vendue : « Vendue » · « Créer une montre similaire » · « Être prévenu(e) d’une pièce proche » ; produit technique : « Atelier en ligne » · « Cette montre se compose <em>pièce par pièce</em> » · « Choisissez boîtier, cadran, lunette, aiguilles et bracelet : le prix s’affiche à chaque choix. » · « Créer ma montre » ; barre fixe « Ajouter — 429 € ».
- Collection : « Collection · 8 pièces » / « Collection · bientôt » ; vide : surtitre « {{ collection.title }} · à l’établi », titre « Les premières pièces sont <em>à l’établi</em> », texte « Cette série se prépare à l’atelier d’Évreux. En attendant, créez la vôtre : elle sera assemblée sous 2 à 3 semaines. », « Créer ma montre », « Être prévenu(e) », succès « C’est noté : je vous écris dès qu’une pièce est prête. » ; filtres : « Filtrer et trier » · « Tout effacer » · « Voir 8 montres » · « Aucune montre avec ces filtres. » ; pagination « Voir plus de montres » ; tuile « Créer la vôtre ».
- Liste des collections : H1 « Les <em>collections</em> » ; « 8 pièces » ou « Bientôt · à composer dès maintenant ».
- Panier : H1 « Votre panier » ; jauge « Plus que 51 € pour la remise en main propre offerte (Eure, Rouen) » → « Remise en main propre offerte (Eure, Rouen) » ; « Colissimo suivi offert partout en France » ; ligne « Votre montre sur-mesure » · « Assemblée sous 2 à 3 semaines » · « Composition (7) » · « Modifier la composition » · « Retirer » · « Pièce fabriquée selon vos choix » ; récapitulatif « Sous-total » · « Taxes incluses. Livraison calculée à l’étape suivante. » · « Passer commande » · « Paiement sécurisé » ; annonce « Panier mis à jour : 2 articles, 707 €. » ; vide : surtitre « Panier », titre « Votre écrin <em>est vide</em> », texte « Une MigMods commence par un boîtier. Il y en a 33 au configurateur. », « Créer ma montre », « Voir les créations ».
- Recherche : H1 « Rechercher » / « Résultats pour « sub » » ; champ « Un modèle, un cadran, une question… » ; « Recherches fréquentes » ; aucun résultat : « Rien pour « x »… <em>pour l’instant</em> » + « Les montres prêtes arrivent au compte-gouttes, mais toutes les combinaisons existent déjà dans le configurateur. ».

### 11.13 Pages

- Atelier : surtitre « MigMods · L’atelier », H1 « Assemblée à la main, <em>pièce par pièce</em> », chapô « Un établi à Évreux, des mouvements Seiko, et le temps qu’il faut. » ; anatomie : surtitre « Anatomie », H2 « Six pièces, <em>une montre</em> » ; calibres : H2 « Cinq calibres <em>Seiko</em> ».
- Livraison : H1 « Livraison et <em>remise en main propre</em> », chapô « Je livre moi-même dans l’Eure et à Rouen. Partout ailleurs, Colissimo suivi, offert. » ; délais « 48 h » — « Montres prêtes : expédiées sous 48 h » ; « 2 à 3 sem. » — « Montres configurées : assemblage, test, réglage ».
- Contact : H1 « Parlons de <em>votre montre</em> » ; chapô « Une question sur un cadran, une compatibilité, un créneau de remise ? Je vous réponds personnellement sous 24 à 48 h. » ; sujets « Une montre sur-mesure » · « Une montre prête » · « Ma commande » · « Remise en main propre » · « Autre chose » ; champs « Prénom et nom » · « E-mail » · « Téléphone (facultatif) » · « Votre message » ; « Envoyer » → « Envoi… » ; succès « Message reçu. Je vous réponds sous 24 à 48 h. » + « En attendant, créez votre montre » ; RGPD « Vos coordonnées servent uniquement à vous répondre. ».
- 404 : surtitre « Erreur 404 », H1 « Cette page <em>s’est arrêtée</em> », texte « Même les meilleurs mouvements ont besoin d’être remontés. Repartons d’un bon point de départ. », « Créer ma montre », « Retour à l’accueil ».
- Configurateur (rendu serveur) : H1 « Créer ma montre », introduction « Composez votre Seiko mod pièce par pièce. Le prix suit chaque choix ; je l’assemble à Évreux sous 2 à 3 semaines. » ; sous l'application : « Avant de créer <em>votre montre</em> ».
- Mot de passe : H1 « Ouverture <em>prochaine</em> », chapô « Les premières MigMods sont à l’établi. Laissez votre e-mail : vous serez prévenu(e) le jour de l’ouverture. », « Me prévenir », « Accès gérant ».

### 11.14 Messages d'erreur

« Ce champ est nécessaire. » · « Adresse e-mail incomplète : il manque le @ ou le domaine. » · « Impossible d’ajouter cette montre pour le moment. Réessayez dans un instant. » · « Une erreur est survenue. Rechargez la page ou écrivez-moi. »

### 11.15 Référencement (à saisir dans l'admin Shopify : Préférences et SEO de chaque page)

- Accueil : titre « MigMods — Montres Seiko mod sur-mesure, assemblées à la main à Évreux » ; description « Composez votre Seiko mod en ligne : 82 cadrans, 33 boîtiers, calibres Seiko NH35 à NH72. Assemblée à la main à Évreux, remise en main propre dans l’Eure et à Rouen. »
- Configurateur : « Créer ma montre — configurateur Seiko mod | MigMods » / « 33 boîtiers, 82 cadrans, mouvements Seiko NH35 à NH72 : composez votre montre, le prix suit chaque choix. Assemblée sous 2 à 3 semaines. »
- Atelier : « L’atelier MigMods à Évreux — assemblage, étanchéité, réglage ». Livraison : « Livraison en main propre dans l’Eure et à Rouen | MigMods ».
- `og:image:alt` de repli : « Logo chromé MigMods sur fond noir ».

---

## 12. Téléphone et iOS (priorité iPhone)

Appareils de référence : **iPhone 15 Pro** (393 × 852, 659 px visibles dans Safari), **iPhone SE** (375 × 667), **iPhone 15 Pro Max** (430 × 932), iPhone en **paysage** (852 × 393, environ 343 px utiles), iPad portrait (820 × 1180).

1. **Aucun débordement horizontal**, mesuré contre `visualViewport.width` (393), pas contre `innerWidth` (qui grandit quand le contenu déborde). Rails et objets débordants sont contenus par `overflow: clip` sur leur parent.
2. **Champs en 16 px minimum** (newsletter, recherche, filtres, code postal, quantité, formulaires) : sinon Safari zoome.
3. **Cibles tactiles ≥ 44 × 44 px** (burger, icônes, liens du pied de page avec `padding-block: 12px`, « Retirer », pagination, puces, commandes vidéo, lien d'annonce par zone étendue). Écart ≥ 8 px entre deux cibles.
4. **Zones de sécurité** : `viewport-fit=cover` impose `env(safe-area-inset-*)` sur `.page-width` (gauche/droite), le menu mobile (haut/bas), les feuilles et barres fixes (bas), le contenu du héros (bas), les commandes du héros en paysage (droite).
5. **Hauteurs** : `100svh` pour le héros, `100dvh` / `88dvh` pour les feuilles, jamais `100vh` seul (sauf repli déclaré avant).
6. **`position: sticky`** ne fonctionne pas sous un parent en `overflow: hidden` : utiliser `overflow: clip`.
7. **Survols** sous `@media (hover: hover) and (pointer: fine)` uniquement (sinon l'état reste collé après un toucher). `-webkit-tap-highlight-color: transparent` sur les éléments interactifs, compensé par l'état `:active`.
8. **Texte chromé** : jamais de `transform` / `will-change` / `filter` sur l'élément en `background-clip: text` (bug WebKit, le texte disparaît).
9. **Vidéo** : `muted playsinline` obligatoires ; lecture refusée en mode économie d'énergie → bouton Lecture visible (§7.8).
10. **bfcache** : sur `pageshow` avec `event.persisted`, fermer le menu et les feuilles, retirer `html.has-dialog`, rafraîchir le compteur du panier (`Mig.cart.get()`).
11. **Défilement bloqué** quand un dialogue est ouvert : `html.has-dialog { overflow: hidden; }` + `overscroll-behavior: contain` dans la feuille.
12. **`backdrop-filter`** toujours avec le préfixe `-webkit-` et un repli opaque hors `@supports`.
13. **Barre d'adresse** : aucune mise en page ne dépend du `resize` vertical ; les vagues ignorent les redimensionnements de moins de 2 px en largeur.
14. **Paysage** : héros en deux colonnes, annonce masquée, en-tête à 60 px, commandes vidéo hors de l'encoche.
15. **Longueur** : chaque section ≤ 1,5 écran ; accueil ≤ 13 écrans (iPhone 15 Pro).
16. **Configurateur** : sous 900 px, l'application est plein écran (`.mm-layout`, fixe, z-index 40). Rien du thème ne s'y superpose : en-tête, annonce, pied de page, `.scroll-line` masqués par le `<style>` de la section, `.site-bg` masqué par `section-migmods-configurator.css`, aucune barre fixe, aucune transition de page. Contrôle par capture à chaque lot.

---

## 13. Accessibilité (WCAG 2.2 AA)

1. **Contrastes** (vérifiés, pire cas sur le fond animé `#2B2B2B`) : `--c-ink` 12,9:1, `--c-ink-2` 8,9:1, `--c-stone` 5,4:1, texte chromé ≥ 5,6:1, libellé de bouton chromé ≥ 6,2:1, bord de champ 4,5:1. `--c-faint` (2,9:1 au pire) est **réservé au décor**. Aucun texte sous 12 px (exception : pastille du panier, doublée par l'`aria-label`, et texte décoratif du poinçon en `aria-hidden`).
2. **Texte sur la vidéo** : voile radial sous le bloc texte (§9.1.1), surtitre en `--c-ink-2`. Contrôle par échantillonnage de pixels sur les captures : ≥ 4,5:1 sous le surtitre et les liens, ≥ 3:1 sous le H1.
3. **Mouvement** : bouton Pause visible pour tout contenu animé de plus de 5 s (vidéo, vagues, fond, scène des créations) — WCAG 2.2.2 ; `prefers-reduced-motion` intégralement respecté (§7.12).
4. **Structure** : un seul `h1` par page (l'accueil : dans le héros ; l'atelier et la FAQ : dans `page-header` ; le contact : dans `contact-form` ; le configurateur : rendu côté serveur) ; titres sans saut de niveau (une grille de cartes `h3` est précédée d'un `h2`, au besoin masqué) ; landmarks `header`, `nav` (étiquetées : « Navigation principale », « Fil d'Ariane », « Pied de page »), `main`, `footer` ; sections avec `aria-labelledby`.
5. **Focus** : toujours visible (`var(--ring)` ou `outline: 2px solid var(--c-focus); outline-offset: 3px`), jamais supprimé ; ordre logique ; lien d'évitement ; `main tabindex="-1"`.
6. **Dialogues** : `<dialog>` + `showModal()` (focus retenu, fond inerte, Échap), focus rendu au déclencheur, titre via `aria-labelledby`.
7. **Boutons bascule** : libellé fixe + `aria-pressed` (Son, Pause). Jamais un libellé qui change **et** `aria-pressed`.
8. **ARIA** : pas d'`aria-label` sur un élément générique (`div`, `p`, `span`) ; le texte de remplacement passe par `.visually-hidden`. Liens d'icônes : `aria-label`. Nouvel onglet signalé « (nouvel onglet) ».
9. **Annonces** : `Mig.announce()` pour l'ajout au panier, la mise à jour du panier, le nombre de résultats de filtres, « Lien copié », « Code copié ». Erreurs de formulaire : `aria-invalid` + `aria-describedby` ; succès en `role="status"`.
10. **Valeurs animées** (disque de date) : partie animée `aria-hidden`, valeur finale en texte.
11. **Images** : `alt` utile pour toute photo ou rendu de montre (nom + légende) ; `alt=""` pour le décor (vignettes de la roue, halos, carte-cadran, poinçon) ; jamais d'`alt` identique répété sur une série.
12. **Combobox de recherche** : `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, navigation aux flèches.
13. **Rails** : piste focalisable (`tabindex="0"`) avec `aria-label`, compteur en `aria-hidden` (doublon visuel).
14. **Langue** : `<html lang="fr">` ; termes étrangers éventuels avec `lang="en"`.

---

## 14. Performance

### 14.1 Budgets (iPhone, 4G simulée, mesurés avec Playwright en profil iPhone 15 Pro)

| Mesure | Cible |
|---|---|
| LCP mobile | < 2,0 s (accueil : poster du héros ; ailleurs : H1 ou première image produit) |
| CLS | < 0,05 sur toutes les pages, **configurateur compris** (squelette) |
| INP | < 200 ms |
| Poids de l'accueil hors vidéo | ≤ 1,2 Mo |
| Poids d'une page de contenu | ≤ 450 Ko |
| Configurateur au démarrage (téléphone) | objectif ≤ 2 Mo (dépend de la demande §18.2) |
| `theme.js` | ≤ 14 Ko compressé |
| `theme.css` | ≤ 16 Ko compressé ; chaque `section-*.css` ≤ 4 Ko compressé |
| Image ajoutée | ≤ 300 Ko (absolu) ; budgets par fichier au §10.7 |

### 14.2 Règles

1. Polices : 2 préchargées (Cormorant 300, Inter) ; `font-display: swap`.
2. Images : `width`/`height`, `srcset` + `sizes` justes, `loading="lazy"` sous la ligne de flottaison, `decoding="async"` sur les grandes images différées, `fetchpriority="high"` uniquement sur l'élément LCP, WebP pour tout fichier généré.
3. Logos : jamais `logo-migmods.png` (609 Ko) dans une page ; en-tête en WebP 320/640 ; grand logo en 640/1100 avec `sizes` corrigé et `fetchpriority="low"`.
4. Pas de `will-change` permanent (exception : `.site-bg::before`), pas de `filter` animé, `backdrop-filter` limité aux cinq usages du §7.13.
5. `content-visibility: auto; contain-intrinsic-size: auto 800px;` sur les sections à partir du troisième écran de l'accueil (`.section--deferred`), **jamais** sur une section qui porte une ancre ciblée (`#creations`) ni sur le pied de page.
6. JavaScript en `defer`, aucune bibliothèque, écouteurs passifs, IntersectionObserver plutôt que `scroll`, rAF pour toute écriture de style, aucune écriture sur `:root` au défilement.
7. `migmods-waves.js` chargé uniquement sur l'accueil et la page mot de passe. Les scripts de section ne sont chargés que par leur section.
8. Vidéo : `preload="metadata"` (accueil), `preload="none"` sous Save-Data ou mouvement réduit. Ne jamais précharger deux vidéos.
9. Préchargements du configurateur : JSON des composants + boîtier et cadran par défaut, uniquement sur `page.configurateur`.

---

## 15. SEO et partage

### 15.1 `snippets/meta-tags.liquid` (lot socle)

- `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale` (`fr_FR`).
- `og:image` en **https** avec `og:image:width`, `og:image:height`, `og:image:alt` ; **repli** : `migmods-og.jpg` (1200 × 630) quand `page_image` est vide ; `twitter:card = summary_large_image` + `twitter:image`.
- `og:price:amount` avec **point décimal** (`{{ product.price | divided_by: 100.0 }}` formaté sans virgule) et `og:price:currency`.
- Fonctionne aussi dans les snippets rendus par `render` (le simulateur ne transmet pas `shop` ni `settings` : limite connue, annexe A).

### 15.2 Données structurées

| Où | Type | Contenu |
|---|---|---|
| Toutes les pages (`jsonld-site`) | `Organization` | `name` MigMods, `url`, `logo` (`logo-migmods-640.webp` en URL absolue), `sameAs` (réglages `social_*` non vides) |
| Accueil (`jsonld-site`) | `WebSite` + `SearchAction` | `target` = `{{ shop.url }}/search?q={search_term_string}` |
| Accueil (`jsonld-site`) | `Store` | `name`, `url`, `image`, `address` : `addressLocality` « Évreux », `postalCode` « 27000 », `addressRegion` « Normandie », `addressCountry` « FR » (**aucune rue inventée**), `areaServed` : « Eure », « Métropole Rouen Normandie », « France », `email` si `settings.contact_email` |
| Fiche produit | `Product` (`structured_data`) + `BreadcrumbList` | fil d'Ariane ; jamais sur un produit technique |
| Collection | `BreadcrumbList` | — |
| FAQ (`jsonld` vrai) | `FAQPage` | sans blocs provisoires ; omis si vide |
| Configurateur | `Product` + `AggregateOffer` | `name` « Montre sur-mesure MigMods », `lowPrice` = prix d'entrée calculé, `priceCurrency` EUR, `offerCount` = nombre de boîtiers |
| Article | `BlogPosting` | titre, date, image, auteur « MigMods » |

### 15.3 Indexation

- `noindex,nofollow` sur les produits techniques (layout) et la carte cadeau ; demande d'admin : `seo.hidden = 1` sur les deux produits techniques (§18).
- Un seul `h1` porteur de mots-clés par page (accueil : « Seiko mods assemblées à la main à Évreux » dans le H1).
- `title` : la mention « – page n » n'apparaît que si `current_page > 1`.
- Favicon et `apple-touch-icon` par défaut (§10.7). `X-UA-Compatible` retiré.

---

## 16. Contenu, prix, marques, juridique

### 16.1 Rien de faux

- Aucun faux avis, faux stock, faux compteur, faux « plus que 2 en stock ».
- Prix : jamais saisis dans le Liquid ou les textes ; toujours calculés (variantes Shopify, repli catalogue) et présentés comme « telle que présentée » pour une création. Si le calcul est impossible : « Prix au configurateur ».
- Chiffres du catalogue (82 cadrans, 33 boîtiers…) : générés par `catalogue-facts` ; « Plus de 80 cadrans » est la seule formulation arrondie admise.
- Promesses **interdites sans validation du client** : durée de garantie, pression de test, tolérance de marche visée, « véritable météorite », « acier 316L » pour tous les boîtiers, « 200 m » ailleurs que sur les boîtiers Sub, « Lume BGW9 » en général.

### 16.2 Textes provisoires

- Garde-fou commun (§2.4) sur : `settings.warranty` (fiche, panier, configurateur), FAQ q4 et q5, étapes du process, intro de l'atelier, contrôle qualité, avis, et dans tout JSON-LD.
- Contenus des templates (lot pages) : quand seule une partie d'un texte est provisoire, on retire la partie entre crochets et on garde la phrase valide :
  - étape 3 → « Contrôle sous pression avant fermeture définitive. » ;
  - étape 4 → « Mesure au chronocomparateur puis réglage de la marche. » ;
  - FAQ q4 → « La spécification Seiko pour ces calibres est de −20 à +40 secondes par jour. Chaque montre est réglée au chronocomparateur à l’atelier. » ;
  - contrôle qualité → « Chaque montre est assemblée à la main, testée en étanchéité et réglée au chronocomparateur avant de partir. » ;
  - intro de l'atelier → texte du §11.8 (composé uniquement d'affirmations déjà présentes dans le contenu du client), **à faire valider** (signalé dans `shopify-setup/GUIDE-INSTALLATION.md`).
- Quand tout le texte est provisoire (FAQ q5 « garantie », réglage `warranty`) : masqué jusqu'à ce que le client le complète.
- Dans l'éditeur de thème, un `.draft-badge` « À compléter » signale ce qui reste à écrire.

### 16.3 Marques

- Aucun nom de marque horlogère tierce dans les textes visibles ni dans les noms de créations (pas de Pepsi, Batman, Root Beer, Starbucks, Submariner, Nautilus, Royal Oak, Day-Date, Explorer en nom de création). Les abréviations de familles du catalogue (Sub, Naut, Oak, DJ, Pilot) restent autorisées dans les légendes techniques. Les identifiants internes (`gmt-pepsi`, `vert-starbucks`…) ne sont jamais affichés.
- Mention de non-affiliation à Seiko dans le pied de page et la FAQ.
- Les logos et marques présents sur les photos et rendus de composants **ne sont jamais retirés**.
- Aucune image de watchmodcustom.com ni de goteia.fr.

### 16.4 Juridique (à valider par le client, signalé dans le guide)

- Montre configurée = bien confectionné selon les spécifications du consommateur, **exclu du droit de rétractation** (art. L221-28, 3° du Code de la consommation) : mention « Pièce fabriquée selon vos choix » sur la ligne du panier, et phrase dans les CGV à valider. Les retours sous 14 jours (réglage `returns`) ne concernent que les montres prêtes à porter.
- Newsletter et alertes : consentement explicite (action volontaire), mention RGPD sous chaque champ, pas de case précochée.
- Bandeau cookies Shopify stylé, jamais masqué. Mentions légales, CGV, confidentialité : liens dans le pied de page dès que les pages et politiques existent.
- Vérificateur de codes postaux : la liste 76 est marquée « [À VÉRIFIER] » dans `livraison-codes-postaux.md` ; les messages promettent une confirmation, pas une garantie ; le paiement Shopify fait foi.

---

## 17. Recette : définition de « terminé »

Un lot est terminé quand **toutes** ces conditions sont remplies :

1. Theme Check (`node run.cjs /home/user/Caveman/migmods/theme`, chemin absolu) : **0 erreur**.
2. Templates JSON : clés `sections` = `order` ; tout réglage utilisé existe ; aucun `"default": null` ; aucun `url` avec un défaut autre que `/collections` ou `/collections/all` (`node tools/build-theme.mjs --skip-render` passe).
3. Captures `snap.mjs <template> <ton-nom> both` de chaque template touché + `page.configurateur` : aucune erreur JS ou réseau imputable au thème, **0 px de débordement horizontal** à 393 et 1440 px, rendu conforme à ce document. Configurateur téléphone **identique** à la capture de référence.
4. Grille de relecture par écran : au plus 1 bouton chromé plein, 1 `em` chromé par titre, 2 animations continues, 3 `.rule` par page ; aucun cadre ni fond de section ; aucune carte soulevée ; aucun glyphe « → + – ✦ ▶ » utilisé comme icône.
5. Accessibilité : cibles ≥ 44 px, champs ≥ 16 px, focus visible, un seul `h1`, aucun `aria-label` sur un élément générique, mouvement réduit testé (`probe-reduced`).
6. Textes : français, vouvoiement, ’ et U+00A0, aucun `[À COMPLÉTER` visible hors éditeur, aucun prix en dur.
7. Performance : aucun asset ajouté > 300 Ko ni au-delà de son budget ; aucune référence à `logo-migmods.png` dans une page ; pas de `will-change` permanent hors `.site-bg::before`.
8. Fichiers : uniquement ceux de son lot (§2.6) ; le reste dans « requests », avec fichier et changement exact ; aucun `git commit`.
9. Fin de phase 2 : `legacy.css` supprimé, plus aucune règle `@layer legacy`, plus aucun alias legacy, `base.css` et `migmods-ui.css` absents.

---

## 18. Demandes hors thème (lot outillage, et administration Shopify)

### 18.1 Outillage

- `tools/build-theme.mjs` : appeler `render-signatures.mjs` avant le zip (option `--skip-render`), ajouter `sig-*`, `logo-migmods-*`, `migmods-og.jpg`, `migmods-glow.webp`, `migmods-grain.png`, `apple-touch-icon.png`, `favicon-32.png`, `migmods-hero-poster-land.jpg` et les polices aux contrôles de budget.
- Copie de travail du simulateur (`/tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/sim/render.mjs`, `snap.mjs`) : exposer `settings` et `shop` aux snippets rendus par `render` (`engine.options.globals`) ; mesurer le débordement contre `visualViewport.width`. À signaler à l'orchestrateur, jamais compensé dans le thème.

### 18.2 Configurateur (`migmods/configurator/configurator.js`, sans toucher à l'interface)

- Limiter `preloadAround()` à l'option choisie et à ses voisines immédiates, en `requestIdleCallback`, et ne rien précharger si `navigator.connection.saveData` (aujourd'hui environ 14,6 Mo chargés sur téléphone).
- Produire au build des images de composants en WebP (environ −85 % par cadran), en gardant les PNG comme source.
- Masquer la ligne de garantie quand le texte est vide ou contient `[À COMPL`.
- Recalculer l'échelle de la montre (`scale`) à la rotation de l'écran.

### 18.3 Administration Shopify (à documenter dans `shopify-setup/GUIDE-INSTALLATION.md`)

- Métachamp `seo.hidden = 1` sur « Montre sur-mesure MigMods » **et** « Composants MigMods ».
- Renseigner `warranty`, `contact_email`, `social_instagram`, `social_tiktok`, les politiques (CGV, confidentialité, mentions légales) et l'image de partage de l'accueil.
- Collections : `montres-pretes` et collections de familles (handles contenant `sub`, `naut`, `oak`, `dj`, `pilot`, `explorer` pour les visuels de repli).
- Valider : texte d'intro de l'atelier (§16.2), mention de rétractation (§16.4), liste des codes postaux 76.
- Fournir, si possible, un export **paysage** 1920 × 1080 de la vidéo du logo (H.264, faststart, ≈ 4 Mo) pour le réglage `video_desktop` ; ne pas réencoder le MP4 du CDN.

---

## Annexe A — Limites connues du simulateur (ne pas « corriger » dans le thème)

- Pas de `product`, `collection`, `collections`, panier, politiques, blog ni article réels ; « NaN € » sans produit ; `select` de variantes vide.
- `image_tag` renvoie une chaîne vide.
- Les snippets rendus par `render` ne voient ni `shop` ni `settings` : filigrane absent, `og:*` vides, `alt` du logo vide, `catalogue-facts` et `config-price` sur leurs replis.
- `current_page` indéfini (« – page » dans le titre).
- `divided_by` produit des décimales (`height="53.29"`).
- `{% form %}` sort un `<form>` sans classe ni id.
- Débordement mesuré contre `innerWidth` (sous-estimé sur téléphone).
- Rendu Chromium logiciel (swiftshader) : saccades, raccords de calques et coûts GPU non représentatifs d'un iPhone ; valider sur appareil réel (Safari, Web Inspector, Timelines et Layers) avant mise en ligne.
- Pour tester les états remplis (produits, panier configuré, résultats), utiliser la copie `/tmp/claude-0/-home-user-Caveman/9e1ace46-0f6b-517f-ab96-12e79e907534/scratchpad/ac-sim/`.

---

## Annexe B — Index

### B.1 Classes de composants (`theme.css` et `component-*.css`)

`.page-width`, `.page-width--wide`, `.page-width--text`, `.page-width--form`, `.grid`, `.section`, `.section--tight`, `.section--flush`, `.section--deferred`, `.btn`, `.btn__label`, `.btn__icon`, `.btn--chrome`, `.btn--ghost`, `.btn--glass`, `.btn--icon`, `.btn--sm`, `.btn--lg`, `.btn--block`, `.link-arrow`, `.rte`, `.eyebrow`, `.eyebrow--plain`, `.section-head`, `.section-head--left`, `.section-head--center`, `.section-head--split`, `.section-head__title`, `.section-head__lead`, `.section-head__action`, `.chrome-text`, `.rule`, `.rule--start`, `.rule--hair`, `.rule--v`, `.ecrin`, `.ecrin__img`, `.ecrin__tilt`, `.ecrin__spec`, `.ecrin--card`, `.ecrin--stage`, `.card`, `.card__media`, `.card__img`, `.card__img--alt`, `.card__badge`, `.card__body`, `.card__meta`, `.card__title`, `.card__link`, `.card--create`, `.sig-card`, `.sig-card__media`, `.sig-card__index`, `.sig-card__title`, `.sig-card__link`, `.sig-card__legend`, `.sig-card__price`, `.sig-card__note`, `.sig-card__action`, `.thumb`, `.badge`, `.badge--chrome`, `.badge--edge`, `.badge--muted`, `.chip`, `.chips`, `.pill-note`, `.field`, `.field__label`, `.field__error`, `.input`, `.select`, `.check`, `.radio`, `.capsule`, `.capsule__input`, `.capsule__btn`, `.qty`, `.accordion`, `.accordion--serif`, `.accordion--ui`, `.accordion__summary`, `.accordion__title`, `.accordion__icon`, `.accordion__body`, `.sheet`, `.sheet--bottom`, `.sheet--center`, `.sheet--full`, `.sheet__handle`, `.sheet__head`, `.sheet__title`, `.sheet__close`, `.sheet__body`, `.sheet__foot`, `.crumbs`, `.recipe`, `.recipe__row`, `.recipe__price`, `.proofs`, `.proof`, `.price`, `.price--lg`, `.price__from`, `.price__now`, `.price__was`, `.price__tax`, `.hallmark`, `.watch-dial`, `.clock`, `.rail`, `.rail__track`, `.rail__item`, `.rail__nav`, `.rail__count`, `.rail__dots`, `.empty-atelier`, `.page-header`, `.page-header__title`, `.buybar`, `.cart-count`, `.cart-gauge`, `.dial-wheel`, `.delivery-map`, `.config-skeleton`, `.visually-hidden`, `.skip-link`, `.draft-badge`, `.site-bg`, `.scroll-line`.

### B.2 Classes globales d'en-tête et de pied (fichiers `section-header.css`, `section-footer.css`)

`.site-header`, `.site-header--overlay`, `.site-header--compact`, `.site-header__bar`, `.site-header__inner`, `.site-header__start`, `.site-header__logo`, `.site-header__end`, `.site-header__burger`, `.site-logo`, `.site-logo__img`, `.announcement`, `.announcement__item`, `.site-nav`, `.site-nav__list`, `.site-nav__item`, `.has-mega`, `.site-nav__ink`, `.mega`, `.mega__list`, `.mega__visual`, `.mega__feature`, `.menu-sheet`, `.site-footer`, `.footer-band`, `.newsletter`, `.footer-grid`, `.footer-col`, `.footer-atelier`, `.footer-legal`, `.footer-logo`.

### B.3 États

`html.js` / `html.no-js`, `html.reveal-ready`, `html.is-still`, `html.tab-hidden`, `html.bg-still`, `html.has-dialog`, `.is-in`, `.is-active`, `.is-open`, `.is-scrolled`, `.is-hidden`, `.is-logo-hidden`, `.is-loading`, `.is-done`, `.is-error`, `.is-loaded`.

### B.4 Attributs `data-*`

| Attribut | Rôle | Géré par |
|---|---|---|
| `data-reveal` (+ `style="--i: n"`) | apparition au défilement | `theme.js` |
| `data-light` | lumière au pointeur | `theme.js` |
| `data-disc` | disque de date | `theme.js` |
| `data-clock` | heure de Paris HH:MM | `theme.js` |
| `data-watch` | aiguilles du `watch-dial` en mode `live` | `theme.js` |
| `data-rail`, `data-rail-count`, `data-rail-dots` | rail horizontal | `theme.js` |
| `data-still-toggle` | bouton Pause global | `theme.js` |
| `data-sheet-close` | fermeture d'une feuille | `theme.js` |
| `data-cta-origin="…"` | origine d'un lien vers le configurateur (`hero`, `signatures`, `cta`, `process`, `atelier`, `local`, `footer-band`, `mega`, `menu`, `header`, `tile`, `empty`, `product`, `technical`, `cart`, `search`, `404`, `faq`) ; au clic, `theme.js` appelle `window.Shopify?.analytics?.publish?.('migmods:cta_configurateur', { origin })` dans un try/catch | `theme.js` |
| `data-header`, `data-menu-open`, `data-mega-trigger` | en-tête | `section-header.js` |
| `data-hero-video`, `data-sound`, `data-waves`, `data-waves-gain` | héros, vagues | `section-hero-video.js`, `migmods-waves.js` |
| `data-sig`, `data-sig-href`, `data-sig-src`, `data-sig-name` | créations | `section-signature-showcase.js` |
| `data-add-button` | bouton d'ajout | `section-main-product.js` |
| `data-remove-keys` | retrait groupé d'une montre configurée | `section-main-cart.js` |

### B.5 Éléments personnalisés

`<mig-hero-video>`, `<mig-signature-showcase>`, `<mig-postcode-check>`, `<mig-gallery>`, `<mig-product-form>`, `<mig-cart>`, `<mig-facets>`, `<mig-predictive-search>`, `<mig-faq>`, `<mig-contact-form>`, `<mig-header>`, `<mig-footer>`.

### B.6 Événements

`mig:cart` (`detail` = panier), `mig:still` (`detail.still`).

### B.7 Keyframes (noms réservés)

`mig-rise`, `mig-fade-out`, `mig-fade-up`, `mig-turn`, `mig-tick-back`, `mig-light-y`, `mig-tilt`, `mig-sweep`, `mig-skel-out`, `mig-pulse`, `mig-spin` (anneau de chargement). Les anciens `chrome-flow`, `sheen`, `dialspin`, `mm-wipe`, `mm-in` sont supprimés côté thème (les `@keyframes` du configurateur, préfixés par son propre CSS, ne sont pas concernés).
