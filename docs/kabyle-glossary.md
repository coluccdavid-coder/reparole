# Kabyle — glossaire de cohérence (relecture native, v6.113-v6.120)

**🎉 Interface complète : 448/448 clés (v6.120).** Fourni par le même
contact kabylophone que `Kabyle_Complet.xlsx`, en plusieurs envois. À
consulter avant toute future modification, pour rester cohérent.

## ✅ Points à trancher — résolus (v6.116)

Décision de l'utilisateur, sur avis explicite du contact kabylophone :
**priorité à la cohérence terminologique plutôt qu'au terme le plus
courant à l'oral**, pour éviter qu'un même mot désigne deux concepts
différents dans un outil de rééducation. Les 3 conflits confirment ce
qui était **déjà dans l'app** — aucun changement de code nécessaire :

| Mot français | Kabyle officiel ReParole | Statut |
|---|---|---|
| Cheval | **Agmar** | Confirmé — Aɣyul écarté (réservé à "âne", déjà utilisé ailleurs) |
| Âne | **Aɣyul** | Confirmé, inchangé |
| Vélo | **Avilu** | Confirmé — Tafradit écarté (moins homogène entre régions) |
| Voiture | **Takeṛṛust** | Confirmé — Ttamubil écarté (emprunt oral, pas le choix retenu) |
| Moto | Tamuturt | Nouveau mot confirmé, pas de conflit (aucun terme kabyle n'existait avant dans l'app) |

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
