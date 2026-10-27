# Installer le thème MigMods sur Shopify

Temps estimé : 1 h. Tout se fait dans l'admin Shopify, sans code. La charte qui décrit chaque page est `migmods/DESIGN-SYSTEM.md` ; ce guide ne liste que ce qui se règle dans l'admin.

Les mentions **[À COMPLÉTER]** et **[À VÉRIFIER]** de ce guide sont des décisions à prendre par vous. Sur le site, tout texte qui contient l'une de ces mentions reste **invisible** pour les visiteurs (et absent des données Google) : seul l'éditeur de thème affiche un badge « À compléter ».

## 1. Importer le thème

1. **Boutique en ligne > Thèmes > Ajouter un thème > Importer un fichier ZIP** : choisir `migmods-theme.zip` (produit par `node tools/build-theme.mjs`, voir §13).
2. Ne pas le publier tout de suite : **Personnaliser** pour le prévisualiser.

## 2. Créer les deux produits techniques

1. **Produits > Importer** : choisir `produits-a-importer.csv`. Cela crée :
   - **Montre sur-mesure MigMods** (0 €) : porte la configuration complète dans la commande ;
   - **Composants MigMods** : une variante par composant payant. Le **SKU** (`case/sub-acier-40`, `dial/meteorite`…) relie la variante au configurateur. **Le prix de la variante est le prix facturé** : pour changer un prix, changez-le ici. Le prix d'entrée « dès 229 € » affiché sur le site et les prix des Créations signature sont recalculés à partir de ces variantes.
2. Sur **les deux** produits :
   - ne les ajouter à **aucune collection** ;
   - les masquer de la recherche et de Google : **Métachamps du produit** > ajouter `seo.hidden` (entier) = `1` (Shopify documente la manipulation sous « masquer un produit des résultats de recherche ») ;
   - **Suivre la quantité** décoché (déjà fait par l'import : stock non suivi).
   Le thème les reconnaît seul (adresse, type ou étiquette `configurateur` / `masque`) : ils ne s'affichent jamais dans les grilles et portent `noindex`.

## 3. Créer les pages

**Boutique en ligne > Pages > Ajouter une page**. Pour chacune, choisir le **modèle** (encadré à droite), puis renseigner **Aperçu du référencement** (titre et description) avec les textes ci-dessous.

| Page | Titre | Adresse | Modèle | Contenu | Titre SEO / description |
|---|---|---|---|---|---|
| Configurateur | Créer ma montre | `/pages/configurateur` | `page.configurateur` | vide | « Créer ma montre — configurateur Seiko mod \| MigMods » / « 33 boîtiers, 82 cadrans, mouvements Seiko NH35 à NH72 : composez votre montre, le prix suit chaque choix. Assemblée sous 2 à 3 semaines. » |
| L'atelier | L'atelier | `/pages/atelier` | `page.atelier` | vide (tout est dans l'éditeur de thème) | « L’atelier MigMods à Évreux — assemblage, étanchéité, réglage » |
| Livraison | Livraison et remise en main propre | `/pages/livraison` | `page.livraison` | vide (tout est dans l'éditeur de thème ; `contenu-pages/livraison.html` reste une archive du texte d'origine) | « Livraison en main propre dans l’Eure et à Rouen \| MigMods » |
| FAQ | Questions fréquentes | `/pages/faq` | `page.faq` | vide | — |
| Contact | Contact | `/pages/contact` | `page.contact` | vide (textes dans l'éditeur de thème) | — |
| Mentions légales | Mentions légales | — | `page` | coller `contenu-pages/mentions-legales.html` et compléter | — |

L'adresse de la page configurateur doit être exactement `/pages/configurateur` : c'est le lien de tous les boutons « Créer ma montre » et des Créations signature.

**Accueil** (Préférences de la boutique en ligne) : titre « MigMods — Montres Seiko mod sur-mesure, assemblées à la main à Évreux » ; description « Composez votre Seiko mod en ligne : 82 cadrans, 33 boîtiers, calibres Seiko NH35 à NH72. Assemblée à la main à Évreux, remise en main propre dans l’Eure et à Rouen. » ; **image de partage** : une photo de montre ou laisser vide (le thème utilise alors `migmods-og.jpg`, logo chromé sur noir).

## 4. Relier le configurateur

**Personnaliser > Pages > Créer ma montre > section « Configurateur MigMods »** :
- Produit « Montre sur-mesure » → **Montre sur-mesure MigMods** ;
- Produit « Composants MigMods » → **Composants MigMods** ;
- **Titre** et **Introduction** : le titre de la page (h1, lu par Google et les lecteurs d'écran) et sa phrase d'introduction, affichée sur ordinateur sous le titre. Valeurs par défaut : « Créer *ma montre* » et « Composez votre Seiko mod pièce par pièce. Le prix suit chaque choix ; je l’assemble à Évreux sous 2 à 3 semaines. »

Sous le configurateur (ordinateur seulement ; sur téléphone, le configurateur est une application plein écran) : la bande **Engagements** et la **FAQ** « Avant de créer votre montre » (4 questions, dont la garantie, masquée tant qu'elle contient [À COMPLÉTER]).

Aussi dans **Paramètres du thème > Panier** : choisir **Montre sur-mesure MigMods**.

## 5. Paramètres du thème à renseigner

**Personnaliser > Paramètres du thème** :

| Groupe | Réglage | À saisir |
|---|---|---|
| Réassurance | **Garantie** | [À COMPLÉTER] ex. « Garantie 24 mois sur l’assemblage et le mouvement ». Tant que le texte contient [À COMPLÉTER], il n'apparaît nulle part (fiche produit, panier, configurateur). |
| Réassurance | Délai montres prêtes / configurées, Ligne livraison, Retours | vérifier les textes proposés |
| Atelier et contact | **E-mail de contact** | l'adresse publique de l'atelier (bloc « L’atelier » du pied de page, données Google) |
| Réseaux sociaux | **Instagram**, **TikTok** (Facebook facultatif) | liens complets, affichés dans le bloc « L’atelier » du pied de page et dans le menu du téléphone ; un réseau vide n'est pas affiché |
| Livraison | Remise en main propre offerte à partir de | 300 € par défaut |
| Livraison | Codes postaux de la remise en main propre | `27*` puis la liste de `livraison-codes-postaux.md` (une ligne par code), **après vérification** (§9) |
| Logo et filigrane | Logo | facultatif : sans logo, le thème utilise le logo chromé fourni |
| Mouvement | Fond animé | décocher pour un fond fixe |

**En-tête** (**Personnaliser > En-tête**) :
- **Annonce** : 3 blocs « Annonce » au plus, qui se succèdent toutes les 5 secondes. Chacun a un **texte**, une **version courte** (affichée sous 430 px de large, sur téléphone) et un **lien** facultatif. Écrire `{seuil}` dans un texte affiche le montant du réglage « Remise en main propre offerte à partir de » (ex. « Remise en main propre offerte dès {seuil} · Eure et Rouen » → « … dès 300 € … ») : il suffit de changer le réglage pour que l'annonce suive.
- Le bouton « Créer ma montre » de l'en-tête pointe vers `/pages/configurateur` (réglage « Lien du bouton », vide par défaut).
- Sur la page du configurateur, l'en-tête est compact (sans annonce ni bouton) et, sur téléphone, laisse toute la place à l'application.

**Pied de page** (**Personnaliser > Pied de page**) : bloc « L’atelier » (ville, horloge de l'atelier, lien de contact, e-mail et réseaux des paramètres du thème), « Lettre de l’atelier », colonnes « Boutique » (menu `footer`) et « Aide » (menu `aide`), « Informations » (politiques + page Mentions légales, §7). La **bande « Une montre se choisit. La vôtre se compose. »** et son bouton « Créer ma montre » s'affichent sur toutes les pages **sauf le panier et le configurateur** (on y est déjà au bout du parcours). Une colonne sans lien n'est pas affichée.

**Héros de l'accueil** (section « Vidéo ») : la vidéo actuelle est en portrait. Si possible, fournir un export **paysage 1920 × 1080** de la vidéo du logo (H.264, « faststart », environ 4 Mo) et le choisir dans **Version paysage (ordinateur)**. Ne pas réencoder le MP4 déjà hébergé par Shopify.

## 6. Modifier prix, stock et images sans code : les metaobjects

**Paramètres > Données personnalisées > Metaobjects > Ajouter une définition** :

- Nom : `Composant de montre` · Type (handle) : **`watch_component`**
- Activer **Accès à la vitrine (Storefront)**, sinon le thème ne voit pas les données.

| Clé du champ | Type | Rôle |
|---|---|---|
| `step` | Texte sur une ligne | étape : `case`, `dial`, `bezel_insert`, `hands`, `second_hand`, `strap`… |
| `component_id` | Texte sur une ligne | id du composant (colonne `id` du catalogue) |
| `label` | Texte sur une ligne | nom affiché |
| `group` | Texte sur une ligne | groupe dans l'étape |
| `price` | Décimal | prix affiché (la variante l'emporte si elle existe) |
| `image` | Fichier (images) | calque PNG détouré (Shopify le sert ensuite dans le meilleur format) |
| `fit` | Texte sur une ligne | calage `cx,cy,taille` mesuré sur l'image d'origine |
| `family` | Texte sur une ligne | boîtiers : `sub`, `dj39`, `kx`… |
| `movement` | Texte sur une ligne | `NH36`, `NH34`, `NH70`, `NH72` |
| `has_date` | Vrai ou faux | cadrans : guichet date |
| `requires` / `excludes` | Texte sur une ligne | conditions (même syntaxe que le catalogue) |
| `color` | Texte sur une ligne | couleur de l'image de substitution |
| `specs` | Texte multiligne | une ligne `clé=valeur` par caractéristique |
| `description` | Texte multiligne | texte de vente |
| `badge`, `hint` | Texte sur une ligne | pastille, conseil |
| `in_stock` | Vrai ou faux | décoché = « Épuisé » |
| `variant` | Référence de variante de produit | variante facturée (pour un nouveau composant) |

Puis **Contenu > Metaobjects > Composant de montre > Ajouter une entrée**.
- **Modifier un composant existant** : `step` + `component_id` identiques au catalogue, et seulement les champs à changer (ex. `in_stock` décoché).
- **Ajouter un composant** : remplir au minimum `step`, `component_id`, `label`, `image`. S'il est payant, créer une variante dans « Composants MigMods » et la choisir dans `variant`.

Le configurateur refuse l'ajout au panier si un composant payant n'a pas de variante : rien n'est vendu à un mauvais prix.

## 7. Collections et menus

**Produits > Collections** :
- **Montres prêtes à porter** (adresse `montres-pretes`) : toutes les montres prêtes ;
- une collection par famille, dont l'adresse contient le nom de la famille (`sub`, `naut`, `oak`, `dj`, `pilot`, `explorer`) : le thème s'en sert pour choisir un visuel de repli quand la collection n'a ni image ni produit (méga-menu, liste des collections). Une collection vide s'affiche « Bientôt » et propose de composer sa montre.

**Boutique en ligne > Navigation** :
- **main-menu** : **Montres prêtes** (`/collections/montres-pretes` ; nommer l'élément de menu exactement « Montres prêtes » : avec un libellé plus long, la navigation d'ordinateur ne tient plus à 1280–1366 px et passe au menu burger) · Collections (sous-menu : les collections de familles) · L'atelier · FAQ · Livraison · Contact. Sur ordinateur, l'en-tête n'affiche que les **4 premiers** liens (les suivants restent dans le menu du téléphone) ; un lien vers `/pages/configurateur` est retiré de la navigation puisque le bouton « Créer ma montre » le porte déjà.
- **footer** (colonne « Boutique ») : Montres prêtes · Créer ma montre · Les collections · L'atelier.
- **aide** (colonne « Aide ») : Livraison · FAQ · Contact · Entretien de votre montre.
- Colonne « Informations » : les politiques de la boutique s'ajoutent seules ; choisir la page **Mentions légales** dans **Personnaliser > Pied de page > Informations**.

## 8. Livraison (Paramètres > Expédition et livraison)

- **Livraison locale** (sur le lieu « atelier ») : activer, zone par **codes postaux**, puis coller la liste de `livraison-codes-postaux.md` (après vérification, §9). Prix : [À COMPLÉTER] (le site annonce « offerte dès 300 € »). Message de confirmation : « Je vous écris pour convenir d’un créneau. »
- **Retrait** : [À COMPLÉTER : lieu ou « sur rendez-vous »], gratuit.
- **Expédition France** : tarif « Colissimo suivi, contre signature, assuré », offert (le site l'annonce : à garder cohérent).
- Taxes : prix TTC (**Paramètres > Taxes et droits** : « Tous les prix incluent les taxes »).

Le vérificateur de code postal de l'accueil ne promet qu'une confirmation : c'est le paiement Shopify qui fait foi.

## 9. À valider par vous avant la mise en ligne

1. **Texte d'introduction de l'atelier** (accueil, section « L’atelier ») : « Chaque montre passe entre mes mains : contrôle des pièces à réception, assemblage, test d’étanchéité, réglage. Pas de chaîne de montage : une montre, un établi, le temps qu’il faut. » Il ne reprend que des affirmations déjà présentes dans vos contenus : à confirmer ou corriger dans l'éditeur.
2. **Droit de rétractation** : une montre configurée est un bien confectionné selon les spécifications du client, **exclu du droit de rétractation** (article L221-28, 3° du Code de la consommation). Le panier affiche « Pièce fabriquée selon vos choix » sur la ligne de la montre et la FAQ le rappelle. Ajouter la phrase correspondante dans les CGV et la politique de remboursement, **à faire relire**. Les retours sous 14 jours (réglage « Retours ») ne concernent que les montres prêtes à porter.
3. **Codes postaux de la métropole de Rouen** : la liste de `livraison-codes-postaux.md` est marquée [À VÉRIFIER] ; la contrôler avec la carte officielle de la Métropole (certains codes couvrent aussi des communes hors métropole).
4. **Garantie** (§5) et **FAQ** : la question « Quelle garantie ? » et la précision visée après réglage restent masquées tant qu'elles contiennent [À COMPLÉTER].
5. **Promesses** : ne pas ajouter de durée de garantie, de pression de test, de « 200 m » hors boîtiers Sub ou de « véritable météorite » sans les avoir vérifiées.

## 10. Mentions obligatoires (France)

- **Paramètres > Politiques** : créer à partir des modèles Shopify puis relire : remboursement (voir §9.2), confidentialité, conditions de vente, expédition, coordonnées. Elles apparaissent seules dans le pied de page.
- **Mentions légales** : page à part (§3), choisie dans le pied de page (§7).
- Bandeau cookies : **Paramètres > Confidentialité des clients > Bannière de cookies** (le thème le met aux couleurs du site ; ne pas le masquer).
- Lettre de l'atelier et alertes « Me prévenir » : les inscrits arrivent dans **Clients** avec l'étiquette `newsletter`, `alerte` ou `prelancement` ; aucune case n'est précochée.

## 11. Fiches produits (montres prêtes)

Métachamps produit (**Paramètres > Données personnalisées > Produits**), espace `custom` :
- `custom.numero` (texte) : numéro de la pièce ;
- `custom.diametre`, `custom.mouvement`, `custom.famille` (texte sur une ligne) : ex. « 40 mm », « Seiko NH35 automatique », « Sub » — affichés sous le nom dans les grilles ;
- `custom.caracteristiques` (texte multiligne) : une ligne par caractéristique, `Diamètre : 40 mm` ;
- `custom.config` (texte) : la composition au format du configurateur (`case:…|dial:…`), pour le lien « Composer une variante de cette montre ».

Le délai affiché (« Expédiée sous 48 h ») vient du réglage **Délai montres prêtes** (§5).

Étiquettes reconnues : `piece-unique` (badge « Pièce unique »), `nouveau` (badge « Nouveau »).

## 12. Tester avant de publier

1. **Ordinateur** : composer une montre avec un composant payant (par exemple le cadran Météorite), vérifier que le total suit, ouvrir le récapitulatif (clic sur le total), puis « Ajouter au panier » : une seule ligne « Montre sur-mesure » avec le détail et l'aperçu, total correct.
2. **Téléphone** : même parcours dans l'application plein écran (balayer la montre pour changer de choix, « Total TTC › » pour le récapitulatif en feuille).
3. Retirer la montre du panier : les composants partent avec.
4. Passer une commande test (**Paramètres > Paiements > mode test**) : la commande montre la configuration, le lien et l'image d'aperçu.
5. Vérifier qu'aucun texte [À COMPLÉTER] n'apparaît sur le site public (seul l'éditeur de thème les signale).

## 13. Mettre à jour le thème après un changement du catalogue

Depuis le dossier `migmods/` : `node tools/build-theme.mjs` (Node 18 ou plus, Python 3 avec Pillow pour les images WebP). L'outil convertit le catalogue, copie le configurateur dans le thème, publie les calques de l'aperçu en **WebP** (environ 7 Mo au lieu de 21 Mo ; les PNG restent la source dans `configurator/assets/`), refait les rendus des Créations signature, contrôle les schémas, les templates et le poids des fichiers, puis écrit `migmods-theme.zip`. Options : `--skip-render` (sans navigateur, rendus inchangés), `--no-zip` (contrôles seulement). Réimporter ensuite le zip (ou seulement les fichiers changés) dans **Thèmes > … > Modifier le code**.
