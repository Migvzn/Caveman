# 🛠️ PROMPTS BONUS & CORRECTIFS — Base44

> À utiliser quand quelque chose casse, quand tu veux monter le niveau visuel, ou pour ajouter des fonctionnalités après le socle.

---

## A. Prompts correctifs (quand ça casse)

### A1. Diagnostic d'un bug
```text
Il y a un bug : [décris précisément : page, action, ce que tu attendais, ce qui se passe, message d'erreur éventuel].
Avant de modifier quoi que ce soit : 1) explique la cause probable, 2) liste les fichiers concernés, 3) propose le correctif minimal. Puis applique UNIQUEMENT ce correctif, sans toucher au reste de l'application ni au design.
```

### A2. Régression après une modification
```text
Depuis ta dernière modification, [fonctionnalité X] ne marche plus alors qu'elle fonctionnait. Compare avec la version précédente, identifie ce qui a changé et restaure le comportement d'origine de X tout en gardant la nouvelle fonctionnalité. Ne refais pas le design.
```

### A3. Le design dérive
```text
Certaines pages ne respectent plus le design system VAYNORA. Rappel : fond blanc #FFFFFF et lavande #F7F5FF, violet nuit #1B1036 pour les bandeaux sombres, la sidebar et le footer, bleu #2F5BFF comme seule couleur d'action (survol #2447D6), lignes #E6E2F2, titres #16112B, texte #2E2947 ; une seule police, Plus Jakarta Sans (titres en 800) ; boutons arrondis rayon 12 px ; cartes blanches rayon 16–18 px bordure #E6E2F2 ; aucun doré, aucune police serif. Passe en revue toutes les pages et corrige uniquement les écarts visuels (couleurs, polices, rayons, espacements). Ne change aucune logique.
```

### A4. Problème de droits d'accès
```text
Vérifie les droits d'accès de toute l'application : 1) chaque page /app est protégée par RoleGuard avec les bons rôles, 2) chaque requête d'entité filtre les données : un chatter ne lit que les Creator/FanNote/Shift/ShiftReport/ContentItem liés à User.assigned_creator_ids ; une créatrice (team_role creator) ne lit que les données liées à User.creator_id ; une recrue n'accède qu'à la Formation. Montre-moi un tableau "page / rôles autorisés / filtre appliqué" puis corrige tout écart.
```

### A5. L'import Markdown ne reconnaît pas un module
```text
L'import Markdown échoue sur le module que je viens de coller (0 leçon). Affiche dans l'aperçu ce que le parseur a détecté ligne par ligne (titre "# ", meta "> ", "**Objectifs du module**", sections "## Leçon N.M — …" et "## Atelier pratique — …", blocs "### À retenir"). Rends le parseur tolérant : espaces multiples, tirets longs ou courts (— – -) après "Leçon N.M", retours à la ligne Windows (\r\n), lettres en minuscules. Ne change rien d'autre.
```

### A6. Les formulaires n'envoient pas d'email
```text
Les emails (SendEmail) ne partent pas après [formulaire]. Vérifie l'appel, les destinataires (les owners = utilisateurs avec role admin), le sujet et le corps HTML. Ajoute une gestion d'erreur : si l'email échoue, l'enregistrement est quand même créé et un toast discret indique "Votre demande est bien enregistrée".
```

---

## B. Prompts pour monter le niveau visuel

### B1. Hero cinématique
```text
Rends le hero de l'accueil plus vivant sans le surcharger : fond violet nuit avec deux halos bleu et violet qui se déplacent très lentement (animation 12 s), titre qui apparaît mot par mot (stagger 0.08 s), aperçu du tableau de bord dont la courbe se dessine à l'apparition, indicateur de scroll minimaliste en bas. Respecte prefers-reduced-motion. Garde exactement les mêmes textes.
```

### B2. Effet "produit soigné"
```text
Ajoute une finition "produit soigné" au site public : cartes qui se soulèvent légèrement au survol (ombre douce), icônes dans des carrés arrondis bleu doux, transitions de page en fondu, compteurs des promesses qui s'animent à l'apparition, sections qui apparaissent en fade-up. Garde le style simple : blanc, bleu, violet nuit, boutons arrondis. Rien de clinquant.
```

### B3. Page d'accueil de l'espace privé premium
```text
Améliore le tableau de bord /app : salutation selon l'heure ("Bonsoir Inès"), date du jour, cartes KPI avec mini-courbes bleues des 12 derniers mois, section "Ta journée" (shifts, tâches, leçon suivante de la formation), et une phrase tournante issue de la charte VAYNORA. Garde les données et la logique existantes.
```

---

## C. Fonctionnalités supplémentaires (après la phase 14)

### C1. Version anglaise du site public
```text
Ajoute un sélecteur de langue FR/EN sur le site public (pas l'espace privé). Traduis toutes les pages publiques en anglais de façon naturelle et premium (pas mot à mot). Les URLs anglaises sont préfixées /en. Mémorise le choix. Les formulaires anglais enregistrent un champ language = "en".
```

### C2. Rappels automatiques
```text
Ajoute un écran "Rappels" (owner) qui liste chaque jour : rapports de shift manquants, demandes custom en attente de validation depuis plus de 24 h, cartes des limites non revalidées depuis 90 jours, relevés mensuels en retard, apprenants qui ont dépassé leur échéance. Chaque ligne a un bouton "Relancer" qui envoie un email poli à la bonne personne et crée une Notification.
```

### C3. Points bien-être des créatrices
```text
Ajoute une entité WellbeingCheck (creator_id, date, mood 1-5, workload 1-5, boundaries_respected boolean, concerns, follow_up, done_by). Dans la fiche créatrice, onglet "Bien-être" avec historique et courbe. Dans l'espace créatrice, un formulaire mensuel simple et confidentiel ("Comment te sens-tu ce mois-ci ?"). Si mood ≤ 2 ou boundaries_respected = false → Task urgente pour le manager et notification à l'owner. Met à jour l'item de conformité "point bien-être < 30 jours".
```

### C4. Suivi des fuites (anti-leak)
```text
Ajoute une entité LeakCase (creator_id, url, platform_host, found_at, found_by, takedown_sent_at, status [detecte, notifie, retire, en_attente, echec], notes). Page /app/protection avec tableau, statistiques (délai moyen de retrait) et un générateur de notification de retrait (texte modèle en français et en anglais, à compléter, que l'on copie). Lien depuis la fiche créatrice.
```

### C5. Base de connaissances interne avec recherche IA
```text
Ajoute une recherche "Demander à la base VAYNORA" dans la topbar : la question est envoyée à InvokeLLM avec comme contexte les titres + extraits pertinents des Lessons, SOP et Scripts approuvés (recherche par mots-clés d'abord, 8 extraits max). La réponse cite ses sources avec des liens. Règle système VAYNORA SFW commune.
```

### C6. Programme de parrainage créatrices
```text
Ajoute une entité Referral (referrer_creator_id, referred_application_id, status [candidature, signee, active_3_mois, bonus_verse], bonus_amount). Dans l'espace créatrice : un lien de parrainage unique (/candidature?ref=CODE) et le suivi de ses parrainages. Le formulaire de candidature enregistre le code ref. Les owners voient le tableau des parrainages et marquent les bonus versés.
```

### C7. Mode "Revue hebdo" guidée
```text
Ajoute une page /app/revue-hebdo/:creatorId qui guide le manager en 5 étapes pendant la réunion hebdomadaire : 1) chiffres du mois en cours vs mois précédent (revenus par source, abonnés, revenu par abonné), 2) analyse IA, 3) ce qui a marché / pas marché (champs texte), 4) 3 actions pour la semaine prochaine (créées en Task), 5) message récapitulatif à envoyer à la créatrice (généré, modifiable, envoyé par email). Historique des revues.
```

---

## D. Prompts de contenu (faire écrire Base44 pour toi)

### D1. Articles du Journal
```text
Rédige et publie 5 nouveaux articles du Journal VAYNORA (800–1 000 mots, ton premium et bienveillant, SFW, utiles aux créatrices, avec intertitres, listes et un CTA final vers /candidature) : 1) "Les 7 erreurs qui font stagner un compte d'abonnement", 2) "Fiscalité des créatrices : les bases à connaître (et pourquoi voir un expert-comptable)", 3) "Fuites de contenu : prévenir, détecter, faire retirer", 4) "Garder son équilibre mental quand on crée du contenu", 5) "Agence ou solo : comment savoir ce qui vous convient". Remplis seo_title et seo_description.
```

### D2. FAQ enrichie
```text
Ajoute 10 questions/réponses à la FAQ catégorie "createurs" et 6 à la catégorie "carrieres", dans le ton VAYNORA (premium, transparent, rassurant), sans promesse chiffrée de revenus.
```

---

## E. Bonnes pratiques Base44

- **Une demande = un objectif.** « Ajoute X à la page Y » marche mieux que « améliore tout ».
- **Nomme les entités et les champs exactement** comme dans le cahier des charges : l'IA les retrouve et ne crée pas de doublons.
- **Teste avec plusieurs comptes** (owner, manager, chatter, creator, recruit) avant de passer à la suite.
- **Fais des captures** quand un rendu ne te plaît pas et décris ce que tu veux à la place.
- **Ne mets jamais de vraies données sensibles** (pièces d'identité, mots de passe, coordonnées bancaires) dans l'app.
- **Avant la mise en ligne :** mentions légales complétées, domaine personnalisé, emails testés, comptes de démo supprimés ou masqués, données « Exemple » archivées.
