# 06 — APIs VOYAGE & EXTERNES

## Approche
Plutôt que d'intégrer chaque API directement, le service `search` expose un **port** (interface unifiée) et chaque API externe est un **adaptateur** (pattern Hexagonal). On démarre avec 1 fournisseur par catégorie en MVP, on en ajoute progressivement.

## Transport — avion

### Duffel (MVP recommandé)
- **Pourquoi** : API moderne, payments inclus, certifié IATA, NDC.
- **Modèle** : commission sur réservations.
- **Endpoints clés** :
  - `POST /air/offer_requests` — recherche
  - `GET /air/offers/{id}` — récupère offre
  - `POST /air/orders` — réservation
- **Limites** : pas tous les LCC ; couverture moins large que Amadeus.
- **Auth** : Bearer token.
- **Pricing** : pas d'abonnement, take rate ~ 2-3 % par billet.

### Amadeus Self-Service (V1.1)
- **Pourquoi** : GDS, couverture mondiale, prédiction prix.
- **Endpoints** :
  - `GET /v2/shopping/flight-offers`
  - `GET /v1/shopping/flight-dates` — moins cher dans une période
  - `GET /v1/analytics/itinerary-price-metrics` — prédiction
- **Quota** : 10 req/sec gratuit, payant au-delà.

### Skyscanner Partners (V1.1)
- **Pourquoi** : couverture meta + traffic affilié.
- **Modèle** : 100 % affiliation (commissions sur clics + booking).
- **Endpoints** : `POST /flights/live/search/create` puis polling `/poll`.

### Kiwi Tequila (V1.1)
- **Pourquoi** : seul à proposer le **virtual interlining** (combine compagnies sans alliance, garantie correspondance).
- **Endpoints** : `GET /v2/search`, `POST /v2/booking/check_flights`, `POST /v2/booking/save_booking`.

## Transport — train

### SNCF Connect API (FR — MVP)
- **Endpoint** public : `https://api.sncf.com/v1/coverage/sncf/journeys`
- Couvre France + connexions Europe.
- Affiliation possible via Trainline (qui revend SNCF + concurrence).

### Trainline Partners (V1.1)
- **Pourquoi** : couvre 270+ compagnies de train EU.
- Affiliation.

### Deutsche Bahn (DB Vendo) (V2)
- Pour couverture Allemagne et Europe centrale en direct.

## Transport — bus & multi-mode

### Omio (MVP)
- **Pourquoi** : agrégateur train+bus+ferry européen, 1000+ opérateurs (FlixBus, BlaBlaBus, Eurostar, etc.).
- **Modèle** : affiliation.

### FlixBus API (V1.1) en direct pour meilleur take rate.

### Rome2Rio (recherche multi-mode)
- **Endpoint** : `GET /search.json?oName=Paris&dName=Lisbon`
- Retourne TOUS les moyens (avion, train, bus, ferry, voiture) avec prix indicatifs et durées.
- **Usage** : pour proposer des trajets hybrides exotiques.
- **Modèle** : payant (à partir de 99 $/mois pour 10k requêtes).

## Voiture & covoiturage

### BlaBlaCar API (V2 — restreinte)
- Partenariat nécessaire ; API B2B uniquement.

### Cars.com / Discover Cars / Booking Cars (V1.1)
- Pour location voiture, affiliation simple.

## Hébergement

### Booking.com Affiliate Partner (MVP)
- **Modèle** : commission 25-40 % de la commission Booking (donc ~ 4 % du prix de la nuit).
- **Endpoint** : Booking Demand API (B2B, accès sur demande).
- **Alternative simple** : deep-links affiliés avec paramètre `aid` — pas d'API riche mais 0 friction.

### Expedia Rapid (V1.1)
- API riche, white-label possible, accès strict.

### Hostelworld Affiliate (V1.1)
- Pour auberges (segment éco).

### Airbnb (V2)
- Pas d'API publique ; partenariat direct nécessaire ou scraping légal (zone grise — éviter).

### Hotels.com / Agoda (V2)
- Couverture complémentaire Asie.

## POIs, restaurants, activités

### Google Places API (MVP)
- `Place Autocomplete`, `Place Details`, `Nearby Search`, `Place Photos`.
- Quota : 200 $ gratuits / mois.

### TripAdvisor Content API (V1.1)
- Avis, photos, ratings.
- Accès partenaire requis.

### GetYourGuide / Viator Affiliate (V1.1)
- Activités réservables, commissions 8-15 %.

### Foursquare Places (V2)
- Bonne couverture restaurants, alternative GMaps moins chère à scale.

## Cartes

### Mapbox (MVP)
- Cartes vector, Directions, Matrix, Optimization API.
- 50k loads/mois gratuits.

### MapLibre + Mapbox tiles autohébergé (V2)
- Pour réduire coûts à scale.

## Météo

### OpenWeather One Call (MVP)
- Free tier 1000 req/jour.

### Tomorrow.io (V1.1)
- Prévisions long-terme plus fiables (utile pour voyages > 14 jours).

## Taux de change

### exchangerate.host (MVP, gratuit)
- `GET https://api.exchangerate.host/latest?base=EUR`

### Open Exchange Rates (V1.1) si besoin de fiabilité prod.

## Traduction (V2)

### DeepL API
- Meilleure qualité que Google Translate sur langues européennes.

### Whisper API (V1.1)
- Voice-to-text pour input vocal.

## Paiements

### Stripe (V1.1 quand checkout natif)
- **Stripe Connect** pour les fournisseurs (escrow).
- **Stripe Identity** pour KYC (réservations sensibles).

### Adyen (V2)
- Alternative pour markets non couverts par Stripe.

## Identité / Auth

### Clerk (MVP) ou Auth0
- OAuth Google, Apple, email magic link, MFA.

### Migration vers WorkOS (V2) pour SSO entreprise B2B.

## Analytics & monitoring

- **PostHog** (product analytics, self-hostable)
- **Sentry** (errors)
- **Datadog** (infra, optionnel — coûteux)

## LLM providers

- **Anthropic** (primaire) — claude-opus-4-7, sonnet-4-6, haiku-4-5
- **OpenAI** (secondaire) — pour Whisper et embeddings text-embedding-3-large
- **Mistral** (fallback EU souveraineté) — Mistral Large pour requêtes sensibles RGPD

## Tableau récapitulatif MVP minimum viable

| Catégorie | Fournisseur MVP | Coût démarrage |
|---|---|---|
| Avion | Duffel | 0 € + commission |
| Train FR/EU | SNCF Connect + Omio | 0 € (affiliation) |
| Bus EU | Omio | 0 € (affiliation) |
| Multi-mode planner | Rome2Rio | 99 $/mois |
| Hôtel | Booking deep-link affilié | 0 € + commission |
| POIs | Google Places | ~ 50 $/mois |
| Cartes | Mapbox | 0 € jusqu'à 50k |
| Météo | OpenWeather | 0 € free tier |
| Auth | Clerk | 0 € jusqu'à 10k MAU |
| LLM | Anthropic | ~ 200-500 €/mois beta |
| Hébergement cloud | AWS + Vercel | ~ 250 €/mois |
| **Total fixe mensuel MVP** | | **~ 800 €/mois** |

## Stratégie de fallback
Pour chaque catégorie, **2 fournisseurs minimum** en V1.1. Le service `pricing` fait fan-out parallèle, déduplique les offres (clé canonique : `mode|operator|from|to|date|class`), et retient la moins chère.
