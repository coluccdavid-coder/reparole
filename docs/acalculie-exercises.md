# Exercices d'acalculie — contexte et état (v6.156)

## Pourquoi ces exercices existent

Demandé explicitement par l'utilisateur, après une discussion sur des
outils professionnels comme Examath (HappyNeuron Pro). Un vrai besoin
a été identifié : l'**acalculie** — trouble acquis du traitement des
nombres et du calcul après une lésion cérébrale (AVC, traumatisme
crânien) — touche une partie réelle du public de ReParole, souvent en
plus de l'aphasie, et reste peu prise en charge par les outils
existants.

Une recherche a confirmé qu'il n'existe que peu de tests adaptés à ce
public précis — la plupart des outils de cognition mathématique
(comme Examath) sont étalonnés sur des enfants avec un trouble
développemental (la dyscalculie), pas sur des adultes avec un trouble
acquis. Un article de presse récent parle même d'un « manque criant
de prise en charge » de l'acalculie post-AVC.

## D'où vient l'inspiration

Dans l'**esprit** de la BENQ (Batterie d'Évaluation du Nombre au
Quotidien, Breille & Giard 2007) — le seul outil français identifié
qui vise spécifiquement les patients cérébro-lésés adultes plutôt
qu'un public pédiatrique. Sa vraie qualité : des tâches concrètes du
quotidien (lire l'heure, compter la monnaie, estimer un prix) plutôt
que du calcul scolaire abstrait.

**Le contenu de ReParole est intégralement original** — aucune
épreuve de la BENQ n'a été reproduite, copiée ou adaptée directement.
Seule la logique de catégories (heure, monnaie, calcul pratique) a
inspiré la conception de nouveaux items.

## Les 5 exercices

| Exercice | Items par niveau | Total |
|---|---|---|
| Lire l'heure | 12 | 36 — horloge dessinée en SVG, plus de plafond (voir ci-dessous) |
| Compter la monnaie | 12 | 36 |
| Calcul du quotidien | 12 | 36 |
| Comparer les nombres | 12 | 36 |
| Estimer un prix | 12 | 36 |
| **Total** | | **180** |

Chaque exercice a 3 niveaux de difficulté, avec le même mécanisme de
difficulté adaptative que les 14 autres types d'exercice existants.

## L'horloge dessinée (v6.158)

La première version de « Lire l'heure » utilisait les émojis
d'horloge d'Unicode — pratique, mais plafonné à 24 (12 heures pleines
+ 12 demi-heures, aucune heure supplémentaire possible). Remplacée
par une vraie horloge dessinée en SVG : cadran, 12 repères, aiguille
des heures et des minutes positionnées par calcul trigonométrique
exact selon l'heure et la minute demandées.

Ça lève complètement le plafond — les quarts d'heure sont désormais
possibles (niveau 3 : "3 heures et quart", "5 heures moins le
quart"...), quelque chose d'impossible avec le jeu d'émojis limité.
La couleur du cadran s'adapte automatiquement au mode sombre
(`currentColor` hérite de la couleur du texte parent).

## Ce que ce n'est PAS

Comme tout le reste de ReParole : **de l'entraînement, jamais un
diagnostic**. Aucun score normé, aucun seuil pathologique, pas de
comparaison à une population de référence — juste de la pratique
adaptative. Le bandeau « ce n'est pas un diagnostic médical » de
l'écran de bilan s'applique de la même façon ici.

## Statut actuel

- **Contenu français** : brouillon de ma part — jamais validé par un∙e
  orthophoniste ni un∙e neuropsychologue spécialisé∙e en cognition
  numérique. À faire vérifier avant tout usage clinique réel.
- **Traduit dans les 9 langues complètes** (en/es/it/pt/de/ar/tr/pl/ja)
  depuis la v6.159 — 1620 items au total. Monnaie et prix **localisés
  par pays**, pas juste traduits mot à mot : dollars pour l'anglais,
  livre égyptienne pour l'arabe, yens avec de vraies coupures
  japonaises, lires turques, zlotys polonais... Un choix pragmatique a
  dû être fait pour l'arabe (22 pays l'utilisent, aucune devise n'est
  neutre) — la livre égyptienne a été retenue.
- **Toujours français uniquement pour dz/ma/tn/kab** (les 4 langues
  partielles) — masqué proprement pour ces langues, comme pour
  syntax/story/rhyme, plutôt que d'afficher du français par erreur.
- **Interface** : les titres et descriptions des 5 tuiles sont déjà
  traduits dans les 14 langues (y compris les 4 partielles).

## Prochaines étapes possibles

- Relecture clinique du contenu français (orthophoniste ou
  neuropsychologue)
- Relecture native des 9 traductions, en particulier les montants
  "monnaie"/"prix" qui dépendent de la connaissance réelle du coût de
  la vie locale
- Traduction vers les 4 langues partielles (dz/ma/tn/kab)
- Éventuellement, plus d'items par niveau si l'usage confirme que
  12/niveau est insuffisant pour une vraie séance
