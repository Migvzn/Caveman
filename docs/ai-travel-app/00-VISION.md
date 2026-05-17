# 00 — VISION GLOBALE

## Nom de code
**Caveman Travel** (placeholder) — Plateforme IA de planification, comparaison et réservation de voyages.

## Pitch (1 phrase)
Un assistant IA qui transforme une phrase en un voyage complet, optimisé, réservable, et personnalisé — du transport hybride à l'hôtel, jour par jour, dans le budget exact de l'utilisateur.

## Pitch long
La plupart des voyageurs passent 10 à 20 heures à comparer des billets sur Skyscanner, des hôtels sur Booking, des trains sur SNCF Connect, des activités sur TripAdvisor, des trajets sur Rome2Rio, puis à assembler le tout dans un Google Doc. Caveman Travel fait ce travail en 30 secondes, en partant d'une phrase libre, en optimisant le budget global au lieu de chaque service séparément, et en proposant des trajets hybrides (train + avion + ferry) que les comparateurs classiques ne montrent jamais.

## Problème
1. **Fragmentation** : 8 à 12 services différents pour planifier un voyage.
2. **Optimisation locale** : chaque service optimise SON sous-problème, jamais le voyage global.
3. **Pas de trajets hybrides** : Skyscanner ne propose pas "TGV jusqu'à Milan puis avion vers Tokyo" même si c'est 200 € moins cher.
4. **Personnalisation pauvre** : recommandations basées sur popularité, pas sur le voyageur.
5. **Budget mal géré** : les utilisateurs réservent les transports puis découvrent qu'il ne reste rien pour les activités.

## Solution
Un **agent IA orchestrateur** qui :
- comprend une demande en langage naturel (FR/EN/ES/DE/IT/JP),
- appelle en parallèle 8+ APIs voyage,
- résout un **problème d'optimisation global** (transport + hébergement + activités + jours) sous contrainte de budget,
- produit 3 scénarios (Économique / Équilibré / Confort),
- génère un itinéraire jour-par-jour modifiable en drag-and-drop,
- déclenche la réservation via APIs partenaires en un clic,
- apprend les préférences et améliore les voyages suivants.

## Public cible
- **Primaire** : voyageurs 22-45 ans urbains, smartphone-first, voyagent 2 à 6 fois/an, budget 400-3000 €/voyage.
- **Secondaire** : groupes d'amis (4-8 personnes), couples, digital nomads.
- **Tertiaire** (V2) : familles, voyageurs business (intégration corporate).

## Différenciateurs clés
| Concurrent | Limite | Différenciateur Caveman |
|---|---|---|
| Skyscanner / Kayak | Mono-mode (avion) | Multi-modal hybride |
| Google Flights | Pas d'itinéraire | Itinéraire + budget + hôtels |
| Booking | Pas de transport | Bundle complet |
| TripAdvisor | Pas de réservation unifiée | One-click full booking |
| ChatGPT seul | Pas d'API prix temps réel | Données live + réservation |
| Notion AI travel templates | Pas d'IA spécialisée | Agents voyage dédiés |

## North Star Metric
**Voyages finalisés et réservés par mois** (un voyage = transport + hébergement réservés via la plateforme).

## Métriques secondaires
- Temps moyen "demande → itinéraire validé" : < 60 secondes
- Taux de conversion chat → réservation : > 12 %
- Économie moyenne vs. réservation manuelle : > 8 %
- NPS : > 55

## Vision 3 ans
Devenir l'**OS du voyage personnel**. L'utilisateur ne va plus sur Skyscanner ni Booking ; il parle à son agent Caveman, qui maintient son passeport voyage permanent (préférences, points fidélité, documents, historique) et planifie toute sa vie de voyageur.
