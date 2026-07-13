# Kabyle — ce qu'il manque encore pour le questionnaire d'accueil (v6.115)

Bonne nouvelle : presque tout est maintenant intégré. Il ne reste que
**3 petites choses**, listées ci-dessous. Tout le reste (compréhension
du mini-test, écran "Avez-vous un bilan ?", écran de résultat "Votre
point de départ", 2 des 4 questions de ressenti) est déjà en place.

## 1. Une seule phrase de complétion manquante

Le mini-test d'accueil a 3 phrases à trous. 2 sur 3 sont intégrées
(« La nuit, je vois la LUNE », « Pour couper le pain, je prends un
COUTEAU »). Il manque juste celle-ci :

**Je bois mon café dans une ___ → TASSE** (pièges donnés en français : CHAISE, PORTE)
Essai (brouillon, à corriger ou retraduire) : *Sswaɣ lqahwa-inu deg [MOT MANQUANT : tasse].*

Le mot pour « tasse » n'a pas de traduction kabyle déjà vérifiée dans
l'app — à fournir plutôt qu'à deviner.

## 2. Deux questions de « Vos ressentis »

Sur les 4, 2 sont déjà intégrées (« chercher vos mots », « comprendre
ce qu'on vous dit »), avec l'échelle Souvent → *Aṭas n tikkal* /
Parfois → *Tikwal* / Rarement → *Drus*. Il reste :

- **Votre parole est-elle difficile à articuler ?**
  Essai (brouillon, à corriger ou retraduire) : *Awal-ik yewɛer i lehḍur ?*
- **La lecture vous demande-t-elle beaucoup d'effort ?**
  Essai (brouillon, à corriger ou retraduire) : *Aɣra yesra-yak aṭas n lǧehd ?*

Même échelle de réponse que les 2 déjà faites — pas besoin de la
retraduire. Sans ces 2 dernières questions, le questionnaire complet
reste en français (le mécanisme technique demande les 4 questions
ensemble, pas une intégration partielle).

## 3. Les phrases du compagnon « Ami »

L'app a un petit personnage ("Ami" → *Ameddakkel*, déjà confirmé) qui
donne des encouragements et des conseils tout au long de l'app — 46
phrases courtes au total, réparties par contexte (accueil, retour
après une pause, encouragements, fins de séance, conseils, et 11
explications d'exercices). Une seule a été confirmée jusqu'ici
(« Prêt·e quand vous voudrez, on y va doucement. » →
*Mi theggaḍ, ad nebdu s lɣerḍ, s leḥnana.*).

C'est un gros morceau — pas besoin de tout faire d'un coup. Je peux
préparer la liste complète des 46 phrases dans un fichier si c'est
utile pour votre contact, à la demande.

## Format

Un simple fichier texte ou Excel. Même format libre que les échanges
précédents.

## Une fois reçu

1. Le mot pour "tasse" → j'ajoute `completion` à `ASSESS_ITEMS_KAB`
   dans `js/assessment.js`.
2. Les 2 dernières questions → j'ajoute `window.SYMPTOM_QUESTIONS_KAB`
   dans `js/assessment.js`.
3. Les phrases du compagnon → `COMPANION_PHRASES.kab` dans
   `js/companion.js`.

Aucun autre changement de code nécessaire.
