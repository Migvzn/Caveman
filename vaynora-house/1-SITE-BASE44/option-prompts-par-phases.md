# 🧱 OPTION — PROMPTS PAR PHASES (alternative au prompt unique `PROMPT-BASE44-VAYNORA-HOUSE.txt`)

> **Pourquoi par phases ?** Base44 donne de bien meilleurs résultats quand on lui demande **une fonctionnalité à la fois**. Tu testes, tu corriges, puis tu passes à la suivante. Moins de bugs, moins de crédits gaspillés, et tu gardes le contrôle.
>
> **Règles d'or :**
> 1. Colle **un seul prompt à la fois**, dans l'ordre.
> 2. Après chaque phase, fais les **tests indiqués** (✅). Si quelque chose casse, utilise les prompts correctifs de `option-prompts-bonus-et-correctifs.md` *avant* de continuer.
> 3. Si Base44 propose de « revenir en arrière » après une régression, accepte plutôt que d'empiler des correctifs.
> 4. Ne change pas les noms d'entités en cours de route : toutes les phases s'appuient dessus.

---

## PHASE 1 — Fondations, design system & rôles

```text
Crée l'application "VAYNORA House" : site d'une agence de management de créatrices de contenu sur plateformes d'abonnement (OnlyFans, Fansly, MYM) + un espace privé "VAYNORA OS" (tableau de bord d'agence + Formation OFM). Interface 100 % en français. Dans cette phase, construis UNIQUEMENT les fondations.

1) DESIGN SYSTEM (simple, clair, moderne — à réutiliser partout, centralisé) :
- Couleurs : blanc #FFFFFF (fond), lavande #F7F5FF (sections alternées, fond de l'espace privé), ligne #E6E2F2, violet nuit #1B1036 (bandeaux sombres, sidebar, footer), violet #3D2A78, violet doux #EFEBFF, bleu #2F5BFF (couleur d'action unique), bleu foncé #2447D6 (survol), bleu doux #E9EEFF, bleu ciel #7FA2FF (accents sur fond sombre), titres #16112B, texte #2E2947, texte secondaire #625D79. Statuts : succès #0CA30C, attention #FAB219, important #EC835A, critique #D03B3B (toujours avec icône + libellé).
- Une seule police Google : "Plus Jakarta Sans" (400 à 800). Titres en 800, letter-spacing -0.02em. Surtitres = petites pastilles arrondies (fond violet doux, texte violet, 12 px, capitales). Pas de serif.
- Composants réutilisables : Button (rayon 12 px, hauteur 48 px ; primaire fond bleu texte blanc ; secondaire fond blanc bordure #E6E2F2 ; variante claire pour fond sombre), Card (blanc, bordure 1 px #E6E2F2, rayon 16–18 px), Input/Select/Textarea (blanc, bordure 1,5 px, rayon 10 px, focus bordure bleue + halo bleu doux), Chip de statut arrondie, SectionTitle (pastille + titre + sous-titre), NightBand (bandeau violet nuit avec halos radiaux bleu/violet discrets), EmptyState, Skeleton.
- Ambiance : simple, nette, rassurante, beaucoup d'espace blanc ; animations douces (fade-up 0.5 s), prefers-reduced-motion respecté. Icônes lucide-react (trait 1.8). Ni doré, ni noir profond.
- Logo : carré arrondi violet nuit avec un "V" blanc aux traits arrondis et un point bleu au-dessus + wordmark "VAYNORA" (800, capitales, letter-spacing 0.12em) avec "HOUSE" en petit dessous, en bleu. Favicon = le carré.

2) LAYOUT PUBLIC : header sticky blanc flouté avec logo, liens (Méthode, Services, Formules, Créatrices, Formation, Carrières, Journal), bouton secondaire "Espace équipe" et bouton primaire "Candidater" ; menu plein écran sur mobile. Footer violet nuit : logo, baseline "Votre talent. Notre maison.", liens, réseaux, mention "Réservé aux personnes majeures · Site sans contenu explicite", liens légaux, © année. Bandeau cookies RGPD (Accepter / Refuser / Personnaliser, choix mémorisé).

3) LAYOUT PRIVÉ (/app, connexion obligatoire) : sidebar violet nuit repliable (logo, sections regroupées Pilotage / Équipe / Apprendre / Agence, élément actif = pastille bleue, compteurs), contenu sur fond lavande, topbar claire (titre, emplacement pour un sélecteur de mois, recherche, cloche de notifications, menu avatar), fil d'Ariane. Page "Accès réservé" pour les rôles non autorisés.

4) RÔLES : ajoute à l'entité User les champs team_role (enum owner, manager, chatter, creator, recruit ; défaut recruit), display_name, phone, timezone (défaut Europe/Paris), languages (array), status (active, paused, offboarded), assigned_creator_ids (array), creator_id, hourly_rate, commission_rate, avatar_url, onboarding_done (boolean). Les admins Base44 sont "owner". Crée un hook/utilitaire useRole() et un composant RoleGuard(allowedRoles) réutilisables. La sidebar n'affiche que les sections autorisées pour le rôle.

5) ONBOARDING : à la première connexion, écran qui demande display_name, timezone, languages puis met onboarding_done = true.

6) ENTITÉ SiteSettings : promises (array {value, label}), stats (object facultatif, affiché seulement si renseigné), contact_email, phone, socials (object instagram/x/tiktok/telegram), seo_title, seo_description, top_banner_text, team (array), agency_name, currency (EUR par défaut), default_commission (40), monthly_goal, fixed_costs. Enregistrement par défaut avec les 4 promesses : "48 h — pour répondre à chaque candidature", "0 € — de frais d'entrée, jamais", "100 % — de votre compte et de vos revenus à votre nom", "19 — modules de formation pour notre équipe".

Crée aussi une page temporaire qui présente le design system (boutons, cartes, champs, pastilles) pour validation, et un tableau de bord /app vide qui affiche "Bonjour {display_name}" et le rôle.
```

✅ **Tests :** le design est-il blanc / bleu / violet nuit, simple, avec des boutons arrondis et la police Plus Jakarta Sans ? Le menu mobile fonctionne ? En te connectant, tu arrives sur l'onboarding puis /app ?

---

## PHASE 2 — Site public : Accueil, Méthode, Services, La Maison

```text
Avec le design system existant, construis les pages publiques suivantes (vouvoiement, SFW strict : uniquement des portraits habillés, du lifestyle, des aperçus stylisés de tableau de bord ou des formes abstraites bleu/violet). N'invente aucune statistique ni aucun témoignage.

PAGE ACCUEIL (/) :
- HERO : surtitre "AGENCE DE MANAGEMENT DE CRÉATRICES", H1 "Votre talent. Notre maison.", sous-titre "VAYNORA House accompagne les créatrices ambitieuses sur OnlyFans, Fansly et MYM : stratégie, croissance, monétisation et protection — avec une transparence totale et un contrat sans piège.", CTA "Rejoindre la House" (/candidature) et "Découvrir la méthode" (/methode), réassurance "✓ Votre compte et vos revenus restent à votre nom · ✓ Contrat clair et résiliable · ✓ Réponse sous 48 h". Fond violet nuit avec halos bleu/violet discrets ; à droite, un aperçu stylisé du tableau de bord (3 KPI, une courbe, 3 barres de modèles) avec la pastille « Exemple ».
- PROMESSES : 4 cartes blanches qui chevauchent le bas du hero, depuis SiteSettings.promises (48 h, 0 €, 100 %, 19 modules).
- LE CONSTAT : titre "Créer, poster, répondre, vendre, se protéger… seule, c'est un second temps plein." + 3 cartes (Des heures perdues dans les messages / Une croissance qui stagne / La peur des fuites et du harcèlement) avec un texte court chacune.
- LA HOUSE À 360° : 6 cartes services (Stratégie & branding, Marketing & trafic, Gestion des messages & monétisation, Production & calendrier, Protection & anti-fuite, Accompagnement business) → liens vers /services#ancre.
- LE CYCLE VAYNORA : timeline 01 Audit, 02 Identité, 03 Lancement, 04 Croissance, 05 Pérennité.
- NOS ENGAGEMENTS : Transparence, Contrôle, Consentement, Sécurité, Contrat juste, Éthique (une phrase forte chacun).
- UNE ÉQUIPE FORMÉE : bandeau violet nuit "Chaque membre de l'équipe suit notre formation interne : 19 modules, 156 leçons, 13 ateliers pratiques, 6 parcours" + lien /formation.
- POUR QUI ? : Vous débutez / Vous stagnez / Vous voulez passer à l'échelle.
- TÉMOIGNAGES : entité Testimonial (display_name, role_label, quote, rating, is_published, order) en carrousel, section masquée tant qu'aucun témoignage réel n'est publié (n'en crée aucun).
- FAQ : entité FAQ (question, answer, category, order, is_published) en accordéon, catégorie "home". Crée ces 8 questions : commission (écrite au contrat, sur revenus nets, aucun frais d'entrée) ; contrôle du compte (compte, contenus et paiements restent à votre nom) ; visage (stratégies anonymes possibles) ; qui répond aux abonnés (équipe formée par notre Formation OFM, dans votre ton et selon vos règles, mention transparente recommandée en bio, vous pouvez reprendre la main) ; arrêter (préavis prévu au contrat, sans pénalité abusive) ; anonymat (protocole de confidentialité, métadonnées, surveillance des fuites, retraits) ; débutante (oui si majeure, motivée, régulière) ; versement des revenus (directement par la plateforme sur votre compte, commission facturée chaque mois sur relevé détaillé).
- CTA FINAL : "Votre place est peut-être ici." + bouton "Candidater en 5 minutes".

PAGE MÉTHODE (/methode) : récit du Cycle VAYNORA. Pour chaque étape : objectifs, livrables, durée — Audit (J1–J7, rapport d'audit + plan d'action), Identité (J7–J14, bible du persona, profil, prix), Lancement (J14–J45, shooting, calendrier 30 jours, campagnes, équipe messages), Croissance (M2–M6, acquisition multi-canal, optimisation des ventes, revues hebdo), Pérennité (M6+, diversification, rétention, protection, préparation de l'après). Bloc "Ce que vous recevez chaque mois".

PAGE SERVICES (/services) : 6 sections ancrées avec "Ce que nous faisons" (5 puces) et "Ce que vous gagnez" (3 puces).

PAGE FORMULES (/formules) : 3 cartes (Essentiel « Vous gérez vos messages, nous gérons la stratégie » ; Croissance « Plus d'abonnés, une stratégie qui tourne », mise en avant « La plus choisie » ; Complet « Vous créez, nous gérons tout le reste »), chacune avec 5 puces de services et la mention « Commission écrite au contrat, calculée sur vos revenus nets » (aucun pourcentage affiché, aucun frais d'entrée), puis un tableau comparatif services × formules et un CTA "Candidater".

PAGE LA MAISON (/maison) : manifeste, valeurs, et la charte éthique en 10 engagements : 1 Majorité vérifiée, toujours. 2 Le consentement d'abord : la carte des limites est sacrée et révocable. 3 La créatrice garde le contrôle de son compte, de ses contenus et de ses revenus. 4 Transparence financière totale. 5 Honnêteté envers les abonnés : ni fausses promesses, ni fausses urgences, ni fausse exclusivité. 6 Protection des personnes vulnérables. 7 Confidentialité absolue. 8 Respect des règles des plateformes et de la loi. 9 Respect et zéro jugement. 10 Excellence et formation continue.

Ajoute les balises SEO (title, description, OpenGraph) sur chaque page.
```

✅ **Tests :** lis tout sur mobile, vérifie les ancres, les promesses, l'accordéon, la page Formules.

---

## PHASE 3 — Candidature créatrice, page Créatrices & simulateur

```text
Construis :

1) PAGE CRÉATRICES (/createurs) : avantages, attentes (majorité, régularité, professionnalisme), étapes de candidature (4 étapes illustrées), témoignages, FAQ catégorie "createurs", et un SIMULATEUR DE POTENTIEL : sliders abonnés actifs (0–5000), prix d'abonnement (0–50 $), % d'abonnés acheteurs (0–60 %), panier moyen mensuel par acheteur (0–300 $) → revenu brut estimé = abonnés × prix + abonnés × % acheteurs × panier ; revenu net = brut × 0,8 ; affichage en grand + petit graphique de répartition. Mention : "Simulation indicative et non contractuelle. Les résultats dépendent de nombreux facteurs."

2) ENTITÉ CreatorApplication : stage_name, first_name, email, phone, messaging_app, messaging_handle, country, timezone, birthdate, is_adult_confirmed, platforms (array), social_links (array {network, url, followers}), monthly_revenue_range, goals, weekly_hours, face_visible, languages (array), content_level, source, consent_gdpr, status (new, contacted, call_scheduled, proposal, accepted, rejected ; défaut new), score, assigned_to, notes.

3) FORMULAIRE MULTI-ÉTAPES (/candidature), barre de progression, brouillon sauvegardé localement :
- Étape 1 Identité : nom de scène, prénom, email, téléphone, messagerie préférée (WhatsApp/Telegram/Signal/Email) + identifiant, pays, fuseau, date de naissance. Si âge < 18 ans : blocage avec message "Nous travaillons exclusivement avec des personnes majeures. Merci de votre compréhension." et impossibilité de continuer.
- Étape 2 Présence : plateformes actuelles (OnlyFans, Fansly, MYM, Fanvue, Aucune), liens, réseaux sociaux (réseau + lien + abonnés, ajout dynamique), revenus mensuels actuels (0, <1k, 1–5k, 5–15k, 15–50k, 50k+ €).
- Étape 3 Projet : objectifs, heures disponibles par semaine, visage visible (oui/non/à discuter), langues, niveau de contenu envisagé (SFW / suggestif / à discuter en privé), comment nous avez-vous connus.
- Étape 4 Validation : récapitulatif, cases obligatoires "Je certifie être majeure", consentement RGPD (non pré-coché, lien /confidentialite), "J'ai compris que cette candidature ne m'engage à rien".
- À l'envoi : crée la CreatorApplication, redirige vers /candidature/merci (page élégante "Réponse sous 48 h" + 3 conseils en attendant), envoie un email de confirmation à la candidate et un email de notification à tous les owners (SendEmail, style sobre blanc / bleu / violet nuit, bouton bleu arrondi).

4) PAGE CONTACT (/contact) : entité ContactMessage (name, email, subject [Créatrice, Partenariat, Presse, Autre], message, consent, status) + email aux owners. Coordonnées depuis SiteSettings.
```

✅ **Tests :** candidature mineure bloquée ; candidature complète enregistrée ; emails reçus ; simulateur réactif.

---

## PHASE 4 — Carrières, test d'écriture IA, Journal & pages légales

```text
Construis :

1) ENTITÉS : JobPosting (title, slug, type [chatter, account_manager, social_media, recruiter, other], description_md, requirements (array), compensation, languages (array), remote (boolean), is_active) ; JobApplication (job_id, full_name, email, phone, country, languages, availability, experience, cv_url, motivation, test_answers (array de 3 textes), ai_score, ai_feedback, consent_gdpr, status [new, test_scored, interview, roleplay, offer, hired, rejected], interview_at, notes).

2) PAGES /carrieres (liste filtrable) et /carrieres/:slug (missions, profil, rémunération, process en 4 étapes) + formulaire de candidature : infos, CV PDF (UploadFile), motivation, consentement RGPD, et TEST D'ÉCRITURE (3 zones de texte, min 40 caractères chacune) :
 1. "Un nouvel abonné vient de s'abonner et écrit juste 'salut'. Rédige un message d'accueil qui donne envie de répondre."
 2. "Un abonné écrit : 'ton contenu est trop cher'. Réponds."
 3. "Un abonné fidèle n'a pas écrit depuis 3 semaines. Écris un message de relance."
 À l'envoi : crée la JobApplication, puis appelle InvokeLLM avec ce système : "Tu es recruteur senior de VAYNORA House. Évalue ces 3 réponses d'un candidat chatter. Grille /100 : orthographe & syntaxe (25), personnalisation & chaleur (25), intelligence commerciale sans agressivité (25), respect de l'éthique — aucune fausse promesse, aucune pression, aucun contenu explicite (25). Réponds en JSON." avec response_json_schema {ai_score: number, ai_feedback: string}. Mets à jour ai_score, ai_feedback, status = test_scored. Le score n'est JAMAIS affiché au candidat. Email de confirmation au candidat.
 Crée 4 offres d'exemple : Chatter francophone, Chatter anglophone, Account Manager, Social Media Manager (SFW).

3) JOURNAL : entité BlogPost (title, slug, excerpt, content_md, cover_url, category, tags, reading_minutes, is_published, published_at, seo_title, seo_description). Pages /journal (grille + filtres catégories) et /journal/:slug (Markdown rendu, table des matières, temps de lecture, articles liés, CTA candidature). Rédige 3 articles complets (~700 mots, SFW) : "Protéger son anonymat en 10 réflexes", "Choisir une agence sans se faire piéger : 12 signaux d'alerte", "Calendrier de contenu : la méthode 1 shooting = 1 mois".

4) PAGE FORMATION vitrine (/formation) : présente la "Formation OFM VAYNORA" (19 modules, 156 leçons, 13 ateliers pratiques, 6 parcours ; formation explicative sans quiz ni examen) : 6 cartes de ce qu'elle couvre (business de l'OFM, OnlyFans de A à Z, structurer son agence, trouver et signer ses modèles, chatting éthique, piloter et scaler), programme en accordéon (titres des modules et des leçons uniquement), les 6 parcours ; CTA "Rejoindre l'équipe" et "Je suis créatrice".

5) PAGES LÉGALES : /mentions-legales, /confidentialite (RGPD complet : finalités, bases légales, durées de conservation, droits, contact DPO, sous-traitants), /cgu, /charte-ethique. Champs à compléter clairement marqués [RAISON SOCIALE], [SIRET], [ADRESSE], [EMAIL DPO], [HÉBERGEUR]. Page 404 soignée.
```

✅ **Tests :** postule à une offre avec des réponses volontairement mauvaises puis bonnes → les scores IA diffèrent ? Le score est invisible côté candidat ?

---

## PHASE 5 — Formation OFM : structure, lecteur de leçons & progression

```text
Construis la Formation OFM dans l'espace privé (/app/formation). C'est une formation EXPLICATIVE : aucun quiz, aucun examen, aucun certificat, aucun verrouillage. Tout est accessible ; la progression = leçons lues.

ENTITÉS :
- LearningPath : title, slug, description, target_role (chatter, manager, recruiter, direction, creator, all), module_ids (array ordonné), module_numbers (array ordonné), cover_url, is_published.
- FormationModule : number, title, description, meta, objectives (array), order, is_published.
- Lesson : module_id, module_number, number_label ("5.2" ou "Atelier"), title, order, content_md, video_url, duration_min, resources (array {label, url}), key_takeaways (array).
- PathAssignment : user_email, path_id, assigned_by, due_date, status (assigned, in_progress, completed).
- LessonProgress : user_email, lesson_id, module_id, status (read), completed_at, personal_notes.

PAGES APPRENANT :
- /app/formation : carte "Votre progression" (x leçons lues sur le total, barre, bouton "Commencer / Continuer : <prochaine leçon>") ; les parcours en cartes (description, nb de modules, % lu) — choisir un parcours filtre l'affichage sur ses modules, bouton "Tout afficher" ; grille des modules (numéro, titre, durée/niveau, x/y leçons, barre, pastille verte quand tout est lu).
- /app/formation/module/:number : description, encadré "Ce que vous saurez faire" (objectifs), leçons avec cercle coché si lue et durée, bouton "Commencer / Reprendre", module précédent / suivant.
- /app/formation/lecon/:id : fil d'Ariane, pastille "Leçon 5.2 · 4 min", rendu Markdown soigné (react-markdown + remark-gfm : titres, listes, tableaux, citations, gras, cases à cocher) dans une colonne de 760 px max (interlignage 1.75), vidéo optionnelle (YouTube/Vimeo/Loom), ressources, encadré "À retenir" (seulement si le contenu n'a pas déjà sa section "À retenir"), barre de progression de lecture, boutons "Marquer comme lue" (bascule), "Précédente", "Leçon suivante" (marque la leçon comme lue), panneau "Mes notes" (autosave dans LessonProgress.personal_notes). L'enchaînement suit le parcours choisi.
- /app/formation/recherche : recherche plein texte dans les titres et contenus, insensible aux accents, extraits avec mots surlignés.

Ne crée aucun module à la main : ils seront installés en phase 6 depuis le fichier vaynora-formation-pack.json (19 modules, 156 leçons, 6 parcours). En attendant, affiche un état vide soigné "La formation arrive très bientôt" (et pour l'owner un encart bleu "Installer la formation").
```

✅ **Tests :** crée à la main une leçon test avec un tableau Markdown → rendu propre ? "Marquer comme lue" met à jour la progression ? La recherche trouve la leçon ?

---

## PHASE 6 — Formation : installateur, import Markdown & administration

```text
Complète la Formation OFM (toujours sans quiz, sans examen, sans certificat).

1) ADMIN FORMATION (/app/formation/admin, owner + manager) :
- CRUD parcours, modules, leçons (éditeur Markdown avec aperçu côte à côte), réordonnancement par glisser-déposer, publier / dépublier.
- Assigner un parcours à un ou plusieurs utilisateurs avec échéance (email d'information).
- Suivi : tableau apprenants × modules (% de leçons lues, dernière activité, retards en rouge), export CSV.

2) INSTALLER LA FORMATION (prioritaire, owner) : encart "Installer / mettre à jour la formation VAYNORA" avec sélecteur de fichier .json. Le fichier vaynora-formation-pack.json est lu dans le navigateur (file.text() + JSON.parse, sans IA) ; vérifier format === "vaynora-academy-pack" ; aperçu (stats, modules avec leur nombre de leçons, parcours) ; bouton "Installer". Structure : { format, version, title, stats { modules, lessons, questions (0), hours, paths }, overview_md, modules: [ { number, title, meta, description, objectives, order, is_published, lessons: [ { number_label, title, order, content_md, duration_min, key_takeaways, video_url, resources } ], quiz: null } ], learning_paths: [ { title, slug, target_role, module_numbers, description, passing_score, is_published } ] }. Le champ quiz vaut toujours null : l'ignorer. Algorithme idempotent : module mis à jour s'il existe (même number) sinon créé ; leçons rapprochées par order (mise à jour / création par lots de 25 avec bulkCreate / suppression des absentes), avec module_id et module_number ; parcours mis à jour par slug ou créés, module_ids dans l'ordre de module_numbers ; overview_md et version enregistrés dans SiteSettings (formation_overview_md, formation_pack_version, formation_installed_at). Barre de progression, journal, résumé final. Ne jamais toucher à LessonProgress ni à PathAssignment.

3) IMPORT MARKDOWN (secours) : zone de texte où je colle un module complet → parseur DÉTERMINISTE (pas d'IA) → aperçu → "Importer". Règles :
  • "# " = titre du module ; retire le préfixe "Module N — " et utilise N comme number/order.
  • Lignes "> " juste après le titre = meta.
  • Texte entre le titre et le premier "## " = description ; la liste sous "**Objectifs du module**" = objectives.
  • "## Leçon N.M — Titre" = leçon (number_label N.M, contenu jusqu'au prochain "## "). Toute autre section "## …" (ex. "## Atelier pratique — Module 5") = leçon avec ce titre et number_label "Atelier".
  • Dans une leçon, un bloc "### À retenir" alimente key_takeaways (une puce = un élément) en plus de rester dans le contenu.
  • duration_min = mots / 200 arrondi au-dessus.
  • Option "Remplacer le module existant de même numéro" (supprime ses leçons avant import), puis publie le module.
  • Si le parsing trouve 0 leçon : bouton secours "Analyser avec l'IA" (InvokeLLM + response_json_schema).
```

✅ **Tests :** installe `vaynora-formation-pack.json` → 19 modules, 156 leçons, 6 parcours ? Relance l'installation → aucun doublon ? Importe `module-05-trouver-ses-modeles.md` en remplacement → 8 leçons + 1 atelier ?

---

## PHASE 7 — Coach IA & simulateur de conversation

```text
Construis deux outils IA (InvokeLLM) dans l'espace privé.

RÈGLE SYSTÈME COMMUNE : "Tu es un assistant professionnel de VAYNORA House. Tu restes strictement SFW, sans aucun contenu sexuel explicite. Tu refuses toute demande illégale, impliquant des mineurs, non consentie, ou contraire à la charte éthique (fausses promesses de rencontre, fausses urgences, pression sur des personnes vulnérables, fausse exclusivité). Tu réponds en français."

1) COACH IA (/app/coach + panneau latéral ouvrable depuis chaque leçon) : entité CoachConversation (user_email, lesson_id, messages array {role, content, at}). Si ouvert depuis une leçon, injecte le content_md de la leçon comme contexte. Le coach explique, donne des exemples SFW, propose un mini-exercice, et cite la leçon concernée. Suggestions de questions cliquables. Historique sauvegardé.

2) SIMULATEUR (/app/simulateur) : entité RoleplaySession (user_email, scenario, creator_persona, transcript array {role, content}, score, sub_scores object, strengths array, improvements array, ideal_reply, red_flag boolean, red_flag_reason).
- L'apprenant choisit un scénario : Le nouveau timide · Le négociateur (trouve tout trop cher) · Le fidèle bavard · Le pressé · Le dormant (rien acheté depuis 30 jours) · Le sceptique (demande "c'est vraiment toi qui écris ?") · Le fan en difficulté (évoque des problèmes d'argent et de moral) · Le profil à risque (laisse échapper des indices de minorité). Et une persona de créatrice (2 fictives : "Luna — girl next door solaire, emojis 🌙✨, phrases courtes" et "Jade — élégante et mystérieuse, peu d'emojis, vouvoiement joueur" ; ou une créatrice réelle assignée, dont on charge la bible du persona).
- L'IA joue l'ABONNÉ : messages de 1 à 3 phrases, style chat réaliste, SFW, cohérent avec le scénario, réagit à la qualité des réponses. Interface type messagerie (bulles, indicateur "écrit…").
- Bouton "Terminer et évaluer" (ou auto après 12 échanges) → InvokeLLM avec response_json_schema : score (0–100), sub_scores {accueil_ton (/15), ecoute_personnalisation (/20), methode_house (/20), objections (/15), ethique (/20), ecriture (/10)}, strengths [], improvements [], ideal_reply (meilleure réponse possible au moment clé), red_flag, red_flag_reason. Si l'apprenant a promis une rencontre, inventé une urgence, insisté auprès du fan en difficulté ou continué à vendre au profil à risque → red_flag = true et score plafonné à 40.
- Écran de résultat (entraînement, pas un examen) : score en jauge bleue, radar des sous-scores (recharts), forces, axes d'amélioration, réponse idéale, alerte rouge si red_flag. Historique des sessions + progression dans le temps. Les managers voient les sessions de leur équipe.
```

✅ **Tests :** fais exprès de promettre une rencontre dans « Le fidèle bavard » → red flag ? Dans « Le profil à risque », arrête la conversation et escalade → bon score éthique ?

---

## PHASE 8 — CRM créatrices & conformité

```text
Construis le CRM et la conformité (owner + manager ; les managers ne voient que leurs créatrices).

1) ENTITÉ Creator : stage_name, platform_main, page_type (payante, gratuite, hybride), source, handle, potential_monthly, next_action, stage_changed_at, signed_at, lost (boolean), lost_at_stage, first_name_private, email_private, phone_private, country, timezone, languages, platforms (array {platform, handle, url, subscribers, price}), niche, archetype, avatar_url, status (reperee, contactee, appel, proposition, contrat_signe, onboarding, active, pause, sortie), status_history (array {status, date, by}), age_verified (boolean), age_verified_at, age_verified_by, persona_md, limits (object {accepted [], refused [], conditional [], custom_price_floors, validated_by_creator_at}), contract_start, contract_end, commission_rate, commission_base, notice_days, contract_file_url, manager_email, chatter_emails (array), monthly_goal, tags, notes.

2) /app/createurs — RECRUTEMENT DES MODÈLES : vue Kanban du pipeline Repérée → Contactée → Appel → Proposition → Contrat signé → Onboarding → Active → En pause → Sortie (glisser-déposer → met à jour status + status_history + stage_changed_at ; cartes avec source, compte, potentiel mensuel, prochaine action, jours dans l'étape en orange au-delà de 7 ; boutons ← →, "Perdue", "Fiche") et vue tableau filtrable. Au-dessus : tuiles (prospects en cours, appels et propositions, signées ce mois, taux de signature = signées ÷ (signées + perdues)), entonnoir (prospects ayant atteint chaque étape + taux de passage), tableau par source (Instagram, TikTok, X, Reddit, Recommandation, Candidature site, Autre : prospects, signées, taux), prospects perdus repliables avec "Réactiver". Bouton "Convertir une candidature" (depuis CreatorApplication, pré-remplit la fiche en « Repérée », source « Candidature site »).

3) FICHE CRÉATRICE (/app/createurs/:id) avec onglets : Profil (coordonnées privées masquées derrière un bouton "Afficher", journalisé) · Persona (éditeur Markdown, modèle pré-rempli : Résumé, Voix & ton, Emojis signature, Expressions typiques, Sujets OK, Sujets interdits, Infos à ne JAMAIS révéler, Faits de vie partageables) · Carte des limites (3 colonnes Accepté / Refusé / Sous conditions, prix planchers, date de validation par la créatrice ; badge rouge si > 90 jours) · Contrat (dates, commission, base, préavis, PDF) · Équipe (manager, chatters ; met à jour User.assigned_creator_ids) · Notes & historique (timeline).

4) CONFORMITÉ (/app/conformite) : entité ComplianceItem (creator_id, key, label, status [ok, missing, expired], checked_at, checked_by, notes). Checklist auto-créée pour chaque créatrice : majorité vérifiée (date + vérificateur, jamais de copie de pièce d'identité), contrat signé, carte des limites validée < 90 jours, bible du persona validée, 2FA activée sur les comptes, co-créateurs vérifiés et déclarés sur la plateforme, mention de l'équipe dans la bio, point bien-être < 30 jours. Score % par créatrice, vue globale avec alertes.

5) INCIDENTS : entité Incident (type [fan_possiblement_mineur, demande_illegale, harcelement_menace, chantage_sextorsion, fuite_contenu, detresse_fan, violation_charte, securite_acces, autre], severity [low, medium, high, critical], creator_id, description, evidence, actions_taken, status [ouvert, en_cours, clos], reported_by, owner_email). Bouton "Signaler" dans la topbar accessible à TOUS les rôles connectés (formulaire rapide en modale). Registre filtrable pour owner/manager. Email immédiat aux owners si severity high/critical. Fiche incident avec procédure affichée selon le type (ex. fan possiblement mineur : 1. arrêter toute interaction commerciale, 2. ne rien envoyer, 3. signaler via la plateforme, 4. documenter ici, 5. manager informé sous 15 min).

6) Crée 5 modèles d'exemple (Luna, Jade, Mia, Nora, Elsa — is_demo = true) avec persona, limites et checklist, et 13 prospects d'exemple répartis dans le pipeline (dont 3 perdus).
```

✅ **Tests :** connecte-toi en manager → tu ne vois que tes créatrices ? Déclare un incident « critical » en chatter → email reçu ?

---

## PHASE 9 — Opérations chatters : planning, rapports, scripts, notes fans

```text
Construis /app/operations (owner, manager, chatter ; un chatter ne voit que les créatrices de User.assigned_creator_ids).

1) ENTITÉS : Shift (chatter_email, creator_id, start, end, status [planned, done, missed]) ; ShiftReport (shift_id, chatter_email, creator_id, date, start, end, messages_sent, ppv_sent, ppv_sold, ppv_revenue, tips_revenue, new_fans_welcomed, fans_reactivated, incidents_count, handover_notes) ; Script (title, category [accueil, qualification, lien, suggestion, objection, apres_vente, relance, reactivation, situations_sensibles], archetype, language, content, notes, upvotes, is_approved, author_email) ; FanNote (creator_id, fan_handle, segment [nouveau, curieux, occasionnel, regulier, vip, dormant, expire], interests, preferences, purchased_refs, estimated_spend, alerts, last_interaction, notes, updated_by).

2) PLANNING : calendrier semaine (vue par créatrice et vue par chatter), création/édition par clic-glisser (manager), affichage des heures NON couvertes en hachuré rouge par créatrice, conversion des fuseaux horaires, mes prochains shifts pour le chatter.

3) PRISE DE POSTE (/app/operations/shift/:id) : en haut, la dernière note de passation de la créatrice, la bible du persona et la carte des limites (repliables), les alertes fans actives ; bouton "Commencer" puis "Terminer et rédiger le rapport".

4) RAPPORT DE SHIFT : formulaire + calculs auto (conversion PPV = vendus/envoyés, revenu/heure). Rappel visible si un shift "done" n'a pas de rapport après 1 h. Historique filtrable.

5) BIBLIOTHÈQUE DE SCRIPTS : recherche, filtres, variables {prenom} remplaçables, bouton copier, vote utile, proposition de script par les chatters (is_approved = false) → validation par manager. Les chatters ne voient que les scripts approuvés + les leurs. Crée 12 scripts SFW d'exemple : accueil chaleureux, question de qualification, rebond sur une passion, suggestion douce d'un contenu, objection "trop cher", objection "envoie un aperçu gratuit", remerciement après achat, relance d'un dormant, réactivation d'un expiré, transparence ("Je travaille avec une petite équipe qui m'aide à gérer mes messages, mais mes contenus sont 100 % les miens et tout est validé par moi"), refus élégant d'une demande de rencontre, réponse bienveillante à un fan en difficulté (sans vente, avec le 3114 si détresse).

6) NOTES FANS : liste par créatrice avec recherche instantanée, fiche fan (segment coloré, centres d'intérêt en tags, ce qu'il a déjà acheté, alertes en rouge en haut, ex. "difficultés financières évoquées : ne pas solliciter"), édition rapide. Bandeau rappel RGPD : "Pas d'identité réelle, pas de données sensibles."
```

✅ **Tests :** en chatter, essaie d'ouvrir une créatrice non assignée par l'URL → bloqué ? Les trous de planning s'affichent ?

---

## PHASE 10 — Contenu : calendrier éditorial, briefs, customs, idées IA

```text
Construis /app/contenu.

1) ENTITÉS : ContentItem (creator_id, type [post_feed, story, message_masse, ppv, live, reseau_social_sfw], platform, title, caption, scheduled_at, status [idee, planifie, pret, publie], price, assigned_to, asset_ref) ; ShootBrief (creator_id, date, theme, outfits, sets_md, formats, anonymity_checklist (array), status) ; CustomRequest (creator_id, fan_handle, description, price, currency, deadline, status [recue, a_valider, validee, en_production, livree, refusee], creator_comment, validated_at).

2) CALENDRIER ÉDITORIAL : vues mois / semaine / liste, filtre par créatrice et par type (couleurs par type), glisser-déposer pour replanifier, création rapide, duplication.

3) BRIEFS DE SHOOTING : formulaire avec modèle Markdown pré-rempli (Objectif, Thème, Tenues, Décors, Lumière, Sets par niveau : Niveau 1 SFW réseaux / Niveau 2 feed / Niveau 3 premium, Formats vertical/horizontal, Quantités) + checklist anonymat (aucun élément identifiant : fenêtre, courrier, reflets, objets personnels, géolocalisation désactivée, métadonnées à supprimer). Vue imprimable.

4) DEMANDES CUSTOM : kanban par statut. Règle : une demande passe à "a_valider" et notifie la créatrice ; rien n'est confirmé au fan avant "validee". La créatrice valide/refuse depuis son espace (phase 12) avec commentaire. Affiche la carte des limites de la créatrice à côté de chaque demande.

5) IDÉES IA : bouton "Générer 10 idées SFW" pour une créatrice et un réseau (Instagram, TikTok, X, Reddit SFW) → InvokeLLM (règle système commune VAYNORA SFW) à partir du persona, de la niche et de la saison → JSON {ideas: [{hook, format, description, caption, hashtags}]}, ajout en un clic au calendrier comme "idee". Doit respecter les règles des plateformes (aucune sollicitation sexuelle, aucun lien interdit).
```

✅ **Tests :** crée une demande custom → la créatrice de test reçoit la notification ?

---

## PHASE 11 — Tableau de bord, revenus, chatters & finance

```text
Construis le pilotage de l'agence : /app (tableau de bord), /app/modeles, /app/revenus, /app/operations/chatters et /app/finance. Graphiques recharts : série principale bleu #2F5BFF ; sources toujours dans cet ordre et ces couleurs : abonnements #2F5BFF, messages payants #EB6834, pourboires #1BAF7A, personnalisés #EDA100, autres #E87BA4 ; bénéfice bleu, perte rouge #E34948 ; lignes 2 px, barres ≤ 24 px aux bouts arrondis, grille légère, légende dès 2 séries, info-bulle listant toutes les séries, lien "Voir les données" (tableau) sous chaque graphique.

1) ENTITÉS : RevenueEntry (creator_id, month "AAAA-MM", currency, revenue_subscriptions, revenue_messages, revenue_tips, revenue_customs, revenue_other — montants NETS après la part de la plateforme —, active_subs, new_subs, expired_subs, ad_spend, traffic (array {source, clicks, new_subs, cost}), notes, is_demo) ; ChatterMonth (chatter_email, month, hours, sales, qa_score 0–100, bonus, notes, is_demo) ; Expense (month, label, category [Outils & logiciels, Publicité, Contenu & shootings, Rémunérations hors chatters, Juridique & comptabilité, Locaux, Autre], amount, notes, is_demo) ; CommissionStatement (creator_id, month, revenue_by_source, net_revenue, commission_rate, commission_amount, creator_share, status [brouillon, envoye, paye, en_retard], invoice_number, due_date, paid_at).

2) SÉLECTEUR DE MOIS global dans la topbar (24 derniers mois) : toutes les pages de pilotage suivent le mois choisi et se comparent au mois précédent. Variation = flèche ▲▼ + %, en vert si c'est bon, en orange si c'est mauvais (pour les charges, une baisse est bonne).

3) SAISIE DES REVENUS (/app/revenus) : grille pour le mois choisi, une ligne par modèle (actives, en lancement, en pause + toute modèle déjà saisie ce mois) ; colonnes Abonnements, Messages payants, Pourboires, Personnalisés, Autres, Abonnés actifs, Nouveaux abonnés, Pub / trafic ; totaux par ligne et en pied de tableau en direct ; boutons "Reprendre les abonnés du mois précédent" et "Enregistrer <mois>" ; ligne vide = rien d'enregistré. Encadrés "Où trouver ces chiffres sur OnlyFans" (Statistiques → Relevés → Revenus) et "La routine de clôture" (6 étapes).

4) MODÈLES (/app/modeles) : filtres par statut avec compteurs ; tableau (modèle, plateforme, niche, statut, CA net, variation, abonnés actifs, revenu par abonné, commission %, montant pour l'agence, contribution = commission − pub − coût chatting réparti) + total. Fiche modèle, onglet Chiffres : 4 tuiles, courbe 12 mois, rentabilité du mois (CA net, part créatrice, commission, pub, chatting réparti, contribution, marge), jauge d'objectif mensuel, barres empilées par source, meilleur mois, historique.

5) TABLEAU DE BORD (/app, owner + manager) : bandeau "Données d'exemple" + "Effacer l'exemple" si is_demo ; tuile principale violet nuit (CA net des modèles, variation, mini-courbe 12 mois) ; 6 tuiles (Commission agence, Bénéfice net + marge, Modèles qui génèrent, Abonnés actifs, Revenu par abonné, Part des messages payants en points) ; "Évolution sur 12 mois" (CA net + commission, même échelle) ; "Objectif du mois" (jauge commission / SiteSettings.monthly_goal) ; "Alertes" triées par gravité et cliquables (revenus non saisis, modèle en baisse ≥ 15 %, résultat négatif, une modèle > 50 % du CA, chatter qualité < 70, chatter < 60 % des ventes/heure moyennes, prospects sans action > 7 jours, incidents ouverts, conformité incomplète, objectif atteint) ; "Revenus par source" (barres empilées 12 mois) ; "Classement des modèles" (barres horizontales + variation ou "non saisi") ; cartes Équipe chatting, Recrutement de modèles, Formation OFM. État vide : "Démarrer en trois étapes" + bouton "Voir avec des données d'exemple".

6) CHATTERS (/app/operations/chatters) : tuiles (heures, ventes générées, ventes par heure, coût de l'équipe en % des ventes) ; tableau par chatter (rôle, langue, taux, modèles, heures, ventes, €/h, qualité, rémunération = heures × hourly_rate + ventes × commission_rate % + prime, coût/ventes) ; bouton "Saisir le mois" (pré-rempli depuis les ShiftReport du mois) ; barres des ventes par heure.

7) FINANCE (/app/finance, owner ; manager en lecture sur ses modèles) : 4 tuiles (revenus de l'agence, charges totales, bénéfice net, marge) ; "Résultat sur 12 mois" (barres bleues/rouges autour de zéro) ; compte de résultat du mois (commission − chatters − pub − dépenses par catégorie − charges fixes SiteSettings.fixed_costs = résultat) + point mort ("N modèles au niveau moyen") + réserve conseillée (3 mois de charges) ; dépenses du mois (ajout en ligne, suppression, "Reprendre le mois précédent") ; rentabilité par modèle ; relevés créatrices du mois (détail par source, CA net, taux, commission due, part créatrice, n° de facture VAY-AAAA-0001, statut, vue imprimable, export CSV) ; simulateur de rentabilité.

8) Données d'exemple (is_demo = true) : 12 mois de RevenueEntry réalistes pour les 5 modèles d'exemple (croissance progressive, Jade en baisse le dernier mois, Elsa en lancement sans saisie du dernier mois), 4 chatters avec leurs ChatterMonth, dépenses mensuelles ; objectif 9 000 €, charges fixes 650 €. Bouton "Effacer l'exemple" qui supprime tout ce qui a is_demo = true.
```

✅ **Tests :** change de mois → tout se met à jour ? Saisis un mois → tuiles, courbes, classement et alertes bougent ? Le compte de résultat et les relevés calculent juste ? "Effacer l'exemple" vide bien les données de démo ?

---

## PHASE 12 — Espace créatrice, tableaux de bord par rôle, tâches, SOP, annonces

```text
Construis :

1) ESPACE CRÉATRICE (/app/mon-espace, team_role creator, données filtrées par User.creator_id) : accueil chaleureux personnalisé, ses KPIs (lecture), ses relevés mensuels, son calendrier de contenu, ses demandes custom à valider (Valider / Refuser + commentaire → met à jour CustomRequest et notifie le manager), sa carte des limites (modifiable : chaque modification horodate validated_by_creator_at et notifie le manager), sa bible du persona (lecture + bouton "Suggérer une modification"), ses documents (contrat), la Formation OFM, boutons "Demander un point" (crée une Task pour son manager) et "Signaler un problème" (Incident confidentiel).

2) TABLEAUX DE BORD /app selon le rôle :
- owner/manager : le tableau de bord de la phase 11, plus "Mes tâches du jour" et les annonces.
- chatter : prochains shifts, modèles assignées (accès rapide persona + limites), mes heures / ventes / ventes par heure / qualité du mois, progression de la formation, annonces.
- creator : redirige vers /app/mon-espace.
- recruit : progression des parcours assignés, prochaine leçon, échéances, message d'encouragement.

3) TÂCHES : entité Task (title, description, assignee_email, creator_id, priority [basse, normale, haute, urgente], due_date, status [todo, doing, done], comments array) ; vues liste et kanban, filtres "mes tâches".

4) SOP : entité SOP (title, category, content_md, version, owner_email, updated_note) ; bibliothèque avec recherche, rendu Markdown, historique de version.

5) ANNONCES : entité Announcement (title, content_md, audience_roles, pinned, read_by) ; affichées sur les tableaux de bord concernés avec accusé de lecture.

6) NOTIFICATIONS : entité Notification (user_email, type, title, link, is_read) ; cloche dans la topbar avec compteur ; créées lors de : nouvelle candidature (owners), tâche assignée, demande custom à valider, incident, parcours assigné, revenus du mois non saisis (le 3 du mois).
```

✅ **Tests :** crée un compte créatrice lié à « Exemple — Luna » → elle voit uniquement ses données ?

---

## PHASE 13 — Recrutement interne & administration

```text
Construis :

1) RECRUTEMENT ÉQUIPE (/app/recrutement, owner + manager) : kanban des JobApplication (new → test_scored → interview → roleplay → offer → hired / rejected), fiche candidat (infos, CV, réponses au test, score IA + feedback, notes, date d'entretien avec ajout calendrier), tri par score. Bouton "Créer l'accès recrue" : invite l'utilisateur (team_role recruit), crée un PathAssignment du parcours "Chatter" (ou selon le poste) avec échéance à J+14, email d'invitation. Gestion des offres JobPosting (CRUD, activer/désactiver).

2) CANDIDATURES CRÉATRICES (/app/candidatures) : liste + fiche (toutes les réponses), statut, score manuel /100 avec grille (motivation 25, régularité/disponibilité 20, potentiel d'audience 20, clarté des limites 15, professionnalisme 20), assignation, bouton "Convertir en créatrice" (CRM).

3) ADMINISTRATION (/app/admin, owner) : réglages de l'agence (nom, devise, commission par défaut, objectif mensuel, charges fixes), sauvegarde (export JSON complet, export CSV des revenus), données d'exemple (charger / effacer), utilisateurs (inviter, team_role, créatrices assignées, creator_id, taux horaires/commissions, désactiver = status offboarded + retrait de toutes les assignations), SiteSettings (promesses, réseaux, coordonnées, SEO, bandeau d'annonce), gestion des contenus publics (Testimonial, FAQ, BlogPost avec éditeur Markdown), journal d'activité (dernières créations/modifications importantes).
```

✅ **Tests :** convertis une candidature en créatrice, invite une recrue et vérifie qu'elle ne voit que la Formation.

---

## PHASE 14 — Polish final, performance, accessibilité & QA

```text
Fais une passe de qualité complète sur toute l'application, sans changer les fonctionnalités :
1) Cohérence visuelle : mêmes espacements, rayons, tailles de titres, couleurs du design system partout ; supprime toute couleur ou police hors charte.
2) Responsive : vérifie chaque page en 360, 768, 1280 px ; aucun débordement horizontal ; tableaux défilables sur mobile ; sidebar en tiroir sur mobile.
3) États : chaque liste a un état vide illustré et utile, un skeleton de chargement, et un message d'erreur clair avec bouton "Réessayer".
4) Accessibilité : contrastes AA, focus visibles bleus, labels sur tous les champs, aria sur les modales, navigation clavier, alt sur les images.
5) Performance : images en lazy-loading, pagination des listes longues (25 par page), requêtes filtrées côté serveur.
6) Sécurité : revérifie que chaque page /app utilise RoleGuard et que chaque requête filtre selon le rôle (chatter → créatrices assignées ; creator → ses données).
7) SEO public : title/description/OG uniques par page, un seul H1 par page, URLs propres.
8) Micro-interactions : toasts de succès/erreur cohérents, confirmations avant suppression, raccourci "/" pour la recherche.
9) Liste-moi ensuite les éventuels points que tu n'as pas pu traiter.
```

✅ **Tests finaux :** vérifie les critères d'acceptation (section 12) de `PROMPT-BASE44-VAYNORA-HOUSE.txt`.

---

## 🔁 Installer la formation (après la phase 6)

1. Dans **/app/formation/admin → Installer la formation**, choisis `2-FORMATION-OFM/vaynora-formation-pack.json` (19 modules, 156 leçons, 6 parcours) puis clique sur « Installer ».
2. Secours seulement : **Import Markdown**, colle chaque fichier du dossier `2-FORMATION-OFM/modules/` dans l'ordre `module-00` → `module-18`, en cochant « Remplacer le module existant ».
