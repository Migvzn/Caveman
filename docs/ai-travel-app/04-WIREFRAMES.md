# 04 — WIREFRAMES TEXTUELS (écran par écran)

Notation : `[ ]` = bouton · `{ }` = input · `«...»` = texte généré IA · `▢` = carte/zone

---

## 1. Landing page (non connecté)

```
┌──────────────────────────────────────────────────────────────┐
│  CAVEMAN                  [ Comment ça marche ]  [ Connexion ]│
├──────────────────────────────────────────────────────────────┤
│                                                                │
│     Tu décris.                                                 │
│     L'IA construit ton voyage.                                 │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐    │
│   │  { Je veux 5 jours à Lisbonne en juin, 800€... }     │    │
│   │                                          [ ↑ Lancer ]│    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
│   Essaie : "Roadtrip Italie en train"  ·  "Bali pas cher"      │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   ▢ Multi-transport       ▢ Optimisation IA    ▢ Réservation  │
│   avion + train + bus     budget global         1 clic         │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│   Témoignages · Presse · Tarifs · Pied de page                 │
└──────────────────────────────────────────────────────────────┘
```

Détails :
- Le champ accepte ENTER → lance la conversation et propose l'auth après le premier scénario généré (pas avant — on prouve la valeur d'abord).
- Suggestions auto-rotatives (4 exemples qui changent toutes les 4 s).
- Background : carte du monde animée (Mapbox globe en rotation lente).

---

## 2. Conversation IA (cœur produit)

```
┌──────────────────────────────────────────────────────────────┐
│ ← Retour       Voyage #42 · brouillon          [ Sauvegarder ]│
├──────────────────────────┬───────────────────────────────────┤
│                          │                                    │
│  CHAT                    │   APERÇU VIVANT                    │
│  ─────────────────       │   ──────────────────────────────   │
│  Toi : Je veux 5 jours   │   ▢ Carte Lisbonne (Mapbox)        │
│  à Lisbonne en juin,     │   ▢ ─────────────────────────      │
│  800€, depuis Lyon.      │                                    │
│                          │   3 scénarios générés :            │
│  IA : « Bien noté. Je    │                                    │
│  vois 3 scénarios. Tu    │   ▢ ÉCO            742€ ✓          │
│  préfères train ou avion │      Bus + Auberge centre          │
│  pour rejoindre Lyon ? » │                                    │
│                          │   ▢ ÉQUILIBRÉ      798€  ★          │
│  [ Avion ] [ Train ]     │      Avion + Hôtel 3* Alfama       │
│  [ Peu importe ]         │                                    │
│                          │   ▢ CONFORT        1140€           │
│  ...                     │      Avion direct + Hôtel 4*       │
│                          │                                    │
│                          │   [ Voir l'itinéraire détaillé ]   │
│  ┌────────────────────┐  │                                    │
│  │ { Tape ici... } ↑  │  │                                    │
│  └────────────────────┘  │                                    │
└──────────────────────────┴───────────────────────────────────┘
```

Comportement :
- **SSE streaming** : la réponse IA s'écrit caractère par caractère.
- Quand l'IA détecte qu'il manque info critique, elle propose des boutons rapides (pas que du texte libre).
- Le panneau droit se met à jour en TEMPS RÉEL (au fur et à mesure que les API répondent).
- Tap sur un scénario → vue détaillée.
- Mobile : 1 colonne ; on switch entre chat / aperçu via tabs en haut.

---

## 3. Vue scénario détaillé

```
┌──────────────────────────────────────────────────────────────┐
│ ← Retour          ÉQUILIBRÉ · 798 € · Lisbonne 5 jours        │
├──────────────────────────────────────────────────────────────┤
│  [ Itinéraire ]  [ Budget ]  [ Transport ]  [ Hôtel ]  [ Carte ]│
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  JOUR 1 — Vendredi 7 juin              ◐ partiellement libre   │
│  ────────────────────────────────────                          │
│  ▢ 06:50  Vol Lyon → Lisbonne (TAP Portugal)       148€        │
│  ▢ 10:30  Check-in Hôtel Lisboa Pessoa                         │
│  ▢ 12:00  Déjeuner — Time Out Market    ≈18€        ⓘ          │
│  ▢ 14:30  Quartier Alfama, balade           gratuit            │
│  ▢ 19:30  Dîner — Cervejaria Ramiro ★★★★    ≈35€    ⓘ          │
│         [ + Ajouter une activité ]                             │
│                                                                │
│  JOUR 2 — Samedi 8 juin                                        │
│  ────────────────────────────────────                          │
│  ▢ 09:00  Tram 28 — tour historique         3€                 │
│  ▢ 11:00  Castelo de São Jorge              15€    ⓘ           │
│  ...                                                           │
│                                                                │
│  [ Glisser-déposer pour réorganiser ]                          │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  [ Tout réserver — 798 € ]      [ Modifier ] [ Partager ] [ ⤓ PDF ]│
└──────────────────────────────────────────────────────────────┘
```

Détails :
- Chaque activité = carte draggable (dnd-kit).
- Drop sur un autre jour = re-planification automatique (recalcul trajets entre activités).
- Icone ⓘ = popover avec photos, avis, horaires, lien Google Maps.
- "Tout réserver" → tunnel de réservation (en V1 : redirections affiliées séquentielles ; en V2 : checkout unifié).

---

## 4. Vue budget

```
┌──────────────────────────────────────────────────────────────┐
│  BUDGET · 798 € / 800 €                                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│           ◯ Budget global                                      │
│        ╭──────────╮                                            │
│        │  798 €   │     ✓ 2 € sous budget                      │
│        ╰──────────╯                                            │
│                                                                │
│  Transport       296 €  ████████░░░░░░░░  37 %                 │
│  Hébergement     280 €  ███████░░░░░░░░░  35 %                 │
│  Nourriture      135 €  ███░░░░░░░░░░░░░  17 %                 │
│  Activités        72 €  ██░░░░░░░░░░░░░░   9 %                 │
│  Imprévus         15 €  ░░░░░░░░░░░░░░░░   2 %                 │
│                                                                │
│  Coût/jour       159 €                                         │
│                                                                │
│  💡 Économies possibles :                                       │
│  • Décaler J1 au mardi → -42 € sur le vol                      │
│  • Auberge Bairro Alto → -55 € total                           │
│  [ Appliquer toutes ]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboard utilisateur

```
┌──────────────────────────────────────────────────────────────┐
│  CAVEMAN                    🔔 ⚙  Avatar                       │
├──────────────────────────────────────────────────────────────┤
│  Bonjour Léo. Prochain voyage dans 23 jours.                   │
│                                                                │
│  ▢ LISBONNE · 7-11 juin                                        │
│     798 € · 3 réservations confirmées · [ Ouvrir ]             │
│                                                                │
│  Brouillons (2)                                                │
│  ▢ Japon 2 sem · oct      [ Reprendre ]                        │
│  ▢ Week-end Berlin         [ Reprendre ]                       │
│                                                                │
│  Voyages passés (7)         [ Voir tous ]                      │
│                                                                │
│  Alertes prix actives (3)                                      │
│  • Paris → NYC < 350 €     surveillé depuis 12 j               │
│  • ...                                                         │
│                                                                │
│  [ + Nouveau voyage ]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Mobile — écrans clés

### Onboarding (3 écrans)
1. "Dis-nous où tu veux aller" — illustration carte
2. "On compare tout pour toi" — illustration multi-modes
3. "Réserve en 1 clic" — illustration paiement
4. Sign-in (Google / Apple / Email)

### Chat mobile
- Plein écran chat ; en bas, sticky composer.
- Toggle haut-droit : 🗺️ → ouvre la vue Aperçu plein écran.

### Itinéraire mobile
- Timeline verticale plein écran.
- Tap sur activité → bottom sheet avec détails (Mapbox + photos + avis).

### Map plein écran
- Pinch zoom, pins clusterisés.
- Bottom sheet rétractable avec liste des étapes.

---

## 7. Composants partagés clés du design system
- **ChatMessage** (user / assistant / system / tool-call collapsed)
- **ScenarioCard** (eco / balanced / comfort variants)
- **TransportLeg** (avion / train / bus, durée, escales)
- **HotelCard** (photo, prix, note, distance centre)
- **ActivityCard** (titre, durée, prix, draggable)
- **BudgetRing** (ring SVG animé)
- **DayTimeline** (vertical, sticky header date)
- **MapWithPins** (Mapbox wrapper)
- **PriceTag** (avec variant promo, prédiction, baisse)
