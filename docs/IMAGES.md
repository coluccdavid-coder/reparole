# 📷 Images d'exercice — remplacer les emoji par de vraies photos

> Créé en v6.248, à la demande du propriétaire : les emoji seuls font
> enfantin pour un public d'adultes après un AVC. Ce document explique
> comment fournir de vraies photos, et lesquelles.

## Comment ça marche

Chaque mot d'exercice est illustré par un emoji dans les banques de mots
(`js/exercises-*.js`). Depuis la v6.248, l'application cherche d'abord
une **vraie photo** dans le dossier `img/` de l'hébergement :

1. `img/<codepoints>.webp` — essayé en premier ;
2. `img/<codepoints>.jpg` — essayé ensuite ;
3. à défaut, l'emoji s'affiche dans une carte sobre (`.prompt-media`).

**L'emoji est la clé partagée des 14 langues** : 🐱 illustre CHAT, CAT,
GATO, KOT… Une seule photo de chat sert donc toutes les langues. Le nom
de fichier est la suite de codepoints de l'emoji (🐱 → `1f431.webp`,
☀️ → `2600.webp`) — stable, sans accent ni problème d'encodage.

Un fichier absent n'est demandé qu'une fois par session (pas de rafale
de 404 — même leçon que les voix en v6.244), et les photos trouvées sont
mises en cache **permanent** par le service worker : elles survivent aux
mises à jour, comme les voix.

## Règles du dossier `img/`

Les mêmes que pour `audio/`, et pour la même raison :

- **Ne JAMAIS supprimer `img/` lors d'un déploiement.** La procédure
  devient : supprimer tout **sauf `audio/` ET `img/`**, puis remettre le
  contenu du zip.
- `img/` est **exclu des zips de livraison** — il vit uniquement chez
  l'hébergeur, rempli progressivement.
- Un fichier ajouté est disponible immédiatement (rechargement de page),
  sans nouvelle version de l'application.

## Quelles photos choisir

C'est du matériel clinique, pas de la décoration :

- **une photo par concept, sur fond neutre et uni** — l'objet seul, sans
  contexte qui distrait ni texte incrusté ;
- **~600 px de large suffit** (l'app affiche 300 px max), format webp de
  préférence, jpg accepté ;
- **pas de visage identifiable** sans consentement écrit (RGPD) ;
- vérifier le **droit d'usage** : vos propres photos, ou des images sous
  licence libre compatible avec un usage commercial (ReParole Pro est
  payant — les licences « non commercial » type CC-NC sont à exclure).

Les photos personnelles prises par l'aidant restent le meilleur choix
clinique quand c'est possible : nommer SA tasse, SON chat, aide plus que
nommer une tasse générique.

## Les images attendues

Tableau généré depuis les banques de mots réelles par
`node scripts/liste-images.js` (à relancer si des mots changent) :

<!-- TABLE-IMAGES:DEBUT -->
| Emoji | Fichier attendu | Mot (fr) | Mot (en) |
|---|---|---|---|
| 🌉 | `1f309.webp` | PONT |  |
| 🌊 | `1f30a.webp` | VAGUE |  |
| 🌋 | `1f30b.webp` | VOLCAN | VOLCANO |
| 🌙 | `1f319.webp` | LUNE |  |
| 🌧️ | `1f327.webp` | PLUIE |  |
| 🌪️ | `1f32a.webp` | TORNADE | TORNADO |
| 🌹 | `1f339.webp` | FLEUR | FLOWER |
| 🍄 | `1f344.webp` | CHAMPIGNON | MUSHROOM |
| 🍇 | `1f347.webp` | RAISIN |  |
| 🍊 | `1f34a.webp` | ORANGE |  |
| 🍌 | `1f34c.webp` | BANANE |  |
| 🍎 | `1f34e.webp` | POMME | APPLE |
| 🍓 | `1f353.webp` | FRAISE |  |
| 🍞 | `1f35e.webp` | PAIN | BREAD |
| 🎁 | `1f381.webp` | CADEAU |  |
| 🎈 | `1f388.webp` | BALLON |  |
| 🎠 | `1f3a0.webp` | MANÈGE |  |
| 🎥 | `1f3a5.webp` | CAMÉRA |  |
| 🎪 | `1f3aa.webp` | CHAPITEAU |  |
| 🎯 | `1f3af.webp` | CIBLE |  |
| 🎷 | `1f3b7.webp` | SAXOPHONE |  |
| 🎸 | `1f3b8.webp` | GUITARE |  |
| 🎹 | `1f3b9.webp` | PIANO |  |
| 🎺 | `1f3ba.webp` | TROMPETTE | TRUMPET |
| 🎻 | `1f3bb.webp` | VIOLON | VIOLIN |
| 🏝️ | `1f3dd.webp` | PLAGE |  |
| 🏠 | `1f3e0.webp` | MAISON | HOUSE |
| 🏮 | `1f3ee.webp` | LANTERNE |  |
| 🏰 | `1f3f0.webp` | CHÂTEAU |  |
| 🏹 | `1f3f9.webp` | ARC |  |
| 🏺 | `1f3fa.webp` | POTERIE |  |
| 🐂 | `1f402.webp` |  |  |
| 🐄 | `1f404.webp` |  |  |
| 🐊 | `1f40a.webp` | CROCODILE |  |
| 🐙 | `1f419.webp` | POULPE |  |
| 🐝 | `1f41d.webp` | ABEILLE |  |
| 🐟 | `1f41f.webp` | POISSON | FISH |
| 🐢 | `1f422.webp` | TORTUE |  |
| 🐧 | `1f427.webp` | PINGOUIN |  |
| 🐭 | `1f42d.webp` | SOURIS |  |
| 🐮 | `1f42e.webp` | VACHE |  |
| 🐰 | `1f430.webp` | LAPIN |  |
| 🐱 | `1f431.webp` | CHAT | CAT |
| 🐴 | `1f434.webp` | CHEVAL |  |
| 🐶 | `1f436.webp` | CHIEN |  |
| 🐷 | `1f437.webp` | COCHON |  |
| 👕 | `1f455.webp` | CHEMISE |  |
| 👖 | `1f456.webp` | PANTALON |  |
| 👟 | `1f45f.webp` | CHAUSSURE |  |
| 💡 | `1f4a1.webp` | AMPOULE |  |
| 📖 | `1f4d6.webp` |  |  |
| 📷 | `1f4f7.webp` |  |  |
| 📺 | `1f4fa.webp` |  |  |
| 🔑 | `1f511.webp` | CLÉ |  |
| 🔩 | `1f529.webp` | BOULON |  |
| 🔬 | `1f52c.webp` | MICROSCOPE | MICROSCOPE |
| 🔭 | `1f52d.webp` | TÉLESCOPE |  |
| 🔴 | `1f534.webp` |  |  |
| 🕸️ | `1f578.webp` | TOILE D\ |  |
| 🖼️ | `1f5bc.webp` | TABLEAU |  |
| 🗼 | `1f5fc.webp` | TOUR |  |
| 🚗 | `1f697.webp` | VOITURE | CAR |
| 🚪 | `1f6aa.webp` | PORTE |  |
| 🛏️ | `1f6cf.webp` | LIT |  |
| 🛡️ | `1f6e1.webp` | BOUCLIER | SHIELD |
| 🥁 | `1f941.webp` | TAMBOUR |  |
| 🥕 | `1f955.webp` | CAROTTE |  |
| 🥚 | `1f95a.webp` | ŒUF |  |
| 🥛 | `1f95b.webp` | LAIT |  |
| 🦀 | `1f980.webp` | CRABE |  |
| 🦁 | `1f981.webp` |  |  |
| 🦂 | `1f982.webp` | SCORPION |  |
| 🦅 | `1f985.webp` | AIGLE |  |
| 🦆 | `1f986.webp` | CANARD |  |
| 🦉 | `1f989.webp` | HIBOU |  |
| 🦋 | `1f98b.webp` | PAPILLON | BUTTERFLY |
| 🦌 | `1f98c.webp` | CERF |  |
| 🦎 | `1f98e.webp` | LÉZARD |  |
| 🦒 | `1f992.webp` | GIRAFE | GIRAFFE |
| 🦔 | `1f994.webp` | HÉRISSON | HEDGEHOG |
| 🦚 | `1f99a.webp` | PAON |  |
| 🦜 | `1f99c.webp` | PERROQUET |  |
| 🦢 | `1f9a2.webp` | CYGNE |  |
| 🦥 | `1f9a5.webp` | PARESSEUX |  |
| 🦦 | `1f9a6.webp` | LOUTRE | OTTER |
| 🦨 | `1f9a8.webp` | MOUFETTE |  |
| 🦩 | `1f9a9.webp` | FLAMANT |  |
| 🦫 | `1f9ab.webp` | CASTOR |  |
| 🧀 | `1f9c0.webp` | FROMAGE |  |
| 🧩 | `1f9e9.webp` | PUZZLE |  |
| 🧪 | `1f9ea.webp` | ÉPROUVETTE |  |
| 🧭 | `1f9ed.webp` | BOUSSOLE | COMPASS |
| 🧯 | `1f9ef.webp` | EXTINCTEUR |  |
| 🧲 | `1f9f2.webp` | AIMANT |  |
| 🪑 | `1fa91.webp` | CHAISE |  |
| 🪕 | `1fa95.webp` | BANJO | BANJO |
| 🪚 | `1fa9a.webp` | SCIE |  |
| 🪛 | `1fa9b.webp` | TOURNEVIS |  |
| 🪡 | `1faa1.webp` | AIGUILLE |  |
| 🪤 | `1faa4.webp` | PIÈGE |  |
| 🫏 | `1facf.webp` |  |  |
| 🫒 | `1fad2.webp` |  |  |
| ⌚ | `231a.webp` | MONTRE | WATCH |
| ☀️ | `2600.webp` | SOLEIL | SUN |
| ☁️ | `2601.webp` | NUAGE |  |
| ⚓ | `2693.webp` | ANCRE | ANCHOR |
| ⚔️ | `2694.webp` | ÉPÉE |  |
| ⚖️ | `2696.webp` | BALANCE |  |
| ⚙️ | `2699.webp` | ENGRENAGE |  |
| ⚪ | `26aa.webp` |  |  |
| ⛰️ | `26f0.webp` | MONTAGNE |  |
| ⛱️ | `26f1.webp` | PARASOL |  |
| ⛲ | `26f2.webp` | FONTAINE |  |
| ⛵ | `26f5.webp` | VOILIER | SAILBOAT |
| ❄️ | `2744.webp` | NEIGE |  |
| ⭐ | `2b50.webp` | ÉTOILE |  |
<!-- TABLE-IMAGES:FIN -->
