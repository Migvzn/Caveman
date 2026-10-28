# 🏛️ PROMPT MAÎTRE BASE44 — VAYNORA House

> **Ce que c'est :** le cahier des charges complet, en un seul bloc, pour générer sur Base44 le site public **et** la plateforme privée « VAYNORA OS » (Académie, CRM, opérations, KPIs, finance, conformité).
>
> **Comment l'utiliser :**
> 1. Crée une nouvelle app sur Base44.
> 2. Copie **tout** le bloc ci-dessous et colle-le dans le chat de Base44.
> 3. Base44 ne construira probablement pas tout d'un coup (c'est normal, le projet est énorme). Enchaîne avec :
>    `Continue : construis maintenant les éléments manquants du cahier des charges, section par section, sans casser ce qui existe. Commence par la section X.`
> 4. **Recommandé pour un résultat solide :** utilise plutôt les 14 prompts séquentiels de `02-prompts-par-phases.md` (une phase = une fonctionnalité testée).
>
> Garde ce fichier comme « bible » du projet : si Base44 dévie, recolle la section concernée.

---

```text
# CAHIER DES CHARGES — VAYNORA HOUSE (site public + VAYNORA OS)

## 0. TON RÔLE
Tu agis comme une équipe senior : directeur artistique luxe, product designer, développeur full-stack Base44 et expert en conversion. Tu livres une application finie et cohérente : aucun "Lorem ipsum", de vrais textes en français, des états vides soignés, des messages d'erreur clairs, des chargements (skeletons), et un code organisé en composants réutilisables. Quand une information manque, choisis la solution la plus professionnelle et continue.

## 1. CONTEXTE & OBJECTIFS
VAYNORA House est une agence premium de management de créatrices et créateurs de contenu sur les plateformes d'abonnement (OnlyFans, Fansly, MYM, Fanvue). Elle accompagne des créatrices majeures sur : stratégie & branding, marketing & acquisition de trafic, gestion des messages & monétisation, planification de contenu, protection anti-fuite, accompagnement business.
Positionnement : "la maison" haut de gamme, transparente, éthique et protectrice — l'opposé des agences opaques. Signature : « Votre talent. Notre maison. »

L'application a deux faces :
1. Un SITE PUBLIC vitrine, 100 % SFW, élégant, qui convertit (candidatures créatrices, candidatures équipe, contacts).
2. Un ESPACE PRIVÉ "VAYNORA OS" (connexion obligatoire, route /app) : Académie de formation certifiante (LMS), coach IA et simulateur de conversation, CRM créatrices, recrutement, opérations des chatters, contenu, KPIs, finance, conformité.

Objectifs mesurables :
- Convertir les visiteuses en candidatures créatrices qualifiées.
- Recruter, former et certifier chatters et managers via l'Académie.
- Piloter toute l'agence depuis un seul outil.

## 2. RÈGLES NON NÉGOCIABLES
- Site public 100 % SFW : aucune nudité, aucun visuel ni texte explicite. Visuels : mode, luxe, textures (soie, marbre, velours), architecture, portraits habillés élégants, abstraits dorés. Utilise des images Unsplash adaptées ou des dégradés/formes abstraites.
- Activité réservée aux personnes majeures : tout formulaire créatrice demande la date de naissance et bloque l'envoi si l'âge est < 18 ans, avec un message clair et respectueux.
- RGPD : bandeau cookies (Accepter / Refuser / Personnaliser), case de consentement NON pré-cochée sur chaque formulaire avec lien vers la politique de confidentialité, minimisation des données. Ne JAMAIS stocker de pièce d'identité : seulement le statut "âge vérifié", la date et la personne qui a vérifié.
- Toutes les fonctions IA restent SFW et professionnelles ; elles refusent tout contenu explicite, illégal ou impliquant des mineurs.
- Mobile-first, responsive parfait (360 px → 1920 px), accessibilité WCAG AA (contrastes, focus visibles, labels, textes alternatifs, navigation clavier).
- Toute l'interface est en français. Public : vouvoiement. Espace privé : tutoiement.
- Montants : € par défaut, formatés "12 345 €" ; les revenus plateformes peuvent être saisis en $ avec un champ devise.

## 3. IDENTITÉ VISUELLE (DESIGN SYSTEM)
Couleurs (tokens) :
- bg #0A0A0C · surface #131317 · surface-2 #1B1B21 · border rgba(200,169,106,0.18)
- text #F4EFE6 · text-muted #9A96A0
- gold #C8A96A · gold-light #E6D3A3 · gold-dark #9C7F45
- wine #5C1A26 (accent rare)
- success #4E9F7A · warning #D9A441 · danger #C2564B
Typographies (Google Fonts) : titres "Cormorant Garamond" 500/600 ; texte et interface "Manrope" 400/500/600/700 ; chiffres en tabular-nums.
Hiérarchie : H1 64–72 px desktop / 40 px mobile ; surtitres en capitales, 12 px, letter-spacing 0.25em, couleur gold.
Composants :
- Boutons "pill" : primaire (fond gold, texte #0A0A0C) ; secondaire (contour gold 1 px, texte gold, fond transparent) ; ghost. Hover : légère élévation + éclat doré.
- Cartes : fond surface, bordure 1 px border, rayon 20 px, ombre douce, padding généreux.
- Inputs : fond surface-2, bordure border, focus anneau gold, labels au-dessus, aides en text-muted.
- Séparateurs : lignes fines dorées, petit losange au centre.
- Badges de statut colorés (success/warning/danger/gold).
Ambiance : luxe discret, beaucoup d'espace, grain très léger en fond, halo radial doré subtil derrière le hero, animations framer-motion douces (fade-up 0.6 s, stagger 0.08 s), hover élégants, jamais d'animation agressive. Respecte prefers-reduced-motion.
Logo : wordmark "VAYNORA" en capitales (Cormorant, letter-spacing 0.35em) avec "HOUSE" en petit dessous ; monogramme SVG : un "V" dans un losange fin doré (favicon + sidebar).
Icônes : lucide-react, trait fin.
Espace privé : même ADN, plus fonctionnel : sidebar sombre repliable, contenu sur surface, densité d'information plus élevée, tableaux lisibles, graphiques recharts aux couleurs gold/gold-light/wine/text-muted.

## 4. RÔLES & ACCÈS
Ajoute à l'entité User : team_role (enum : owner, manager, chatter, creator, recruit ; défaut recruit), display_name, phone, timezone (défaut Europe/Paris), languages (array), status (active, paused, offboarded), assigned_creator_ids (array d'ids Creator), creator_id (si team_role = creator), hourly_rate (number), commission_rate (number, %), avatar_url, onboarding_done (boolean), certified_paths (array).
- owner (admin Base44) : accès total, gestion des utilisateurs et des rôles.
- manager : CRM des créatrices assignées, équipe, planning, contenu, KPIs, recrutement, suivi des apprenants.
- chatter : académie, scripts, planning (ses shifts), rapports de shift, notes fans des créatrices assignées, ses KPIs.
- creator : uniquement son espace (ses KPIs, son calendrier, ses demandes custom, ses documents, sa carte des limites, son parcours de formation créatrice).
- recruit : académie uniquement (parcours assignés) jusqu'à validation.
Chaque page privée vérifie le rôle. Sans droit : page élégante "Accès réservé" avec retour au tableau de bord. Les données sont filtrées dans les requêtes (un chatter ne voit que ses créatrices assignées, une créatrice uniquement ses propres données). Applique des règles d'accès au niveau des entités quand c'est possible.

## 5. SITE PUBLIC (sans connexion)
Header sticky (transparent puis fond flouté au scroll) : logo ; liens Méthode, Services, Créatrices, Académie, Carrières, Journal ; bouton "Candidater" (primaire) ; lien discret "Espace membre". Menu plein écran sur mobile.
Footer : logo, baseline "Votre talent. Notre maison.", liens, réseaux (depuis SiteSettings), mention "Réservé aux personnes majeures · Site sans contenu explicite", liens légaux, © année.

### 5.1 Accueil (/)
- HERO — surtitre "AGENCE DE MANAGEMENT DE CRÉATRICES" ; H1 "Votre talent. Notre maison." ; sous-titre "VAYNORA House accompagne les créatrices ambitieuses sur OnlyFans, Fansly et MYM : stratégie, croissance, monétisation et protection — avec une transparence totale et un contrat sans piège." ; CTA primaire "Rejoindre la House" (/candidature) ; CTA secondaire "Découvrir la méthode" (/methode) ; réassurance : "✓ Votre compte et vos revenus restent à votre nom · ✓ Contrat clair et résiliable · ✓ Réponse sous 48 h".
- CHIFFRES (éditables dans SiteSettings, compteurs animés) : créatrices accompagnées, taux de rétention, gestion des messages "24/7", pays couverts.
- LE CONSTAT — titre "Créer, poster, répondre, vendre, se protéger… seule, c'est un second temps plein." 3 cartes : "Des heures perdues dans les messages", "Une croissance qui stagne", "La peur des fuites et du harcèlement".
- LA HOUSE À 360° — 6 services en cartes avec icône (cf. 5.3) et lien.
- LE CYCLE VAYNORA — 5 étapes en timeline horizontale (verticale sur mobile) : 01 Audit · 02 Identité · 03 Lancement · 04 Croissance · 05 Pérennité (une phrase chacune).
- NOS ENGAGEMENTS — 6 cartes : Transparence (relevé mensuel détaillé, accès à vos statistiques) · Contrôle (compte et paiements à votre nom) · Consentement (votre carte des limites est sacrée et modifiable à tout moment) · Sécurité (anonymat, anti-fuite, confidentialité) · Contrat juste (aucun frais d'entrée, aucune clause abusive, sortie possible) · Éthique (aucune pratique trompeuse envers vos abonnés).
- POUR QUI ? — 3 profils : "Vous débutez", "Vous stagnez", "Vous voulez passer à l'échelle".
- TÉMOIGNAGES — carrousel depuis l'entité Testimonial (publiés uniquement, prénoms/pseudos).
- FAQ — accordéon (entité FAQ, catégorie "home"). Contenu initial :
  1. Quelle est votre commission ? → Elle dépend de l'accompagnement choisi, elle est écrite noir sur blanc dans le contrat et calculée sur vos revenus nets. Aucun frais d'entrée.
  2. Est-ce que je garde le contrôle de mon compte ? → Oui. Le compte, les contenus et les paiements restent à votre nom. Vous pouvez consulter vos statistiques à tout moment.
  3. Dois-je montrer mon visage ? → Non. Nous construisons aussi des stratégies anonymes performantes.
  4. Qui répond à mes abonnés ? → Une équipe formée et certifiée, dans votre ton et selon vos règles. Nous recommandons une mention transparente dans votre bio et vous pouvez reprendre la main à tout moment.
  5. Puis-je arrêter ? → Oui. Le préavis est prévu au contrat, sans pénalité abusive.
  6. Comment protégez-vous mon anonymat ? → Protocole de confidentialité, nettoyage des métadonnées, surveillance des fuites et procédures de retrait.
  7. Je débute, est-ce pour moi ? → Oui, si vous êtes majeure, motivée et régulière : nous construisons votre lancement de A à Z.
  8. Comment sont versés mes revenus ? → Directement par la plateforme, sur votre compte. Nous vous facturons notre commission chaque mois sur la base d'un relevé détaillé.
- CTA FINAL — "Votre place est peut-être ici." + bouton "Candidater en 5 minutes".

### 5.2 Méthode (/methode)
Page narrative du Cycle VAYNORA, chaque étape avec objectifs, livrables et durée :
01 Audit (J1–J7) : analyse du compte, des réseaux, des revenus, des limites. Livrable : rapport d'audit + plan d'action.
02 Identité (J7–J14) : persona, positionnement, profil, prix, bible de marque. Livrable : bible du persona.
03 Lancement (J14–J45) : shooting de départ, calendrier 30 jours, campagnes de lancement, mise en place de l'équipe messages.
04 Croissance (M2–M6) : acquisition multi-canal, optimisation des ventes, revues hebdo, tests.
05 Pérennité (M6+) : diversification, rétention, protection, préparation de l'après.
+ bloc "Ce que vous recevez chaque mois" (relevé, rapport KPI, point stratégique, calendrier).

### 5.3 Services (/services)
6 sections détaillées avec "Ce que nous faisons / Ce que vous gagnez" :
Stratégie & branding · Marketing & acquisition de trafic · Gestion des messages & monétisation · Production & calendrier de contenu · Protection, anonymat & anti-fuite · Accompagnement business (organisation, fiscalité avec partenaires experts-comptables, éducation financière).

### 5.4 Créatrices (/createurs)
Avantages, attentes (majorité, régularité, professionnalisme), étapes de candidature, témoignages, et un SIMULATEUR DE POTENTIEL : sliders (abonnés actifs, prix d'abonnement, % d'abonnés qui achètent du contenu, panier moyen mensuel) → revenu brut estimé, revenu net après plateforme (20 %), graphique. Mention obligatoire : "Simulation indicative et non contractuelle. Les résultats dépendent de nombreux facteurs."

### 5.5 Candidature créatrice (/candidature) — formulaire multi-étapes avec barre de progression, sauvegarde locale du brouillon
Étape 1 Identité : nom de scène, prénom, email, téléphone, messagerie préférée (WhatsApp/Telegram/Signal/Email) + identifiant, pays, fuseau, date de naissance (contrôle ≥ 18 ans bloquant).
Étape 2 Présence : plateformes actuelles (multi-choix + liens), réseaux sociaux (Instagram, TikTok, X, Reddit, autre : lien + nombre d'abonnés), revenus mensuels actuels (tranches : 0 / <1k / 1–5k / 5–15k / 15–50k / 50k+ €).
Étape 3 Projet : objectifs (texte), disponibilité hebdo pour créer (heures), visage visible (oui/non/à discuter), langues, niveau de contenu envisagé (SFW / suggestif / à discuter en privé), comment nous avez-vous connus.
Étape 4 Validation : résumé, cases : "Je certifie être majeure" (obligatoire), consentement RGPD (obligatoire), "J'ai compris que cette candidature ne m'engage à rien".
Envoi → crée CreatorApplication (status "new") → page de confirmation élégante ("Réponse sous 48 h") → email de confirmation à la candidate → notification email aux owners.

### 5.6 Carrières (/carrieres, /carrieres/:slug)
Liste des JobPosting actifs (filtres type/langue/télétravail). Page offre : missions, profil, rémunération, process. Formulaire : nom, email, téléphone, pays, langues, disponibilités, expérience, CV (UploadFile, PDF), motivation, consentement RGPD + TEST D'ÉCRITURE intégré (3 situations, réponse écrite libre) :
1. "Un nouvel abonné vient de s'abonner et écrit juste 'salut'. Rédige un message d'accueil qui donne envie de répondre."
2. "Un abonné écrit : 'ton contenu est trop cher'. Réponds."
3. "Un abonné fidèle n'a pas écrit depuis 3 semaines. Écris un message de relance."
À l'envoi : crée JobApplication, puis InvokeLLM note le test (cf. section 8.4) et enregistre ai_score + ai_feedback (visibles uniquement par owner/manager). Email de confirmation au candidat.

### 5.7 Académie (/academie) — page vitrine
Présente l'Académie VAYNORA (programme des modules, parcours par métier, certification, coach IA, simulateur). Les contenus des leçons restent privés. CTA "Rejoindre l'équipe".

### 5.8 La Maison & Charte (/maison)
Manifeste, valeurs, charte éthique publique (10 engagements), équipe (optionnel, depuis SiteSettings).

### 5.9 Journal (/journal, /journal/:slug)
Blog SEO (entité BlogPost) : liste avec catégories, article avec table des matières, temps de lecture, articles liés, CTA candidature. Articles de démo (SFW, utiles aux créatrices) : "Protéger son anonymat en 10 réflexes", "Comment choisir une agence sans se faire piéger", "Calendrier de contenu : la méthode 1 shooting = 1 mois".

### 5.10 Contact (/contact)
Formulaire (nom, email, sujet : Créatrice / Partenariat / Presse / Autre, message, consentement) → ContactMessage + email aux owners. Coordonnées depuis SiteSettings.

### 5.11 Légal
/mentions-legales, /confidentialite, /cgu, /charte-ethique : modèles complets et sérieux avec des champs à compléter clairement signalés [RAISON SOCIALE], [SIRET], [ADRESSE], [EMAIL DPO], [HÉBERGEUR].

### 5.12 404 élégante + bandeau cookies + balises SEO (title/description/OpenGraph par page, éditables via SiteSettings pour l'accueil).

## 6. VAYNORA OS — ESPACE PRIVÉ (/app, connexion obligatoire)
Layout : sidebar (monogramme, sections filtrées par rôle, repliable), topbar (recherche globale, cloche de notifications, menu avatar), fil d'Ariane. Après la 1re connexion d'un utilisateur, un écran d'onboarding lui fait compléter display_name, timezone, languages.

### 6.1 Tableau de bord (/app) — par rôle
- owner/manager : KPIs agrégés du mois (revenu net total des créatrices, commission agence, créatrices actives, nouveaux abonnés, taux de conversion PPV moyen), graphique revenus 12 semaines, pipeline candidatures, alertes (incidents ouverts, conformité incomplète, rapports de shift manquants, apprenants en retard), tâches du jour.
- chatter : prochains shifts, créatrices assignées (accès rapide bible du persona + carte des limites), ses KPIs de la semaine, progression académie, annonces.
- creator : ses KPIs, son calendrier, ses demandes custom à valider, messages de son manager, prochain point.
- recruit : progression des parcours assignés, prochaine leçon, échéances.

### 6.2 Académie (/app/academie)
Structure : LearningPath (parcours) → AcademyModule (modules) → Lesson (leçons) + Quiz (un par module).
Apprenant :
- Catalogue des parcours assignés et ouverts (cartes avec progression %).
- Page module : objectifs, liste des leçons (cochées si terminées), durée, quiz.
- Page leçon : contenu Markdown rendu proprement (titres, listes, tableaux, citations, gras), vidéo optionnelle (URL YouTube/Vimeo/Loom), ressources téléchargeables, "À retenir", bouton "Marquer comme terminée", navigation précédente/suivante, notes personnelles (sauvegardées), bouton "Demander au coach IA".
- Déverrouillage séquentiel : un module se débloque quand le précédent est validé (quiz ≥ seuil, défaut 80 %).
- Quiz : QCM (une ou plusieurs bonnes réponses), vrai/faux, réponse courte (corrigée par IA, cf. 8.3). Affichage des explications après soumission. 3 tentatives par 24 h.
- Certificat : à la fin d'un parcours (tous modules validés), génère un Certificate (code unique VAY-AAAA-XXXXXX), page certificat imprimable élégante (noir/or, nom, parcours, date, score moyen, code), page publique de vérification /verifier/:code.
- Badges (premier module, série de 7 jours, 100 % à un quiz, parcours terminé) et classement (opt-in) par points.
Admin/manager (/app/academie/admin) :
- CRUD parcours, modules, leçons, quiz (éditeur Markdown avec aperçu, réordonnancement par glisser-déposer).
- Assignation de parcours à des utilisateurs (PathAssignment avec échéance).
- Suivi des apprenants : tableau progression par personne/module, scores, tentatives, retards, export CSV.
- IMPORT MARKDOWN : une zone où je colle le texte complet d'un module (format ci-dessous) → parse → aperçu (module, leçons, questions) → bouton "Importer". Le parseur doit être DÉTERMINISTE (code, pas IA) avec ces règles :
  • Ligne commençant par "# " = titre du module (retirer le préfixe "Module N — " pour le titre, garder N comme ordre).
  • Ligne commençant par "> " juste après le titre = métadonnées (durée, niveau, parcours).
  • Texte entre le titre et le premier "## " = description du module.
  • Chaque section "## Leçon N.M — Titre" = une leçon (contenu = tout jusqu'au prochain "## "). Toute autre section "## Titre" qui ne commence pas par "Quiz" devient aussi une leçon portant ce titre.
  • La section "## Quiz…" contient les questions : chaque question commence par "**Q<n>.**" ; options = lignes "- A) …", "- B) …" ; réponse = ligne "> ✅ Réponse : B — explication" (plusieurs lettres possibles "A, C"). Si une question n'a pas d'options → type "short_answer" et la ligne "> ✅ Réponse attendue : …" donne la réponse modèle.
  • Dans une leçon, un bloc "### À retenir" alimente aussi key_takeaways (une puce = un élément).
  • Durée d'une leçon = nombre de mots / 200, arrondi à la minute supérieure.
  • Option "Remplacer le module s'il existe déjà (même numéro)".
  Si le parseur échoue, proposer un bouton "Analyser avec l'IA" (InvokeLLM avec response_json_schema) en secours.

### 6.3 Coach IA & Simulateur (/app/coach, /app/simulateur)
- Coach IA : chat contextualisé (leçon en cours ou question libre) — cf. 8.1. Historique sauvegardé par utilisateur.
- Simulateur de conversation : l'apprenant choisit un scénario d'abonné et une créatrice-persona (fictive ou réelle s'il y est assigné) ; l'IA joue l'abonné ; l'apprenant répond comme s'il gérait les messages ; bouton "Terminer et évaluer" → score détaillé — cf. 8.2. Sessions sauvegardées (RoleplaySession), visibles par les managers. Scénarios : Le nouveau timide · Le négociateur · Le fidèle bavard · Le pressé · Le dormant · Le sceptique ("c'est vraiment toi ?") · Le fan en difficulté (soucis d'argent/tristesse : la bonne réponse est de NE PAS vendre et d'escalader) · Le profil à risque (indices de minorité : la bonne réponse est d'arrêter et d'escalader).

### 6.4 CRM Créatrices (/app/createurs)
- Vue Kanban du pipeline : Candidature → Contactée → Appel planifié → Proposition → Contrat signé → Onboarding → Active → En pause → Sortie. Glisser-déposer met à jour le statut + horodatage dans l'historique.
- Vue tableau filtrable (statut, manager, plateforme, niche, revenus).
- Fiche créatrice (onglets) : Profil (nom de scène, coordonnées privées masquées par défaut, pays, fuseau, langues, plateformes et liens, niche, avatar SFW) · Persona (bible du persona en Markdown : résumé, voix, emojis signature, sujets OK, sujets interdits, infos à ne jamais révéler) · Carte des limites (accepté / refusé / sous conditions, prix planchers customs, dernière mise à jour + validée par la créatrice) · Contrat (dates, commission %, base de calcul, préavis, fichier PDF) · Équipe (manager, chatters assignés) · Objectifs & KPIs (graphiques) · Contenu (calendrier) · Conformité (checklist) · Notes & historique (timeline de toutes les actions).
- Conversion d'une CreatorApplication en Creator en un clic (pré-remplissage).

### 6.5 Conformité & incidents (/app/conformite)
- Checklist par créatrice (ComplianceItem) : majorité vérifiée (date + vérificateur), contrat signé, carte des limites validée < 90 jours, bible du persona validée, 2FA activée sur les comptes, co-créateurs vérifiés et déclarés sur la plateforme, mention de l'équipe dans la bio, point bien-être < 30 jours. Score de conformité % + alerte si < 100 %.
- Registre des incidents (Incident) : types (fan possiblement mineur, demande illégale, harcèlement/menace, chantage/sextorsion, fuite de contenu, détresse d'un fan, violation de charte interne, sécurité/accès, autre), gravité, description, preuves (texte), actions, statut (ouvert/en cours/clos), responsable. Tout utilisateur connecté peut déclarer un incident (formulaire rapide accessible partout via un bouton "Signaler" dans la topbar). Alerte email aux owners pour gravité haute.

### 6.6 Recrutement équipe (/app/recrutement)
Kanban candidatures (Nouveau → Test évalué → Entretien → Mise en situation → Offre → Embauché → Refusé), fiche candidat (réponses au test, score IA, feedback, CV, notes, planification d'entretien), bouton "Créer l'accès recrue" (invite l'utilisateur avec team_role recruit + assigne le parcours Chatter). Gestion des offres (JobPosting).

### 6.7 Opérations chatters (/app/operations)
- Planning des shifts : calendrier semaine par créatrice et par chatter, création rapide par glisser, détection des trous de couverture (affichage des heures non couvertes), fuseaux respectés, export.
- Rapport de fin de shift (ShiftReport) : créatrice, début/fin, messages envoyés, PPV envoyés, PPV vendus, revenus PPV, tips, nouveaux abonnés accueillis, fans réactivés, incidents (lien vers déclaration), notes de passation. Calculs auto : taux de conversion, revenu/heure. Rappel visuel si un shift terminé n'a pas de rapport.
- Passation : la dernière note de passation de chaque créatrice s'affiche en haut de la page de prise de poste.
- Bibliothèque de scripts (Script) : catégories (accueil, qualification, lien, suggestion, objection, après-vente, relance, réactivation, situations sensibles), persona/archétype, langue, contenu, variables {prénom}, bouton copier, vote "utile", statut approuvé (seuls les scripts approuvés par un manager sont visibles des chatters).
- Notes fans (FanNote) : par créatrice — pseudo, segment (Nouveau, Curieux, Occasionnel, Régulier, VIP, Dormant, Expiré), centres d'intérêt, préférences, ce qu'il a déjà acheté (références de contenu), dépenses estimées, alertes (ex : "signes de difficultés financières : ne pas solliciter"), dernière interaction. Pas de données sensibles ni d'identité réelle. Recherche instantanée.

### 6.8 Contenu (/app/contenu)
- Calendrier éditorial (mois/semaine/liste) par créatrice : type (post feed, story, message de masse, PPV, live, réseau social SFW), plateforme, titre, description/caption, date-heure, statut (idée → planifié → prêt → publié), prix si PPV, assigné à.
- Briefs de shooting (ShootBrief) : thème, tenues, décors, lumière, shot list par niveau, formats, consignes anonymat, date.
- Demandes custom (CustomRequest) : pseudo fan, description, prix, deadline, statut (reçue → à valider par la créatrice → validée → en production → livrée → refusée). La créatrice valide ou refuse depuis son espace ; rien n'est promis au fan avant validation.
- Générateur d'idées IA SFW (cf. 8.5).

### 6.9 KPIs & Analytics (/app/kpis)
- Saisie hebdomadaire par créatrice (KPIEntry) : revenus par source (abonnements, messages/PPV, tips, posts payants, autres), devise, abonnés actifs, nouveaux, expirés, renouvellement activé (%), clics par source de trafic, coût marketing.
- Calculs automatiques : revenu net (après 20 % plateforme), ARPU, % de payeurs, churn, taux de conversion trafic, CAC, croissance vs semaine précédente.
- Graphiques : évolution des revenus, répartition par source (donut), abonnés, top créatrices, classement des chatters (revenu/heure, conversion, qualité).
- Objectifs mensuels par créatrice avec jauges.
- Bouton "Analyse IA de la semaine" (cf. 8.6). Export CSV.

### 6.10 Finance (/app/finance) — owner uniquement (manager en lecture sur ses créatrices)
- Relevé mensuel par créatrice (CommissionStatement) : revenu brut, frais plateforme, revenu net, taux de commission, commission agence, part équipe chat, statut (brouillon → envoyé → payé → en retard), n° de facture, date d'échéance. Génération auto depuis les KPIEntry du mois. Vue imprimable.
- Rémunération de l'équipe : calcul par chatter (heures × taux + % commission sur ventes de ses shifts).
- Vue P&L simplifiée : commissions encaissées, coûts équipe, marketing, autres coûts (saisie libre), marge.
- Simulateur de rentabilité (créatrices, revenu moyen, commission, coûts) → marge et point mort.

### 6.11 Tâches, SOP, Annonces
- Tâches (Task) : liste + kanban, assignation, créatrice liée, priorité, échéance, commentaires.
- SOP (SOP) : bibliothèque de procédures en Markdown, versionnées, catégories, recherche.
- Annonces (Announcement) : épinglées, ciblées par rôle, accusé de lecture.
- Notifications (Notification) : nouvelles candidatures, tâches assignées, quiz validés, incidents, demandes custom à valider.

### 6.12 Espace créatrice (/app/mon-espace) — team_role creator
Accueil chaleureux, ses KPIs, son relevé mensuel, son calendrier, ses demandes custom à valider (boutons Valider/Refuser + commentaire), sa carte des limites (modifiable : toute modification notifie son manager et horodate la version), sa bible du persona (lecture + suggestions), ses documents, son parcours de formation créatrice, bouton "Demander un point" et bouton "Signaler un problème" (confidentiel).

### 6.13 Administration (/app/admin) — owner
Utilisateurs & rôles (inviter, changer team_role, assigner des créatrices, désactiver), SiteSettings (chiffres de l'accueil, réseaux, coordonnées, SEO accueil, textes de l'annonce en haut du site), contenus publics (Testimonial, FAQ, BlogPost, JobPosting), journal d'activité.

## 7. MODÈLE DE DONNÉES (entités Base44 — les champs id/created_date/updated_date/created_by sont automatiques)
- SiteSettings : stats (object : creators_count, retention_rate, countries_count), contact_email, phone, socials (object), seo_title, seo_description, top_banner_text, team (array)
- Testimonial : display_name, role_label, quote, rating, is_published, order
- FAQ : question, answer, category (home, createurs, carrieres), order, is_published
- BlogPost : title, slug, excerpt, content_md, cover_url, category, tags (array), reading_minutes, is_published, published_at, seo_title, seo_description
- ContactMessage : name, email, subject, message, consent, status (new, handled)
- CreatorApplication : stage_name, first_name, email, phone, messaging_app, messaging_handle, country, timezone, birthdate, is_adult_confirmed, platforms (array), social_links (array d'objets {network, url, followers}), monthly_revenue_range, goals, weekly_hours, face_visible, languages (array), content_level, source, consent_gdpr, status (new, contacted, call_scheduled, proposal, accepted, rejected), score (0-100), assigned_to, notes
- Creator : stage_name, first_name_private, email_private, phone_private, country, timezone, languages (array), platforms (array d'objets {platform, handle, url, subscribers, price}), niche, archetype, avatar_url, status (candidature, contactee, appel, proposition, contrat_signe, onboarding, active, pause, sortie), status_history (array {status, date, by}), age_verified (boolean), age_verified_at, age_verified_by, persona_md, limits (object {accepted: [], refused: [], conditional: [], custom_price_floors: string, validated_by_creator_at}), contract_start, contract_end, commission_rate, commission_base, notice_days, contract_file_url, manager_email, chatter_emails (array), monthly_goal, tags (array), notes
- LearningPath : title, slug, description, target_role (chatter, manager, recruiter, direction, creator, all), module_ids (array ordonné), cover_url, is_published, passing_score (défaut 80)
- AcademyModule : number, title, description, meta (durée/niveau/parcours), objectives (array), order, is_published
- Lesson : module_id, number_label (ex "7.3"), title, order, content_md, video_url, duration_min, resources (array {label, url}), key_takeaways (array)
- Quiz : module_id, title, passing_score, max_attempts_per_day (3), questions (array {id, type: single|multiple|true_false|short_answer, prompt, options: [], correct: [indices], expected_answer, explanation, points})
- PathAssignment : user_email, path_id, assigned_by, due_date, status (assigned, in_progress, completed)
- LessonProgress : user_email, lesson_id, module_id, status (started, completed), completed_at, personal_notes
- QuizAttempt : user_email, quiz_id, module_id, answers (array), score, passed, ai_feedback
- Certificate : user_email, user_name, path_id, path_title, code, issued_at, average_score
- Badge : user_email, key, label, earned_at
- CoachConversation : user_email, lesson_id, messages (array {role, content, at})
- RoleplaySession : user_email, scenario, creator_persona, transcript (array {role, content}), score, sub_scores (object), strengths (array), improvements (array), ideal_reply, red_flag (boolean)
- JobPosting : title, slug, type (chatter, account_manager, social_media, recruiter, other), description_md, requirements (array), compensation, languages (array), remote (boolean), is_active
- JobApplication : job_id, full_name, email, phone, country, languages (array), availability, experience, cv_url, motivation, test_answers (array de 3), ai_score, ai_feedback, consent_gdpr, status (new, test_scored, interview, roleplay, offer, hired, rejected), interview_at, notes
- Shift : chatter_email, creator_id, start, end, status (planned, done, missed)
- ShiftReport : shift_id, chatter_email, creator_id, date, start, end, messages_sent, ppv_sent, ppv_sold, ppv_revenue, tips_revenue, new_fans_welcomed, fans_reactivated, incidents_count, handover_notes
- Script : title, category, archetype, language, content, notes, upvotes, is_approved, author_email
- FanNote : creator_id, fan_handle, segment, interests (array), preferences, purchased_refs (array), estimated_spend, alerts (array), last_interaction, notes, updated_by
- ContentItem : creator_id, type, platform, title, caption, scheduled_at, status, price, assigned_to, asset_ref
- ShootBrief : creator_id, date, theme, outfits, sets_md, formats, anonymity_checklist (array), status
- CustomRequest : creator_id, fan_handle, description, price, currency, deadline, status, creator_comment, validated_at
- KPIEntry : creator_id, week_start, currency, revenue_subscriptions, revenue_messages, revenue_tips, revenue_posts, revenue_other, active_subs, new_subs, expired_subs, renew_on_rate, traffic (array {source, clicks, new_subs, cost}), marketing_cost, notes
- CommissionStatement : creator_id, month (AAAA-MM), gross_revenue, platform_fee, net_revenue, commission_rate, commission_amount, chat_team_share, status, invoice_number, due_date, paid_at
- ComplianceItem : creator_id, key, label, status (ok, missing, expired), checked_at, checked_by, notes
- Incident : type, severity (low, medium, high, critical), creator_id, description, evidence, actions_taken, status, reported_by, owner_email
- Task : title, description, assignee_email, creator_id, priority, due_date, status (todo, doing, done), comments (array)
- SOP : title, category, content_md, version, owner_email, updated_note
- Announcement : title, content_md, audience_roles (array), pinned, read_by (array)
- Notification : user_email, type, title, link, is_read

## 8. FONCTIONS IA (intégration InvokeLLM)
Règle commune injectée dans chaque prompt système : "Tu es un assistant professionnel de VAYNORA House. Tu restes strictement SFW, sans aucun contenu sexuel explicite. Tu refuses toute demande illégale, impliquant des mineurs, non consentie, ou contraire à la charte éthique (fausses promesses de rencontre, fausses urgences, pression sur des personnes vulnérables, fausse exclusivité). Tu réponds en français."
8.1 Coach IA : contexte = contenu Markdown de la leçon (si ouverte) + rôle de l'utilisateur. Répond aux questions, donne des exemples, renvoie vers la leçon concernée, propose un mini-exercice.
8.2 Simulateur : l'IA joue l'abonné du scénario choisi (messages courts, style chat réaliste, 1–3 phrases, SFW, cohérent avec le scénario). Après "Terminer", appel d'évaluation avec response_json_schema { score (0-100), sub_scores { accueil_ton (15), ecoute_personnalisation (20), methode_house (20), objections (15), ethique (20), ecriture (10) }, strengths [], improvements [], ideal_reply, red_flag (boolean), red_flag_reason }. Toute violation de la charte (promesse de rencontre, fausse urgence, insistance auprès d'un fan en difficulté, poursuite de la vente avec un profil possiblement mineur) → red_flag = true et score plafonné à 40.
8.3 Correction des questions à réponse courte : compare la réponse à expected_answer → { score 0–1, feedback }.
8.4 Notation du test d'écriture candidat : grille /100 (orthographe & syntaxe 25, personnalisation & chaleur 25, intelligence commerciale 25, respect de l'éthique 25) → { ai_score, ai_feedback }.
8.5 Générateur d'idées de contenu SFW pour les réseaux sociaux (Instagram, TikTok, X, Reddit SFW) à partir du persona et de la niche de la créatrice : 10 idées avec accroche, format, caption, hashtags ; doit respecter les règles des plateformes.
8.6 Analyse KPI hebdomadaire : à partir des 8 dernières KPIEntry d'une créatrice → { resume, points_forts [], alertes [], actions_prioritaires [3] }.
8.7 Secours d'import Markdown (si le parseur déterministe échoue).

## 9. EMAILS (intégration SendEmail) — style sobre noir/or, signature "L'équipe VAYNORA House"
Confirmation candidature créatrice · Notification owners nouvelle candidature · Confirmation candidature équipe · Invitation recrue + parcours assigné · Certificat obtenu · Incident de gravité haute (owners) · Demande custom à valider (créatrice) · Relevé mensuel disponible (créatrice).

## 10. DONNÉES DE DÉMO (à créer au premier lancement, marquées "Exemple")
- SiteSettings par défaut (stats : 40 créatrices, 92 % rétention, 6 pays — modifiables).
- 3 témoignages (pseudos), FAQ ci-dessus, 3 articles du Journal.
- 4 offres : Chatter francophone, Chatter anglophone, Account Manager, Social Media Manager SFW.
- Parcours : "Fondamentaux VAYNORA" (modules 0, 1, 2), "Chatter certifié" (0, 1, 2, 7, 8, 9, 13, 15, 16, 17), "Account Manager" (0 à 6, 9, 11, 12, 13, 15, 16, 17), "Recruteur·se talents" (0, 1, 2, 3, 4, 13, 15, 16, 17), "Direction d'agence" (0 à 17), "Parcours Créatrice" (0, 1, 2, 4, 5, 6, 13, 17). Créer les 18 modules vides avec ces titres (le contenu sera importé) :
  0 Bienvenue chez VAYNORA House · 1 L'écosystème des plateformes d'abonnement · 2 Cadre légal, conformité & éthique · 3 Recruter & signer des créatrices · 4 Onboarding, persona & stratégie de compte · 5 Production & gestion du contenu · 6 Marketing & acquisition de trafic · 7 Chatting I — Fondamentaux & méthode HOUSE · 8 Chatting II — Monétisation avancée & rétention · 9 Outils, sécurité & opérations · 10 Recruter, former & manager les chatters · 11 KPIs, analytics & pilotage · 12 Finance, fiscalité & modèle économique · 13 Bien-être, sécurité & protection des créatrices · 14 Scaler VAYNORA House · 15 Examen final de certification · 16 Boîte à outils : templates & SOP · 17 Glossaire
- 2 créatrices fictives ("Exemple — Luna", "Exemple — Jade") avec persona, limites, 8 semaines de KPIs, quelques contenus et notes fans fictives SFW.
- 12 scripts approuvés (accueil, qualification, relance, objection prix, après-vente, transparence "c'est vraiment toi ?", refus de rencontre, fan en difficulté…), tous SFW.

## 11. QUALITÉ & CRITÈRES D'ACCEPTATION
- Toutes les pages publiques sont accessibles sans connexion et parfaites sur mobile.
- Chaque formulaire valide les champs, affiche des erreurs claires, bloque les mineures, enregistre le consentement.
- Un chatter connecté ne peut voir aucune donnée d'une créatrice non assignée ; une créatrice ne voit que ses données.
- L'import Markdown d'un module crée correctement leçons et quiz.
- Un apprenant peut suivre un parcours complet, passer les quiz, obtenir un certificat vérifiable.
- Le simulateur joue l'abonné, évalue et détecte les violations éthiques.
- Les KPIs se calculent automatiquement, les graphiques s'affichent, l'export CSV fonctionne.
- États vides illustrés et utiles partout ("Aucune tâche — profite-en pour avancer ta formation").
- Aucune erreur console, chargements fluides, design cohérent noir/ivoire/or sur toutes les pages.
```

---

## Après la génération : checklist de contrôle

- [ ] Ouvre le site sur ton téléphone : le hero, le menu et les formulaires sont-ils impeccables ?
- [ ] Teste une candidature avec une date de naissance < 18 ans → doit être bloquée.
- [ ] Crée 3 comptes de test (manager, chatter, creator) et vérifie les cloisonnements.
- [ ] Importe le module 0 (`formation/module-00-bienvenue.md`) via l'import Markdown.
- [ ] Lance une session de simulateur « Le sceptique » puis « Le fan en difficulté ».
- [ ] Remplis les mentions légales ([RAISON SOCIALE], [SIRET]…) avant toute mise en ligne.
