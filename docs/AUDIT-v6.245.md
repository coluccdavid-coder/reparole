# 🔍 Audit complet — juillet 2026 (base v6.244, corrections v6.245)

> Audit mené sur la totalité du dépôt : 16 pages HTML, 45 fichiers JS,
> 3 fichiers SQL, 3 feuilles de style, 97 fichiers de tests.
> Méthode : mesures et vérifications automatisées, pas d'impression.
> Ce qui n'a pas pu être vérifié est signalé comme tel.

---

## 1. Verdict

Le projet est **en bien meilleur état que la moyenne de ce qu'on voit**, sur
les deux points qui coûtent le plus cher à rattraper plus tard : la sécurité
de la base et la complétude des traductions. Les défauts trouvés sont réels
mais concentrés, et un seul est structurant : **le poids de l'application
patient**.

Aucun problème de sécurité n'a été trouvé. Aucun code mort. Aucune donnée
inventée dans les interfaces.

---

## 2. Ce qui va (avec les chiffres)

### Traductions — 708 clés × 14 langues, zéro manquante

Vérifié en chargeant `js/i18n.js` et en comparant chaque bloc au français :
**0 clé manquante dans les 14 langues**, kabyle et darijas comprises. C'est
le point le plus difficile du projet, et il est tenu.

Les 10 chaînes identiques au français ont été inspectées une par une : toutes
légitimes — `label_honey`/« Miel » est de l'espagnol, `label_paper`/« Papier »
de l'allemand, `ortho_score_col`/« Score » et `ortho_date_col`/« Date » de
l'anglais, le reste étant des noms propres (ReParole, ReParole Pro) ou des
mots internationaux (Normal, Stop). **Aucun oubli de traduction.**

### Sécurité de la base — modèle solide

- **21 tables, 21 avec RLS activée.** Aucune table nue.
- **7 tables sensibles** (`journal_entries`, `voice_recordings`,
  `favorite_words`, `patient_connections`, `caregiver_words`,
  `custom_exercises`, `ia_usage`) ont RLS **sans aucune policy** : elles sont
  donc inaccessibles en direct depuis le navigateur. Tout passe par des
  fonctions RPC. C'est un choix d'architecture, et c'est le bon.
- **Les 57 fonctions `security definer` fixent toutes leur `search_path`.**
  C'est le vecteur classique d'élévation de privilèges sur PostgreSQL, celui
  que l'analyseur de Supabase signale en priorité. Aucune exception trouvée.
- La clé Supabase exposée dans `js/storage.js` est bien la clé **anon**
  (`role: anon`, expiration 2036) — publique par conception, protégée par RLS.
  Aucune clé `service_role`, aucune clé Google TTS, aucune clé Anthropic dans
  le dépôt.

### Hygiène du code

| Contrôle | Résultat |
|---|---|
| Fichiers JS jamais chargés par une page | 0 |
| `TODO` / `FIXME` / `HACK` restants | 0 |
| `console.log` en production | 0 (66 `console.warn`, tous sur des chemins d'erreur) |
| Fichiers listés dans `sw.js` mais absents du disque | 0 |
| Fichiers de test non lancés par `npm test` | 0 (verrou posé en v6.244) |
| Tests | **963, 0 échec**, relancés par la CI à chaque push |

### Accessibilité — les fondamentaux sont là

`prefers-reduced-motion` (11 règles), styles de focus visibles, cibles
tactiles à 44/48 px, **toutes les images ont un `alt`**, aucun bouton-icône
sans `aria-label`. Pour une application destinée à des personnes après un AVC,
ce n'est pas un détail, et c'est fait.

---

## 3. Ce qui ne va pas

### 🔴 Gravité 1 — L'application patient pèse 2,5 Mo

C'est le seul défaut structurant de l'audit.

| Page | Poids brut | Après compression | Fichiers |
|---|---|---|---|
| `index.html` (patient) | **2 531 Ko** | 586 Ko | 42 |
| `dashboard-ortho.html` | 1 034 Ko | — | 14 |
| `aidant.html` | 921 Ko | — | 13 |
| `accueil.html` | 24 Ko | — | 1 |

Deux fichiers font 60 % du total :

- `js/i18n.js` — 735 Ko (234 Ko compressés). Il contient **les 14 langues**,
  alors qu'un patient n'en utilise qu'**une**. Environ 93 % du fichier est
  téléchargé, analysé et gardé en mémoire pour rien.
- `js/exercises-acalculie-i18n.js` — 753 Ko, mais **41 Ko compressés** : un
  rapport de 18 pour 1, qui signale une répétition massive de structures.

La compression atténue le transfert, mais **pas le temps d'analyse** : un
téléphone d'entrée de gamme doit parser 2,5 Mo de JavaScript avant le premier
exercice. Le public visé — personnes âgées, après un AVC, souvent sur du
matériel modeste et des connexions moyennes — est exactement celui qui le
supporte le moins bien.

**Non corrigé volontairement.** Le remède (découper `i18n.js` par langue et
ne charger que la langue active) touche le fichier le plus verrouillé du
projet, celui que protègent les tests de complétude. Ça mérite sa propre
version, avec le temps de tout revérifier — pas d'être glissé dans un lot de
corrections. C'est le chantier technique n°1.

### 🟠 Gravité 2 — L'arabe s'affichait de travers · **corrigé**

`dir="rtl"` était bien posé sur `<html>` pour l'arabe et les trois darijas
(`js/i18n.js`), mais **aucune** des trois feuilles de style ne contenait de
règle RTL : 24 propriétés physiques (`text-align:left`, `margin-left`,
`padding-right`) figeaient la mise en page en sens gauche-à-droite. Dans une
page arabe, un paragraphe aligné à gauche paraît cassé.

Les 24 occurrences ont été remplacées par leurs équivalents logiques
(`start`, `margin-inline-start`, `padding-inline-end`), y compris dans
`js/app.js`, `js/assessment.js`, `js/phonation.js` et `dashboard-ortho.html`.
Comportement **strictement identique** dans les 10 langues gauche-à-droite.

### 🟠 Gravité 2 — Quatre pages ne sont pas traduites du tout

| Page | Clés i18n | Conséquence |
|---|---|---|
| `accueil.html` | **0** | La porte d'entrée publique d'une application en 14 langues est en français seul |
| `mon-resume.html` | **0** | Le résumé **du patient** — celui qu'il est censé lire |
| `reset-password.html` | **0** | Réinitialisation de mot de passe, écran patient |
| `report.html` | **0** | Bilan, écran orthophoniste |

Coût mesuré : 68 chaînes distinctes pour `accueil.html`, 21 pour
`mon-resume.html`, 15 pour `reset-password.html`, 25 pour `report.html` —
soit **129 chaînes, donc 1 806 valeurs** à produire pour les 14 langues.

**Non corrigé** : la règle du projet interdit d'inventer une traduction, et
le kabyle ne s'improvise pas. C'est un chantier de traduction avant d'être un
chantier de code. `mon-resume.html` devrait passer en premier : c'est la seule
des quatre qu'un patient non francophone est censé lire seul.

### 🟡 Gravité 3 — L'identité visuelle n'avait pas suivi la refonte · **corrigé**

`manifest.json` portait encore la palette d'avant v6.206 : fond beige
`#efead9`, vert `#2F6B57`. Un patient qui installe l'application voyait donc
un écran de démarrage aux couleurs d'une version qui n'existe plus. Idem pour
la barre système : les 10 pages qui déclaraient `theme-color` pointaient
l'ancien vert, et **6 pages sur 16 n'en déclaraient aucune**.

Corrigé : manifeste aligné sur `--bg` et `--accent-dark` lus dans
`css/style.css`, `theme-color` uniformisée sur les 16 pages. Un test compare
désormais le manifeste aux variables CSS — la dérive ne peut plus repasser.

### 🟡 Gravité 3 — Détails corrigés au passage

- `icons/icon-512-maskable.png` était déclarée dans le manifeste mais absente
  du cache hors-ligne. Ajoutée à `APP_SHELL`, avec un test qui vérifie que
  **toutes** les icônes du manifeste y sont.
- `accueil.html` n'avait aucune balise Open Graph : un lien vers reparole.fr
  envoyé par mail s'affichait en URL nue. Gênant au moment précis où des
  prises de contact sont en cours (FNO, France AVC). Corrigé.

### 🟡 Gravité 3 — La bannière de mise à jour · **non corrigé**

Elle est en français en dur (« 🔄 Nouvelle version disponible »,
« Actualiser », « Fermer ») **et dupliquée** en deux endroits :
`index.html` (script en ligne) et `js/sw-update.js`. Deux défauts en un :
un patient japonais ou arabophone la lit en français, et une correction
apportée à un seul des deux exemplaires laissera l'autre en arrière.

Bloqué par les traductions (aucune clé i18n existante ne convient). La
déduplication, elle, est faisable dès maintenant : elle mérite d'être faite
**en même temps** que la traduction, pas avant, pour ne pas toucher deux fois
au même code.

### ⚪ Gravité 4 — Dette de forme

- **Le journal `README.md` s'arrête à v6.201.** Les entrées v6.202 → v6.243
  manquent, alors que la check-list de sortie les exige. Aucun test ne le
  vérifie — c'est le prochain verrou à poser, sur le modèle de celui qui
  protège déjà `docs/INDEX.md`.
- `escapeHTML()` est redéfinie à l'identique dans 4 fichiers
  (`app.js`, `admin.js`, `caregiver.js`, `dashboard-ortho.js`), plus deux
  variantes locales `esc()` dans `dashboard-ortho.js`. Sans danger
  aujourd'hui, mais quatre endroits où corriger si la fonction s'avérait
  incomplète un jour.
- Aucun lien d'évitement (« aller au contenu ») sur les 16 pages. Faible
  priorité pour ce public, réel pour la navigation au clavier.

---

## 4. Ce qui n'a pas pu être vérifié

Par honnêteté, ces points restent ouverts :

- **Le rendu réel en arabe** : les propriétés logiques sont correctes en
  théorie et testées mécaniquement, mais personne n'a ouvert l'application en
  arabe sur un vrai écran. À faire avant de considérer le sujet clos.
- **Les voix en production** : le correctif de cache v6.244 est vérifié dans
  le code, pas dans un navigateur. Ouvrir reparole.fr, onglet Réseau,
  prononcer un mot, confirmer un `.mp3` en 200.
- **Le contenu des dossiers `audio/en`, `es`, `tr`, `pl`, `kab`** : l'API
  GitHub a coupé le comptage (limite anonyme). Les 6 autres langues sont
  confirmées.
- **La qualité clinique du contenu** : hors de portée d'un audit technique.
  Elle demande un·e orthophoniste, et reste le garde-fou n°1 du projet.

---

## 5. Priorités qui en découlent

1. **Alléger l'application patient** — découper `i18n.js` par langue.
   Le seul chantier technique structurant. Gain attendu : environ 200 Ko
   compressés et 700 Ko d'analyse en moins sur un téléphone.
2. **Faire traduire 129 chaînes** pour les 4 pages orphelines, en commençant
   par `mon-resume.html`.
3. **Vérifier l'arabe et les voix dans un vrai navigateur** — deux
   vérifications de dix minutes qui ferment deux sujets.
4. **Poser le verrou sur le journal `README.md`**, puis combler ce qui peut
   l'être de v6.202 → v6.243.
5. Traduire et dédupliquer la bannière de mise à jour.

Rien de tout cela n'est bloquant pour la bêta. Les vrais bloquants restent
ceux déjà connus, et ils ne sont pas techniques : **hébergement certifié
HDS**, cadre RGPD signé, et relecture clinique par un·e orthophoniste.
