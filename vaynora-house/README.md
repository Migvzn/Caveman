# VAYNORA House — le kit complet

> **Votre talent. Notre maison.**

> 🌐 **Le site est construit et hébergé gratuitement** dans le dossier `vaynora/` à la racine du dépôt : site public `index.html` + **Espace équipe** `equipe.html` (tableau de bord complet de l'agence + Formation OFM, protégés par un code d'accès). Il est publié automatiquement par Vercel, déjà relié à ce dépôt. Pour relier les formulaires à votre boîte mail, renseignez `WEB3FORMS_KEY` et `CONTACT_EMAIL` dans le bloc `CONFIG` de `vaynora/index.html`. Pour changer le code d'accès de l'Espace équipe : `python3 vaynora-house/outils/chiffrer-formation.py "NOUVEAU-CODE"`.

> 📦 **Pour Base44 : `VAYNORA-HOUSE-BASE44.zip`** — le prompt Base44 + toute la formation prête à installer en un clic (`vaynora-formation-pack.json`) + les fichiers de secours. Décompresse-le et suis `00-LISEZ-MOI.txt` (Base44 n'importe pas de ZIP directement).

| | Partie | Fichier principal | À quoi ça sert |
|---|--------|-------------------|----------------|
| **1** | **Le site (Base44)** | `1-SITE-BASE44/PROMPT-BASE44-VAYNORA-HOUSE.txt` | Le prompt entier, seul, à coller dans Base44 : site public, tableau de bord d'agence et Formation OFM avec son installateur |
| **2** | **La formation OFM** | `2-FORMATION-OFM/FORMATION-OFM-VAYNORA-HOUSE.pdf` | La formation complète, indépendante de Base44 : à lire, imprimer, partager |

---

## 🎨 Identité

Simple et claire : blanc, bleu `#2F5BFF`, violet nuit `#1B1036` ; une seule police, **Plus Jakarta Sans** ; boutons un peu arrondis (12 px). Logo : carré violet nuit, « V » blanc arrondi et point bleu.

## 📊 L'Espace équipe (dashboard)

- **Vue d'ensemble** : CA net des modèles, commission agence, bénéfice, abonnés, revenu par abonné, part des messages payants, courbe 12 mois, revenus par source, classement des modèles, objectif du mois, alertes automatiques.
- **Modèles** : tableau filtrable, fiche par modèle (12 mois, sources, rentabilité, historique).
- **Saisie des revenus** : une grille par mois, une ligne par modèle.
- **Chatters** : heures, ventes, ventes par heure, qualité, rémunération calculée.
- **Finance** : compte de résultat, résultat sur 12 mois, dépenses, rentabilité par modèle, relevés créatrices (CSV), point mort.
- **Recrutement** : pipeline de prospects en kanban, entonnoir, taux par source.
- **Formation OFM** : 19 modules, parcours, progression, recherche.
- **Données & réglages** : objectif, charges fixes, devise, sauvegarde/import JSON, export CSV, données d'exemple.
- **Candidatures** *(mode équipe)* : les formulaires du site (créatrices, équipe, contact), à traiter, à ajouter au recrutement en un clic.
- **Utilisateurs** et **Mon compte** *(mode équipe)* : comptes Propriétaire / Manager / Chatter, mots de passe personnels.

### Mode équipe (données partagées, un compte par membre)

Le site contient son propre serveur (`api/vaynora.js`, fonction Vercel sans dépendance). Pour l'activer, une seule fois :

1. Vercel → projet → **Storage** → **Create Database** → **Upstash for Redis** (offre gratuite) → **Connect** au projet (cocher Production et Preview).
2. **Deployments** → dernier déploiement → **Redeploy**.
3. Ouvre `/vaynora/equipe.html` : l'écran **« Créer le compte propriétaire »** apparaît. Il faut le code d'accès de la formation (seul son détenteur peut créer ce compte).
4. **Utilisateurs** → ajoute ton équipe (Manager ou Chatter) : un mot de passe provisoire s'affiche, le membre le change à sa première connexion.

Ensuite : les chiffres sont partagés entre tous les appareils, chaque membre a son compte, les chatters ne voient que la formation et leurs propres chiffres, et les formulaires du site arrivent dans **Candidatures** (plus besoin de Web3Forms ; la clé reste possible pour recevoir aussi un email).

Sans base connectée, l'Espace équipe fonctionne en **mode local** : code d'accès unique, données dans le navigateur de l'appareil (exporte une sauvegarde chaque mois).

## 🎓 La formation en chiffres

19 modules · 156 leçons (dont 13 ateliers pratiques) · 6 parcours · sans quiz ni examen. Une formation explicative, dans un style direct d'entrepreneur : comprendre le business de l'OFM, maîtriser OnlyFans de A à Z, monter et structurer son agence, trouver et signer ses modèles, produire, faire venir du trafic, chatter avec éthique, recruter et manager l'équipe, piloter les KPIs et la finance, puis scaler de 1 à 30 modèles.

---

## 📁 Organisation

```
vaynora-house/
├── README.md
├── VAYNORA-HOUSE-BASE44.zip                     ← le pack Base44 (prompt + formation à installer)
├── 00-LISEZ-MOI-ZIP.txt                         ← mode d'emploi du ZIP
├── outils/chiffrer-formation.py                 ← change le code d'accès de l'Espace équipe
├── 1-SITE-BASE44/
│   ├── PROMPT-BASE44-VAYNORA-HOUSE.txt          ← le prompt entier (à coller tel quel)
│   ├── option-prompts-par-phases.md             ← le même projet en 14 étapes
│   └── option-prompts-bonus-et-correctifs.md    ← corriger un bug, améliorer le design
└── 2-FORMATION-OFM/
    ├── FORMATION-OFM-VAYNORA-HOUSE.pdf          ← la formation complète (PDF)
    ├── FORMATION-OFM-VAYNORA-HOUSE.md           ← la même en texte
    ├── vaynora-formation-pack.json              ← toute la formation pour l'installateur Base44
    └── modules/                                 ← un fichier par module (00 → 18)
```

## 1️⃣ Construire le site avec Base44

1. Ouvre `1-SITE-BASE44/PROMPT-BASE44-VAYNORA-HOUSE.txt`, **sélectionne tout, copie**.
2. Crée une nouvelle app sur Base44 et **colle le prompt entier**.
3. Si Base44 ne construit pas tout d'un coup, écris : `Continue : construis les éléments manquants du cahier des charges, section par section, sans casser l'existant.`
4. Si Base44 refuse un texte aussi long, utilise `option-prompts-par-phases.md` (14 prompts plus courts).

## 2️⃣ Mettre la formation sur le site Base44

Espace privé → Formation → Admin → **Installer la formation** → choisis `2-FORMATION-OFM/vaynora-formation-pack.json` → Installer (19 modules, 156 leçons, 6 parcours). Secours : « Import d'un module », un fichier de `modules/` à la fois, en cochant « Remplacer le module existant ».

---

## ⚖️ Avertissements

- Le site public est **100 % SFW** et l'activité est réservée aux **personnes majeures**.
- Les contenus juridiques, fiscaux et sur les règles des plateformes sont des **repères généraux** qui évoluent : fais valider ton modèle, tes contrats et tes procédures par un **avocat** et un **expert-comptable**.
- Les chiffres repères et les exemples chiffrés (formation et données d'exemple du dashboard) sont **indicatifs et fictifs**.
