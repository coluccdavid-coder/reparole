# Kabyle — questionnaire « Vos ressentis » + mini-test d'accueil (à corriger)

Deux petits lots, séparés du reste : des phrases complètes (pas du
vocabulaire isolé). Sur demande de l'utilisateur, j'ai ajouté un essai
de traduction ci-dessous plutôt que de laisser une page blanche — mais
**ce n'est pas une traduction fiable, c'est un brouillon à corriger**.
Le kabyle est une langue berbère, structurellement très différente de
l'arabe dialectal (où je m'appuie sur l'arabe standard que je maîtrise
mieux) — attendez-vous à de vraies erreurs de conjugaison, d'accord,
voire de sens sur les tournures les moins courantes, pas juste des
détails à peaufiner. Le mieux serait que votre contact **retraduise
plutôt que corrige** les lignes qui ne sonnent pas juste, sans se
sentir obligé de partir de ce brouillon.

**Ce n'est pas un diagnostic** : ces questions servent juste à
orienter le point de départ des exercices (qui reste ajustable
ensuite). Mais le score doit rester comparable à la version française,
donc l'échelle de réponse (Souvent / Parfois / Rarement) doit garder
le même sens dans les trois choix, pas juste une traduction
approximative.

## Lot 1 — Les 4 questions « Vos ressentis »

1. **Vous arrive-t-il de chercher vos mots ?**
   Réponses : Souvent / Parfois / Rarement
   Essai : *Yezmer ad ak-yeḍru aț-țnadiḍ ɣef wawalen-ik ?*

2. **Avez-vous du mal à comprendre ce qu'on vous dit ?**
   Réponses : Souvent / Parfois / Rarement
   Essai : *Yewɛer fell-ak ad tfehmeḍ ayen i k-d-qqaren ?*

3. **Votre parole est-elle difficile à articuler ?**
   Réponses : Souvent / Parfois / Rarement
   Essai : *Awal-ik yewɛer i lehḍur ?*

4. **La lecture vous demande-t-elle beaucoup d'effort ?**
   Réponses : Souvent / Parfois / Rarement
   Essai : *Aɣra yesra-yak aṭas n lǧehd ?*

Réponses, essai : **Aṭas** (souvent) / **Kra n tikkal** (parfois) / **Drus** (rarement) — les 3 mots isolés me semblent plus fiables que les 4 phrases ci-dessus.

Les 3 réponses (Souvent / Parfois / Rarement) sont les mêmes pour les
4 questions — les traduire une fois suffit, pas besoin de les répéter
4 fois si le sens ne change pas selon la question.

## Lot 2 — Le mini-test d'accueil : « compléter » et « comprendre » (6 phrases)

⚠️ **Essai partiel seulement, pas complet** — contrairement au lot 1,
plusieurs mots ici (tasse, couteau, étagère, ciseaux) n'ont pas de
traduction kabyle déjà vérifiée dans l'app. Plutôt que d'en inventer
une, je laisse ces trous marqués **[MOT MANQUANT]** — à remplir par la
personne, pas par moi. Les phrases où je réutilise un mot déjà
sourcé (aggur, afrux, adlis, igzem) restent quand même un essai de
construction de phrase, à corriger.

Même écran d'accueil, juste après les questions de ressenti : un
petit test de 3 domaines pour évaluer le point de départ. Le domaine
« dénomination » est déjà traduit en kabyle (3 mots : chien/vélo/pluie
— voir `ASSESS_ITEMS_KAB` dans `js/assessment.js`). Il manque les deux
autres domaines :

**Compléter des phrases** (3 phrases à trou — donnez aussi 2 mots
« pièges » plausibles par phrase, comme en français) :

1. Je bois mon café dans une ___ → TASSE (pièges donnés en français : CHAISE, PORTE)
   Essai : *Sswaɣ lqahwa-inu deg [MOT MANQUANT : tasse].*
2. La nuit, je vois la ___ → LUNE (pièges : TABLE, MAIN)
   Essai : *Iḍ, walaɣ aggur.* — attention, "aggur" est lui-même noté "non vérifié exact" dans `js/exercises-kab.js` (variante possible : *ayyur*) — à confirmer en même temps.
3. Pour couper le pain, je prends un ___ → COUTEAU (pièges : LIVRE, VERRE)
   Essai : *I ugezzem n weɣrum, sseqdaceɣ [MOT MANQUANT : couteau].*

**Comprendre des consignes** (question → réponse, + 2 réponses
« pièges » plausibles) :

4. Quel animal vole ? → L'OISEAU (pièges : LE CHIEN, LE POISSON)
   Essai : *Anwa aɣersiw i ferrun ?* → réponse : **Afrux** (déjà sourcé — "afrux" apparaît dans une phrase confirmée par votre contact : "Afrux ibennu axxam-is" = l'oiseau construit son nid)
5. Où range-t-on les livres ? → SUR UNE ÉTAGÈRE (pièges : DANS LE FRIGO, DANS LA BAIGNOIRE)
   Essai : *Anida ttwakksen idlisen ?* ("idlisen" = pluriel de "adlis", livre, déjà sourcé) → réponse : **[MOT MANQUANT : étagère]**
6. Que fait-on avec des ciseaux ? → COUPER (pièges : BOIRE, DORMIR)
   Essai : *D acu i nexdem s [MOT MANQUANT : ciseaux] ?* → réponse : **Agzem** (déjà sourcé — "igzem" apparaît dans une phrase confirmée : "Ajennay ad igzem iruẓan" = le jardinier taille les rosiers)

Les mots « pièges » n'ont pas besoin d'être un choix parfait — juste
des mots plausibles et déjà présents dans le vocabulaire kabyle de
l'app si possible (voir `js/exercises-kab.js`), pour rester cohérent.

## Format

Un simple fichier texte ou Excel avec la traduction en kabyle pour
chaque ligne des deux lots. Même format libre que les échanges
précédents — pas besoin de suivre une structure figée.

## Une fois reçu

**Lot 1** : j'ajouterai `window.SYMPTOM_QUESTIONS_KAB` dans
`js/assessment.js` (même structure que `SYMPTOM_QUESTIONS_EN`, `_ES`,
etc., déjà présentes dans ce fichier).

**Lot 2** : j'ajouterai `completion` et `comprehension` à
`ASSESS_ITEMS_KAB` (déjà existant pour `denomination`, même fichier).

Aucun autre changement de code nécessaire — pas besoin de retravailler
le reste.
