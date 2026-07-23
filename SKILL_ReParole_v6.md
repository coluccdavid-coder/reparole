# ReParole Pro — Référence essentielle (v6.166)

*Ce document remplace l'ancien `SKILL_ReParole_v6.md` (périmé depuis v6.109).
Il résume l'état réel du projet, sans le détail du débogage — pour ça, voir
l'historique complet dans `README.md`.*

## En une phrase

Application de rééducation du langage post-AVC, multilingue (14 langues),
gratuite pour l'essentiel avec un abonnement à 10 €/mois pour aller plus
loin. Version bêta fonctionnelle, pas encore en production avec de vraies
données patients.

## Stack technique

- Vanilla JS, PWA (installable, fonctionne hors-ligne), aucun framework
- Supabase (base de données + auth) — **pas certifié HDS**, à migrer avant
  la production
- Stripe pour le paiement (structure prête, paywall désactivé —
  `PAYWALL_ENABLED = false`)
- Voix : Google Cloud Text-to-Speech (Neural2/WaveNet) pour les 9 langues
  complètes, généré via `scripts/generate-voice-audio.js`
- 738+ tests automatisés, tous au vert

## Les 4 piliers du produit

| Pilier | Exercices | Statut |
|---|---|---|
| **Langage** | Dénomination, complétion, compréhension, association, structure de phrase, rimes, lecture | Complet dans les 9 langues complètes ; structure/lecture masquées en darija/kabyle (pas traduit) |
| **Parole** | Répétition, dénomination orale, intonation, fluence | Complet dans les 9 langues complètes ; masqué en darija/kabyle (pas de synthèse vocale navigateur) |
| **Mémoire** | Jeu de séquence d'images | Complet partout — contenu universel (emoji), aucune traduction nécessaire |
| **Acalculie** | Heure, monnaie, calcul du quotidien, comparaison de nombres, prix | Complet dans les 9 langues complètes (monnaie localisée par pays réel) ; masqué en darija/kabyle |

Plus : conversation guidée (9 langues complètes), photos personnelles
(dynamique par patient, jamais traduit par nature).

## Les 14 langues

**10 complètes** : français (référence), anglais, espagnol, italien,
portugais, allemand, arabe, turc, polonais, japonais.

**4 partielles** : kabyle, darija algérienne/marocaine/tunisienne —
interface complète, contenu de base traduit, mais brouillon non relu par
des locuteurs natifs. Les exercices sans traduction sont proprement
masqués (jamais de mélange de langues visible).

## Tarification

| | Gratuit | Pro |
|---|---|---|
| **Patient** | 14 langues, exercices à choix, 5 séances/jour | 10 €/mois ou 100 €/an — exercices vocaux, conversation guidée, illimité |
| **Orthophoniste** | 3 patients suivis | 9,99 €/mois ou 79 €/an — patients illimités (marge possible jusqu'à 15-20 €/mois si besoin) |

## Avant un vrai lancement (production)

1. Pages légales à compléter (mentions légales, CGU, CGV, confidentialité)
2. Migrer ou auto-héberger Supabase sur infrastructure certifiée HDS
   (OVHcloud, Scaleway, Outscale... — 30-80 €/mois en entrée de gamme)
3. Relecture native pour les 4 langues partielles et le contenu japonais
   récent (conversation guidée)
4. Décider si GitHub reste l'outil de travail (voir `HEBERGEMENT.md`)

Détail complet : `Feuille-de-route-Production.docx` (livré séparément).

## Pièges connus, à ne pas refaire

- **Le dossier `audio/`** ne doit jamais être supprimé lors d'une mise à
  jour complète du code — aucun zip livré ne le contient, il n'existe que
  sur le dépôt de l'utilisateur. Voir l'avertissement dans
  `HEBERGEMENT.md`.
- **Nouveau contenu parlé** (nouvel exercice, nouvelle traduction) →
  toujours relancer `node scripts/extract-voice-content.js` PUIS
  `generate-voice-audio.js` — plusieurs oublis passés ont laissé des
  exercices entiers sur la voix robot du navigateur.
- **`FRENCH_ONLY_EXERCISE_TYPES`** (js/app.js) a un nom trompeur : ne pas
  retirer un type de cette liste en pensant qu'il a une traduction — le
  mécanisme est dynamique (`hasTranslatedContent()`), le retirer désactive
  la vérification entièrement au lieu de la laisser fonctionner par langue.
- **`association`** n'a pas besoin d'être dans cette liste : son contenu
  (emoji) est universel, sa consigne se génère dynamiquement — déjà
  vérifié fonctionnel dans toutes les langues.

## Contacts utiles identifiés

- **FNO** (Fédération Nationale des Orthophonistes) — contact@fno.fr —
  le candidat le plus solide pour un retour clinique
- **France AVC** — franceavc.com/contact — utile pour la diffusion
  patient, moins pour la validation clinique
