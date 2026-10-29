# Enregistrer la voix off (voix humaine)

Durée : environ 1 min 45 de texte. Un téléphone suffit (Dictaphone sur iPhone, Enregistreur sur Android).

## Conseils

- Pièce calme, porte fermée, sans écho : un dressing ou une chambre avec des rideaux est idéal. Coupez la ventilation et le frigo si possible.
- Téléphone à 15–20 cm de la bouche, un peu sur le côté (pas face à la bouche, pour éviter les « p » qui claquent).
- Parlez naturellement, avec le sourire, un peu plus lentement qu'en conversation. Lisez le texte tel quel : les sous-titres l'affichent mot pour mot.
- Une seule prise suffit : lisez tout d'affilée et **laissez 2 secondes de silence entre chaque paragraphe**.
- Une erreur ? Faites une pause de 2 secondes et recommencez **le paragraphe entier**. Pas besoin de couper : la dernière version est gardée automatiquement.
- Vous préférez des fichiers séparés ? Un fichier par paragraphe, nommés 01, 02… 13.

Prononciation : « VAYNORA House » = « Vé-no-ra Haouss » (ou comme vous le dites d'habitude), « OFM » = « O-F-M », « chatters » = « tchatteurs ».

## Le texte

**01 — VAYNORA House**

Voici VAYNORA House : l'agence qui accompagne les créatrices de contenu, avec une transparence totale. Faisons le tour du site.

**02 — L'accueil**

Sur la page d'accueil, le ton est donné : un site clair et moderne, des promesses concrètes, et un aperçu du tableau de bord que chaque créatrice reçoit.

**03 — Services & méthode**

Six métiers sont réunis dans une seule équipe. La stratégie, l'acquisition d'abonnés, la gestion des messages, le contenu, la protection, et l'accompagnement. Le tout, guidé par une méthode en cinq étapes, de l'audit jusqu'à la pérennité.

**04 — Les formules**

Trois formules simples : Essentiel, Croissance et Complet. Une commission écrite noir sur blanc dans le contrat, et aucun frais d'entrée.

**05 — Créatrices & candidature**

Les créatrices estiment leur potentiel avec le simulateur, puis candidatent en cinq minutes, grâce à un formulaire en quatre étapes, avec vérification de la majorité.

**06 — La formation**

Toute l'équipe est formée avec la formation OFM de la maison : dix-neuf modules, cent cinquante-six leçons, et treize ateliers pratiques.

**07 — L'Espace équipe**

Côté agence, tout se pilote depuis l'Espace équipe. Chaque membre a son propre compte, et le tableau de bord affiche en un coup d'œil le chiffre d'affaires, la commission, le bénéfice et les alertes du mois.

**08 — Modèles & revenus**

Chaque modèle a sa fiche, avec ses revenus par source, son évolution sur douze mois et sa rentabilité réelle pour l'agence. La saisie des revenus ne prend que quelques minutes.

**09 — Chatters & finance**

Les chatters sont suivis à l'heure près : ventes, qualité et rémunération. Et la finance calcule automatiquement le résultat, le point mort et les relevés des créatrices.

**10 — Recrutement & candidatures**

Le recrutement des modèles se gère comme un pipeline, et chaque candidature envoyée depuis le site arrive directement dans l'espace, prête à être traitée.

**11 — Formation & équipe**

La formation se lit en ligne, avec la progression de chacun. Et le propriétaire gère les accès de toute son équipe.

**12 — Sur mobile**

Enfin, tout est pensé pour le téléphone : le site, comme l'Espace équipe.

**13 — Votre talent. Notre maison.**

VAYNORA House. Votre talent, notre maison.

## Ensuite

Envoyez le ou les fichiers tels quels (m4a, mp3, wav…). Ils sont importés avec :

```bash
python3 scripts/import_voice.py <prise.m4a ou dossier> [--asr <modèle whisper sherpa-onnx>]
npx remotion render Presentation out/vaynora-presentation-120fps.mp4
```

Le son est nettoyé (bruit de fond, niveau, silences) et la vidéo se recale toute seule sur la musique avec la durée réelle de chaque phrase.
