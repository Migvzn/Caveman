# 03 — STRUCTURE TECHNIQUE (MONOREPO & MICROSERVICES)

## Monorepo (pnpm + Turborepo)

```
caveman-travel/
├─ apps/
│  ├─ web/                    # Next.js 15 — site + webapp
│  ├─ mobile/                 # Expo (React Native) — V1.1
│  ├─ admin/                  # back-office (Next.js minimal)
│  └─ landing/                # marketing site statique
├─ services/
│  ├─ api-gateway/            # NestJS BFF
│  ├─ ai-orchestrator/        # FastAPI (Python) — agents IA
│  ├─ search/                 # Go — agrégateur prix
│  ├─ pricing/                # Go — normalisation + prédiction
│  ├─ itinerary/              # NestJS — génération + édition
│  ├─ booking/                # NestJS — redirection affiliée puis checkout
│  ├─ user/                   # NestJS — profil, préférences, mémoire
│  ├─ inventory/              # NestJS — POIs, restaurants, hôtels enrichis
│  ├─ payments/               # NestJS — Stripe (V2 pour checkout natif)
│  ├─ notifications/          # NestJS — email, push, in-app
│  ├─ recommendation/         # Python — collaborative + content-based
│  └─ ingestion/              # Python — workers Kafka, ETL APIs externes
├─ packages/
│  ├─ ui/                     # design system partagé (shadcn-based)
│  ├─ icons/
│  ├─ types/                  # types TS partagés (générés depuis Protobuf)
│  ├─ protobuf/               # définitions gRPC
│  ├─ config/                 # ESLint, Prettier, TSConfig, Tailwind preset
│  ├─ analytics/              # wrapper PostHog
│  ├─ feature-flags/          # GrowthBook client
│  └─ test-utils/
├─ infra/
│  ├─ terraform/
│  │  ├─ modules/
│  │  └─ envs/{dev,staging,prod}/
│  ├─ helm/
│  └─ k8s/manifests/
├─ docs/
└─ scripts/
```

## Structure interne d'un service NestJS type

```
services/booking/
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ modules/
│  │  ├─ booking/
│  │  │  ├─ booking.controller.ts        # REST / gRPC
│  │  │  ├─ booking.service.ts           # use cases
│  │  │  ├─ booking.repository.ts        # accès DB
│  │  │  ├─ dto/
│  │  │  ├─ domain/                       # entités + value objects
│  │  │  └─ events/                       # publishers Kafka
│  │  └─ affiliate/                       # adaptateurs partenaires
│  │     ├─ booking-com.adapter.ts
│  │     ├─ duffel.adapter.ts
│  │     └─ ...
│  ├─ common/
│  │  ├─ filters/
│  │  ├─ guards/
│  │  ├─ interceptors/                    # tracing, metrics, rate limit
│  │  └─ pipes/
│  └─ config/
├─ test/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ Dockerfile
└─ package.json
```

## Frontend Next.js — arborescence

```
apps/web/
├─ app/
│  ├─ (marketing)/
│  │  ├─ page.tsx                          # landing
│  │  ├─ pricing/page.tsx
│  │  └─ about/page.tsx
│  ├─ (app)/
│  │  ├─ layout.tsx                        # shell connecté
│  │  ├─ chat/page.tsx                     # conversation IA
│  │  ├─ trips/
│  │  │  ├─ page.tsx                       # liste voyages
│  │  │  ├─ [tripId]/
│  │  │  │  ├─ page.tsx                    # vue voyage
│  │  │  │  ├─ itinerary/page.tsx
│  │  │  │  ├─ budget/page.tsx
│  │  │  │  ├─ documents/page.tsx
│  │  │  │  └─ map/page.tsx
│  │  ├─ favorites/page.tsx
│  │  ├─ alerts/page.tsx
│  │  └─ settings/page.tsx
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ callback/page.tsx
│  └─ api/                                  # route handlers
│     ├─ chat/route.ts                      # SSE proxy → ai-orchestrator
│     ├─ trips/[id]/pdf/route.ts
│     └─ webhooks/stripe/route.ts
├─ components/
│  ├─ chat/
│  │  ├─ ChatComposer.tsx
│  │  ├─ MessageList.tsx
│  │  └─ ScenarioCard.tsx
│  ├─ itinerary/
│  │  ├─ DayTimeline.tsx
│  │  ├─ DraggableActivity.tsx
│  │  └─ MapView.tsx
│  ├─ budget/
│  │  ├─ BudgetRing.tsx
│  │  └─ BudgetBreakdown.tsx
│  ├─ search/
│  │  ├─ TransportOptions.tsx
│  │  └─ HotelCard.tsx
│  └─ ui/                                   # primitives shadcn
├─ lib/
│  ├─ api/                                  # client typé (generated)
│  ├─ ai/                                   # SSE consumer
│  ├─ hooks/
│  ├─ stores/                               # zustand
│  └─ utils/
├─ styles/
└─ public/
```

## Communication entre services
- **Sud-Nord** (client → BFF) : **REST** + **SSE** pour streaming chat.
- **Est-Ouest** (service → service) : **gRPC** synchrone + **Kafka** asynchrone.
- **Schémas** : Protobuf source de vérité ; types TS / Python générés en CI.

## Conventions
- **Trunk-based development** : feature flags pour livraison continue.
- **Conventional Commits** : `feat:`, `fix:`, `chore:`, etc.
- **PR template** obligatoire (problème, solution, tests, risques).
- **Tests** : pyramide 70% unit / 20% integration / 10% e2e.
- **Coverage cible** : 80 % sur code métier, 60 % global.
- **Linter** : ESLint + Biome, Prettier off (Biome formatte).
- **TypeScript strict** + `noUncheckedIndexedAccess`.
- **API versionnée** : `/v1/...`, `/v2/...` ; jamais de breaking change silencieux.

## Performance budgets
- **Web** : LCP < 2.0 s, INP < 200 ms, CLS < 0.1.
- **API** : P95 < 300 ms (sauf endpoints de génération IA, P95 < 12 s, streaming).
- **Bundle JS initial** : < 180 KB gzip.
