# 📚 ReParole Pro — Documentation

> **Version documentée : `reparole-v6-204`** — cette ligne est vérifiée
> automatiquement contre `sw.js` par `tests/documentation.test.js` :
> toute nouvelle version DOIT mettre à jour la documentation, sinon la
> suite de tests échoue. « Tout documenter » n'est pas une intention,
> c'est un verrou.

ReParole Pro est une application web (PWA) d'entraînement du langage
pour personnes aphasiques après un AVC, construite autour d'un triangle
**patient ↔ orthophoniste ↔ aidant**, en **14 langues**, avec une
couche d'IA strictement **non-décisionnaire** (« l'IA prépare, l'humain
décide »).

## Les documents

| Document | Contenu | Pour qui |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Pile technique, carte des fichiers, flux de données, modèle de sécurité | Développeur |
| [FONCTIONNALITES.md](FONCTIONNALITES.md) | Les 4 espaces, les 20 exercices, les jeux, la quête, Ami, la personnalisation | Tout le monde |
| [IA.md](IA.md) | Philosophie, les 11 tâches, plafonds, anonymisation, coûts, dépannage | Ortho / dev |
| [DEPLOIEMENT.md](DEPLOIEMENT.md) | Site, fonction IA (pas-à-pas éprouvé), SQL, voix — et tous les pièges rencontrés | Dev / admin |
| [DONNEES.md](DONNEES.md) | Les 20 tables, ce qui part (ou pas) vers l'IA, RGPD/HDS | Dev / DPO |
| [DEVELOPPEMENT.md](DEVELOPPEMENT.md) | Discipline de version, conventions i18n, banques de contenu, tests | Contributeur |
| [DESIGN.md](DESIGN.md) | Charte de design : couleurs, typo, boutons, cartes, grille 8px | Design / dev |
| [ERGONOMIE.md](ERGONOMIE.md) | Charte d'ergonomie troubles du langage : 8 règles + règle d'or d'Ami | Tout le monde |

## Documents racine complémentaires

- `README.md` — journal de bord complet, version par version (changelog).
- `HEBERGEMENT.md` — hébergeur actuel, procédure de mise en ligne du site.
- `RGPD.md` + `PREPARATION-REGLEMENTAIRE.md` — cadre réglementaire.
- `js/ia-edge-function.md` — le code source commenté de la fonction IA
  (c'est LE fichier à coller lors du déploiement de `ia-assist`).
- `docs/kabyle-*.md`, `docs/*-parity-request.md` — traçabilité des
  contenus kabyle et darijas (demandes de parité, glossaire).
- `docs/acalculie-exercises.md` — conception des exercices de calcul.

## Principes non négociables (rappel)

1. **Aucun diagnostic** — l'application entraîne, elle ne diagnostique pas.
2. **L'autorité clinique prime** — l'orthophoniste décide, toujours
   (exercices IA validés un par un, interrupteurs par patient).
3. **Anonymat vers l'IA** — aucun nom de patient ne quitte la base.
4. **Le patient n'est jamais face à un LLM** — Ami est scripté ; la
   couche IA sert les professionnels.
5. **Gratuit généreux** — les 14 langues et les jeux sont gratuits ;
   le Pro (9,99 €/mois) finance la couche IA et les outils ortho.
