# Darija algérienne — ce qu'il reste pour la parité avec le français

État après intégration des 5 fichiers Excel fournis (v6.103) :

| Exercice | Statut |
|---|---|
| Dénomination | ✅ 23 / 34 / 35 — complet, intégré dans `js/exercises-dz.js` |
| Complétion | ✅ 8 / 8 / 8 — complet, intégré dans `js/exercises-dz.js` |
| Compréhension | ❌ 0 / 0 / 0 — **manquant, voir liste ci-dessous** |

Contrairement à la dénomination (mots isolés) et à la complétion (déjà
fournie), je ne peux pas traduire moi-même les 18 questions de
compréhension : plusieurs sont des expressions/de la logique (niveau 3)
qui doivent rester grammaticalement et idiomatiquement correctes une
fois traduites — un risque de sonner "arabe standard à peine modifié"
plutôt que du vrai parler algérien si je les improvise seul (même
principe que pour le kabyle, voir `docs/kabyle-parity-request.md`).

## Compréhension — 18 questions à traduire

### Niveau 1

1. Quel animal aboie ? → **LE CHIEN**
2. Avec quoi mange-t-on la soupe ? → **UNE CUILLÈRE**
3. Où dort-on ? → **DANS UN LIT**
4. Quelle couleur est l'herbe ? → **VERTE**
5. Que boit-on quand on a soif ? → **DE L'EAU**
6. Quel objet éclaire la nuit ? → **UNE LAMPE**

### Niveau 2

7. Quel objet sert à voir l'heure ? → **UNE MONTRE**
8. Quelle saison vient après l'hiver ? → **LE PRINTEMPS**
9. Que fait-on avec un parapluie ? → **SE PROTÉGER DE LA PLUIE**
10. Quel métier soigne les malades ? → **LE MÉDECIN**
11. Combien de jours dans une semaine ? → **SEPT**
12. Où achète-t-on des médicaments ? → **À LA PHARMACIE**

### Niveau 3

13. Si tous les roses sont des fleurs, une rose est-elle une fleur ? → **OUI**
14. Le contraire de "rapidement" est : → **LENTEMENT**
15. "Il pleut des cordes" signifie : → **IL PLEUT BEAUCOUP**
16. Pierre est plus grand que Paul. Qui est le plus petit ? → **PAUL**
17. "Tourner la page" veut dire : → **PASSER À AUTRE CHOSE**
18. Quel mot n'est pas un fruit ? → **CAROTTE**

## Format attendu (même que les fichiers déjà fournis)

Un fichier Excel avec les colonnes : `Niveau` (1/2/3), `Français`
(la question ci-dessus), `Darija algérienne` (la question traduite),
`Réponse attendue` (la réponse traduite). Même méthode que
`Darija_Algerienne_Completion_Partie1/2.xlsx`.

## Une fois ce fichier fourni

J'intégrerai directement dans `js/exercises-dz.js` (ajout de
`comprehension:{...}` à `window.BANK_DZ`, même mécanisme que
dénomination/complétion) — pas besoin de retravailler le reste du
fichier.
