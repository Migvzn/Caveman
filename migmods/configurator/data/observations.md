# Observations sur les fichiers reçus (Seiko_Claude.zip)

Reçu : 60 images PNG, **sans tableur**. J'ai identifié chaque image à l'œil, je l'ai renommée et rangée dans `assets/`, puis j'ai construit `catalogue.csv` en croisant ces images avec le catalogue du brief (section 4).

## À vérifier : correspondances que j'ai devinées

| Fichier d'origine | Devenu | Doute |
|---|---|---|
| IMG_3168 / 1036 / 3169 | Boîtier Sub Acier / Doré / Or rose | — |
| IMG_3184 | Boîtier DJ 39 Acier | **également utilisé pour le DJ 36** (pas de photo dédiée) |
| IMG_1038 | Insert YM Doré | — |
| IMG_3171 | Insert YM **Gris** | gris foncé : Gris ou Noir ? |
| IMG_1039 / 3173 / 3174 | Aiguilles Benz Doré / Acier / Acier patine | — |
| IMG_3176 | Trotteuse « SKX Noir » | nom à confirmer |
| IMG_3177 | Trotteuse « Bâton Acier » | **axe de rotation estimé** (pas de moyeu visible sur la photo) |
| IMG_3178 | Trotteuse « Benz Acier » | nom à confirmer |
| IMG_3179 / 3180 / 3181 | Bracelets 20 mm Oyster Acier / Oyster Acier poli / Oyster Bicolore doré | — |
| IMG_3185 / 3186 | Bracelets DJ Oyster Acier poli / Jubilee | aussi utilisés pour le DJ 36 |
| IMG_3182 / 3183 | Loupe de date / Loupe disque noir | — |
| IMG_8353–8393 | 41 cadrans (Open Heart, Rayé, Arabes, Tapisserie, Squelette, Soleillé) | noms, prix et mouvements à confirmer dans `catalogue.csv` |

## Défauts trouvés dans les images

- **Basse résolution** : 400×400 px (pièces) et 200×200 px (cadrans). Idéal 1200×1200 : correct sur mobile, un peu flou au zoom.
- **Fond blanc au lieu de transparent** : IMG_3178, IMG_8391, IMG_8392, IMG_8393. **Corrigé automatiquement** (détourage et masque rond).
- **Images non carrées** : IMG_8392 (212×200), IMG_8393 (200×195). Remises au carré, avec une légère déformation possible.
- **Filigrane** : les 4 boîtiers portent un petit logo hexagonal « S » sur la corne en bas à droite. Ce sont sans doute des photos de fournisseur ou d'un autre site : obtenir l'autorisation ou refaire les photos avant la mise en ligne.
- **Marques déposées imprimées sur les cadrans** :
  - IMG_8385 à 8393 (soleillés) portent « OYSTER PERPETUAL DATEJUST / SUPERLATIVE CHRONOMETER ». **Ce sont des marques Rolex** : les vendre ou les montrer présente un vrai risque juridique (contrefaçon). Je recommande de les retirer ou de prendre des versions sans inscription.
  - La plupart des cadrans portent le logo SEIKO. C'est courant dans le mod, mais à garder hors de la marque MigMods, conformément au brief (pas de « Seiko » dans les noms de produits).

## Composants sans image (substitution générée)

229 sur 292, notamment : boîtiers Naut, DJ (autres coloris), Explorer, Pilot, Engineer, Oak, Octo, PR, Sharp, KX ; tous les rehauts, lunettes et couronnes ; la plupart des inserts, aiguilles, trotteuses et bracelets. Liste complète avec les noms de fichiers : `images-attendues.md`.

## Questions ouvertes (aucune valeur définitive mise sans ton accord)

1. **Prix** : ceux du brief (sections 3 et 4), tous indicatifs. 223 composants « inclus » (prix vide) à confirmer, dont tous tes cadrans sauf Open Heart et squelettes.
2. **Explorer 39 mm** : le brief le range à la fois dans « Bracelets 20 mm » et dans « DJ & Explorer ». J'ai mis Explorer 36 → DJ & Explorer, Explorer 39 → 20 mm.
3. **Sharp 40 mm** : groupe de bracelets non précisé, mis en 20 mm.
4. **Logo personnalisé** : prix ? (0 € pour l'instant).
5. **Garantie** : durée à compléter (`config.json > texts.warranty`).
6. Tous les cadrans sont proposés sur tous les boîtiers. Faut-il restreindre (par exemple les cadrans DJ réservés aux boîtiers DJ) ?
