# Voix cloud — guide pas à pas (v6.150)

Tout est prêt côté code. Il reste 4 étapes de votre côté — aucune ne
demande de compétence technique particulière, ~15-20 minutes au total.

## 1. Créer un projet Google Cloud

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet (ou utilisez-en un existant)
3. **Activez la facturation** sur ce projet (obligatoire pour utiliser l'API,
   même si le coût réel sera très faible — voir plus bas)

## 2. Activer l'API Text-to-Speech

1. Dans le menu, allez sur **APIs & Services → Bibliothèque**
2. Cherchez « Cloud Text-to-Speech API »
3. Cliquez **Activer**

## 3. Créer une clé API

1. **APIs & Services → Identifiants → Créer des identifiants → Clé API**
2. Copiez la clé générée
3. **Recommandé** : cliquez sur la clé pour la restreindre à l'API
   Text-to-Speech uniquement (évite qu'elle serve à autre chose si
   elle fuite un jour)

## 4. Lancer la génération

Depuis un terminal, à la racine du projet :

```bash
GOOGLE_TTS_API_KEY=votre_clé_ici node scripts/generate-voice-audio.js
```

Le script :
- découvre automatiquement la meilleure voix disponible pour chacune
  des 10 langues complètes (jamais un nom de voix deviné à l'avance)
- génère un fichier audio par texte unique (~1 366 fichiers,
  ~48 000 caractères au total)
- **est rejouable sans risque** : si vous le relancez plus tard après
  un ajout de contenu, il ne régénère que les nouveaux fichiers, pas
  ceux qui existent déjà

À la fin, un dossier `audio/` apparaît avec un sous-dossier par
langue (`audio/fr/`, `audio/en/`, etc.). Ces fichiers doivent être
**déployés avec le reste du site** (même dépôt GitHub Pages) pour que
l'app les trouve.

## ⚠️ Une fois ce dossier généré, ne l'écrasez plus jamais par erreur

Signalé par l'utilisateur (v6.162) : si votre habitude est de tout
supprimer puis remettre un zip complet à chaque mise à jour, **ce
dossier `audio/` ne doit jamais faire partie de ce qui est
supprimé** — aucun zip livré ne le contient (il n'existe que sur
votre dépôt, généré par vous seul avec votre clé Google). Voir
`HEBERGEMENT.md` pour la méthode de mise à jour sûre.

## Coût réel

Avec le volume actuel (~48 000 caractères), en voix Neural2 : **moins
d'1 €, une seule fois**. Ce n'est pas un abonnement — une fois les
fichiers générés, ils sont servis comme n'importe quel fichier
statique du site, sans coût récurrent. Vous pouvez suivre la
consommation réelle dans Google Cloud Console → Facturation.

## Si vous ajoutez du contenu plus tard

Deux commandes à relancer dans l'ordre :

```bash
node scripts/extract-voice-content.js          # met à jour la liste des textes
GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js  # génère seulement les nouveaux
```

## Ce qui reste volontairement en voix navigateur

- Le texte de bilan que le patient/aidant téléverse à l'inscription
  (dynamique par nature, différent pour chaque personne)
- Les langues partielles (darija algérienne/marocaine/tunisienne,
  kabyle) — pas prévu dans cette phase
- Tout texte pas encore généré (filet de sécurité automatique, pas de
  configuration nécessaire)

## Vérifier que ça marche

Une fois les fichiers déployés, ouvrez l'app, cliquez sur un bouton
« Écouter » — si le son est nettement plus naturel qu'avant, c'est
que la voix cloud a bien pris le relais. En cas de doute, l'outil de
développement du navigateur (onglet Réseau) montre si un fichier
`audio/...mp3` a été chargé.
