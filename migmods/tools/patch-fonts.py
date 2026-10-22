#!/usr/bin/env python3
"""MIGMODS — corrige les accents des minuscules de Cormorant Garamond (DESIGN-SYSTEM.md §4.1).

Le défaut (circonflexes géants, aigu décalé, grave quasi vertical en italique) vient du dessin
de la fonte : refaire un sous-ensemble ne change rien, on redessine donc les glyphes.

  - accents des minuscules « àáâäèéêëìíîïòóôöùúûüÿ » (et « œ », sans accent : inchangé) ramenés
    à K de leur hauteur (0,62) et 92 % de leur largeur, posés 30 unités plus bas ;
  - graves « àèìòù » redressés par un cisaillement SHEAR (−0,6, italique seulement) ;
  - capitales (É, À…), cédille et ponctuation : intactes.

Usage (depuis migmods/) :
  python3 tools/patch-fonts.py SRC DST K [SHEAR]
  python3 tools/patch-fonts.py --all        # les trois fichiers du thème, réglages de la charte

Sources : tools/fonts-src/ (@fontsource/cormorant-garamond 5.3.0, licence OFL 1.1 dans OFL.txt).
Dépendances : fontTools et brotli (pip install fonttools brotli).
Sortie reproductible (horodatage de la source conservé) ; code de sortie 1 si un contrôle échoue
ou si le fichier dépasse son budget (§10.7 : ≈ 22–24 Ko chacun).
"""
import os
import sys

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # migmods/

ACCENTED = 'àáâäèéêëìíîïòóôöùúûüÿ'   # minuscules à accent au-dessus (ç a son signe dessous)
GRAVES = 'àèìòù'
EXTRA_NOOP = 'œ'                     # listé par la charte, sans accent : laissé tel quel
WIDTH = 0.92                         # largeur des accents
DROP = 30                            # descente de la base de l'accent (unités, cadratin de 1000)
BUDGET = 24 * 1024                   # octets par fichier
FEATURES = ('lnum', 'tnum', 'liga', 'ccmp', 'locl', 'frac')
REQUIRED = {0x00A0: 'espace insécable', 0x20AC: '€', 0x2019: '’', 0x0153: 'œ'}
ABSENT = {0x202F: 'espace fine insécable (ne jamais l’utiliser)', 0x2192: '→ (ne jamais l’utiliser)'}

JOBS = [  # (source, destination, K, SHEAR) — commandes de la charte §4.1
    ('tools/fonts-src/cormorant-garamond-latin-300-normal.woff2', 'theme/assets/cormorant-garamond-300.woff2', 0.62, 0.0),
    ('tools/fonts-src/cormorant-garamond-latin-500-normal.woff2', 'theme/assets/cormorant-garamond-500.woff2', 0.62, 0.0),
    ('tools/fonts-src/cormorant-garamond-latin-400-italic.woff2', 'theme/assets/cormorant-garamond-400-italic.woff2', 0.62, -0.6),
]


def fail(msg):
    print('✘ ' + msg, file=sys.stderr)
    sys.exit(1)


def patch(src, dst, k, shear=0.0):
    if not 0.3 <= k <= 1.0:
        fail(f'K hors bornes ({k}) : attendu entre 0,3 et 1')
    font = TTFont(src, recalcTimestamp=False)
    glyf = font['glyf']
    cmap = font.getBestCmap()
    xh = font['OS/2'].sxHeight

    done = []
    for ch in ACCENTED:
        name = cmap.get(ord(ch))
        if not name:
            fail(f'{os.path.basename(src)} : glyphe absent pour « {ch} »')
        g = glyf[name]
        if g.isComposite():
            fail(f'{os.path.basename(src)} : « {ch} » est composite, correctif non prévu pour ce cas')
        coords, ends, _flags = g.getCoordinates(glyf)
        start, touched = 0, 0
        for end in ends:
            idx = range(start, end + 1)
            start = end + 1
            ys = [coords[i][1] for i in idx]
            ymin = min(ys)
            if ymin < xh + 40:          # contour de la lettre, pas de l'accent
                continue
            xs = [coords[i][0] for i in idx]
            cx = (min(xs) + max(xs)) / 2
            base = ymin - DROP
            sh = shear if ch in GRAVES else 0.0
            for i in idx:
                x, y = coords[i]
                ny = base + (y - ymin) * k
                coords[i] = (round(cx + (x - cx) * WIDTH + sh * (ny - base)), round(ny))
            touched += 1
        if not touched:
            fail(f'{os.path.basename(src)} : aucun accent trouvé dans « {ch} »')
        g.coordinates = coords
        g.recalcBounds(glyf)
        done.append(ch)

    # Version lisible dans le fichier (nameID 5), sans changer le nom de famille (pas de nom réservé dans l'OFL).
    for rec in font['name'].names:
        if rec.nameID == 5:
            v = rec.toUnicode()
            if 'MigMods' not in v:
                rec.string = v + '; MigMods accents ' + ('%g' % k) + ('/%g' % shear if shear else '')

    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    font.flavor = 'woff2'
    font.save(dst)
    check(dst, len(done))


def check(path, patched):
    font = TTFont(path)
    cmap = font.getBestCmap()
    feats = {fr.FeatureTag for fr in font['GSUB'].table.FeatureList.FeatureRecord}
    missing = [f for f in FEATURES if f not in feats]
    if missing:
        fail(f'{path} : fonctions OpenType absentes : {", ".join(missing)}')
    for cp, label in REQUIRED.items():
        if cp not in cmap:
            fail(f'{path} : glyphe requis absent : U+{cp:04X} {label}')
    absent = [f'U+{cp:04X} {label}' for cp, label in ABSENT.items() if cp not in cmap]
    size = os.path.getsize(path)
    rel = os.path.relpath(path, ROOT)
    print(f'✔ {rel} : {patched} minuscules corrigées, {size} o ({size / 1024:.1f} Ko), '
          f'fonctions {" ".join(FEATURES)} présentes ; absents comme prévu : {"; ".join(absent) or "aucun"}')
    if size > BUDGET:
        fail(f'{rel} : {size} o dépasse le budget de {BUDGET} o')


def main(argv):
    if argv[:1] == ['--all']:
        for src, dst, k, shear in JOBS:
            patch(os.path.join(ROOT, src), os.path.join(ROOT, dst), k, shear)
        return
    if len(argv) not in (3, 4) or argv[0].startswith('-'):
        print(__doc__)
        sys.exit(2)
    patch(argv[0], argv[1], float(argv[2]), float(argv[3]) if len(argv) == 4 else 0.0)


if __name__ == '__main__':
    main(sys.argv[1:])
