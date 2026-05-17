# 08 — SYSTÈME D'OPTIMISATION DES PRIX

## Trois optimisations distinctes
1. **Prix unitaire** : trouver le meilleur prix pour un segment donné (vol, hôtel...).
2. **Prix global du voyage** : sélectionner LA combinaison qui minimise le coût total sous contraintes.
3. **Timing** : prédire si le prix va baisser/monter, pour conseiller "réserver maintenant" ou "attendre".

## 1. Recherche prix unitaire — agrégation parallèle

### Pipeline
```
[Requête utilisateur normalisée]
        │
        ▼
[Cache Redis] ── hit ──► retour immédiat
        │ miss
        ▼
[Fan-out parallèle] ── N adaptateurs (Duffel, Amadeus, Kiwi, ...)
        │              chacun avec timeout 4s
        ▼
[Normalizer] — convertit tous les formats en `Offer` canonique
        │
        ▼
[Deduplicator] — clé : sha1(operator|number|date|leg_hash)
        │
        ▼
[Scorer] — calcule utility score
        │
        ▼
[Cache write 6h] ─► retour
```

### `Offer` canonique
```ts
type Offer = {
  id: string;
  mode: 'flight'|'train'|'bus'|'ferry'|'multi';
  legs: Leg[];                 // chaque segment
  total_eur: number;
  currency_orig: string;
  duration_min: number;
  stops: number;
  carbon_kg: number;
  refundable: boolean;
  baggage: { cabin: boolean; checked: number };
  provider: string;
  affiliate_url: string;
  bookable_until: string;      // ISO date
  raw: unknown;                // payload original pour la suite
};
```

### Déduplication
- Même vol vendu par Duffel et Skyscanner → on garde **le moins cher**, on conserve les autres dans `alternatives` pour fallback.

## 2. Optimisation globale du voyage — programmation linéaire

### Variables
- `x_t ∈ {0,1}` : sélection de l'option transport t (aller + retour)
- `y_h ∈ {0,1}` : sélection de l'hôtel h
- `z_a ∈ {0,1}` : sélection de l'activité a

### Objectif (scénario BALANCED)
```
maximize  U = Σ x_t · u_t  +  Σ y_h · u_h  +  Σ z_a · u_a
```
où `u_i = α / prix_i + β · score_pref_i + γ · score_qualité_i`.

### Contraintes
```
Σ x_t · prix_t + nights · Σ y_h · prix_h + Σ z_a · prix_a  ≤  Budget · (1 − marge_buffer)
Σ x_t = 1                       # exactement 1 transport choisi
Σ y_h = 1                       # exactement 1 hôtel
Σ z_a ≤ max_activities_par_jour · nb_jours
durée_activités_jour ≤ 10h     # par jour
```

### Outils
- **PuLP** (Python, MILP via CBC) — gratuit, suffisant pour < 500 variables (cas typique).
- Solveur en < 200 ms.

### Génération 3 scénarios
- **ECO** : poids `α` élevé (90 %), `β`/`γ` faibles.
- **BALANCED** : `α=50 %`, `β=30 %`, `γ=20 %`.
- **COMFORT** : `γ=60 %`, contrainte budget × 1.4.

## 3. Packing géographique des activités (par jour)

### Problème
Sélectionner et ordonner les POIs pour chaque jour de façon à minimiser le temps de trajet entre activités.

### Approche
1. **Clustering** : k-medoids (k = nb_jours) sur les POIs candidats, avec distance Haversine.
2. **Affectation** : chaque cluster = 1 jour.
3. **Ordonnancement intra-jour** : approximation TSP (nearest-neighbor + 2-opt) — fenêtres temporelles respectées.
4. **Validation** : appel Mapbox Matrix API pour temps de trajet réels (transport sélectionné : marche, métro, taxi).

### Résultat
- Aucun aller-retour absurde dans la journée.
- Activités groupées par quartier.
- Temps libres préservés (on ne sur-planifie pas).

## 4. Prédiction prix (timing)

### Modèle
- **Time series** sur ClickHouse `price_history`.
- **Features** :
  - jour de la semaine, mois, jours avant départ
  - événements (vacances, JO, salons)
  - prix historique min/médian/max sur même route
- **Modèle V1** : gradient boosting (LightGBM), entraîné chaque nuit.
- **Modèle V2** : forecasting probabiliste (Prophet ou DeepAR sur Sagemaker).

### Output
- `predicted_price_in_7d`, `confidence_interval`
- Recommandation : `BOOK_NOW` / `WAIT_LIKELY_DROP` / `WAIT_RISK_RISE`.

### Affichage utilisateur
```
148 €   ▼ 12 % vs. médiane     [ Réserver ]
        Notre IA estime que le prix baissera de ~ 15 € sous 5 jours
        (confiance 68 %).      [ M'alerter à 130 € ]
```

## 5. Alertes prix

### Architecture
- Table `price_alerts`.
- Worker Kafka qui consume topic `price.updated`.
- Quand un prix passe sous le seuil :
  - Publish `alert.triggered`
  - Service `notifications` envoie email + push.

### Coût optimization
- On ne re-requête pas les APIs externes pour chaque alerte ; on s'appuie sur le cache `price:{hash}` qui s'auto-rafraîchit dès qu'un autre utilisateur fait la même recherche → effet réseau pour réduire coûts API.
- Alertes "froides" (aucun utilisateur en recherche active) : refresh quotidien 1x.

## 6. Hybrid routes (la killer feature)

### Algorithme
1. Pour chaque paire (origine, destination) éloignée, on appelle **Rome2Rio** qui retourne tous les modes.
2. On extrait les "hubs" géographiques pertinents (gares/aéroports à mi-chemin avec prix bas).
3. On recompose : pour origine → hub via TRAIN/BUS, hub → destination via AVION (et inverse).
4. On somme prix + durée + buffer de correspondance (≥ 3 h).
5. On garde la combinaison si elle est strictement meilleure (Pareto) sur prix OU sur durée.

### Exemple
- Paris → Tokyo direct : 850 €, 12 h
- Paris → Milan (TGV, 110 €, 7h) + Milan → Tokyo (vol, 580 €, 11h) = 690 €, 22 h (avec nuit Milan)
- Si l'utilisateur a budget tight et ≥ 1 jour de marge → on propose cette option en plus.

## 7. Garantie de prix (V2)

À terme, on peut offrir une **garantie de prix** : si le même billet est trouvé moins cher dans les 24h, on rembourse la différence. Implémenté via un side-job qui re-requête après réservation.

## 8. Métriques de qualité
| Métrique | Cible |
|---|---|
| Taux de résultats < 4 s | > 95 % |
| Précision dedup (manual sample) | > 99 % |
| % cas où Caveman bat la recherche manuelle utilisateur | > 80 % |
| MAPE prédiction prix 7j | < 12 % |
| % voyages avec route hybride proposée pertinente | > 25 % |
