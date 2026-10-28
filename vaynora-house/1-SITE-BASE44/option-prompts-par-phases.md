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
Crée l'application "VAYNORA House" : site d'une agence premium de management de créatrices de contenu sur plateformes d'abonnement (OnlyFans, Fansly, MYM) + un espace privé "VAYNORA OS". Interface 100 % en français. Dans cette phase, construis UNIQUEMENT les fondations.

1) DESIGN SYSTEM (à réutiliser partout, centralisé) :
- Couleurs : bg #0A0A0C, surface #131317, surface-2 #1B1B21, border rgba(200,169,106,0.18), text #F4EFE6, text-muted #9A96A0, gold #C8A96A, gold-light #E6D3A3, gold-dark #9C7F45, wine #5C1A26, success #4E9F7A, warning #D9A441, danger #C2564B.
- Polices Google : "Cormorant Garamond" (titres 500/600) et "Manrope" (texte 400–700). Surtitres en capitales 12 px, letter-spacing 0.25em, couleur gold.
- Composants réutilisables : Button (primary fond gold texte noir / secondary contour gold / ghost, forme pill), Card (surface, bordure border, rayon 20 px), Input/Select/Textarea sombres avec focus gold, Badge de statut, SectionTitle (surtitre + titre serif + sous-titre), GoldDivider (ligne fine + petit losange), EmptyState (icône fine + texte + action), Skeleton.
- Ambiance luxe discret : beaucoup d'espace, léger grain en fond, halos radiaux dorés subtils, animations framer-motion douces (fade-up), respect de prefers-reduced-motion. Icônes lucide-react.
- Logo : wordmark "VAYNORA" (Cormorant, capitales, letter-spacing 0.35em) avec "HOUSE" en petit dessous + monogramme SVG "V" dans un losange fin doré (aussi en favicon).

2) LAYOUT PUBLIC : header sticky (transparent puis flouté au scroll) avec logo, liens (Méthode, Services, Créatrices, Académie, Carrières, Journal), bouton "Candidater", lien discret "Espace membre" ; menu plein écran sur mobile. Footer : logo, baseline "Votre talent. Notre maison.", liens, réseaux, mention "Réservé aux personnes majeures · Site sans contenu explicite", liens légaux, © année. Bandeau cookies RGPD (Accepter / Refuser / Personnaliser, choix mémorisé).

3) LAYOUT PRIVÉ (/app, connexion obligatoire) : sidebar sombre repliable avec monogramme, topbar (recherche, cloche de notifications, menu avatar), fil d'Ariane. Page "Accès réservé" élégante pour les rôles non autorisés.

4) RÔLES : ajoute à l'entité User les champs team_role (enum owner, manager, chatter, creator, recruit ; défaut recruit), display_name, phone, timezone (défaut Europe/Paris), languages (array), status (active, paused, offboarded), assigned_creator_ids (array), creator_id, hourly_rate, commission_rate, avatar_url, onboarding_done (boolean), certified_paths (array). Les admins Base44 sont "owner". Crée un hook/utilitaire useRole() et un composant RoleGuard(allowedRoles) réutilisables. La sidebar n'affiche que les sections autorisées pour le rôle.

5) ONBOARDING : à la première connexion, écran qui demande display_name, timezone, languages puis met onboarding_done = true.

6) ENTITÉ SiteSettings : stats (object : creators_count, retention_rate, countries_count), contact_email, phone, socials (object instagram/x/tiktok/telegram), seo_title, seo_description, top_banner_text, team (array). Crée un enregistrement par défaut (40, 92, 6).

Crée aussi une page d'accueil temporaire qui présente le design system (boutons, cartes, inputs, badges) pour validation, et un tableau de bord /app vide qui affiche "Bonjour {display_name}" et le rôle.
```

✅ **Tests :** le design est-il noir/ivoire/or et élégant ? Le menu mobile fonctionne ? En te connectant, tu arrives sur l'onboarding puis /app ?

---

## PHASE 2 — Site public : Accueil, Méthode, Services, La Maison

```text
Avec le design system existant, construis les pages publiques suivantes (vouvoiement, SFW strict : uniquement des visuels mode/luxe/textures/architecture/portraits habillés ou des abstraits dorés).

PAGE ACCUEIL (/) :
- HERO : surtitre "AGENCE DE MANAGEMENT DE CRÉATRICES", H1 "Votre talent. Notre maison.", sous-titre "VAYNORA House accompagne les créatrices ambitieuses sur OnlyFans, Fansly et MYM : stratégie, croissance, monétisation et protection — avec une transparence totale et un contrat sans piège.", CTA "Rejoindre la House" (/candidature) et "Découvrir la méthode" (/methode), réassurance "✓ Votre compte et vos revenus restent à votre nom · ✓ Contrat clair et résiliable · ✓ Réponse sous 48 h". Halo doré animé très subtil.
- CHIFFRES animés depuis SiteSettings.stats : créatrices accompagnées, % de rétention, "24/7" gestion des messages, pays.
- LE CONSTAT : titre "Créer, poster, répondre, vendre, se protéger… seule, c'est un second temps plein." + 3 cartes (Des heures perdues dans les messages / Une croissance qui stagne / La peur des fuites et du harcèlement) avec un texte court chacune.
- LA HOUSE À 360° : 6 cartes services (Stratégie & branding, Marketing & trafic, Gestion des messages & monétisation, Production & calendrier, Protection & anti-fuite, Accompagnement business) → liens vers /services#ancre.
- LE CYCLE VAYNORA : timeline 01 Audit, 02 Identité, 03 Lancement, 04 Croissance, 05 Pérennité.
- NOS ENGAGEMENTS : Transparence, Contrôle, Consentement, Sécurité, Contrat juste, Éthique (une phrase forte chacun).
- POUR QUI ? : Vous débutez / Vous stagnez / Vous voulez passer à l'échelle.
- TÉMOIGNAGES : entité Testimonial (display_name, role_label, quote, rating, is_published, order) en carrousel ; crée 3 exemples.
- FAQ : entité FAQ (question, answer, category, order, is_published) en accordéon, catégorie "home". Crée ces 8 questions : commission (écrite au contrat, sur revenus nets, aucun frais d'entrée) ; contrôle du compte (compte, contenus et paiements restent à votre nom) ; visage (stratégies anonymes possibles) ; qui répond aux abonnés (équipe formée et certifiée, dans votre ton et selon vos règles, mention transparente recommandée en bio, vous pouvez reprendre la main) ; arrêter (préavis prévu au contrat, sans pénalité abusive) ; anonymat (protocole de confidentialité, métadonnées, surveillance des fuites, retraits) ; débutante (oui si majeure, motivée, régulière) ; versement des revenus (directement par la plateforme sur votre compte, commission facturée chaque mois sur relevé détaillé).
- CTA FINAL : "Votre place est peut-être ici." + bouton "Candidater en 5 minutes".

PAGE MÉTHODE (/methode) : récit du Cycle VAYNORA. Pour chaque étape : objectifs, livrables, durée — Audit (J1–J7, rapport d'audit + plan d'action), Identité (J7–J14, bible du persona, profil, prix), Lancement (J14–J45, shooting, calendrier 30 jours, campagnes, équipe messages), Croissance (M2–M6, acquisition multi-canal, optimisation des ventes, revues hebdo), Pérennité (M6+, diversification, rétention, protection, préparation de l'après). Bloc "Ce que vous recevez chaque mois".

PAGE SERVICES (/services) : 6 sections ancrées avec "Ce que nous faisons" (5 puces) et "Ce que vous gagnez" (3 puces).

PAGE LA MAISON (/maison) : manifeste, valeurs, et la charte éthique en 10 engagements : 1 Majorité vérifiée, toujours. 2 Le consentement d'abord : la carte des limites est sacrée et révocable. 3 La créatrice garde le contrôle de son compte, de ses contenus et de ses revenus. 4 Transparence financière totale. 5 Honnêteté envers les abonnés : ni fausses promesses, ni fausses urgences, ni fausse exclusivité. 6 Protection des personnes vulnérables. 7 Confidentialité absolue. 8 Respect des règles des plateformes et de la loi. 9 Respect et zéro jugement. 10 Excellence et formation continue.

Ajoute les balises SEO (title, description, OpenGraph) sur chaque page.
```

✅ **Tests :** lis tout sur mobile, vérifie les ancres, les compteurs, le carrousel, l'accordéon.

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
- À l'envoi : crée la CreatorApplication, redirige vers /candidature/merci (page élégante "Réponse sous 48 h" + 3 conseils en attendant), envoie un email de confirmation à la candidate et un email de notification à tous les owners (SendEmail, style sobre noir/or).

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

4) PAGE ACADÉMIE vitrine (/academie) : présente l'Académie VAYNORA (18 modules, parcours par métier, certification, coach IA, simulateur de conversation) sans dévoiler le contenu ; CTA "Rejoindre l'équipe".

5) PAGES LÉGALES : /mentions-legales, /confidentialite (RGPD complet : finalités, bases légales, durées de conservation, droits, contact DPO, sous-traitants), /cgu, /charte-ethique. Champs à compléter clairement marqués [RAISON SOCIALE], [SIRET], [ADRESSE], [EMAIL DPO], [HÉBERGEUR]. Page 404 élégante.
```

✅ **Tests :** postule à une offre avec des réponses volontairement mauvaises puis bonnes → les scores IA diffèrent ? Le score est invisible côté candidat ?

---

## PHASE 5 — Académie : structure, lecteur de leçons & progression

```text
Construis l'Académie dans l'espace privé (/app/academie).

ENTITÉS :
- LearningPath : title, slug, description, target_role (chatter, manager, recruiter, direction, creator, all), module_ids (array ordonné), cover_url, is_published, passing_score (défaut 80).
- AcademyModule : number, title, description, meta, objectives (array), order, is_published.
- Lesson : module_id, number_label, title, order, content_md, video_url, duration_min, resources (array {label, url}), key_takeaways (array).
- PathAssignment : user_email, path_id, assigned_by, due_date, status (assigned, in_progress, completed).
- LessonProgress : user_email, lesson_id, module_id, status (started, completed), completed_at, personal_notes.

PAGES APPRENANT :
- /app/academie : mes parcours (assignés + ceux dont target_role correspond à mon rôle ou "all"), cartes avec couverture, progression %, prochaine leçon, échéance.
- /app/academie/parcours/:slug : liste ordonnée des modules avec statut (verrouillé / en cours / validé). Déverrouillage séquentiel : un module s'ouvre quand le précédent est validé (pour l'instant : toutes ses leçons terminées ; le quiz viendra en phase 6).
- /app/academie/module/:id : objectifs, description, leçons avec coche, durée totale.
- /app/academie/lecon/:id : rendu Markdown soigné (react-markdown + remark-gfm : titres, listes, tableaux, citations, gras, liens) avec une typographie de lecture confortable (max 720 px, interlignage 1.7), vidéo optionnelle intégrée (YouTube/Vimeo/Loom), ressources, encadré "À retenir", bouton "Marquer comme terminée", barre de progression de lecture, précédent/suivant, panneau "Mes notes" (autosave dans LessonProgress.personal_notes).

DONNÉES : crée les 18 modules (vides, non publiés, avec number et title) :
0 Bienvenue chez VAYNORA House · 1 L'écosystème des plateformes d'abonnement · 2 Cadre légal, conformité & éthique · 3 Recruter & signer des créatrices · 4 Onboarding, persona & stratégie de compte · 5 Production & gestion du contenu · 6 Marketing & acquisition de trafic · 7 Chatting I — Fondamentaux & méthode HOUSE · 8 Chatting II — Monétisation avancée & rétention · 9 Outils, sécurité & opérations · 10 Recruter, former & manager les chatters · 11 KPIs, analytics & pilotage · 12 Finance, fiscalité & modèle économique · 13 Bien-être, sécurité & protection des créatrices · 14 Scaler VAYNORA House · 15 Examen final de certification · 16 Boîte à outils : templates & SOP · 17 Glossaire.
Et les parcours : "Fondamentaux VAYNORA" [0,1,2], "Chatter certifié" [0,1,2,7,8,9,13,15,16,17], "Account Manager" [0,1,2,3,4,5,6,9,11,12,13,15,16,17], "Recruteur·se talents" [0,1,2,3,4,13,15,16,17], "Direction d'agence" [0 → 17], "Parcours Créatrice" [0,1,2,4,5,6,13,17].
```

✅ **Tests :** crée à la main une leçon test avec un tableau Markdown → rendu propre ? La progression se met à jour ?

---

## PHASE 6 — Académie : import Markdown, quiz, certificats, badges, admin

```text
Complète l'Académie.

1) ENTITÉS : Quiz (module_id, title, passing_score défaut 80, max_attempts_per_day défaut 3, questions: array {id, type: single|multiple|true_false|short_answer, prompt, options, correct (indices), expected_answer, explanation, points}) ; QuizAttempt (user_email, quiz_id, module_id, answers, score, passed, ai_feedback) ; Certificate (user_email, user_name, path_id, path_title, code, issued_at, average_score) ; Badge (user_email, key, label, earned_at).

2) PASSAGE DE QUIZ (/app/academie/quiz/:moduleId) : une question par écran ou toutes à la suite (option), minuteur facultatif, soumission → score, correction détaillée avec explications. Les questions short_answer sont corrigées par InvokeLLM (système : "Tu corriges une réponse d'apprenant VAYNORA House. Compare-la à la réponse attendue. Sois juste mais exigeant.", schéma {score: number entre 0 et 1, feedback: string}). Validation si score ≥ passing_score. Limite de tentatives par 24 h. Désormais un module est validé = toutes leçons terminées + quiz réussi (ou pas de quiz).

3) CERTIFICAT : quand tous les modules d'un parcours sont validés → crée Certificate (code "VAY-AAAA-" + 6 caractères aléatoires), ajoute le parcours à User.certified_paths, email de félicitations. Page /app/certificat/:code imprimable (A4 paysage, fond noir, cadre doré fin, monogramme, nom, parcours, date, score moyen, code, mention "Académie VAYNORA House") + page publique /verifier/:code (affiche nom, parcours, date si valide).

4) BADGES : premier module validé, 100 % à un quiz, 7 jours d'apprentissage consécutifs, parcours terminé. Points : leçon 10, quiz réussi 50, 100 % +25. Classement opt-in.

5) ADMIN ACADÉMIE (/app/academie/admin, owner + manager) :
- CRUD parcours, modules, leçons (éditeur Markdown avec aperçu côte à côte), quiz (éditeur de questions), réordonnancement par glisser-déposer, publier/dépublier.
- Assigner un parcours à un ou plusieurs utilisateurs avec échéance (email d'information).
- Suivi : tableau apprenants × modules (statut, score, tentatives, retard en rouge), export CSV.
- IMPORT MARKDOWN : zone de texte où je colle un module complet → parseur DÉTERMINISTE (pas d'IA) → aperçu → "Importer". Règles :
  • "# " = titre du module ; retire le préfixe "Module N — " et utilise N comme number/order.
  • Lignes "> " juste après le titre = meta.
  • Texte entre le titre et le premier "## " = description.
  • "## Leçon N.M — Titre" = leçon (number_label N.M, contenu jusqu'au prochain "## "). Toute autre section "## …" qui ne commence pas par "Quiz" = leçon avec ce titre.
  • Dans une leçon, un bloc commençant par "### À retenir" alimente key_takeaways (une puce = un élément) en plus de rester dans le contenu.
  • "## Quiz…" : chaque question commence par "**Q<n>.**" ; options "- A) …" ; réponse "> ✅ Réponse : B — explication" (plusieurs lettres possibles "A, C" → type multiple ; deux options Vrai/Faux → true_false). Sans options : short_answer, avec "> ✅ Réponse attendue : …" comme expected_answer.
  • duration_min = mots / 200 arrondi au-dessus.
  • Option "Remplacer le module existant de même numéro" (supprime ses leçons et son quiz avant import), puis publie le module.
  • Si le parsing échoue ou trouve 0 leçon : bouton secours "Analyser avec l'IA" (InvokeLLM + response_json_schema).
```

✅ **Tests :** importe `2-FORMATION-OFM/modules/module-00-bienvenue.md` puis `module-07-chatting-fondamentaux.md` → leçons et quiz corrects ? Passe un quiz, rate-le, réussis-le, obtiens un certificat de test.

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
- Écran de résultat : score en jauge dorée, radar des sous-scores (recharts), forces, axes d'amélioration, réponse idéale, alerte rouge si red_flag. Historique des sessions + progression dans le temps. Les managers voient les sessions de leur équipe.
```

✅ **Tests :** fais exprès de promettre une rencontre dans « Le fidèle bavard » → red flag ? Dans « Le profil à risque », arrête la conversation et escalade → bon score éthique ?

---

## PHASE 8 — CRM créatrices & conformité

```text
Construis le CRM et la conformité (owner + manager ; les managers ne voient que leurs créatrices).

1) ENTITÉ Creator : stage_name, first_name_private, email_private, phone_private, country, timezone, languages, platforms (array {platform, handle, url, subscribers, price}), niche, archetype, avatar_url, status (candidature, contactee, appel, proposition, contrat_signe, onboarding, active, pause, sortie), status_history (array {status, date, by}), age_verified (boolean), age_verified_at, age_verified_by, persona_md, limits (object {accepted [], refused [], conditional [], custom_price_floors, validated_by_creator_at}), contract_start, contract_end, commission_rate, commission_base, notice_days, contract_file_url, manager_email, chatter_emails (array), monthly_goal, tags, notes.

2) /app/createurs : vue Kanban du pipeline (glisser-déposer → met à jour status + status_history) et vue tableau filtrable. Bouton "Convertir une candidature" (depuis CreatorApplication, pré-remplit la fiche).

3) FICHE CRÉATRICE (/app/createurs/:id) avec onglets : Profil (coordonnées privées masquées derrière un bouton "Afficher", journalisé) · Persona (éditeur Markdown, modèle pré-rempli : Résumé, Voix & ton, Emojis signature, Expressions typiques, Sujets OK, Sujets interdits, Infos à ne JAMAIS révéler, Faits de vie partageables) · Carte des limites (3 colonnes Accepté / Refusé / Sous conditions, prix planchers, date de validation par la créatrice ; badge rouge si > 90 jours) · Contrat (dates, commission, base, préavis, PDF) · Équipe (manager, chatters ; met à jour User.assigned_creator_ids) · Notes & historique (timeline).

4) CONFORMITÉ (/app/conformite) : entité ComplianceItem (creator_id, key, label, status [ok, missing, expired], checked_at, checked_by, notes). Checklist auto-créée pour chaque créatrice : majorité vérifiée (date + vérificateur, jamais de copie de pièce d'identité), contrat signé, carte des limites validée < 90 jours, bible du persona validée, 2FA activée sur les comptes, co-créateurs vérifiés et déclarés sur la plateforme, mention de l'équipe dans la bio, point bien-être < 30 jours. Score % par créatrice, vue globale avec alertes.

5) INCIDENTS : entité Incident (type [fan_possiblement_mineur, demande_illegale, harcelement_menace, chantage_sextorsion, fuite_contenu, detresse_fan, violation_charte, securite_acces, autre], severity [low, medium, high, critical], creator_id, description, evidence, actions_taken, status [ouvert, en_cours, clos], reported_by, owner_email). Bouton "Signaler" dans la topbar accessible à TOUS les rôles connectés (formulaire rapide en modale). Registre filtrable pour owner/manager. Email immédiat aux owners si severity high/critical. Fiche incident avec procédure affichée selon le type (ex. fan possiblement mineur : 1. arrêter toute interaction commerciale, 2. ne rien envoyer, 3. signaler via la plateforme, 4. documenter ici, 5. manager informé sous 15 min).

6) Crée 2 créatrices d'exemple ("Exemple — Luna", "Exemple — Jade") avec persona, limites et checklist.
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

## PHASE 11 — KPIs, analytics & finance

```text
Construis /app/kpis et /app/finance.

1) ENTITÉS : KPIEntry (creator_id, week_start, currency [EUR, USD], revenue_subscriptions, revenue_messages, revenue_tips, revenue_posts, revenue_other, active_subs, new_subs, expired_subs, renew_on_rate, traffic (array {source, clicks, new_subs, cost}), marketing_cost, notes) ; CommissionStatement (creator_id, month "AAAA-MM", gross_revenue, platform_fee, net_revenue, commission_rate, commission_amount, chat_team_share, status [brouillon, envoye, paye, en_retard], invoice_number, due_date, paid_at).

2) KPIs : formulaire de saisie hebdo (owner/manager). Calculs : brut = somme des revenus ; net = brut × 0,8 ; ARPU = net / abonnés actifs ; churn = expirés / abonnés actifs début ; conversion trafic par source = new_subs / clicks ; CAC = coût / new_subs ; croissance vs semaine précédente. Tableau de bord : cartes KPI avec variation (flèche verte/rouge), courbe des revenus 12 semaines, donut de répartition par source, barres des abonnés (nouveaux vs expirés), tableau des sources de trafic, top créatrices, classement des chatters (depuis ShiftReport : revenu/heure, conversion PPV). Objectifs mensuels (Creator.monthly_goal) en jauges. Filtres période/créatrice. Export CSV. Bouton "Analyse IA" → InvokeLLM sur les 8 dernières semaines → {resume, points_forts [], alertes [], actions_prioritaires [3]} affiché dans une carte élégante.

3) FINANCE (owner ; manager en lecture sur ses créatrices) : génération des relevés mensuels depuis les KPIEntry du mois (commission = net × commission_rate de la créatrice), numérotation de facture automatique (VAY-AAAA-0001), statuts, échéances, alerte retard, vue imprimable du relevé (pour la créatrice). Rémunération équipe : par chatter, heures (depuis Shift/ShiftReport) × hourly_rate + commission_rate × revenus de ses shifts. P&L simplifié du mois (commissions, coûts équipe, marketing, autres coûts saisis, marge). Simulateur de rentabilité (nb créatrices, revenu net moyen, commission %, coûts %) → marge mensuelle et point mort.

4) Données d'exemple : 8 semaines de KPIEntry réalistes pour Luna et Jade.
```

✅ **Tests :** les graphiques s'affichent ? Le relevé mensuel calcule bien la commission ?

---

## PHASE 12 — Espace créatrice, tableaux de bord par rôle, tâches, SOP, annonces

```text
Construis :

1) ESPACE CRÉATRICE (/app/mon-espace, team_role creator, données filtrées par User.creator_id) : accueil chaleureux personnalisé, ses KPIs (lecture), ses relevés mensuels, son calendrier de contenu, ses demandes custom à valider (Valider / Refuser + commentaire → met à jour CustomRequest et notifie le manager), sa carte des limites (modifiable : chaque modification horodate validated_by_creator_at et notifie le manager), sa bible du persona (lecture + bouton "Suggérer une modification"), ses documents (contrat), son parcours "Parcours Créatrice", boutons "Demander un point" (crée une Task pour son manager) et "Signaler un problème" (Incident confidentiel).

2) TABLEAUX DE BORD /app selon le rôle :
- owner/manager : KPIs du mois (revenu net total, commission agence, créatrices actives, nouveaux abonnés, conversion PPV moyenne), courbe 12 semaines, pipeline candidatures (créatrices et équipe), alertes (incidents ouverts, conformité < 100 %, rapports de shift manquants, apprenants en retard, limites > 90 jours), mes tâches du jour.
- chatter : prochains shifts, créatrices assignées (accès rapide persona + limites), mes KPIs de la semaine, progression académie, annonces.
- creator : redirige vers /app/mon-espace.
- recruit : progression des parcours assignés, prochaine leçon, échéances, message d'encouragement.

3) TÂCHES : entité Task (title, description, assignee_email, creator_id, priority [basse, normale, haute, urgente], due_date, status [todo, doing, done], comments array) ; vues liste et kanban, filtres "mes tâches".

4) SOP : entité SOP (title, category, content_md, version, owner_email, updated_note) ; bibliothèque avec recherche, rendu Markdown, historique de version.

5) ANNONCES : entité Announcement (title, content_md, audience_roles, pinned, read_by) ; affichées sur les tableaux de bord concernés avec accusé de lecture.

6) NOTIFICATIONS : entité Notification (user_email, type, title, link, is_read) ; cloche dans la topbar avec compteur ; créées lors de : nouvelle candidature (owners), tâche assignée, demande custom à valider, incident, quiz validé, parcours assigné, certificat obtenu.
```

✅ **Tests :** crée un compte créatrice lié à « Exemple — Luna » → elle voit uniquement ses données ?

---

## PHASE 13 — Recrutement interne & administration

```text
Construis :

1) RECRUTEMENT ÉQUIPE (/app/recrutement, owner + manager) : kanban des JobApplication (new → test_scored → interview → roleplay → offer → hired / rejected), fiche candidat (infos, CV, réponses au test, score IA + feedback, notes, date d'entretien avec ajout calendrier), tri par score. Bouton "Créer l'accès recrue" : invite l'utilisateur (team_role recruit), crée un PathAssignment "Chatter certifié" (ou selon le poste) avec échéance à J+14, email d'invitation. Gestion des offres JobPosting (CRUD, activer/désactiver).

2) CANDIDATURES CRÉATRICES (/app/candidatures) : liste + fiche (toutes les réponses), statut, score manuel /100 avec grille (motivation 25, régularité/disponibilité 20, potentiel d'audience 20, clarté des limites 15, professionnalisme 20), assignation, bouton "Convertir en créatrice" (CRM).

3) ADMINISTRATION (/app/admin, owner) : utilisateurs (inviter, team_role, créatrices assignées, creator_id, taux horaires/commissions, désactiver = status offboarded + retrait de toutes les assignations), SiteSettings (chiffres, réseaux, coordonnées, SEO, bandeau d'annonce), gestion des contenus publics (Testimonial, FAQ, BlogPost avec éditeur Markdown), journal d'activité (dernières créations/modifications importantes).
```

✅ **Tests :** convertis une candidature en créatrice, invite une recrue et vérifie qu'elle ne voit que l'Académie.

---

## PHASE 14 — Polish final, performance, accessibilité & QA

```text
Fais une passe de qualité complète sur toute l'application, sans changer les fonctionnalités :
1) Cohérence visuelle : mêmes espacements, rayons, tailles de titres, couleurs du design system partout ; supprime toute couleur ou police hors charte.
2) Responsive : vérifie chaque page en 360, 768, 1280 px ; aucun débordement horizontal ; tableaux défilables sur mobile ; sidebar en tiroir sur mobile.
3) États : chaque liste a un état vide illustré et utile, un skeleton de chargement, et un message d'erreur clair avec bouton "Réessayer".
4) Accessibilité : contrastes AA, focus visibles dorés, labels sur tous les champs, aria sur les modales, navigation clavier, alt sur les images.
5) Performance : images en lazy-loading, pagination des listes longues (25 par page), requêtes filtrées côté serveur.
6) Sécurité : revérifie que chaque page /app utilise RoleGuard et que chaque requête filtre selon le rôle (chatter → créatrices assignées ; creator → ses données).
7) SEO public : title/description/OG uniques par page, un seul H1 par page, URLs propres.
8) Micro-interactions : toasts de succès/erreur cohérents, confirmations avant suppression, raccourci "/" pour la recherche.
9) Liste-moi ensuite les éventuels points que tu n'as pas pu traiter.
```

✅ **Tests finaux :** vérifie les critères d'acceptation (section 12) de `PROMPT-BASE44-VAYNORA-HOUSE.txt`.

---

## 🔁 Ordre d'import de la formation (après la phase 6)

Dans **/app/academie/admin → Import Markdown**, colle chaque fichier du dossier `2-FORMATION-OFM/modules/` dans cet ordre, en cochant « Remplacer le module existant » :

`module-00` → `module-01` → … → `module-14` → `module-15-examen-final` → `module-16-boite-a-outils` → `module-17-glossaire`
