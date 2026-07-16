# Darija marocaine — état du contenu (v6.147)

| Exercice | Statut |
|---|---|
| Interface | ✅ 538/538 (depuis la v6.145) |
| Dénomination | ⚠️ 8/8/8 (24 mots) — **brouillon de ma part**, pas de fichier natif fourni |
| Complétion | ⚠️ 8/8/8 (24 phrases) — **brouillon de ma part** |
| Compréhension | ⚠️ 6/6/6 (18 questions) — **brouillon de ma part** |

## Pourquoi un brouillon plutôt qu'une attente

Contrairement à la darija algérienne (dénomination et complétion
fournies à 100% par des fichiers Excel natifs), aucun fichier n'a été
fourni pour le marocain. Vous avez demandé explicitement d'avancer
plutôt que d'attendre — ce contenu est donc une première tentative de
ma part, construite en traduisant le même contenu déjà utilisé pour
les langues complètes (anglais, espagnol...), avec le marqueur
possessif ديال (distinctif du marocain, contrairement à تاع pour
l'algérien ou متاع pour le tunisien).

## Ce qui mérite le plus une relecture native

- Le vocabulaire du niveau 3 (mots plus rares : boussole, hérisson,
  ancre, microscope...) — plus de risque de sonner "arabe standard à
  peine modifié" que les mots très courants du niveau 1.
- Les 2 questions de compréhension avec expression idiomatique
  ("il pleut des cordes", "tourner la page") — même réserve que pour
  la darija algérienne (voir `docs/dz-parity-request.md`).

## Comment corriger

Le fichier est `js/exercises-ma.js` — modifiable directement, ou par
le même mécanisme `BANK_EXTEND` que les autres langues. Si vous avez
accès à une personne marocaine darijaphone, le format le plus simple
reste un tableau (Niveau / Français ou Anglais / Darija marocaine /
Réponse attendue), même méthode que les fichiers fournis pour
l'algérien.

## Ce qui reste hors de portée

Les exercices vocaux (répétition, dénomination orale, fluence)
restent en français : aucune voix de navigateur ne prend en charge la
darija marocaine — limite technique, pas un manque de contenu (voir
`js/voice-recognition-cross-browser.md`).
