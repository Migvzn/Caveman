/* =========================================================
   CAVEMAN TRAVEL — Interactive demo
   Simule le pipeline IA décrit dans docs/ai-travel-app/05-AI-WORKFLOW.md :
   Intent parse → Planning → Search parallèle → Optimizer → Composer → Presenter
   ========================================================= */

/* ---------------------------------------------------------
   Données : 4 voyages pré-conçus
   --------------------------------------------------------- */
const TRIPS = {
  lisbon: {
    intent: {
      origin: 'Lyon', destination: 'Lisbonne', days: 5,
      month: 'juin', budget: 800, currency: 'EUR'
    },
    summary: '5 jours à Lisbonne en juin, depuis Lyon, budget 800€.',
    weather: 'Doux, 21-26°C, ensoleillé',
    scenarios: [
      {
        key: 'eco', tag: 'Éco', price: 642, delta: '−20 % vs. médiane',
        includes: ['Bus de nuit Lyon→Madrid + vol Madrid→Lisbonne', 'Auberge Bairro Alto', 'Visites gratuites + 1 musée'],
        breakdown: { trans: 0.31, hotel: 0.37, food: 0.18, act: 0.08, buf: 0.06 }
      },
      {
        key: 'bal', tag: 'Équilibré', price: 794, delta: '★ recommandé · 2€ sous budget',
        includes: ['Vol direct Lyon→Lisbonne (TAP)', 'Hôtel 3★ Alfama, vue Tage', 'Tram 28, Sintra, fado'],
        breakdown: { trans: 0.37, hotel: 0.35, food: 0.17, act: 0.09, buf: 0.02 }
      },
      {
        key: 'cmf', tag: 'Confort', price: 1140, delta: '+340 € pour confort + vol direct',
        includes: ['Vol direct + bagage soute', 'Hôtel 4★ piscine, Príncipe Real', 'Tour gastronomique + Sintra avec guide'],
        breakdown: { trans: 0.32, hotel: 0.42, food: 0.16, act: 0.08, buf: 0.02 }
      }
    ],
    selectedKey: 'bal',
    itinerary: [
      { date: 'Ven. 7 juin', title: 'Arrivée et Alfama', weather: '☀ 24°C',
        items: [
          { time: '06:50', icon: '✈', title: 'Vol Lyon → Lisbonne (TAP Portugal)', sub: '2h35 · 1 escale optionnelle Madrid', price: 148 },
          { time: '10:30', icon: '⌂', title: 'Check-in Hôtel Lisboa Pessoa ★★★', sub: 'Alfama · 4 nuits', price: 280 },
          { time: '12:00', icon: '✻', title: 'Time Out Market — déjeuner', sub: 'Tapas portugaises', price: 18 },
          { time: '14:30', icon: '☖', title: 'Balade Alfama + miradouro', sub: 'Vue panoramique du Tage', price: 0 },
          { time: '19:30', icon: '✻', title: 'Cervejaria Ramiro — crustacés', sub: '★★★★ légende locale', price: 35 }
        ] },
      { date: 'Sam. 8 juin', title: 'Belém et désserts', weather: '☀ 26°C',
        items: [
          { time: '09:00', icon: '◷', title: 'Tram 28 — boucle historique', sub: 'Graça → Estrela', price: 3 },
          { time: '11:00', icon: '◉', title: 'Castelo de São Jorge', sub: 'Forteresse mauresque, vue à 360°', price: 15 },
          { time: '13:30', icon: '✻', title: 'Pastéis de Belém', sub: 'Les originaux depuis 1837', price: 8 },
          { time: '15:00', icon: '◉', title: 'Monastère des Hiéronymites', sub: 'UNESCO · gothique manuélin', price: 12 },
          { time: '20:00', icon: '♪', title: 'Soirée fado à Bairro Alto', sub: 'Tasca do Chico — réservé', price: 28 }
        ] },
      { date: 'Dim. 9 juin', title: 'Sintra, le jour dans les nuages', weather: '⛅ 22°C',
        items: [
          { time: '08:30', icon: '◷', title: 'Train Rossio → Sintra', sub: '40 min · billet journée', price: 5 },
          { time: '10:00', icon: '◉', title: 'Palais da Pena', sub: 'Couleurs psychédéliques du romantisme', price: 14 },
          { time: '13:00', icon: '✻', title: 'Tascantiga — déjeuner local', sub: 'Hors zone touristique', price: 22 },
          { time: '15:30', icon: '◉', title: 'Quinta da Regaleira', sub: 'Puits initiatique', price: 12 },
          { time: '20:00', icon: '✻', title: 'Retour Lisbonne + dîner Príncipe Real', sub: 'A Cevicheria — réservé', price: 32 }
        ] },
      { date: 'Lun. 10 juin', title: 'LX Factory et art urbain', weather: '☀ 25°C',
        items: [
          { time: '10:00', icon: '◉', title: 'LX Factory', sub: 'Friche réhabilitée, boutiques créatives', price: 0 },
          { time: '12:30', icon: '✻', title: 'A Praça — brunch', sub: 'Cuisine portugaise moderne', price: 24 },
          { time: '15:00', icon: '☖', title: 'Streetart Bairro Alto', sub: 'Tour autoguidé carte fournie', price: 0 },
          { time: '18:00', icon: '◷', title: 'Sunset Miradouro Santa Catarina', sub: 'Apéro Aperol & coucher de soleil', price: 9 },
          { time: '21:00', icon: '✻', title: 'Cantinho do Avillez', sub: 'Chef étoilé · menu dégustation', price: 45 }
        ] },
      { date: 'Mar. 11 juin', title: 'Cascais et retour', weather: '☀ 27°C',
        items: [
          { time: '09:00', icon: '◷', title: 'Train Cais do Sodré → Cascais', sub: '40 min · longe la côte', price: 5 },
          { time: '10:30', icon: '◉', title: 'Boca do Inferno + plages', sub: 'Falaises et atlantique', price: 0 },
          { time: '13:00', icon: '✻', title: 'Mar do Inferno — déjeuner', sub: 'Poisson grillé pieds dans l\'eau', price: 28 },
          { time: '16:00', icon: '⌂', title: 'Check-out hôtel + transfert', sub: 'Métro vers aéroport', price: 2 },
          { time: '19:55', icon: '✈', title: 'Vol Lisbonne → Lyon', sub: '2h45 direct', price: 148 }
        ] }
    ],
    budget: {
      total: 794, target: 800,
      rows: [
        { name: 'Transport',   val: 296, pct: 37 },
        { name: 'Hébergement', val: 280, pct: 35 },
        { name: 'Nourriture',  val: 135, pct: 17 },
        { name: 'Activités',   val: 72,  pct: 9 },
        { name: 'Imprévus',    val: 11,  pct: 2 }
      ],
      perDay: 159,
      tips: [
        'Décaler J1 au mardi → −42 € sur le vol',
        'Auberge Bairro Alto en remplacement nuit 4 → −55 €',
        'Pass Lisboa Card 72h → −18 € sur 4 musées'
      ]
    },
    map: { city: 'Lisbonne', pins: [
      { lbl: 'Alfama', x: 52, y: 48, day: 1 },
      { lbl: 'Belém', x: 22, y: 62, day: 2 },
      { lbl: 'Sintra', x: 12, y: 28, day: 3 },
      { lbl: 'LX Factory', x: 38, y: 64, day: 4 },
      { lbl: 'Cascais', x: 6, y: 54, day: 5 }
    ]}
  },

  japan: {
    intent: { origin: 'Paris', destination: 'Japon', days: 14, month: 'octobre', budget: 1200, currency: 'EUR' },
    summary: '14 jours au Japon en octobre, depuis Paris, budget 1200€ — tight mais faisable avec route hybride.',
    weather: 'Automne : 18-23°C, ginkgo dorés, peu de pluie',
    scenarios: [
      { key: 'eco', tag: 'Éco', price: 1145, delta: 'Route hybride · −195 € vs. vol direct',
        includes: ['TGV Paris→Istanbul + vol Istanbul→Tokyo', 'Capsule hôtels + auberge Kyoto', 'JR Pass 7j (limité)'],
        breakdown: { trans: 0.62, hotel: 0.18, food: 0.13, act: 0.05, buf: 0.02 } },
      { key: 'bal', tag: 'Équilibré', price: 1198, delta: '★ recommandé · 2 € sous budget',
        includes: ['Vol direct ANA Paris→Tokyo', 'Ryokan Kyoto + business hôtels', 'JR Pass 14j illimité'],
        breakdown: { trans: 0.55, hotel: 0.22, food: 0.14, act: 0.07, buf: 0.02 } },
      { key: 'cmf', tag: 'Confort', price: 1820, delta: 'Class. Premium + experiences premium',
        includes: ['Premium Economy ANA', 'Ryokan onsen Hakone 2N + hôtels 4★', 'Onsen privé + sushi étoilé Tsukiji'],
        breakdown: { trans: 0.52, hotel: 0.28, food: 0.13, act: 0.06, buf: 0.01 } }
    ],
    selectedKey: 'bal',
    itinerary: [
      { date: 'Sam. 5 oct', title: 'Arrivée Tokyo', weather: '☀ 21°C',
        items: [
          { time: '06:35', icon: '✈', title: 'Vol ANA NH-216 Paris → Tokyo Haneda', sub: '11h45 direct · Premium Economy', price: 580 },
          { time: '13:30', icon: '◷', title: 'Monorail Haneda → Shimbashi', sub: 'JR Pass activé', price: 0 },
          { time: '15:00', icon: '⌂', title: 'Check-in Hotel Mimaru Asakusa', sub: 'Asakusa · 4 nuits', price: 320 },
          { time: '18:00', icon: '◉', title: 'Senso-ji + Nakamise', sub: 'Coucher de soleil sur la pagode', price: 0 },
          { time: '20:00', icon: '✻', title: 'Izakaya Hoppy Street', sub: 'Robatayaki + Asahi', price: 22 }
        ] },
      { date: 'Dim. 6 oct', title: 'Tokyo électrique', weather: '☀ 22°C',
        items: [
          { time: '08:00', icon: '✻', title: 'Tsukiji Outer Market — petit-déj', sub: 'Tamago + thon gras', price: 16 },
          { time: '10:30', icon: '◉', title: 'TeamLab Borderless', sub: 'Toyosu · réservé en ligne', price: 24 },
          { time: '14:00', icon: '☖', title: 'Shibuya Scramble + Hachiko', sub: 'Le carrefour iconique', price: 0 },
          { time: '17:00', icon: '◉', title: 'Vue Shibuya Sky', sub: 'Sunset 360°, réserver 17:30', price: 18 },
          { time: '20:30', icon: '✻', title: 'Yakitori Memory Lane', sub: 'Shinjuku · 8 brochettes', price: 28 }
        ] },
      { date: 'Lun. 7 oct', title: 'Harajuku & Yoyogi', weather: '⛅ 20°C',
        items: [
          { time: '09:30', icon: '◉', title: 'Meiji Jingu', sub: 'Sanctuaire shinto · forêt urbaine', price: 0 },
          { time: '11:00', icon: '☖', title: 'Takeshita Street + Cat Street', sub: 'Pop culture J', price: 0 },
          { time: '14:00', icon: '◉', title: 'Tokyo National Museum', sub: 'Trésors époque Edo', price: 9 },
          { time: '18:00', icon: '✻', title: 'Sushi Gonpachi Nishi-Azabu', sub: 'Le restaurant de Kill Bill', price: 38 },
          { time: '21:00', icon: '♪', title: 'Golden Gai bar hop', sub: '6 bars en 6 ruelles', price: 22 }
        ] },
      { date: 'Mar. 8 oct', title: 'Hakone, onsen et Fuji', weather: '☀ 19°C',
        items: [
          { time: '08:00', icon: '⊞', title: 'Shinkansen → Odawara', sub: 'JR Pass · 35 min', price: 0 },
          { time: '10:00', icon: '◷', title: 'Hakone Round Course', sub: 'Bus + funiculaire + bateau', price: 28 },
          { time: '13:00', icon: '◉', title: 'Hakone Open-Air Museum', sub: 'Sculptures + Picasso', price: 14 },
          { time: '16:00', icon: '⌂', title: 'Ryokan Yumoto Fujiya', sub: 'Onsen privé · 1 nuit kaiseki incluse', price: 145 },
          { time: '19:00', icon: '✻', title: 'Dîner kaiseki traditionnel', sub: 'Inclus dans le ryokan', price: 0 }
        ] },
      { date: 'Mer. 9 oct', title: 'Kyoto, l\'ancienne capitale', weather: '☀ 23°C',
        items: [
          { time: '09:00', icon: '⊞', title: 'Shinkansen Nozomi → Kyoto', sub: 'JR Pass · 2h15', price: 0 },
          { time: '12:00', icon: '⌂', title: 'Check-in Ryokan Yoshikawa', sub: 'Gion · 4 nuits', price: 380 },
          { time: '14:00', icon: '◉', title: 'Fushimi Inari', sub: 'Mille torii rouge · monter à 16h pour la lumière', price: 0 },
          { time: '18:00', icon: '☖', title: 'Gion au crépuscule', sub: 'Quartier des geisha', price: 0 },
          { time: '20:00', icon: '✻', title: 'Pontocho — sushi du soir', sub: 'Bord de rivière Kamo', price: 32 }
        ] }
    ],
    budget: {
      total: 1198, target: 1200,
      rows: [
        { name: 'Transport',   val: 660, pct: 55 },
        { name: 'Hébergement', val: 263, pct: 22 },
        { name: 'Nourriture',  val: 168, pct: 14 },
        { name: 'Activités',   val: 83,  pct: 7 },
        { name: 'Imprévus',    val: 24,  pct: 2 }
      ],
      perDay: 85,
      tips: [
        'Route hybride via Istanbul → −195 € (+ 11h de trajet)',
        'JR Pass 7j au lieu de 14j → −180 € (Kyoto stay-put)',
        'Capsule hôtel 3 nuits sur 13 → −90 €'
      ]
    },
    map: { city: 'Japon', pins: [
      { lbl: 'Tokyo', x: 72, y: 50, day: 1 },
      { lbl: 'Hakone', x: 65, y: 56, day: 4 },
      { lbl: 'Kyoto', x: 42, y: 62, day: 5 },
      { lbl: 'Nara', x: 44, y: 67, day: 8 },
      { lbl: 'Hiroshima', x: 22, y: 70, day: 11 }
    ]}
  },

  berlin: {
    intent: { origin: 'Paris', destination: 'Berlin', days: 3, month: 'mars', budget: 350, currency: 'EUR' },
    summary: 'Week-end Berlin pas cher, 3 jours depuis Paris, 350€.',
    weather: 'Frais, 7-12°C, prévoir manteau',
    scenarios: [
      { key: 'eco', tag: 'Éco', price: 287, delta: '−63 € sous budget',
        includes: ['FlixBus de nuit aller-retour', 'Auberge Mitte', 'Musée gratuit + bar dimanche'],
        breakdown: { trans: 0.35, hotel: 0.30, food: 0.22, act: 0.10, buf: 0.03 } },
      { key: 'bal', tag: 'Équilibré', price: 342, delta: '★ recommandé · 8€ sous budget',
        includes: ['ICE Paris→Berlin via Frankfurt', 'Hôtel 3★ Friedrichshain', 'Pergamon + East Side Gallery'],
        breakdown: { trans: 0.38, hotel: 0.32, food: 0.18, act: 0.09, buf: 0.03 } },
      { key: 'cmf', tag: 'Confort', price: 540, delta: 'Vol + boutique hôtel',
        includes: ['Vol Air France direct', 'Boutique hôtel design Mitte', 'Tour privé Berghain + dîner étoilé'],
        breakdown: { trans: 0.41, hotel: 0.38, food: 0.13, act: 0.06, buf: 0.02 } }
    ],
    selectedKey: 'bal',
    itinerary: [
      { date: 'Ven. 14 mars', title: 'Arrivée Mitte', weather: '⛅ 10°C',
        items: [
          { time: '07:20', icon: '⊞', title: 'ICE Paris Est → Berlin Hbf', sub: 'Via Frankfurt · 8h', price: 79 },
          { time: '15:30', icon: '⌂', title: 'Check-in Hotel Amano Grand Central', sub: 'Friedrichshain · 2 nuits', price: 110 },
          { time: '17:00', icon: '◉', title: 'Reichstag + dôme', sub: 'Réservé en ligne, gratuit', price: 0 },
          { time: '19:30', icon: '✻', title: 'Mustafa\'s — döner légendaire', sub: 'File 30 min mais vaut le coup', price: 9 },
          { time: '21:30', icon: '♪', title: 'Watergate — soirée techno', sub: 'Optionnel · ambiance Berlin', price: 18 }
        ] },
      { date: 'Sam. 15 mars', title: 'Histoire et East Side', weather: '☁ 8°C',
        items: [
          { time: '09:30', icon: '◉', title: 'Brandenburger Tor + Mémorial', sub: 'Holocaust Memorial à pied', price: 0 },
          { time: '11:00', icon: '◉', title: 'Île aux musées — Pergamon', sub: 'Antiquités · gratuit étudiants', price: 14 },
          { time: '14:00', icon: '✻', title: 'Markthalle Neun — déj', sub: 'Street food du monde', price: 14 },
          { time: '16:30', icon: '☖', title: 'East Side Gallery', sub: 'Mur peint, 1,3 km', price: 0 },
          { time: '19:30', icon: '✻', title: 'Maximilians — schnitzel + bière', sub: 'Cosy & abordable', price: 22 }
        ] },
      { date: 'Dim. 16 mars', title: 'Kreuzberg et retour', weather: '⛅ 11°C',
        items: [
          { time: '10:00', icon: '✻', title: 'Brunch Tres Cabezas', sub: 'Café spécialité Kreuzberg', price: 14 },
          { time: '12:00', icon: '☖', title: 'Görlitzer Park + street art', sub: 'Quartier turc + alternatif', price: 0 },
          { time: '14:00', icon: '◉', title: 'Musée Juif de Berlin', sub: 'Architecture Daniel Libeskind', price: 10 },
          { time: '16:30', icon: '⌂', title: 'Check-out + transfert gare', sub: 'S-Bahn vers Hbf', price: 3 },
          { time: '18:55', icon: '⊞', title: 'ICE Berlin → Paris Est', sub: 'Retour 8h05', price: 79 }
        ] }
    ],
    budget: {
      total: 342, target: 350,
      rows: [
        { name: 'Transport',   val: 158, pct: 46 },
        { name: 'Hébergement', val: 110, pct: 32 },
        { name: 'Nourriture',  val: 49,  pct: 14 },
        { name: 'Activités',   val: 18,  pct: 5 },
        { name: 'Imprévus',    val: 7,   pct: 3 }
      ],
      perDay: 114,
      tips: [
        'FlixBus de nuit → −80 € sur le transport (−6h sommeil)',
        'Auberge Mitte au lieu de l\'hôtel → −55 €',
        'Dimanche musée gratuit (Berlinische Galerie) → −12 €'
      ]
    },
    map: { city: 'Berlin', pins: [
      { lbl: 'Mitte', x: 50, y: 48, day: 1 },
      { lbl: 'Reichstag', x: 45, y: 44, day: 1 },
      { lbl: 'East Side', x: 62, y: 56, day: 2 },
      { lbl: 'Kreuzberg', x: 54, y: 62, day: 3 }
    ]}
  },

  italy: {
    intent: { origin: 'Paris', destination: 'Italie (Milan, Venise, Florence, Rome)', days: 10, month: 'mai', budget: 1100, currency: 'EUR' },
    summary: 'Roadtrip Italie en train, 10 jours, depuis Paris, 1100€.',
    weather: 'Printemps : 18-25°C, idéal',
    scenarios: [
      { key: 'eco', tag: 'Éco', price: 894, delta: '−206 € sous budget',
        includes: ['TGV INOUI + Trenitalia regional', 'Auberges + 1 Airbnb', 'Vatican gratuit dim + Uffizi étudiants'],
        breakdown: { trans: 0.32, hotel: 0.34, food: 0.20, act: 0.10, buf: 0.04 } },
      { key: 'bal', tag: 'Équilibré', price: 1085, delta: '★ recommandé · 15 € sous budget',
        includes: ['TGV + Frecciarossa rapide', 'Hôtels 3★ centre historique', 'Tours sans queue Vatican + Uffizi'],
        breakdown: { trans: 0.36, hotel: 0.32, food: 0.18, act: 0.11, buf: 0.03 } },
      { key: 'cmf', tag: 'Confort', price: 1640, delta: 'Confort + dégustation Toscane',
        includes: ['1ère classe Frecciarossa', 'Hôtels 4★ + 1 nuit agriturismo', 'Cooking class + dégustation vins'],
        breakdown: { trans: 0.30, hotel: 0.40, food: 0.16, act: 0.12, buf: 0.02 } }
    ],
    selectedKey: 'bal',
    itinerary: [
      { date: 'Lun. 12 mai', title: 'Milan en express', weather: '☀ 22°C',
        items: [
          { time: '07:25', icon: '⊞', title: 'TGV Paris Gare de Lyon → Milan', sub: '7h direct via Modane', price: 89 },
          { time: '14:30', icon: '⌂', title: 'Check-in Hotel Spadari', sub: 'Duomo · 1 nuit', price: 92 },
          { time: '16:00', icon: '◉', title: 'Duomo + montée toit', sub: 'Réservé en ligne', price: 18 },
          { time: '18:30', icon: '☖', title: 'Galleria Vittorio + Brera', sub: 'Aperitivo à Brera', price: 14 },
          { time: '20:30', icon: '✻', title: 'Trippa — milanaise moderne', sub: 'Réservé J-30', price: 38 }
        ] },
      { date: 'Mar. 13 mai', title: 'Venise, le rêve', weather: '☀ 23°C',
        items: [
          { time: '09:00', icon: '⊞', title: 'Frecciarossa Milan → Venise', sub: '2h25 direct', price: 38 },
          { time: '12:00', icon: '⌂', title: 'Check-in Pensione Wildner', sub: 'Riva degli Schiavoni · 2 nuits', price: 184 },
          { time: '14:00', icon: '◉', title: 'San Marco + Basilique', sub: 'File matin évitée', price: 25 },
          { time: '17:00', icon: '◷', title: 'Vaporetto Grand Canal', sub: 'Ligne 1, coucher de soleil', price: 9 },
          { time: '20:00', icon: '✻', title: 'Osteria al Squero', sub: 'Cicchetti + spritz', price: 24 }
        ] },
      { date: 'Mer. 14 mai', title: 'Murano, Burano, Torcello', weather: '⛅ 21°C',
        items: [
          { time: '09:30', icon: '◷', title: 'Vaporetto Fondamenta Nove → Murano', sub: 'Verre soufflé', price: 9 },
          { time: '12:00', icon: '☖', title: 'Burano + déj poisson frais', sub: 'Maisons colorées', price: 32 },
          { time: '15:00', icon: '◉', title: 'Torcello + Santa Maria Assunta', sub: 'Mosaïques byzantines', price: 5 },
          { time: '19:30', icon: '✻', title: 'Antiche Carampane', sub: 'Resto local · cuisine vénitienne', price: 42 },
          { time: '21:30', icon: '♪', title: 'Concert baroque San Vidal', sub: 'Vivaldi en costume d\'époque', price: 28 }
        ] },
      { date: 'Jeu. 15 mai', title: 'Florence et la Renaissance', weather: '☀ 24°C',
        items: [
          { time: '08:00', icon: '⊞', title: 'Frecciarossa Venise → Florence', sub: '2h05 direct', price: 42 },
          { time: '11:00', icon: '⌂', title: 'Check-in Hotel Davanzati', sub: 'Centre historique · 2 nuits', price: 198 },
          { time: '14:00', icon: '◉', title: 'Galleria degli Uffizi', sub: 'Skip-the-line réservé', price: 28 },
          { time: '17:30', icon: '☖', title: 'Ponte Vecchio + Oltrarno', sub: 'Coucher Piazzale Michelangelo', price: 0 },
          { time: '20:30', icon: '✻', title: 'Trattoria Sabatino', sub: 'Cuisine toscane authentique', price: 22 }
        ] },
      { date: 'Ven. 16 mai', title: 'Sienne et chianti', weather: '☀ 25°C',
        items: [
          { time: '09:00', icon: '◷', title: 'Bus régional Florence → Sienne', sub: '1h15', price: 9 },
          { time: '11:00', icon: '◉', title: 'Piazza del Campo + Duomo', sub: 'Sol marbre incrusté', price: 13 },
          { time: '14:00', icon: '✻', title: 'Osteria Le Logge', sub: 'Pici cacio e pepe', price: 26 },
          { time: '16:30', icon: '☖', title: 'San Gimignano (option)', sub: 'Tours médiévales · facultatif', price: 12 },
          { time: '20:00', icon: '✻', title: 'Retour Florence + dîner Mercato', sub: 'Mercato Centrale 1er étage', price: 18 }
        ] }
    ],
    budget: {
      total: 1085, target: 1100,
      rows: [
        { name: 'Transport',   val: 391, pct: 36 },
        { name: 'Hébergement', val: 347, pct: 32 },
        { name: 'Nourriture',  val: 195, pct: 18 },
        { name: 'Activités',   val: 119, pct: 11 },
        { name: 'Imprévus',    val: 33,  pct: 3 }
      ],
      perDay: 108,
      tips: [
        'Pass ferroviaire Italo Più → −45 €',
        'Auberges Florence + Rome 2 nuits → −80 €',
        'Vatican dimanche gratuit (matin) → −20 €'
      ]
    },
    map: { city: 'Italie', pins: [
      { lbl: 'Milan', x: 30, y: 22, day: 1 },
      { lbl: 'Venise', x: 56, y: 26, day: 2 },
      { lbl: 'Florence', x: 44, y: 50, day: 4 },
      { lbl: 'Sienne', x: 42, y: 58, day: 5 },
      { lbl: 'Rome', x: 50, y: 70, day: 7 }
    ]}
  }
};

/* ---------------------------------------------------------
   État & helpers DOM
   --------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

let currentTrip = null;
let pipelineRunning = false;

/* ---------------------------------------------------------
   Theme toggle
   --------------------------------------------------------- */
const themeToggle = $('#themeToggle');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch (e) {}
}
const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
if (savedTheme === 'light') applyTheme('light');
themeToggle?.addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme;
  applyTheme(cur === 'light' ? 'dark' : 'light');
});

/* ---------------------------------------------------------
   Composer : submit + chips
   --------------------------------------------------------- */
const composer = $('#composer');
const composerInput = $('#composerInput');

composerInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

composer?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = composerInput.value.trim();
  if (!text) return;
  const tripKey = detectTrip(text);
  runPipeline(text, tripKey);
});

$$('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const key = chip.dataset.example;
    const text = chip.textContent.trim();
    composerInput.value = text;
    runPipeline(text, key);
  });
});

/** Détecte la "trip key" à partir d'un texte libre. Fallback : lisbon. */
function detectTrip(text) {
  const t = text.toLowerCase();
  if (/jap|tokyo|kyoto/.test(t)) return 'japan';
  if (/berlin/.test(t)) return 'berlin';
  if (/italie|rome|milan|venise|florence|toscan/.test(t)) return 'italy';
  return 'lisbon';
}

/* ---------------------------------------------------------
   Pipeline : Intent → Thinking → Scenarios → Itinerary
   --------------------------------------------------------- */
async function runPipeline(userText, tripKey) {
  if (pipelineRunning) return;
  pipelineRunning = true;

  const trip = TRIPS[tripKey];
  currentTrip = trip;

  // Scroll to demo
  $('#demo').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Reset
  const chatBody = $('#chatBody');
  chatBody.innerHTML = '';
  $('#emptystate').hidden = true;
  $('#scenarios').hidden = true;
  $('#itin').hidden = true;
  $('#thinking').hidden = false;
  setStatus('analyse…', true);

  // 1. User message
  await sleep(150);
  pushMsg('user', userText);

  // 2. AI "intent understood"
  await sleep(550);
  pushMsg('ai', `J'ai compris : <strong>${trip.intent.destination}</strong>, ${trip.intent.days} j, ${trip.intent.month}, ${trip.intent.budget}€ depuis ${trip.intent.origin}. ✓`);

  // 3. Thinking with parallel counters
  setStatus('recherche multi-API en parallèle…', true);
  $('#thinkingLabel').textContent = 'Je compare 8 fournisseurs en parallèle…';

  await Promise.all([
    animateCounter('counterFlights', 47, 1800),
    animateCounter('counterTrains', 12, 1600),
    animateCounter('counterHotels', 23, 2000),
    animateCounter('counterPois', 84, 2400)
  ]);

  // 4. AI optimizing
  $('#thinkingLabel').textContent = 'Optimisation budget global (MILP)…';
  await sleep(700);
  pushMsg('ai', `Météo prévue : ${trip.weather}. 3 scénarios générés.`);

  // 5. Hide thinking, show scenarios
  await sleep(400);
  $('#thinking').hidden = true;
  renderScenarios(trip);
  $('#scenarios').hidden = false;
  setStatus('scénarios prêts', false);

  // 6. Auto-select default scenario and render itinerary
  await sleep(900);
  selectScenario(trip.selectedKey);

  pipelineRunning = false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pushMsg(role, html) {
  const m = document.createElement('div');
  m.className = `msg msg--${role}`;
  m.innerHTML = html;
  $('#chatBody').appendChild(m);
  $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
}

function setStatus(text, active) {
  const s = $('#chatStatus');
  s.textContent = text;
  s.classList.toggle('is-active', !!active);
}

function animateCounter(id, target, duration) {
  return new Promise(resolve => {
    const el = $('#' + id);
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

/* ---------------------------------------------------------
   Render : scenarios
   --------------------------------------------------------- */
function renderScenarios(trip) {
  $('#scenariosSub').textContent = trip.summary;
  const grid = $('#scenariosGrid');
  grid.innerHTML = '';
  trip.scenarios.forEach(sc => {
    const el = document.createElement('button');
    el.className = `scenario scenario--${sc.key}`;
    el.dataset.key = sc.key;
    el.innerHTML = `
      <span class="scenario__tag">${sc.tag}</span>
      <div class="scenario__price">${sc.price} €</div>
      <div class="scenario__delta">${sc.delta}</div>
      <ul class="scenario__inc">
        ${sc.includes.map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div class="scenario__bar">
        <span class="seg-trans" style="width:${sc.breakdown.trans * 100}%"></span>
        <span class="seg-hotel" style="width:${sc.breakdown.hotel * 100}%"></span>
        <span class="seg-food"  style="width:${sc.breakdown.food  * 100}%"></span>
        <span class="seg-act"   style="width:${sc.breakdown.act   * 100}%"></span>
        <span class="seg-buf"   style="width:${sc.breakdown.buf   * 100}%"></span>
      </div>
    `;
    el.addEventListener('click', () => selectScenario(sc.key));
    grid.appendChild(el);
  });
}

/* ---------------------------------------------------------
   Select scenario → render itinerary
   --------------------------------------------------------- */
function selectScenario(key) {
  if (!currentTrip) return;
  $$('.scenario').forEach(s => s.classList.toggle('is-selected', s.dataset.key === key));

  const sc = currentTrip.scenarios.find(s => s.key === key);
  $('#itinTitle').textContent = `Itinéraire — ${sc.tag} · ${sc.price} €`;
  $('#itinSub').textContent = `${currentTrip.intent.destination} · ${currentTrip.intent.days} jours`;
  renderDays(currentTrip);
  renderBudget(currentTrip);
  renderMap(currentTrip);
  $('#itin').hidden = false;
  // smooth scroll vers l'itinéraire après une légère pause
  setTimeout(() => $('#itin').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

/* ---------------------------------------------------------
   Render : days (avec drag & drop)
   --------------------------------------------------------- */
function renderDays(trip) {
  const wrap = $('#panelDays');
  wrap.innerHTML = '';
  trip.itinerary.forEach((day, dIdx) => {
    const d = document.createElement('section');
    d.className = 'day';
    d.dataset.day = dIdx;
    d.innerHTML = `
      <header class="day__head">
        <span class="day__num">J${dIdx + 1}</span>
        <h3 class="day__title">${day.title}</h3>
        <span class="day__date">${day.date}</span>
        <span class="day__weather">${day.weather}</span>
      </header>
      <div class="day__items" data-day="${dIdx}"></div>
    `;
    const itemsWrap = d.querySelector('.day__items');
    day.items.forEach((it, iIdx) => {
      itemsWrap.appendChild(buildActivity(it, dIdx, iIdx));
    });
    wrap.appendChild(d);
  });
  wireDragAndDrop();
}

function buildActivity(it, dIdx, iIdx) {
  const a = document.createElement('div');
  a.className = 'activity';
  a.draggable = true;
  a.dataset.d = dIdx;
  a.dataset.i = iIdx;
  a.innerHTML = `
    <div class="activity__time">${it.time}</div>
    <div>
      <div class="activity__title"><span class="activity__icon">${it.icon}</span>${it.title}</div>
      <div class="activity__sub">${it.sub}</div>
    </div>
    <div class="activity__price ${it.price === 0 ? 'is-free' : ''}">${it.price === 0 ? 'gratuit' : it.price + ' €'}</div>
  `;
  return a;
}

function wireDragAndDrop() {
  let dragged = null;
  $$('.activity').forEach(el => {
    el.addEventListener('dragstart', () => {
      dragged = el;
      el.classList.add('is-dragging');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('is-dragging');
      $$('.activity').forEach(a => a.classList.remove('is-over'));
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (el !== dragged) el.classList.add('is-over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('is-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('is-over');
      if (!dragged || dragged === el) return;
      // simple DOM swap (visual only, démo)
      const parent = el.parentNode;
      const tmp = document.createElement('div');
      parent.insertBefore(tmp, dragged);
      el.parentNode.insertBefore(dragged, el);
      tmp.parentNode.insertBefore(el, tmp);
      tmp.remove();
      flashStatus('itinéraire recalculé');
    });
  });
}

function flashStatus(text) {
  const s = $('#chatStatus');
  const prev = s.textContent;
  s.textContent = text;
  s.classList.add('is-active');
  setTimeout(() => {
    s.textContent = prev;
    s.classList.toggle('is-active', prev !== 'prêt');
  }, 1400);
}

/* ---------------------------------------------------------
   Render : budget
   --------------------------------------------------------- */
function renderBudget(trip) {
  const b = trip.budget;
  const ratio = Math.min(1, b.total / b.target);
  const r = 84, c = 2 * Math.PI * r;
  $('#budgetRing').innerHTML = `
    <svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="14"/>
      <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--accent)" stroke-width="14"
              stroke-linecap="round"
              stroke-dasharray="${c}"
              stroke-dashoffset="${c * (1 - ratio)}"
              style="transition: stroke-dashoffset 1.2s var(--ease-out);"/>
    </svg>
    <div class="budget__ring__center">
      <div class="budget__ring__big">${b.total} €</div>
      <div class="budget__ring__sub">/ ${b.target} € · ${b.perDay} €/j</div>
    </div>
  `;

  const bd = $('#budgetBreakdown');
  bd.innerHTML = b.rows.map(row => `
    <div class="bud-row">
      <div class="bud-row__name">${row.name}</div>
      <div class="bud-row__val">${row.val} €</div>
      <div class="bud-row__bar"><span style="width:${row.pct}%"></span></div>
      <div class="bud-row__pct">${row.pct}%</div>
    </div>
  `).join('');

  $('#budgetTips').innerHTML = `
    <strong>💡 Économies possibles :</strong>
    <ul>${b.tips.map(t => `<li>${t}</li>`).join('')}</ul>
  `;
}

/* ---------------------------------------------------------
   Render : map (SVG stylisé)
   --------------------------------------------------------- */
function renderMap(trip) {
  const m = trip.map;
  const colors = ['#ff5c39', '#5d6bff', '#2ebd7a', '#ffc857', '#e5484d', '#a06bff', '#39d9d6'];

  const lines = m.pins.slice(0, -1).map((p, i) => {
    const next = m.pins[i + 1];
    return `<line x1="${p.x}%" y1="${p.y}%" x2="${next.x}%" y2="${next.y}%"
              stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".4"/>`;
  }).join('');

  const pins = m.pins.map((p, i) => `
    <g transform="translate(${p.x}% ${p.y}%)">
      <circle r="14" fill="${colors[i % colors.length]}" opacity=".25"/>
      <circle r="7"  fill="${colors[i % colors.length]}"/>
      <text x="14" y="5" font-family="Inter" font-size="11" fill="var(--fg)" font-weight="600">${p.lbl}</text>
    </g>
  `).join('');

  const legend = m.pins.map((p, i) => `
    <div><i style="background:${colors[i % colors.length]}"></i> J${p.day} · ${p.lbl}</div>
  `).join('');

  $('#mapwrap').innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="dots" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".5" fill="var(--border)"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dots)"/>
    </svg>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow:visible">
      ${lines}
      ${pins}
    </svg>
    <div class="mapwrap__legend">
      <div style="color:var(--fg);margin-bottom:6px;font-weight:600">${m.city}</div>
      ${legend}
    </div>
  `;
}

/* ---------------------------------------------------------
   Itinerary tabs
   --------------------------------------------------------- */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    $$('.tab').forEach(t => t.classList.toggle('is-active', t === tab));
    $$('.itin__panel').forEach(p => p.hidden = (p.dataset.panel !== target));
  });
});

/* ---------------------------------------------------------
   Itinerary action buttons (toasts demo)
   --------------------------------------------------------- */
['btnPdf', 'btnShare', 'btnBook'].forEach(id => {
  const el = $('#' + id);
  if (!el) return;
  el.addEventListener('click', () => {
    const labels = {
      btnPdf: 'Export PDF généré ✓',
      btnShare: 'Lien copié dans le presse-papier ✓',
      btnBook: 'Tunnel de réservation en cours d\'ouverture…'
    };
    flashStatus(labels[id]);
    if (id === 'btnShare' && navigator.clipboard) {
      navigator.clipboard.writeText(location.href).catch(() => {});
    }
  });
});
