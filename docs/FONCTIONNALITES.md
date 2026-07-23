# ✨ Fonctionnalités

## Les 14 langues

10 complètes : `fr`, `en`, `es`, `it`, `pt`, `de`, `ar`, `tr`, `pl`,
`ja` — et 4 à contenu partiel mais réel : `kab` (kabyle — JAMAIS
inventé, uniquement du contenu vérifié), `dz`, `ma`, `tn` (darijas).
Tout est gratuit dans toutes les langues ; les exercices vocaux
avancés relèvent du Pro. Les langues arabes s'affichent en RTL
(y compris les mots croisés, colonnes inversées à l'affichage).

## L'espace patient (`index.html`)

- **Carte ☀️ Aujourd'hui** (v6.191) : UNE action principale — le bouton
  « ▶ Continuer » lance l'exercice recommandé par le moteur adaptatif.
- **Ami**, le compagnon scripté : consignes par exercice,
  encouragements, célébrations. **Mémoire scriptée** (v6.191) : Ami
  mentionne des faits réels (retour après absence, série en cours, mot
  qui résiste après 3 erreurs et plus). **Niveaux d'accompagnement** :
  Présent / Discret (ne garde que l'important) / Silencieux (se tait
  vraiment). Ligne éthique verrouillée par test : Ami ne prétend
  JAMAIS éprouver d'émotion.
- **Personnalisation progressive** (v6.191) : l'app propose au bon
  moment (mode sombre le soir, Ami discret après 15 séances) — une
  proposition par session maximum, refus mémorisé, jamais imposé.
- **Accessibilité** : lecture facilitée (dys), police adaptée, boutons
  agrandis, mode sombre, usage à une main, sons de réponse,
  échauffement, séance courte (3 questions), choix de la voix.
- **Journal** : espace libre, jamais analysé ; dates relatives et
  invitation douce si la dernière note a plus de 2 jours (v6.188).
- **Photos personnelles** : exercices sur les propres photos du patient.
- **Mots à revoir** : favoris ⭐ + mots fréquemment en erreur.
- **Espace aidant** : code d'accès replié par défaut (v6.188),
  régénérable, révocable.
- **Résumé imprimable**, rappels par email (opt-in), export/restauration
  des données, suppression de compte.

## Les 21 exercices (tuiles `data-type`)

| Type | Nom | Famille |
|---|---|---|
| `denomination` | Nommer les images | Lexique |
| `denomination_orale` | Nommer à voix haute 🎙️ | Lexique / voix |
| `comprehension` | Comprendre la consigne | Compréhension |
| `completion` | Compléter la phrase | Syntaxe/lexique |
| `syntax` | Structure de phrase | Syntaxe |
| `association` | Associer les images | Sémantique |
| `rhyme` | Rimes | Phonologie |
| `story` | Lire et comprendre | Compréhension écrite |
| `repetition` | Répéter à voix haute 🎙️ | Voix |
| `intonation` | Répéter avec intonation 🎙️ | Voix / prosodie |
| `fluence` | Fluence verbale 🎙️ | Voix / évocation |
| `photos_perso` | Nommer vos photos 🎙️ | Lexique personnel |
| `heure` | Lire l'heure | Acalculie |
| `monnaie` | Compter la monnaie | Acalculie |
| `prix` | Estimer un prix | Acalculie |
| `calcul_quotidien` | Calcul du quotidien | Acalculie |
| `comparaison_nombres` | Comparer les nombres | Acalculie |
| `anagramme` | Le mot en morceaux 🧩 | Jeu |
| `verif` | Ça va ensemble ? 🎯 | Jeu |
| `croises` | La grille en images 🔡 | Jeu (mots croisés illustrés, indice = image) |
| `memoire_liste` | La liste à retenir 🧠 | Jeu (mémoire de travail — chantier issu de la veille IA) |

Tous nourrissent le moteur adaptatif (`answer_feedback` → `AI.record`).
Les jeux sont **gratuits** et sans chronomètre ; les mots croisés
priorisent les **mots ciblés** par l'ortho/l'aidant.

## La quête-découverte (v6.187)

Les tuiles de JEU (jamais les exercices thérapeutiques) se révèlent
progressivement : 1 séance → anagramme, 2 → verif, 3 → croisés.
Célébration, jamais barrière — trois soupapes : lien « voir tous les
jeux », interrupteur de l'ortho par patient (`games_all_unlocked`),
et les patients existants (3+ séances) voient tout d'office.

## L'espace orthophoniste (`dashboard-ortho.html`) — Pro

- Liste des patients (tri par inactivité), **☀️ Vue cabinet (IA)**,
  **🔭 Veille scientifique (IA + web)**.
- Fiche patient organisée en **5 volets navigables** (v6.197) :
  📊 Vue d'ensemble (chiffres clés + temps de rééducation mesuré/estimé
  + fréquence hebdomadaire), 📈 Évolution des capacités (barres de
  réussite par domaine), 🗓️ Événements (pauses, records, premières
  fois — calculés localement), 📔 Journal d'Ami (résumés qualitatifs
  scriptés par séance, factuels), 💡 Recommandations (règles simples et
  transparentes, PAS d'IA — l'ortho reste seul juge).
- Fiche patient : **récit 📖** (2-4 phrases générées localement, v6.191),
  niveaux par type, chiffres clés, historique, analyse d'erreurs,
  profil clinique déclaratif, notes cliniques (+ ✨ Reformuler),
  rapport (+ ✨ Brouillon, 🗒️ Préparation, 📈 Récit d'évolution 7/30/90 j),
  **mots ciblés**, **exercices sur mesure (IA)** validés un par un,
  **boucle vocale** (verdicts humains sur les enregistrements),
  interrupteur 🎁 des jeux.

## L'espace aidant (`aidant.html`)

Lecture seule (progrès, encouragements à transmettre), proposition de
mots du quotidien, conseil pratique du jour. Aucun droit d'écriture
sur le dossier.

## L'espace admin (`admin.html`)

Sécurité du compte (MFA), boîte à suggestions (+ ✨ tri IA), erreurs
techniques (+ ✨ résumé IA, 🔭 veille), tendances agrégées anonymes,
historique des connexions (+ purge 30 jours).
