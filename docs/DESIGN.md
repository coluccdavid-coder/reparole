# 🎨 Charte de design

Cette charte grave les règles visuelles de ReParole. Objectif : une
interface qui inspire **confiance et qualité** à trois publics très
différents — patients (dont certains aphasiques ou fatigables), aidants,
professionnels de santé. Une règle par décision, pour que rien ne soit
laissé au hasard d'un écran à l'autre.

## Couleurs — une fonction par couleur

ReParole est une marque **verte** (vert sapin). C'est un choix d'identité
assumé : il nous distingue (Aphasix est bleu/violet) et le vert porte
déjà, chez nous, le sens « progression / vivant ». On ne repeint pas la
marque ; on discipline l'usage des couleurs autour d'elle.

| Couleur | Variable(s) | Fonction UNIQUE | Ne JAMAIS servir à |
|---|---|---|---|
| Vert sapin | `--accent`, `--accent-dark` | Marque, navigation, boutons principaux, réussite/validation | — |
| Orange doux | `--warm`, `--warm-dark` | Encouragements, information importante, alerte NON critique | Une erreur technique |
| Rouge | `--error` | **Erreurs techniques uniquement** (connexion, sauvegarde) | **JAMAIS** la performance du patient (verrouillé par test) |
| Violet léger | `--ami`, `--ami-soft` | Identité visuelle d'**Ami** et de lui seul | Un élément d'interface générique |
| Neutres | `--bg`, `--surface`, `--ink`, `--ink-soft`, `--line` | Fonds, cartes, texte, séparateurs | Porter un sens (succès/erreur) |

Principe : le patient apprend le sens des couleurs **sans lire** les
textes. Une couleur qui change de rôle selon l'écran casse cet
apprentissage — c'est interdit.

## Typographie — hiérarchie et respiration

- La **base** de l'interface reste inchangée (les pros ne sont pas
  fatigables ; grossir partout casserait les tableaux ortho).
- Le **confort de lecture** pour les patients passe par le mode
  **lecture facilitée** (`body.dys` / réglage d'accessibilité) : c'est
  LUI qui monte la taille (texte courant 22-24 px), l'interligne
  (1,5-1,7) et l'espacement. Une **préférence**, jamais un défaut imposé.
- Hiérarchie cible (en lecture facilitée) : titre 40-44 px, sous-titre
  28-32 px, texte courant 22-24 px, boutons ≥ 22 px.
- Interligne généreux (1,5 à 1,7) : bénéfice documenté pour l'aphasie et
  la fatigue cognitive.

## Boutons

- Hauteur confortable (cible 60-64 px côté patient / lecture facilitée),
  largeur généreuse, coins franchement arrondis.
- Transition douce au clic (200-250 ms) — voir Animations.
- États **survol / focus / désactivé** visuellement distincts (le focus
  clavier est non négociable pour l'accessibilité).
- **Un seul** bouton principal par écran, toujours le plus visible
  (« Commencer ma séance », « ▶ Continuer »). Voir ERGONOMIE.md.

## Cartes

Toutes les cartes partagent le **même** langage : même rayon de bordure,
ombre très légère, marges et espacement interne constants. Objectif :
une interface qui semble taillée dans un seul bloc, pas juxtaposée. Toute
carte nouvelle réutilise la classe `.card` — jamais de style inline
concurrent pour le fond/rayon/ombre.

## Animations — guider, pas distraire

Autorisé : apparition douce, léger déplacement, disparition progressive.
**Interdit** : rebonds, effets spectaculaires, mouvements rapides.
L'animation sert la compréhension. Et elle respecte toujours
`prefers-reduced-motion` et le réglage « réduire les animations » : dans
ce cas tout apparaît instantanément.

## Icônes

Une seule bibliothèque, une seule épaisseur de trait, un seul style,
tailles cohérentes. (Aujourd'hui : emojis, homogènes et lisibles.)
Mélanger des styles d'icônes donne une impression d'application
« assemblée » — à éviter.

## Espacements — grille de 8 px

Tous les espacements (entre titres, cartes, boutons) sont des multiples
de 8 px (8 / 16 / 24 / 32…). Cette régularité crée une sensation d'ordre
qui **réduit la charge cognitive**. En cas de doute sur une marge :
arrondir au multiple de 8 le plus proche.

## Ce qui relève d'un chantier dédié

La *refonte visuelle premium* (ré-espacer et harmoniser finement les ~40
écrans existants) est un sprint à part entière, à mener d'un bloc sur une
structure stabilisée — pas à saupoudrer version par version. Cette charte
est la **référence** de ce futur chantier ; d'ici là, tout NOUVEL écran
la respecte dès sa création.
