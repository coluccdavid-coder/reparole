# Kabyle — glossaire de cohérence (relecture native, v6.113+)

Fourni par le même contact kabylophone que `Kabyle_Complet.xlsx` et
`docs/kabyle-symptoms-request.md`, en plus des traductions déjà
intégrées. À consulter avant d'ajouter de nouvelles clés en kabyle,
pour rester cohérent avec ce qui existe déjà.

## ⚠️ Points à trancher (non résolus, v6.115)

3 mots proposés entrent en conflit avec du vocabulaire déjà présent
et sourcé séparément ailleurs dans l'app. Rien n'a été changé tant que
ce n'est pas confirmé :

| Mot français | Déjà dans l'app | Proposé par la relecture | Statut |
|---|---|---|---|
| Cheval | Agmar (`exercises-kab.js`, sourcé Glosbe + article académique) | Aɣyul | **Conflit** : Aɣyul désigne déjà l'âne 🫏 ailleurs dans l'app (sourcé Glosbe + kabyle.com/polyglotclub, audio natif) |
| Vélo | Avilu (`exercises-kab.js` + `assessment.js`, sourcé Wiktionnaire+Glosbe) | Tafradit | Peut-être 2 synonymes valides — à confirmer lequel garder |
| Voiture | Takeṛṛust (utilisé comme réponse d'exercice, pas juste distracteur) | Ttamubil | Peut-être 2 synonymes valides — à confirmer lequel garder |

*(Différence sur "pluie" — Ageffur vs Aɣffur — probablement une simple
variante orthographique du même mot, pas un vrai conflit.)*

## Vocabulaire général

| Français | Kabyle |
|---|---|
| Bilan | Anezgum |
| Compte-rendu | Anezgum *ou* Asmel n ugmuḍ (selon contexte) |
| Fichier | Afaylu |
| Appareil | Ibenk |
| Étape | Amecwar |
| Choisir | Fren |
| Cliquer | Sit (ou *Ssed* pour éviter l'emprunt) |
| Effacer | Sfesx |
| Enregistrer | Sekles |
| Envoyer | Azen |

## Boutons génériques

| Français | Kabyle |
|---|---|
| Bienvenue | Ansuf |
| Commencer | Bdu |
| Continuer | Kemmel |
| Retour | Uɣal |
| Annuler | Sefsex |
| Valider | Sentem |
| Suivant | Uḍfir |
| Précédent | Uzwir |

*(Retour, Annuler, Valider, Suivant ont déjà été rattachés aux clés
existantes — `back_btn`, `phonation_cancel`, `ortho_validate_btn`,
`memory_next_btn`, `js/i18n.js`. Continuer/Précédent n'ont pas encore
de clé correspondante dans l'app — à utiliser si un futur écran en a
besoin.)*

## Échelle de fréquence — à utiliser partout, toujours les mêmes mots

| Français | Kabyle |
|---|---|
| Souvent | Aṭas n tikkal |
| Parfois | Tikwal |
| Rarement | Drus |

## Remarques générales de la relecture

- Pour un public aphasique : préférer des phrases **courtes**,
  **faciles à lire**, **faciles à comprendre**, et des tournures
  **naturelles à l'oral** plutôt que des traductions littérales.
- Pour les boutons d'action : préférer des verbes courts et directs
  ("Bduɣ" = *je commence*) plutôt que des états ("Heggaɣ" = *je suis
  prêt*) — plus dynamique sur un bouton.
- Si un titre d'écran correspond au nom de l'application (ReParole),
  garder "ReParole" tel quel plutôt que le traduire — pratique
  standard pour les applications (WhatsApp, Signal, Duolingo...).
- Le contact a proposé son aide pour harmoniser tout le vocabulaire de
  l'app à l'avenir — à solliciter si un nouveau gros lot de traduction
  est envisagé.

## Non encore rattaché à du contenu existant

Les 6 liens légaux du pied de page (`js/footer.js`) sont **codés en
dur en français pour toutes les langues de l'app** — pas seulement le
kabyle, un vrai trou pour toutes les langues. Traductions kabyles
reçues, prêtes si ce chantier est fait un jour :

| Français | Kabyle |
|---|---|
| Mentions légales | Tilisa n uselḍan |
| Confidentialité | Tabaḍnit |
| Politique cookies | Tasertit n yinagan (cookies) |
| Gestion des cookies | Asefrek n yinagan (cookies) |
| CGV | Tiwtilin timatutin n uznuzu |
| CGU | Tiwtilin timatutin n useqdec |
