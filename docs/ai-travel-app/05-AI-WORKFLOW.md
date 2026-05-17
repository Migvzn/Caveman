# 05 — WORKFLOW IA COMPLET

## Principe directeur
Un **orchestrateur** unique (LLM principal) qui décompose la demande en sous-tâches, et **n agents spécialisés** (LLM secondaires ou pipelines déterministes) qui résolvent chaque sous-tâche. L'orchestrateur agrège, arbitre, présente.

L'IA générative est utilisée pour la **compréhension** et la **mise en forme**. Toute optimisation numérique (budget, planning, prix) repose sur des **algorithmes déterministes** — pas le LLM.

## Vue d'ensemble du pipeline

```
Utilisateur (texte libre)
        │
        ▼
┌───────────────────────────┐
│ 1. Intent Parser          │ ← Claude Haiku (rapide, pas cher)
│    JSON structuré         │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 2. Clarifier (≤2 questions)│ ← Claude Haiku
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 3. Planner Orchestrator   │ ← Claude Opus 4.7 (raisonnement)
│    décompose en tâches    │
└───────┬───────────────────┘
        │
        ├──► Agent Search (parallèle)
        │      └── APIs transport
        ├──► Agent Lodging (parallèle)
        │      └── APIs hôtels
        ├──► Agent POI (parallèle)
        │      └── Inventory interne + Google Places
        └──► Agent Weather (parallèle)
               └── OpenWeather / Climacell
        │
        ▼
┌───────────────────────────┐
│ 4. Optimizer (déterministe)│ ← Programmation linéaire / heuristique
│   Génère 3 scénarios       │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 5. Itinerary Composer     │ ← Claude Sonnet + template engine
│   Jour-par-jour            │
└───────┬───────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 6. Presenter              │ ← Claude Sonnet (style, ton)
│   Réponse user-facing      │
└───────────────────────────┘
```

## Agents en détail

### 1. Intent Parser
**But** : extraire un schéma structuré en < 1 seconde.

**Modèle** : `claude-haiku-4-5`, température 0.2, max_tokens 400, prompt cache sur la spec.

**Sortie JSON (Zod-validée)** :
```json
{
  "origin": "Lyon",
  "destination": "Lisbonne",
  "duration_days": 5,
  "date_window": { "month": "2026-06", "flexible_days": 3 },
  "budget_total_eur": 800,
  "transport_preferences": ["any"],
  "lodging_preferences": ["quiet"],
  "activity_preferences": ["local_food", "avoid_touristy"],
  "travelers": { "adults": 1, "children": 0 },
  "missing_critical": []
}
```

Si `missing_critical` non vide → passer au Clarifier.

### 2. Clarifier
- Pose au maximum **2 questions** ciblées avec **boutons** (pas du texte libre).
- Exemples : "Dates flexibles ?", "Avion ok ?", "Combien êtes-vous ?".
- Si l'utilisateur ne répond pas → assume des défauts (window flexible 7j, transport any, 1 adulte).

### 3. Planner Orchestrator
**But** : décider QUELLES APIs appeler avec QUELS paramètres.

**Modèle** : `claude-opus-4-7`, raisonnement étendu activé.

**Pattern : tool-use ReAct contrôlé** — l'orchestrateur sort un plan structuré (pas du free-form) :
```json
{
  "search_legs": [
    { "from": "LYS", "to": "LIS", "date_range": "2026-06-05..2026-06-08", "modes": ["flight","train"] },
    { "from": "LIS", "to": "LYS", "date_range": "2026-06-09..2026-06-12", "modes": ["flight","train"] }
  ],
  "lodging": { "city": "Lisbon", "nights": 4, "max_eur_per_night": 90, "vibes": ["quiet"] },
  "poi_buckets": ["food_local", "history", "nature", "nightlife_optional"],
  "weather_for": ["Lisbon", "2026-06-05..2026-06-09"]
}
```

Ce plan est ensuite exécuté en **parallèle** par les agents spécialisés (gather), avec timeout 6s par agent.

### 4. Optimizer (déterministe)
- **Pas de LLM ici** — un algorithme.
- Reçoit : N options transport (chacune avec prix, durée, score confort), M options hôtels, K POIs scorés.
- Produit **3 scénarios** :
  - **ECO** : minimise prix total
  - **BALANCED** : optimise un score utilité = `0.5·prix_inv + 0.3·confort + 0.2·match_pref`
  - **COMFORT** : maximise confort sous contrainte budget × 1.4
- Algo : programmation linéaire entière (PuLP) pour la sélection transport+hôtel, puis greedy pour le packing des activités jour-par-jour avec **contrainte géographique** (regrouper par proximité — k-medoids).

### 5. Itinerary Composer
- Reçoit les 3 scénarios + POIs sélectionnés.
- Génère le **planning jour-par-jour** : pour chaque jour, choisit 3-5 activités cohérentes géographiquement et temporellement.
- LLM utilisé seulement pour les **titres et descriptions** ; le squelette horaire est déterministe.

### 6. Presenter
- Transforme la sortie technique en réponse **conversationnelle** courte.
- Ton à adapter : sobre, direct, francophone naturel.
- N'invente jamais de prix ni d'horaires (toutes les valeurs viennent des sorties d'agents).

## Streaming (UX)
- L'utilisateur voit la réponse arriver progressivement en SSE :
  1. **0.5 s** : "J'analyse..." (Intent Parser)
  2. **1.5 s** : "Je compare 47 options de vol et 23 hôtels..." (lancement parallèle)
  3. **4-8 s** : remplissage progressif du panneau scénarios (chaque agent qui finit pousse son fragment)
  4. **8-12 s** : itinéraire complet rendu

Implémentation : SSE multipart, chaque event a un `type` (`thinking`, `scenario_partial`, `scenario_final`, `done`, `error`).

## Mémoire utilisateur (RAG)
- Chaque interaction génère des **faits** condensés (`prefère train à avion`, `n'aime pas les hôtels lit double`, `voyage souvent en septembre`).
- Stockés dans Postgres `user_facts` table + embedding pgvector.
- À chaque nouvelle conversation, top-10 faits pertinents sont récupérés et injectés en system prompt (avec prompt caching).
- L'utilisateur peut **consulter et éditer** ses faits (transparence — RGPD).

## Garde-fous (safety + qualité)
- **Validation Zod** stricte sur toute sortie LLM structurée. Si parse fail → 1 retry avec message d'erreur, sinon fallback déterministe.
- **Aucun prix inventé** : tous les prix proviennent d'appels API et sont passés au LLM comme contexte read-only.
- **Hallucination guard** : les noms de lieux/hôtels sont validés contre Inventory ou Google Places avant affichage.
- **Coût cap** : budget LLM par voyage hard-cappé à 0,60 € ; au-delà, on tronque le contexte et on log.
- **Latence budget** : si Planner > 4s, on bascule sur un sous-modèle plus rapide.
- **Toxicity filter** sur input utilisateur (modération API).

## Choix de modèles (table)

| Étape | Modèle | Justification |
|---|---|---|
| Intent Parser | claude-haiku-4-5 | Rapide, structuré, peu cher |
| Clarifier | claude-haiku-4-5 | Même prompt cache |
| Planner | claude-opus-4-7 | Raisonnement multi-étapes |
| Composer | claude-sonnet-4-6 | Bon équilibre qualité/coût |
| Presenter | claude-sonnet-4-6 | Style FR/EN naturel |
| Embeddings | text-embedding-3-large (1536d) | Qualité top |
| Voix (V1.1) | Whisper-1 | STT robuste multi-langues |

## Coûts cibles par voyage
- Tokens IA : ~ 0,20-0,35 €
- API externes : ~ 0,05 € (la plupart sont free tier / affiliés)
- Compute : ~ 0,03 €
- **Total : ~ 0,30-0,45 € par voyage généré**

À 100 000 voyages/mois → ~ 35 000 €/mois COGS, à comparer avec ~ 250 € de revenu moyen par voyage réservé × taux de conversion 15 % = 37 500 €... ratio à durcir (cf. Business Model).
