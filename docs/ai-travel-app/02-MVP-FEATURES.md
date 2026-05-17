# 02 — FONCTIONNALITÉS PRIORITAIRES (MVP)

## Philosophie MVP
Le MVP doit prouver UNE chose : **"une phrase libre → un voyage réservable de qualité supérieure à ce que l'utilisateur ferait seul, en moins de 60 secondes"**.

Tout ce qui n'aide pas à prouver cela est reporté.

## Scope MVP (12 semaines)

### Inclus (must-have)
1. **Chat IA libre** (texte uniquement, pas de voix V1)
   - Comprend la demande, demande au max 2 clarifications, sinon assume des défauts intelligents.
2. **Recherche transport multi-mode** : avion + train + bus (3 modes suffisent au lancement).
   - APIs : **Duffel** (avion, simple), **SNCF Connect** (train FR), **Omio** (train/bus EU).
3. **Recherche hébergement** : **Booking** affilié (1 fournisseur suffit V1).
4. **Optimisation budget** : 3 scénarios générés (Éco / Équilibré / Confort) avec répartition transport/héberg/activités/nourriture.
5. **Itinéraire jour-par-jour** généré, modifiable en glisser-déposer, avec carte interactive.
6. **Réservation par redirection affiliée** (pas de checkout natif V1 — gagne 6 semaines de dev + simplifie réglementaire).
7. **Compte utilisateur** : email/Google/Apple, sauvegarde voyages, historique.
8. **Export PDF** du voyage.
9. **Web responsive** uniquement (pas d'app native V1 ; PWA pour mobile).
10. **2 langues** : FR + EN.

### Reporté V1.1 (semaines 13-20)
- App native iOS/Android (Expo).
- Alertes prix.
- Mode groupe + split budget.
- Plus de fournisseurs (Skyscanner, Kiwi, Amadeus, Expedia, Airbnb).
- Ferry + location voiture + covoiturage.
- Carnet de voyage IA post-voyage.
- Voix (Whisper).
- Recommandations TikTok/Instagram.

### Reporté V2 (mois 6-12)
- Checkout natif unifié (PSP + escrow).
- Mode hors ligne mobile.
- Assistant voyage temps réel (pendant le voyage : "mon train est annulé, replanifie").
- Traduction instantanée embarquée.
- Génération contenu réseaux sociaux.
- B2B / corporate.

## Critères de succès du MVP
| Métrique | Cible |
|---|---|
| Demande → itinéraire généré (P95) | < 75 sec |
| Précision intention (validation humaine) | > 88 % |
| Taux d'utilisateurs qui valident un scénario | > 45 % |
| Taux clic vers réservation affiliée | > 18 % |
| Coût IA moyen par voyage généré | < 0,40 € |
| NPS early users (n=200) | > 40 |

## Priorisation détaillée (RICE)

| Feature | Reach | Impact | Confidence | Effort | RICE |
|---|---|---|---|---|---|
| Chat IA → itinéraire | 100% | 3 | 90% | 6 sem | **45** |
| Recherche transport multi-mode | 100% | 3 | 80% | 4 sem | **60** |
| Optimisation 3 scénarios | 100% | 2.5 | 75% | 2 sem | **94** |
| Itinéraire drag-and-drop | 80% | 2 | 70% | 3 sem | **37** |
| Réservation affiliée | 100% | 3 | 95% | 1 sem | **285** |
| Alertes prix | 35% | 2 | 60% | 3 sem | **14** ← V1.1 |
| Mode groupe | 25% | 2 | 50% | 4 sem | **6** ← V2 |
| Voix | 15% | 1.5 | 70% | 2 sem | **8** ← V1.1 |

## Définition du "Done" pour le MVP
- L'utilisateur tape "Je veux 5 jours à Lisbonne en juin, 800 €, départ Lyon".
- En < 60 s, il voit 3 scénarios chiffrés, avec un itinéraire jour-par-jour, une carte, et des liens "Réserver".
- Il peut sauvegarder, modifier, exporter en PDF.
- Le coût total cloud + IA pour ce voyage est < 0,50 €.
