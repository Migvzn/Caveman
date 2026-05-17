# 12 — STRATÉGIE DE MONÉTISATION & SCALING

## Sources de revenus (4 piliers)

### 1. Commissions d'affiliation (revenu principal V1)
- **Hôtels** : Booking 25-40 % de leur commission (~ 4 % du montant utilisateur).
- **Vols** : Duffel ~ 2 %, Skyscanner ~ 1-1.5 % par clic+booking.
- **Trains/Bus** : Omio 2-5 %.
- **Activités** : GetYourGuide/Viator 8-15 %.
- **Voiture** : 5-8 %.

**Mix moyen estimé** : ~ 4-6 % du panier voyage.
- Panier moyen : 800 € → ~ 32-48 € revenu par voyage réservé.

### 2. Abonnement Premium (lancement mois 7)
- **Caveman Plus** : 9,90 €/mois ou 79 €/an.
- Inclut :
  - Alertes prix illimitées (V1 limite à 3 alertes free)
  - Voyages illimités (free = 3 brouillons simultanés)
  - Carnet de voyage IA et exports avancés
  - Support prioritaire
  - Garantie meilleur prix (V2)
  - Carbon offset offert
  - 5 % cashback sur les commissions
- Cible : 4-6 % de conversion sur MAU actifs.

### 3. Caveman for Teams (B2B — mois 11)
- 15 €/mois/employé.
- Gestion des notes de frais, politique voyage, reporting CO2.
- Intégrations SAP Concur, Expensify.
- Cible : PME 20-500 salariés.

### 4. Partenariats / sponsored placements (V2)
- Offices de tourisme régionaux qui sponsorisent recommandations honnêtes (clairement étiquetées).
- Modèle : forfait + CPM.
- Doit rester < 5 % des résultats pour ne pas casser la confiance.

## Modèle économique unitaire (mois 12 cible)

```
Par utilisateur MAU actif (qui finalise au moins 1 voyage / 3 mois) :
   Revenu voyages affiliés .............  4,2 €/mois (40 € / 9 mois cycle moyen)
   Conversion Premium (5 %)  ...........  0,40 €/mois  (5 % × 8 €)
   Total revenu  .......................  4,6 €/mois

   COGS :
   - API LLM ........................... 0,15 €/mois
   - APIs externes (Mapbox, GMaps, etc.) 0,20 €/mois
   - Infra (compute + DB) .............. 0,18 €/mois
   - Paiements (Stripe ~3 %) ........... 0,06 €/mois
   Total COGS .........................  0,59 €/mois
   Marge brute ........................  87 %
```

À 250k MAU actifs, mois 12 :
- Revenu mensuel : **~ 1,15 M €**
- COGS : ~ 150 k €
- Gross margin : ~ 1 M €
- Opex (salaires, marketing, etc.) : ~ 800 k €
- **EBITDA mensuel ~ +200 k €** (objectif "rentable opérationnellement")

## Stratégie d'acquisition

### Organique (priorité)
- **SEO programmatique** : pages "Voyage [destination] en [mois] avec [budget] €" générées (avec garde-fous qualité).
- **Réseaux sociaux** : TikTok / Instagram — démos de génération voyage en 30 s.
- **Communauté Reddit / forums voyageurs** : présence experte, pas spam.
- **Press relations** : angle "fin des comparateurs séparés" + "IA qui économise X €".

### Payant (modéré)
- **CAC cible** : < 12 €.
- **Canaux** : Google Search (intent élevé), TikTok ads (jeune audience), Meta ads (retargeting).
- **Affiliation inverse** : créateurs voyage promeuvent contre revshare 10 %.

### Virilité
- Partage voyage (lien public) → friction réduite pour invitations groupe.
- "Découvre comment j'ai planifié ce voyage avec Caveman" → conversion via démo réelle.

## Stratégie de prix

### Freemium
- 3 voyages brouillons simultanés
- 3 alertes prix
- Toutes les fonctions d'IA principales (la valeur du chat doit rester accessible — c'est le wow)
- 1 export PDF / voyage

### Premium (9,90 € / 79 €)
- Tout illimité
- Fonctions avancées (carbon, garantie prix, carnet IA)

### Pourquoi pas un essai gratuit
- L'utilisateur doit pouvoir réaliser **1 voyage complet** en free pour comprendre la valeur, puis on lui propose Premium quand il revient pour le 2e.

## Scaling

### Scaling technique
| Étape | Trigger | Action |
|---|---|---|
| 0-10k MAU | — | Modular monolith, 1 région |
| 10k-100k MAU | latence > 500ms P95 | Extraction `search` en Go |
| 100k-500k MAU | DB hot spots | Read replicas Postgres, cache aggressif |
| 500k-2M MAU | latence cross-region | 2e région cloud |
| 2M+ MAU | DB monolithic atteint limite | Sharding par user_id ou Cockroach |

### Scaling équipe
- Pas plus de 8 personnes par équipe.
- Squads par domaine (Identity, Search, Itinerary, Booking, Mobile, AI, Growth, Infra).
- Engineering manager par squad au-delà de 5 ingénieurs.

### Scaling produit
- Verticales successives :
  1. Voyages loisir 1 personne (V1)
  2. Voyages couple (V1.1)
  3. Voyages groupe (V2)
  4. Voyages d'affaires (V2)
  5. Voyages famille (V3)
  6. Honeymoons / événementiel (V3)

### Scaling géographique
- 6 marchés prioritaires : FR, UK, DE, ES, IT, US.
- Localisation = traduction + adaptation des partenaires (e.g. trains DB en Allemagne).
- Pas d'expansion avant d'avoir > 30 % retention M3 sur marché courant.

## Funding plan
- **Pré-seed** (mois 0) : 500 k € — fondateurs + business angels.
- **Seed** (mois 6) : 3 M € — VC, après 10k MAU et NPS > 40.
- **Série A** (mois 14-18) : 12-18 M € — après preuve unit economics + scale en cours.

## Métriques de référence (rapport mensuel)

### North Star
- Voyages réservés par mois (transport + hôtel confirmés)

### Acquisition
- Visiteurs uniques, sign-ups, CAC, source mix

### Engagement
- DAU/MAU, sessions/MAU, temps moyen avant 1er voyage finalisé

### Monétisation
- Revenue per MAU, conversion Premium, ARPU, take rate moyen

### Rétention
- M1, M3, M6 retention
- % d'utilisateurs avec ≥ 2 voyages finalisés

### Qualité
- NPS, support tickets / 1k MAU, taux de réclamation
