# Brouillon — "Compléter la phrase" en kabyle

⚠️ **Pas encore intégré dans l'application.** Ces phrases sont tirées
telles quelles de corpus réels (Glosbe, exemples de traduction attestés),
pas inventées — donc plus fiables qu'une construction libre — mais elles
n'ont pas été relues par une personne kabylophone. Une fois validées
(ou corrigées), elles peuvent être ajoutées à `js/exercises-kab.js` dans
`BANK_KAB.completion`, avec la même structure que `js/exercises.js`.

**Mise à jour v6.7** — les phrases 1 et 2 ont été re-vérifiées directement
sur la page Glosbe correspondante (pas juste retrouvées via une recherche
générale) : la phrase complète, mot pour mot, y est citée comme exemple
attesté. Ça n'égale pas une relecture native, mais ça confirme qu'aucune
erreur de recopie ne s'est glissée depuis la version précédente de ce
brouillon. Le distracteur non vérifié de la phrase 4 a été remplacé (voir
plus bas) — il ne reste donc plus aucun mot "non vérifié" dans ce
brouillon, seulement l'absence de relecture native sur la grammaire des
phrases (accords), ce qui reste la seule chose bloquante avant intégration.

## Pourquoi ce n'est pas encore dans l'app

Contrairement aux mots isolés ("Nommer les images"), une phrase à trous
doit rester grammaticalement correcte une fois le mot retiré — accord du
verbe, article, état d'annexion... Découper une vraie phrase de corpus
en "phrase à trou" peut introduire une erreur que je ne suis pas en
mesure de détecter moi-même avec certitude. Je préfère livrer ce
brouillon plutôt que de deviner.

## Candidats (phrases réelles, source Glosbe)

| Phrase complète (kabyle) | Traduction | Trou proposé | Réponse | Distracteurs (mots déjà vérifiés ailleurs dans l'app) |
|---|---|---|---|---|
| Aql-i tetteɣ tatteffaḥt. | Je suis en train de manger une pomme. | Aql-i tetteɣ ___. | TATTEFFAḤT | TABBURT, AMAN |
| Tsekkreḍ tawwurt? | As-tu fermé la porte ? | Tsekkreḍ ___? | TAWWURT | TAKEṚṚUST, AXXAM |
| Yemmut yislem-nni-inu azeggaɣ. | Mon poisson rouge est mort. | Yemmut ___-nni-inu azeggaɣ. | YISLEM | AQJUN, AMCIC |
| Ḥemmleɣ aṭas tikeṛṛusin. | J'adore les voitures. | Ḥemmleɣ aṭas ___. | TIKEṚṚUSIN | TABBURT, AXXAM *(remplacé en v6.7 — l'ancien distracteur "tiɣerdayin" n'était pas vérifié ; ces deux mots le sont déjà, ailleurs dans l'app)* |

Sources consultées le 5 juillet 2026 pour cette mise à jour : la phrase 1
("Aql-i tetteɣ tatteffaḥt") et la phrase 2 ("Tsekkreḍ tawwurt?") sont
toutes deux citées mot pour mot comme exemples de traduction attestés sur
fr.glosbe.com (pages "manger" et "porte" / "la porte" en kabyle-français).
Les phrases 3 et 4 n'ont pas retrouvé de nouvelle source directe lors de
cette passe — elles gardent leur niveau de confiance précédent (vocabulaire
individuel vérifié, phrase entière non retrouvée telle quelle dans un
corpus).

## Recommandation

Avant d'ajouter ceci à l'app :
1. Faire relire ce tableau par une personne kabylophone (5 minutes de son
   temps suffiraient).
2. Vérifier en particulier les accords (le trou modifie parfois la
   phrase de façon subtile — ex. "yislem" vs "aslem" selon l'état
   d'annexion, déjà visible dans le tableau ci-dessus).
3. Une fois validées, les ajouter dans `js/exercises-kab.js` :

```js
completion:{
  title:'Ečč awal ay ixuṣṣen',  // "Complète le mot manquant" — À VÉRIFIER, non sourcé
  items:{
    1:[
      {text:'Aql-i tetteɣ ___.', answer:'TATTEFFAḤT', choices:['TATTEFFAḤT','TABBURT','AMAN']},
      // ... etc, une fois validé
    ]
  }
}
```

Ce même brouillon peut ensuite inspirer "Comprendre la consigne" (choisir
la bonne réponse à une question), avec la même méthode : partir de
phrases réelles du corpus plutôt que d'en inventer.
