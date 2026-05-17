# 11 — ROADMAP 12 MOIS

## Vue d'ensemble

| Mois | Phase | Livrable clé | KPI cible |
|---|---|---|---|
| 1-3 | MVP | Web app fonctionnelle, 1 fournisseur par catégorie | 1k waitlist |
| 4-6 | V1.1 — Mobile + alertes | Apps iOS/Android, alertes prix | 10k MAU |
| 7-9 | V2 — Checkout natif | Stripe Connect, paiement unifié | 100k MAU, 5k voyages/mois |
| 10-12 | Scale | Multi-région, B2B | 250k MAU, profitabilité unit |

## Phase 1 — MVP (mois 1 à 3)

### Mois 1 — Fondations
- Setup monorepo, CI/CD, infra Terraform.
- Auth (Clerk), DB Postgres, premier endpoint santé.
- Landing + composant chat.
- Premier wiring LLM (Claude) avec Intent Parser.
- Intégration Duffel + Booking deep-link.
- Design system v0 + 3 écrans clés.

### Mois 2 — Cœur produit
- Planner Orchestrator + Optimizer (PuLP).
- Itinerary Composer.
- SSE streaming bout-en-bout.
- Drag-and-drop itinéraire.
- Map view (Mapbox).
- Export PDF.

### Mois 3 — Polissage + Beta privée
- Comptes utilisateurs, sauvegarde voyages.
- 50 beta testeurs.
- Itération UX, fix bugs, eval prompts.
- Launch ProductHunt fin de mois.

**Sortie phase 1** : produit utilisable, public restreint, ~ 1000 inscrits.

## Phase 2 — V1.1 Mobile + Alertes (mois 4 à 6)

### Mois 4
- App Expo (iOS + Android).
- Push notifications.
- Alertes prix (worker + UI).
- Ajout Skyscanner + Amadeus comme fournisseurs avion.

### Mois 5
- Recommandation V1 (content-based) basée sur historique.
- Mode groupe simple (partage voyage en lecture).
- Onboarding amélioré.
- Premier paid acquisition test (5k €).

### Mois 6
- Voix (Whisper) en input.
- Ajout Kiwi (virtual interlining).
- Hybrid routes activées par défaut.
- Public launch officiel.

**Sortie phase 2** : 10k MAU, NPS > 40.

## Phase 3 — V2 Checkout natif + Monétisation (mois 7 à 9)

### Mois 7
- Stripe Connect + escrow.
- Checkout unifié (vol + hôtel + activités en 1 tunnel).
- Gestion changements/annulations.
- Service Customer Support intégré.

### Mois 8
- Abonnement Premium (voir Business Model) lancé.
- Split budget mode groupe.
- Carnet de voyage IA.

### Mois 9
- Mode hors ligne mobile (offline maps, billets téléchargés).
- Traduction embarquée (DeepL).
- Assistant temps réel (replanification pendant le voyage).

**Sortie phase 3** : 100k MAU, premier mois rentable opérationnellement.

## Phase 4 — Scale (mois 10 à 12)

### Mois 10
- Multi-région : ouverture US (eu-central + us-east).
- Localisation ES, DE, IT.
- A/B testing systématisé.

### Mois 11
- Lancement B2B (Caveman for Teams) — voyages d'affaires.
- Intégrations corporate (Expensify, SAP Concur).
- Programme partenaires (créateurs voyage).

### Mois 12
- Génération contenu réseaux sociaux (post-voyage).
- Recommandation V2 (collaborative filtering + LLM).
- Open API (V0) pour partenaires.

**Sortie phase 4** : 250k MAU, levée de fonds série A possible.

## Jalons techniques transverses

| Trimestre | Tech |
|---|---|
| Q1 | Modular monolith NestJS, 1 Postgres, 1 Redis |
| Q2 | Extraction service `search` en Go, Kafka introduit |
| Q3 | Extraction `recommendation` (Python), ClickHouse, pgvector |
| Q4 | Multi-région DB, CDN images, observabilité complète |

## Recrutement parallèle

| Mois | Embauches |
|---|---|
| 1 | CTO + 1 senior fullstack + 1 designer |
| 3 | +1 ML/AI engineer, +1 backend (Go) |
| 5 | +2 mobile (Swift/Kotlin si on quitte Expo), +1 growth |
| 7 | +1 head of ops, +1 customer support |
| 9 | +2 fullstack, +1 data engineer |
| 12 | Équipe ~ 18 personnes |

## Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Coût IA explose | M | H | Cache agressif, Haiku par défaut, hard caps |
| API partenaire down | M | H | Multi-fournisseur dès V1.1 |
| Régulation IATA pour réservation directe | H | M | V1 = affiliation pure (pas concerné) |
| Concurrence (Google, Booking) ajoutent IA | H | M | Vitesse + DX > eux ; niche premium |
| Hallucinations | M | H | Validation stricte, jamais inventer prix/POI |
| Saisonnalité | H | M | Diversifier destinations cibles, B2B = anti-cyclique |
| RGPD / souveraineté | M | M | Hébergement EU, modèle EU (Mistral) fallback |
