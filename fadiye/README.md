# Fadiye — cardigan 3D & vidéo de présentation

Maison de streetwear indépendante française créée par **Mig & Killian**.
Univers : élégance, monde floral (le lycoris), mélancolie — noir profond, rouge intense, argent.

Ce dossier contient :

| Dossier | Contenu |
|---|---|
| `assets/source/` | Les visuels fournis : photo produit, mockup, fiche technique, étiquette, bouton, fonds lycoris |
| `blender/` | La maquette 3D du **Cardigan « Fadiye »** (taille M), générée par script, et les scripts de rendu |
| `video/` | Le projet **Remotion** de la vidéo de présentation (vertical 1080×1920, 30 i/s, 48 s) |
| `rendu/` | Les vues 3D devant / dos ; la vidéo MP4 y est générée (non versionnée car elle contient la musique) |

## La maquette 3D (`blender/`)

Objectif : qu'on voie un **vrai vêtement**, pas une simple modélisation.

**Coupe calée sur la photo produit.** La silhouette de face est mesurée sur
`assets/source/cardigan_photo.png` (1132 px = 1 m : longueur 66 cm du point haut d'épaule à
l'ourlet) : ligne d'épaule, largeur du buste, axe et largeur des manches, hauteur des
bord-côtes, position des boutons, crochets et broderie. La projection de face du modèle recouvre
la photo à 95 % (le reste vient surtout de la légère asymétrie de la prise de vue).
Présentation « ghost mannequin » : coupe oversize / boxy, épaules tombantes, manches amples
qui blousent au-dessus des poignets, col rond qui descend devant jusqu'au premier bouton.

**Ce qui rend le vêtement réel :**

- **maille jersey** en vraie texture de points en V (fils retors, irrégularités maille par
  maille), posée par pièce (devants, dos, manches) avec les **coutures** aux bons endroits :
  emmanchures, côtés, épaules ;
- **plis de tombé** : une maille lourde (450 g/m²) qui pend depuis les épaules, fronces
  là où les manches entrent dans les poignets ;
- **bord-côtes 2×2** (col, poignets, ourlet, patte) en vraie géométrie, côtes de 6,3 mm
  comme sur la photo, **bords repliés arrondis** ;
- **broderie « Fadiye » au point satin** en vraie géométrie : bourrelet en relief, fils
  visibles un par un, reflet soyeux qui suit le sens des fils, bords nets ;
- **boutons signature** (Ø 25 mm, taille relevée sur la photo) sculptés d'après la photo HD
  du bouton : 22 étamines tracées en tubes lisses avec leur boule, cœur de pétales, tige,
  ornements art nouveau, listel et bord bombé ; patine légère dans les creux ;
- **crochets « fireman »** en métal poli (barre, goupille en T, bague, anneau) ;
- **duvet de fibres** (≈ 190 000 fibres) qui adoucit les contours comme une vraie maille ;
- étiquette tissée Fadiye cousue dans le col.

Fichiers :

- `cardigan_fadiye.blend` — la scène complète (modèle, matières, éclairages vidéo et studio,
  caméra) à ouvrir dans Blender 4.2+ / 5.x
- `sdf_garment.py` — la forme du vêtement (buste, manches, plis, coutures), cotes de la photo
- `prepare_textures.py` — textures dérivées des visuels fournis : maille, côtes, broderie
  (masque, relief, fils, sens des fils), relief et patine du bouton, logo et fleur
- `build_cardigan.py` — construit la scène et enregistre le `.blend`
- `render_shots.py` — les plans caméra (rotation 360°, héros, macros, `packshot` cadré comme
  la photo produit avec `--studio`) en PNG transparents
- `render_all.sh` — rend toutes les séquences de la vidéo, image par image (~4 à 5 h sur 4 cœurs CPU)

```bash
pip install bpy numpy opencv-python-headless scikit-image scipy pillow   # Python 3.13
python blender/prepare_textures.py
python blender/build_cardigan.py
./blender/render_all.sh
```

## La vidéo (`video/`)

Six scènes, toutes éditables dans Remotion Studio :

1. **Ouverture** — une fleur de lycoris pousse dans le noir, le logo calligraphié se dessine,
   « Maison indépendante française ».
2. **Manifeste** — *Élégance.* / *Floral.* / *Mélancolie.* sur les fonds lycoris fournis.
3. **Révélation** — le cardigan 3D apparaît en contre-plongée puis tourne à 360° devant le champ de lycoris.
4. **Détails** — bouton signature, crochets, broderie, col & étiquette (gros plans 3D).
5. **Fiche technique** — vues devant / dos, tableau des mesures S → XXL, matière, coloris.
6. **Signature** — fleur, logo, « Créée par Mig & Killian ».

Musique : **« Possession » de Sea Oleena**, à partir de **3:02**, utilisée avec l'accord de
l'artiste. Le fichier n'est pas versionné (dépôt public) : le placer dans
`video/public/audio/possession.mp3` (nom et point de départ réglables dans `video/src/music.ts`).

```bash
cd video
npm install
# les séquences 3D doivent être présentes dans public/renders (lien vers ../../blender/renders)
npx remotion studio                 # prévisualiser / modifier
npx remotion render FadiyePresentation ../rendu/fadiye_presentation.mp4
```
