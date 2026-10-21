# MIGMODS — Configurateur (phase 1)

Prototype autonome du configurateur de montres Seiko mod MigMods. Vanilla JS, sans framework ni dépendance, prêt à être intégré dans une section de thème Shopify (phase 2).

```
configurator/
├── index.html            page de démonstration
├── configurator.js       moteur (règles, aperçu canvas, interface)
├── configurator.css      styles (préfixe .mm-)
├── components.json       données générées : NE PAS éditer à la main
├── assets/<étape>/<id>.png   calques PNG
├── data/
│   ├── catalogue.csv     ← VOTRE FICHIER : un composant par ligne (ouvrable dans Excel)
│   ├── config.json       étapes, familles de boîtiers, règles générales, textes
│   ├── rapport-donnees.md     erreurs / manques trouvés (généré)
│   ├── images-attendues.md    nom exact de chaque photo à préparer (généré)
│   └── observations.md        notes sur les images reçues
└── tools/
    ├── convertisseur.html     convertisseur glisser-déposer (Excel, CSV, JSON)
    ├── convertir.mjs          même chose en ligne de commande
    └── convert-core.js
```

## Lancer en local

Le navigateur bloque la lecture de `components.json` si on ouvre `index.html` par double-clic. Il faut un petit serveur :

```bash
cd configurator
npx http-server -p 8080 -c-1 .      # ou : python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080. Sur téléphone (même Wi-Fi) : `http://<ip-de-l-ordinateur>:8080`.

## Le cycle de mise à jour

1. Modifier `data/catalogue.csv` dans Excel (séparateur `;`, encodage UTF-8).
2. Convertir :
   - **sans rien installer** : ouvrir http://localhost:8080/tools/convertisseur.html, déposer le fichier (`.xlsx` accepté), télécharger `components.json` et le placer à côté de `index.html` ;
   - **ou** en ligne de commande : `node tools/convertir.mjs` (ou `node tools/convertir.mjs mon-fichier.csv`).
3. Lire `data/rapport-donnees.md` : les lignes 🔴 sont à corriger.
4. Recharger la page.

## Colonnes du catalogue

| Colonne | Rôle | Exemple |
|---|---|---|
| `etape` | id de l'étape (voir `config.json`) | `case`, `dial`, `hands`, `strap`… |
| `groupe` | sous-titre dans l'étape | `Sub 40 mm`, `Bracelets 20 mm` |
| `id` | identifiant unique dans l'étape, sans espace ni accent | `sub-acier-40` |
| `nom` | nom affiché | `Sub Acier 40 mm` |
| `prix` | boîtier : prix de base. Autres : supplément. Vide = inclus | `249`, `29` |
| `image` | chemin du calque PNG. Vide = image de substitution | `assets/case/sub-acier-40.png` |
| `famille` | boîtiers uniquement : famille définie dans `config.json` | `sub`, `dj39`, `kx` |
| `mouvement` | calibre imposé par le composant | `NH36`, `NH34`, `NH70`, `NH72` |
| `date` | cadrans : le cadran a-t-il un guichet date ? | `oui` / `non` |
| `requiert` | condition pour que l'option soit proposée | `case.strap=20mm` |
| `exclut` | condition qui interdit l'option | `dial.movement=NH36` |
| `couleur` | couleur des substitutions (sinon devinée depuis le nom) | `#b3261e/#1f3f8f` |
| `specs` | caractéristiques `clé=valeur` séparées par `\|` | `diametre=40 mm\|etancheite=200 m` |
| `description`, `badge`, `conseil`, `conseil_si` | textes de vente / avertissement | `badge` = `Populaire` |
| `stock` | `non` = affiché « Épuisé », non sélectionnable | `oui` |
| `calage` | position de l'image : `cx,cy,taille[,angle]` en pixels de l'image | `195,198,311` |

### Ajouter un composant

1. Ajouter une ligne dans `catalogue.csv` (copier une ligne voisine de la même étape).
2. Déposer la photo dans `assets/<etape>/<id>.png`.
3. Convertir, recharger, puis caler l'image (ci-dessous).

### Changer un prix

Modifier la colonne `prix`, convertir, recharger. Le total, le récapitulatif et le panier suivent.

### Règles de compatibilité

Elles sont dans les données, pas dans le code :

- **Conditions** (`requiert`, `exclut`, `visibleIf` d'une étape) : `étape.champ=valeur1,valeur2`, `!=` pour l'inverse, `&` pour combiner. `oui`/`non`/`vide` sont reconnus.
  `case.strap=20mm` · `dial.date=oui` · `caseback=plein` · `dial.movement=vide,NH35,NH34` · `gmt_hand` (une aiguille GMT est choisie).
- **Familles de boîtiers** (`config.json > families`) : groupe de bracelets (`strap`), lunette tournante (`lunette`), géométrie de l'aperçu.
- **Mouvement** : le calibre le plus contraignant parmi les composants choisis l'emporte (`movementPriority`), NH35 sinon.
- Une option liée au boîtier (`case.…`) est **masquée** quand elle ne convient pas. Les autres incompatibilités sont **grisées**, avec la raison (colonne `conseil`).
- Quand un changement rend une option incompatible, elle est retirée et un message l'indique. Une étape obligatoire est complétée avec l'option la plus proche.

## Préparer les photos (calques)

- **PNG fond transparent**, carré, idéalement **1200×1200 px**, la pièce vue **de face**, même angle et même lumière pour toutes.
- Le plus simple : toutes les pièces d'une même étape au même cadrage (même centre, même taille). Ensuite, une seule valeur de `calage` sert pour toute l'étape.
- Aiguilles : photographiées montées sur un axe, en position **10 h 10** ; trotteuse vers 35 s.
- Noms de fichiers : `assets/<etape>/<id>.png`. La liste complète, avec ce qui manque : `data/images-attendues.md`.

### Caler une image : mode calage

Ouvrir `index.html?calibrer=1`, choisir le composant, ouvrir son étape : un panneau rouge permet de régler

- `cx`, `cy` : le point de l'image qui doit tomber au centre de la montre (centre du cadran, axe des aiguilles, milieu du bracelet…) ;
- `d` : la taille de référence dans l'image (diamètre de la lunette pour un boîtier, du cadran pour un cadran, longueur de l'aiguille des minutes, largeur du bracelet…) ;
- `angle` : rotation éventuelle.

Copier la valeur `calage = …` dans la colonne `calage` du catalogue.

## Phase 2 : branchement Shopify (déjà préparé)

- Au clic sur « Ajouter au panier », le configurateur construit une ligne « montre » qui porte toute la configuration en propriétés (Boîtier, Cadran…, Mouvement, lien de configuration, `_config_id`), plus une ligne par composant payant reliée par le même `_config_id`.
- Il émet l'événement `migmods:add-to-cart` (annulable) et appelle `window.MIGMODS_OPTIONS.onAddToCart(payload)` s'il existe. En phase 1, une fenêtre montre simplement ce contenu.
- Correspondance des variantes Shopify : `window.MIGMODS_OPTIONS = { variants: { base: 123, 'dial/meteorite': 456 } }`.
- Le lien partagé (`?c=case:…|dial:…`) recharge exactement la configuration.

## Nouvelles photos : préparation automatique

1. Ajouter une ligne `fichier;etape;id` dans `data/sources-images.csv` (ex. `IMG_3500;dial;sub-orange`).
2. `python3 tools/preparer_images.py "<dossier des photos>"` (depuis `migmods/`) : retire le fond blanc, détoure les cadrans en cercle, mesure le calage (ouverture du boîtier, axe des aiguilles, largeur du bracelet…) et crée les vignettes.
   Si une mesure est fausse, la corriger dans `data/calages-manuels.json` (prioritaire).
3. `python3 tools/generer_catalogue.py` puis `node configurator/tools/convertir.mjs`.
4. Bracelets : `python3 tools/affiner_bracelets.py` les agrandit proprement (×3) avant l'étape 3.
5. `node tools/build-theme.mjs` pour refaire le zip du thème.

Une ligne du catalogue dont l'étape commence par `#` est en réserve : elle n'apparaît pas dans le configurateur (composants sans photo, ou cadrans portant des marques déposées).
