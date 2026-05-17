# Caveman Travel — Dossier de conception complet

Plateforme IA de planification, comparaison et réservation de voyages.

> **Pitch** : Un assistant IA qui transforme une phrase libre en un voyage complet, optimisé, réservable, et personnalisé — du transport hybride à l'hôtel, jour par jour, dans le budget exact de l'utilisateur.

## Sommaire

| # | Document | Contenu |
|---|---|---|
| 00 | [Vision](./00-VISION.md) | Pitch, problème, solution, différenciateurs |
| 01 | [Architecture](./01-ARCHITECTURE.md) | Stack technique, services, infra, multi-région |
| 02 | [MVP Features](./02-MVP-FEATURES.md) | Périmètre, priorisation RICE, critères de succès |
| 03 | [Structure technique](./03-TECH-STRUCTURE.md) | Monorepo, services, conventions |
| 04 | [Wireframes](./04-WIREFRAMES.md) | Écrans clés, composants signature |
| 05 | [Workflow IA](./05-AI-WORKFLOW.md) | Agents, pipeline, choix modèles |
| 06 | [APIs](./06-APIS.md) | Fournisseurs voyage, stratégie multi-source |
| 07 | [Base de données](./07-DATABASE.md) | Schémas Postgres/ClickHouse, vector store |
| 08 | [Optimisation prix](./08-PRICE-OPTIMIZATION.md) | Algos, hybrid routes, prédictions |
| 09 | [UX](./09-UX.md) | Parcours, design system, animations |
| 10 | [Prompt engineering](./10-PROMPT-ENGINEERING.md) | Prompts complets, eval, sécurité |
| 11 | [Roadmap](./11-ROADMAP.md) | Plan 12 mois, jalons, recrutement |
| 12 | [Business model](./12-BUSINESS-MODEL.md) | Monétisation, scaling, funding |
| 13 | [Sécurité / DevOps](./13-SECURITY-DEVOPS.md) | RGPD, IaC, observabilité |

## Points clés à retenir

### Produit
- **Une phrase → un voyage en < 60 s** : flux conversationnel streamé.
- **3 scénarios** générés (Éco / Équilibré / Confort) avec breakdown budget.
- **Killer feature** : trajets hybrides (train + avion) que personne d'autre ne propose.
- **Réservation 1-clic** : V1 affiliée, V2 checkout unifié Stripe.

### Technique
- **Modular monolith** NestJS au démarrage, extraction services au besoin.
- **Orchestrateur LLM** (Claude Opus) + agents spécialisés (Haiku/Sonnet) + optimiseur déterministe (PuLP).
- **Postgres + pgvector** pour tout V1, **ClickHouse** pour price history.
- **Coût IA cible** : < 0,45 € par voyage généré.

### Business
- **Affiliation** (4-6 % panier) + **Premium 9,90 €/mois** + **B2B 15 €/employé/mois**.
- **Path to profitability** : 250k MAU mois 12, EBITDA mensuel +200k €.

### Différenciateurs durables
1. Optimisation **globale** du voyage (pas par silo).
2. Trajets **hybrides** multi-modes.
3. **Mémoire utilisateur** qui s'enrichit (RAG).
4. **Vitesse perçue** (streaming, optimistic UI).
5. UX premium qui ne ressemble pas à un comparateur.

## État d'avancement de ce dossier

Ce dossier est un **plan produit + technique**, pas du code. Il fournit à une équipe de développement tout le matériel nécessaire pour démarrer la construction :

- Specs fonctionnelles complètes
- Architecture cible
- Schémas DB exploitables
- Prompts LLM testables
- Plan d'exécution 12 mois
- Politique sécurité / conformité

**Prochaine étape recommandée** : passer en mode build → setup monorepo + premier appel LLM bout-en-bout (semaine 1 du plan mois 1).
