#!/usr/bin/env python3
"""MIGMODS — génère configurator/data/catalogue.csv à partir des photos préparées.
Un composant n'est publié que s'il a une photo ; les autres sont gardés en commentaire (#) pour plus tard.
Usage : python3 tools/generer_catalogue.py"""
import csv, json, os, re, unicodedata
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'configurator')
fits = json.load(open(os.path.join(ROOT, 'data/calages-auto.json')))
fits.update(json.load(open(os.path.join(ROOT, 'data/calages-manuels.json'))))
COLS = "etape;groupe;id;nom;prix;image;vignette;famille;mouvement;date;requiert;couleur;specs;description;stock;calage;badge;conseil;conseil_si".split(';')
rows = []

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def add(step, group, label, price='', id=None, image_id=None, hidden=False, **kw):
    id = id or slug(label)
    img = f"assets/{step}/{image_id or id}.png"
    has = os.path.exists(os.path.join(ROOT, img))
    r = {c: '' for c in COLS}
    r.update(etape=('#' if (hidden or (not has and step not in ('caseback', 'engraving'))) else '') + step, groupe=group, id=id, nom=label, prix=str(price), stock='oui')
    if has:
        r['image'] = img
        r['calage'] = fits.get(img, '')
        th = img.replace('assets/', 'assets/thumbs/', 1)
        if os.path.exists(os.path.join(ROOT, th)):
            r['vignette'] = th
    r.update({k: v for k, v in kw.items()})
    rows.append(r)

SUB = "diametre=40 mm|epaisseur=13 mm|entre-cornes=47 mm|pompes=20 mm|etancheite=200 m|verre=Saphir|couronne=Vissée 316L"
for lab, id, p in [('Sub Acier', 'sub-acier-40', 249), ('Sub Or rose', 'sub-or-rose-40', 279), ('Sub Doré', 'sub-dore-40', 279), ('Sub Acier/Or rose', 'sub-acier-or-rose-40', 279), ('Sub Bicolore doré', 'sub-bicolore-dore-40', 279), ('Sub Noir', 'sub-noir-40', 249)]:
    add('case', 'Sub 40 mm', lab, p, id, famille='sub', specs=SUB)
NAUT = "diametre=40 mm (42,5 mm avec protège-couronne)|verre=Saphir avant et arrière|couronne=Vissée|etancheite=100 m"
for c in ['Acier', 'Or rose', 'Doré', 'Noir', 'Noir mat']:
    add('case', 'Naut 40 mm', f'Naut {c}', 319, f'naut-{slug(c)}-40-mm', famille='naut', specs=NAUT)
DJ = "lunette=Cannelée|verre=Saphir|etancheite=100 m"
add('case', 'DJ', 'DJ Acier 36 mm', 269, 'dj36-acier', famille='dj36', specs='diametre=36 mm|' + DJ)
add('case', 'DJ', 'DJ Acier 39 mm', 269, 'dj39-acier', famille='dj39', specs='diametre=39 mm|' + DJ)
for c in ['Full Gold', 'Full Or rose', 'Acier/Doré', 'Acier/Or rose']:
    add('case', 'DJ', f'DJ {c} 39 mm', 299, f'dj-{slug(c)}-39-mm', famille='dj39', specs='diametre=39 mm|' + DJ)
add('case', 'Explorer', 'Explorer Acier 36 mm', 269, 'explorer-acier-36-mm', famille='explorer36', specs='diametre=36 mm|lunette=Lisse|verre=Saphir|etancheite=100 m')
add('case', 'Explorer', 'Explorer Acier 39 mm', 269, 'explorer-acier-39-mm', famille='explorer39', specs='diametre=39 mm|lunette=Lisse|verre=Saphir|etancheite=100 m')
add('case', 'Pilot 38 mm', 'Pilot Acier 316L', 229, 'pilot-acier-316l-38-mm', famille='pilot', specs='diametre=38 mm|matiere=Acier 316L')
add('case', 'Pilot 38 mm', 'Pilot Noir mat PVD', 229, 'pilot-noir-mat-pvd-38-mm', famille='pilot', specs='diametre=38 mm|matiere=Acier PVD noir mat')
INTEG = 'diametre=40 mm|bracelet=Intégré|verre=Saphir|couronne=Vissée|etancheite=100 m'
add('case', 'Bracelet intégré', 'Oak Acier 40 mm', 329, 'oak-acier-40-mm', famille='oak', specs=INTEG)
add('case', 'Bracelet intégré', 'Octo Acier 40 mm', 329, 'octo-acier-40-mm', famille='octo', specs=INTEG)
add('case', 'Bracelet intégré', 'PR Acier 40 mm', 329, 'pr-acier-40-mm', famille='pr', specs=INTEG)
add('case', 'Bracelet intégré', 'Engineer Acier 40 mm', 249, 'engineer-acier-40-mm', famille='engineer', specs=INTEG)
for c in ['Noir', 'Doré', 'Or rose', 'Acier']:
    add('case', 'Sharp 40 mm', f'Sharp {c}', 289, f'sharp-{slug(c)}-40-mm', famille='sharp', specs='diametre=40 mm|verre=Saphir')
for c in ['Or rose', 'Doré', 'Acier', 'Noir mat']:
    add('case', 'KX 42 mm', f'KX {c}', 259, f'kx-{slug(c)}-42-mm', famille='kx', specs='diametre=42 mm|verre=Saphir double bombé|couronne=Vissée|etancheite=100 m')

def dial(group, label, id, price='', mv='', date='oui', **kw):
    add('dial', group, label, price, id, mouvement=mv, date=date, **kw)
for id, lab, p in [('sub-bleu-soleille', 'Bleu soleillé', ''), ('sub-noir', 'Noir', ''), ('sub-noir-mat', 'Noir mat', ''), ('sub-noir-vert', 'Noir / Vert', ''), ('sub-noir-rouge', 'Noir / Rouge', ''), ('sub-waffle-bleu', 'Waffle Bleu', ''), ('sub-waffle-noir-mat', 'Waffle Noir mat', ''), ('sub-vert-soleille', 'Vert soleillé', ''), ('sub-gris-soleille', 'Gris soleillé', ''), ('sub-bleu-nuit', 'Bleu nuit', ''), ('sub-blanc', 'Blanc', ''), ('sub-dore', 'Noir & Doré', ''), ('sub-or-rose', 'Noir & Or rose', ''), ('sub-vintage', 'Vintage', ''), ('sub-carbone-forge', 'Carbone forgé', 29), ('sub-meteorite', 'Météorite', 199)]:
    dial('Plongée', lab, id, p, badge='Populaire' if id == 'sub-bleu-soleille' else '')
for id, lab in [('marine-noir', 'Noir'), ('marine-bleu', 'Bleu'), ('marine-vert', 'Vert'), ('marine-gris', 'Gris'), ('marine-rouge', 'Rouge'), ('marine-blanc', 'Blanc'), ('marine-dore', 'Noir & Doré'), ('marine-or-rose', 'Noir & Or rose')]:
    dial('Professionnel 300 m', lab, id)
for id, lab, p in [('baton-noir', 'Noir', ''), ('baton-blanc', 'Blanc', ''), ('baton-gris-soleille', 'Gris soleillé', ''), ('baton-vert', 'Vert', ''), ('baton-bleu-turquoise', 'Bleu turquoise', ''), ('baton-marron', 'Marron', ''), ('baton-rose', 'Rose', ''), ('baton-violet', 'Violet', ''), ('baton-carbone-forge', 'Carbone forgé', 29), ('baton-meteorite', 'Météorite', 199)]:
    dial('Bâtons', lab, id, p)
dial('Noir mat & jour-date', 'Noir mat date noire', 'noir-mat-date-noire')
dial('Noir mat & jour-date', 'Day-Date disque noir', 'day-date-disque-noir', '', 'NH36')
dial('Noir mat & jour-date', 'Day-Date disque blanc', 'day-date-disque-blanc', '', 'NH36')
dial('Noir mat & jour-date', 'KX noir mat Day-Date', 'kx-noir-mat-day-date', '', 'NH36')
dial('Noir mat & jour-date', 'Message gravé noir', 'message-grave-noir')
dial('Noir mat & jour-date', 'Message gravé blanc', 'message-grave-blanc')
for id, lab in [('arabe-noir', 'Noir'), ('arabe-bleu', 'Bleu'), ('arabe-vert', 'Vert'), ('arabe-bleu-glacier', 'Bleu glacier'), ('arabe-raye-noir', 'Rayé Noir'), ('arabe-raye-bleu', 'Rayé Bleu'), ('arabe-raye-blanc', 'Rayé Blanc'), ('arabe-raye-vert', 'Rayé Vert'), ('arabe-raye-vert-degrade', 'Rayé Vert dégradé')]:
    dial('Chiffres arabes', lab, id, date='non' if not id.startswith('arabe-raye') else 'oui')
for id, lab in [('raye-bleu', 'Bleu'), ('raye-noir', 'Noir'), ('raye-argent', 'Argent'), ('raye-blanc', 'Blanc'), ('raye-rouge', 'Rouge dégradé'), ('raye-vert-degrade', 'Vert dégradé'), ('raye-vert-eau', "Vert d'eau"), ('raye-rose', 'Rose')]:
    dial('Rayé', lab, id)
for id, lab in [('tapisserie-noir', 'Noir'), ('tapisserie-argent', 'Argent'), ('tapisserie-bleu', 'Bleu'), ('tapisserie-vert', 'Vert'), ('tapisserie-rouge', 'Rouge'), ('tapisserie-jaune', 'Jaune'), ('tapisserie-rose-arabe', 'Rose chiffres arabes'), ('tapisserie-rouge-arabe', 'Rouge chiffres arabes')]:
    dial('Tapisserie', lab, id)
dial('Open Heart', 'Noir bâtons', 'open-heart-noir', 19, 'NH70', 'non')
for id, lab in [('oh-raye-blanc', 'Rayé Blanc'), ('oh-raye-bleu', 'Rayé Bleu'), ('oh-raye-marron', 'Rayé Marron'), ('oh-raye-vert', 'Rayé Vert'), ('oh-raye-turquoise', 'Rayé Turquoise'), ('oh-raye-vert-fonce', 'Rayé Vert foncé'), ('oh-raye-bleu-ciel', 'Rayé Bleu ciel')]:
    dial('Open Heart', lab, id, 19, 'NH70', 'non')
for id, lab, p, mv in [('squelette-argent', 'Argent', 49, 'NH70'), ('squelette-argent-baton', 'Argent bâtons', 49, 'NH70'), ('squelette-bleu', 'Bleu', 49, 'NH70'), ('squelette-vert', 'Vert', 49, 'NH70'), ('squelette-noir', 'Noir', 59, 'NH72'), ('squelette-noir-baton', 'Noir bâtons', 59, 'NH72'), ('squelette-argent-oak', 'Argent ajouré', 49, 'NH70'), ('squelette-bleu-oak', 'Bleu ajouré', 49, 'NH70'), ('squelette-noir-oak', 'Noir ajouré', 59, 'NH72')]:
    dial('Squelette', lab, id, p, mv, 'non')
add('dial', 'Sur-mesure', 'Cadran personnalisé texte / logo / couleur', 60, 'cadran-personnalise', hidden=True, description="Vous nous envoyez votre texte, logo ou couleur après la commande.")

for g, items in [('Standard', [('ym-noir', 'YM Noir', ''), ('ym-gris', 'YM Gris', ''), ('ym-dore', 'YM Doré', ''), ('ym-or-rose', 'YM Or rose', ''), ('sub-noir', 'Sub Noir', ''), ('sub-noir-touche-rouge', 'Sub Noir touche rouge', ''), ('deep-noir', 'Deep Noir', ''), ('sub-stealth', 'Sub Stealth', ''), ('bleu-petrole', 'Bleu pétrole', ''), ('bleu-smurf', 'Bleu Smurf', ''), ('vert-starbucks', 'Vert Starbucks', ''), ('marron', 'Marron', ''), ('ceramique-blanche', 'Céramique blanche', ''), ('acier-brosse-circulaire', 'Acier brossé', ''), ('carbone-forge', 'Carbone forgé', 59)]),
                 ('GMT', [('gmt-noir', 'Noir', ''), ('gmt-batman', 'Batman', ''), ('gmt-pepsi', 'Pepsi', ''), ('gmt-coke', 'Coke', ''), ('gmt-rootbeer', 'Rootbeer', ''), ('gmt-sprite', 'Sprite', ''), ('gmt-noir-bleu-turquoise', 'Noir & Turquoise', ''), ('gmt-bleu-turquoise', 'Turquoise', ''), ('gmt-gris-noir-dore', 'Gris, Noir & Doré', ''), ('gmt-gris-noir', 'Gris & Noir', ''), ('gmt-vert-ceramique', 'Vert céramique', ''), ('gmt-violet-noir', 'Violet & Noir', ''), ('gmt-ym-gmt-noir', 'YM GMT Noir', 19), ('gmt-gmt-carbone-forge', 'GMT Carbone forgé', 59)]),
                 ('Chiffres arabes', [('arabes-noir', 'Noir', ''), ('arabes-bleu', 'Bleu', ''), ('arabes-bleu-electrique', 'Bleu électrique', ''), ('arabes-vert', 'Vert', '')]),
                 ('Dual Time', [('dual-time-batman', 'Batman', ''), ('dual-time-pepsi', 'Pepsi', ''), ('dual-time-coke', 'Coke', ''), ('dual-time-rootbeer', 'Rootbeer', ''), ('dual-time-green-lantern', 'Green Lantern', ''), ('dual-time-wayne', 'Wayne', '')])]:
    for id, lab, p in items:
        add('bezel_insert', g, lab, p, id)

for id, lab, p in [('benz-acier', 'Benz Acier', ''), ('benz-acier-patine', 'Benz Acier patine', ''), ('benz-dore', 'Benz Doré', ''), ('benz-or-rose', 'Benz Or rose', ''), ('benz-noir', 'Benz Noir', ''), ('benz-full-noir', 'Benz Full Noir', ''), ('benz-squelette-noir-blanc-bgw9', 'Benz squelette BGW9', 9), ('precision-acier', 'Precision Acier', ''), ('naut-acier', 'Naut Acier', ''), ('naut-or-rose', 'Naut Or rose', ''), ('naut-dore', 'Naut Doré', ''), ('naut-noir', 'Naut Noir', ''), ('baton-acier', 'Bâton Acier', ''), ('baton-or-rose', 'Bâton Or rose', ''), ('baton-dore', 'Bâton Doré', ''), ('baton-noir', 'Bâton Noir', ''), ('dolphin', 'Dolphin Acier', 9), ('dolphin-or-rose', 'Dolphin Or rose', 9), ('skx-noir', 'SKX Noir', 9), ('skx-squelette', 'SKX Squelette', 9)]:
    add('hands', '', lab, p, id)
for id, lab, p in [('benz-acier', 'Benz Acier', ''), ('benz-acier-vintage', 'Benz Acier vintage', ''), ('benz-dore', 'Benz Doré', ''), ('benz-or-rose', 'Benz Or rose', ''), ('benz-noir', 'Benz Noir', ''), ('benz-full-noir', 'Benz Full Noir', ''), ('benz-squelette-n-b', 'Benz Noir & Blanc', 5), ('benz-bleu', 'Benz Bleu', ''), ('precision-acier', 'Precision Acier', ''), ('baton-acier', 'Bâton Acier', ''), ('baton-or-rose', 'Bâton Or rose', ''), ('baton-dore', 'Bâton Doré', ''), ('baton-noir', 'Bâton Noir', ''), ('naut-acier', 'Naut Acier', ''), ('naut-or-rose', 'Naut Or rose', ''), ('naut-dore', 'Naut Doré', ''), ('naut-noir', 'Naut Noir', ''), ('naut-orange', 'Naut Orange', ''), ('flash-acier', 'Flash Acier', ''), ('flash-or-rose', 'Flash Or rose', ''), ('flash-bleu', 'Flash Bleu', ''), ('flash-orange', 'Flash Orange', ''), ('flash-rouge', 'Flash Rouge', ''), ('flash-jaune', 'Flash Jaune', ''), ('skx-noir', 'SKX Noir', 9)]:
    add('second_hand', '', lab, p, id)

add('date_magnifier', '', 'Loupe de date', '', 'loupe', badge='Conseillé')
add('date_magnifier', '', 'Loupe de date disque noir', '', 'loupe-disque-noir')

S20 = [('oyster-acier', 'Oyster Acier'), ('oyster-acier-poli', 'Oyster Acier poli'), ('oyster-bicolore-dore', 'Oyster Bicolore doré'), ('oyster-bicolore-or-rose', 'Oyster Bicolore or rose'), ('oyster-dore', 'Oyster Doré'), ('oyster-or-rose-brosse', 'Oyster Or rose brossé'), ('oyster-or-rose-poli', 'Oyster Or rose poli'), ('oyster-noir', 'Oyster Noir'), ('jubilee-acier-poli', 'Jubilee Acier poli'), ('jubilee-bicolore-dore', 'Jubilee Bicolore doré'), ('jubilee-bicolore-or-rose', 'Jubilee Bicolore or rose'), ('jubilee-dore', 'Jubilee Doré'), ('jubilee-or-rose', 'Jubilee Or rose'), ('jubilee-noir', 'Jubilee Noir'), ('caoutchouc-noir', 'Caoutchouc Noir'), ('caoutchouc-gris', 'Caoutchouc Gris'), ('caoutchouc-bleu', 'Caoutchouc Bleu'), ('caoutchouc-bleu-ciel', 'Caoutchouc Bleu ciel'), ('caoutchouc-orange', 'Caoutchouc Orange'), ('caoutchouc-rouge', 'Caoutchouc Rouge'), ('waffle-noir', 'Waffle Noir'), ('waffle-gris', 'Waffle Gris'), ('waffle-kaki', 'Waffle Kaki'), ('waffle-orange', 'Waffle Orange'), ('waffle-rouge', 'Waffle Rouge'), ('waffle-jaune', 'Waffle Jaune'), ('nylon-noir', 'Nylon Noir'), ('nylon-velcro-noir', 'Nylon velcro Noir')]
for k, lab in S20:
    add('strap', 'Bracelets 20 mm', lab, '', '20-' + k, requiert='case.strap=20mm')
for k, lab in [('caoutchouc-noir', 'Caoutchouc Noir'), ('caoutchouc-gris', 'FKM Gris'), ('caoutchouc-bleu', 'FKM Bleu'), ('caoutchouc-bleu-ciel', 'FKM Bleu ciel'), ('caoutchouc-orange', 'FKM Orange'), ('caoutchouc-rouge', 'FKM Rouge'), ('waffle-kaki', 'Waffle Kaki'), ('waffle-jaune', 'Waffle Jaune')]:
    add('strap', 'Bracelets 22 mm', lab, '', '22-' + slug(lab), image_id='20-' + k, requiert='case.strap=22mm')
for k, lab in [('oyster-acier', 'Oyster brossé'), ('oyster-dore', 'Oyster Doré brossé'), ('oyster-or-rose-brosse', 'Oyster Or rose brossé'), ('oyster-noir', 'Oyster Noir PVD'), ('caoutchouc-noir', 'FKM Noir'), ('caoutchouc-bleu', 'FKM Bleu'), ('caoutchouc-gris', 'FKM Gris'), ('caoutchouc-orange', 'FKM Orange'), ('caoutchouc-rouge', 'FKM Rouge'), ('waffle-noir', 'Waffle Noir'), ('waffle-gris', 'Waffle Gris'), ('waffle-kaki', 'Waffle Kaki'), ('waffle-orange', 'Waffle Orange'), ('waffle-rouge', 'Waffle Rouge'), ('waffle-jaune', 'Waffle Jaune'), ('nylon-noir', 'Nylon Noir')]:
    add('strap', 'Bracelets Naut', lab, '', 'naut-' + slug(lab), image_id='20-' + k, requiert='case.strap=naut')
for img, lab in [('dj-jubilee', 'Jubilee Acier'), ('20-jubilee-dore', 'Jubilee Full Gold'), ('20-jubilee-or-rose', 'Jubilee Full Or rose'), ('20-jubilee-bicolore-dore', 'Jubilee Acier/Doré'), ('20-jubilee-bicolore-or-rose', 'Jubilee Acier/Or rose'), ('dj-oyster-acier-poli', 'Oyster Acier poli'), ('20-oyster-dore', 'Oyster Full Gold'), ('20-oyster-or-rose-poli', 'Oyster Full Or rose'), ('20-oyster-bicolore-dore', 'Oyster Acier/Doré'), ('20-oyster-bicolore-or-rose', 'Oyster Acier/Or rose'), ('20-caoutchouc-noir', 'Caoutchouc Noir')]:
    add('strap', 'Bracelets DJ & Explorer', lab, '', 'dj-' + slug(lab), image_id=img, requiert='case.strap=dj-explorer')
for img, lab in [('dj-jubilee', 'Jubilee Acier'), ('dj-oyster-acier-poli', 'Oyster Acier poli')]:
    add('strap', 'Bracelets DJ 36', lab, '', 'dj36-' + slug(lab), image_id=img, requiert='case.strap=dj36')
for img, lab in [('20-nylon-noir', 'Nylon Noir'), ('20-waffle-noir', 'Waffle Noir'), ('20-nylon-velcro-noir', 'Nylon velcro Noir')]:
    add('strap', 'Bracelets Pilot', lab, '', 'pilot-' + slug(lab), image_id=img, requiert='case.strap=pilot')

add('caseback', '', 'Fond plein', '', 'plein', description='Le plus étanche. Peut recevoir une gravure.')
add('caseback', '', 'Fond transparent', 10, 'transparent', description='Saphir au dos : voyez battre le mouvement automatique.', badge='Voir le mouvement')
add('engraving', '', 'Gravure boucle de bracelet', 10, 'boucle')
add('engraving', '', 'Gravure fond de boîte', 15, 'fond', requiert='caseback=plein', description='Uniquement sur fond plein.')
add('engraving', '', 'Gravure couronne', 10, 'couronne')
add('engraving', '', 'Gravure rotor', 15, 'rotor', conseil='Conseil : avec un fond transparent, la gravure du rotor reste visible.', conseil_si='caseback!=transparent')
# en réserve (pas de photo ou marques déposées) : réactiver en retirant le # quand une photo propre existe
for step, lab in [('crown', 'Couronne Noire'), ('crown', 'Couronne Dorée'), ('bezel', 'Lunette Noire'), ('chapter_ring', 'Rehaut Acier brossé'), ('gmt_hand', 'Flèche GMT Rouge')]:
    add(step, '', lab, 150 if step == 'gmt_hand' else '', hidden=True)

with open(os.path.join(ROOT, 'data/catalogue.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=COLS, delimiter=';'); w.writeheader(); w.writerows(rows)
live = [r for r in rows if not r['etape'].startswith('#')]
print(len(live), 'composants publiés,', len(rows) - len(live), 'en réserve')
