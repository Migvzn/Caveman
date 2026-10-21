# Installer le thème MigMods sur Shopify

Temps estimé : 45 min. Tout se fait dans l'admin Shopify, sans code.

## 1. Importer le thème

1. **Boutique en ligne > Thèmes > Ajouter un thème > Importer un fichier ZIP** : choisir `migmods-theme.zip`.
2. Ne pas le publier tout de suite : **Personnaliser** pour le prévisualiser.

## 2. Créer les deux produits techniques

1. **Produits > Importer** : choisir `produits-a-importer.csv`. Cela crée :
   - **Montre sur-mesure MigMods** (0 €) : porte la configuration complète dans la commande ;
   - **Composants MigMods** : une variante par composant payant. Le **SKU** (`case/sub-acier-40`, `dial/meteorite`…) relie la variante au configurateur. **Le prix de la variante est le prix facturé** : pour changer un prix, changez-le ici.
2. Ouvrir **Composants MigMods** :
   - ne l'ajouter à **aucune collection** ;
   - le masquer de la recherche : **Metafields du produit** > ajouter `seo.hidden` (entier) = `1`. Shopify documente la manip sous « masquer un produit des résultats de recherche ».
3. Sur les deux produits : décocher **Suivre la quantité** (déjà fait par l'import : stock non suivi).

## 3. Créer les pages

**Boutique en ligne > Pages > Ajouter une page**. Pour chacune, choisir le **modèle** (encadré à droite) :

| Page | Titre | Modèle | Contenu |
|---|---|---|---|
| Configurateur | Créer ma montre | `page.configurateur` | vide |
| L'atelier | L'atelier | `page.atelier` | vide (tout est dans l'éditeur de thème) |
| Livraison & retrait | Livraison et retrait | `page.livraison` | coller `contenu-pages/livraison.html` |
| FAQ | Questions fréquentes | `page.faq` | vide |
| Contact | Contact | `page.contact` | une phrase d'accueil |
| Mentions légales | Mentions légales | `page` | coller `contenu-pages/mentions-legales.html` et compléter |

L'adresse de la page configurateur doit être `/pages/configurateur` (c'est le lien des boutons « Créer ma montre »).

## 4. Relier le configurateur

**Personnaliser > Pages > Créer ma montre > section « Configurateur MigMods »** :
- Produit « Montre sur-mesure » → **Montre sur-mesure MigMods** ;
- Produit « Composants MigMods » → **Composants MigMods**.

Aussi dans **Paramètres du thème > Panier** : choisir **Montre sur-mesure MigMods**.

## 5. Modifier prix, stock et images sans code : les metaobjects

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
| `image` | Fichier (images) | calque PNG détouré |
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

## 6. Livraison (Paramètres > Expédition et livraison)

- **Livraison locale** (sur le lieu « atelier ») : activer, zone par **codes postaux**, puis coller la liste de `livraison-codes-postaux.md`. Prix : [À COMPLÉTER]. Message de confirmation : « Nous vous contactons par SMS pour convenir du créneau. »
- **Retrait en magasin** : activer sur le même lieu. [À COMPLÉTER : lieu ou « sur rendez-vous »], gratuit.
- **Expédition France** : tarif « Colissimo suivi, signature, assuré », [À COMPLÉTER : prix / gratuit dès X €].
- Taxes : prix TTC (**Paramètres > Taxes et droits** : « Tous les prix incluent les taxes »).

## 7. Mentions obligatoires (France)

- **Paramètres > Politiques** : créer à partir des modèles Shopify puis relire : politique de remboursement (droit de rétractation de 14 jours ; attention, il ne s'applique pas aux biens confectionnés selon les spécifications du client, donc aux montres configurées : à faire relire), confidentialité, conditions de vente, expédition, coordonnées. Elles apparaissent seules dans le pied de page.
- **Mentions légales** : page à part (étape 3), à choisir dans **Personnaliser > Pied de page > Informations légales**.
- Bandeau cookies : **Paramètres > Confidentialité des clients > Bannière de cookies**.

## 8. Menus (Boutique en ligne > Navigation)

- **main-menu** : Créer ma montre (`/pages/configurateur`) · Montres prêtes · Collections (sous-menu : Sub, Naut, DJ / Explorer, Pilot, KX, Oak / Octo / PR, Accessoires) · L'atelier · FAQ.
- **footer** : Livraison et retrait · FAQ · Contact · L'atelier.

Collections à créer : Montres prêtes à porter, Sub, Naut, DJ / Explorer, Pilot, KX, Oak / Octo / PR, Accessoires.

## 9. Fiches produits (montres prêtes)

Metafields produit (**Paramètres > Données personnalisées > Produits**), namespace `custom` :
- `custom.mouvement` (texte sur une ligne) : ex. « Seiko NH35 automatique » ;
- `custom.caracteristiques` (texte multiligne) : une ligne par caractéristique, `Diamètre : 40 mm` ;
- `custom.delai` (texte sur une ligne) : remplace « Expédiée sous 48 h » si besoin.

## 10. Tester avant de publier

1. Configurer une montre avec un composant payant, ajouter au panier : une seule ligne « Montre sur-mesure » avec le détail, total correct.
2. Retirer la montre du panier : les composants partent avec.
3. Passer une commande test (**Paramètres > Paiements > mode test**) : la commande montre la configuration, le lien et l'image d'aperçu.
4. Tester sur téléphone.
