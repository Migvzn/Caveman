# 01 — ARCHITECTURE TECHNIQUE

## Vue d'ensemble (haut niveau)

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  Web (Next.js)   iOS (Swift/RN)   Android (Kotlin/RN)   PWA      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WSS
                ┌──────────────▼───────────────┐
                │     API Gateway (Kong)        │
                │     Auth, Rate-limit, WAF     │
                └──────────────┬───────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼─────┐         ┌──────▼──────┐        ┌──────▼──────┐
   │   BFF    │         │  Realtime   │        │   Static    │
   │ (NestJS) │         │  (WS/SSE)   │        │   (CDN)     │
   └────┬─────┘         └──────┬──────┘        └─────────────┘
        │                      │
┌───────┴──────────────────────┴───────────────────────────────────┐
│                    SERVICE MESH (gRPC interne)                    │
├──────────────────────────────────────────────────────────────────┤
│ AI Orchestrator │ Search │ Pricing │ Itinerary │ Booking │ User  │
│ Inventory       │ Payments │ Notifications │ Recommendation │ ... │
└──────────────────────────────────────────────────────────────────┘
        │                      │                      │
┌───────▼──────┐      ┌────────▼────────┐    ┌────────▼────────┐
│  PostgreSQL  │      │     Redis       │    │   Pinecone /    │
│   (OLTP)     │      │  (cache/queue)  │    │     pgvector    │
└──────────────┘      └─────────────────┘    └─────────────────┘
        │                      │                      │
┌───────▼──────┐      ┌────────▼────────┐    ┌────────▼────────┐
│  ClickHouse  │      │   Object Store  │    │     Kafka       │
│  (analytics) │      │   (S3 / R2)     │    │  (event bus)    │
└──────────────┘      └─────────────────┘    └─────────────────┘

External APIs : Amadeus · Skyscanner · Duffel · Kiwi · SNCF · Omio
                Rome2Rio · Booking · Expedia · Airbnb · GMaps · OpenWeather
                Stripe · LLM providers (Anthropic, OpenAI, Mistral)
```

## Choix technologiques

### Frontend Web
- **Next.js 15** (App Router, RSC, Server Actions)
- **React 19**
- **TypeScript** strict
- **TailwindCSS** + **shadcn/ui**
- **Framer Motion** pour animations
- **Mapbox GL JS** ou **MapLibre** pour cartes
- **TanStack Query** pour fetching/cache
- **Zustand** pour state local
- **Zod** pour validation runtime
- **next-intl** pour i18n

### Mobile
- **React Native + Expo** (V1) pour partage code / vitesse de mise au marché
- Migration possible vers **natif** (Swift / Kotlin Compose) si besoins de perf (cartes 3D, AR)
- **Expo Router**, **Reanimated 3**, **Skia** pour micro-animations

### Backend
- **NestJS** (TypeScript) pour les services REST/BFF
- **Go** pour les services hot path (Search, Pricing aggregator) — concurrence forte
- **Python (FastAPI)** pour les services IA / ML
- Communication interne : **gRPC** + **Protobuf**
- **Kafka** pour évènements asynchrones (alertes prix, indexation, analytics)

### Bases de données
- **PostgreSQL 16** : users, trips, bookings, payments (source de vérité)
- **pgvector** (extension) : embeddings — OU **Pinecone** managé si scale > 10M vecteurs
- **Redis 7** : cache, rate limit, sessions, queue temps réel
- **ClickHouse** : analytics, logs requêtes, prédiction prix
- **S3 / Cloudflare R2** : photos voyages, PDFs, documents
- **Elasticsearch / Meilisearch** : recherche full-text (destinations, POIs)

### IA / ML
- **Claude (Anthropic)** comme LLM principal (claude-opus-4-7 pour planification complexe, claude-haiku-4-5 pour intentions rapides)
- **OpenAI** en fallback / pour fonctions spécifiques (Whisper voix, embeddings text-3-large)
- **LangGraph** ou orchestrateur custom léger pour les workflows multi-agents
- **Prompt caching** activé (gain coût ~80 % sur prompts système longs)
- **Embeddings** : text-embedding-3-large (3072 dims, réduit à 768 via Matryoshka)

### Infrastructure
- **Vercel** pour Next.js (preview deploys, edge functions)
- **AWS** (Frankfurt + Singapore) pour services backend
  - **EKS** (Kubernetes) pour microservices
  - **RDS** Postgres Multi-AZ
  - **ElastiCache** Redis
  - **MSK** Kafka managé
  - **CloudFront** CDN
- **Docker** pour images, **Helm** pour charts K8s
- **Terraform** pour IaC
- **GitHub Actions** pour CI/CD

### Observabilité
- **OpenTelemetry** (traces + métriques + logs)
- **Grafana** + **Prometheus** + **Loki**
- **Sentry** pour erreurs front + back
- **PostHog** pour product analytics

### Sécurité
- **Auth0** ou **Clerk** pour identité (V1) → custom (V2) avec OAuth Google/Apple
- **Vault** pour secrets
- **Cloudflare WAF** + bot management
- **Mutual TLS** entre services internes
- **Audit logs** dans ClickHouse

## Pattern d'architecture
- **Modular monolith** au démarrage (NestJS avec modules clairs), puis extraction progressive vers microservices au fur et à mesure que les domaines mûrissent et que les charges divergent.
- **Domain-Driven Design** : bounded contexts clairs (Identity, Travel Search, Itinerary, Booking, Payments, Recommendation).
- **CQRS léger** sur les services lecture-lourde (Search, Recommendation).
- **Event-driven** pour intégrations cross-service (booking confirmé → notif + analytics + indexation).

## Stratégie multi-région
- **Phase 1** : 1 région (eu-central-1), latence acceptable Europe + MENA.
- **Phase 2** : ajout us-east-1, ap-southeast-1.
- **Phase 3** : Postgres multi-master via **CockroachDB** (réécriture limitée) ou **read replicas** régionales.

## Disponibilité cible
- **SLO** : 99.9 % uptime sur le path critique (chat + search + booking).
- **RTO** : 15 minutes.
- **RPO** : 5 minutes (réplication continue Postgres + sauvegardes PITR).

## Limites volontaires (V1)
- Pas de microservices avant d'avoir besoin (YAGNI).
- Pas de service mesh complexe (Istio) tant que < 15 services.
- Pas de multi-cloud (un seul cloud = simplicité).
