# Darija tunisienne — état du contenu (v6.147)

| Exercice | Statut |
|---|---|
| Interface | ✅ 538/538 (depuis la v6.145) |
| Dénomination | ⚠️ 8/8/8 (24 mots) — **brouillon de ma part**, pas de fichier natif fourni |
| Complétion | ⚠️ 8/8/8 (24 phrases) — **brouillon de ma part** |
| Compréhension | ⚠️ 6/6/6 (18 questions) — **brouillon de ma part** |

## Pourquoi un brouillon plutôt qu'une attente

Même situation que le marocain (voir `docs/ma-parity-request.md`) :
aucun fichier natif fourni, contenu construit en traduisant la même
base que les langues complètes, avec le marqueur possessif متاع
(distinctif du tunisien, contrairement à تاع pour l'algérien ou ديال
pour le marocain).

## Ce qui mérite le plus une relecture native

- Le vocabulaire du niveau 3 (mots plus rares).
- Les 2 questions de compréhension avec expression idiomatique
  ("il pleut des cordes" → "الشتا حابسة", "tourner la page").
- Le tunisien a des emprunts au français particulièrement fréquents
  dans l'usage courant (plus encore que l'algérien ou le marocain) —
  possible que certains mots choisis ici (ex. القلم pour "stylo")
  sonnent moins naturels qu'un emprunt français plus courant dans
  l'usage réel.

## Comment corriger

Le fichier est `js/exercises-tn.js` — modifiable directement, ou par
le même mécanisme `BANK_EXTEND` que les autres langues. Même format
suggéré que pour le marocain si vous avez accès à une personne
tunisienne darijaphone.

## Ce qui reste hors de portée

Les exercices vocaux restent en français : aucune voix de navigateur
ne prend en charge la darija tunisienne (voir
`js/voice-recognition-cross-browser.md`).
