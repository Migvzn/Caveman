# Fadiye — cardigan 3D & vidéo de présentation

Maison de streetwear indépendante française créée par **Mig & Killian**.
Univers : élégance, monde floral (le lycoris), mélancolie — noir profond, rouge intense, argent.

Ce dossier contient :

| Dossier | Contenu |
|---|---|
| `assets/source/` | Les visuels fournis : photo produit, mockup, fiche technique, étiquette, bouton, fonds lycoris |
| `blender/` | La maquette 3D du **Cardigan « Fadiye »** (taille M), générée par script, et les scripts de rendu |
| `video/` | Le projet **Remotion** de la vidéo de présentation (vertical 1080×1920, 30 i/s, ~45 s) |
| `rendu/` | Les fichiers finaux : vidéo MP4, vues 3D devant / dos |

## La maquette 3D (`blender/`)

Le cardigan est montré **porté par un mannequin fin, invisible** (effet « ghost mannequin » des
fiches produit) : épaules naturelles, bras légèrement écartés et coude fléchi, tissu qui tombe de
la poitrine en plis de drapé, bord-côte resserré sur les hanches (effet blouson, taille affinée).

Fidèle à la fiche technique (Collection 01, Automne-Hiver) :

- coupe **oversize / boxy**, épaules tombantes, manches amples resserrées aux poignets ;
- mesures taille M : longueur 66 cm, largeur poitrine 60 cm, manche 56 cm ;
- **bord-côtes** côtelés au col rond, aux poignets et à l'ourlet ;
- patte de boutonnage côtelée, **4 boutons signature** Ø 20 mm avec la **fleur Lycoris en relief**
  (vraie géométrie, dessin repris de la fleur de l'étiquette) ;
- **2 crochets métalliques** type « fireman » (barre, goupille en T, anneau) ;
- **broderie « Fadiye »** en relief, extraite de la photo produit, placée au même endroit ;
- maille jersey noire (points en V), étiquette tissée Fadiye cousue dans le col.

Fichiers :

- `cardigan_fadiye.blend` — la scène complète (modèle, matériaux, éclairage, caméra) à ouvrir dans Blender 4.2+ / 5.x
- `sdf_garment.py` — la forme du vêtement (buste, manches, plis) décrite mathématiquement
- `build_cardigan.py` — construit la scène et enregistre le `.blend`
- `prepare_textures.py` — extrait broderie, logo, fleur et relief du bouton depuis `assets/source/`
- `render_shots.py` — les plans caméra (rotation 360°, héros, macros) en PNG transparents
- `render_all.sh` — rend toutes les séquences utilisées par la vidéo (~1 h 30 sur 4 cœurs CPU)

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
