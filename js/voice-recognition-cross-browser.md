# Reconnaissance vocale sur tous les navigateurs — ce qui est possible, et ce qui ne l'est pas

## Ce qui limite l'app aujourd'hui

Les exercices vocaux (répétition, nommer à voix haute, fluence, intonation)
utilisent l'API navigateur `SpeechRecognition` — gratuite, instantanée, sans
serveur. Mais **ce n'est pas une limite de ReParole : c'est une limite du
navigateur lui-même** :

| Navigateur | Reconnaissance vocale native |
|---|---|
| Chrome, Edge, Opera (Chromium) | ✅ Oui |
| Safari (macOS/iOS récents) | ✅ Oui |
| **Firefox** | ❌ **Jamais implémentée**, à ce jour |

Il n'existe **aucun code JavaScript possible** pour faire fonctionner cette
API dans Firefox : elle n'existe tout simplement pas dans ce navigateur. Ce
n'est pas un bug à corriger, c'est une case à cocher que Mozilla n'a jamais
cochée.

## Ce qui est déjà fait (v6.142)

- Le micro est maintenant grisé et non cliquable si le navigateur ne
  supporte pas la reconnaissance vocale, plutôt que de rester cliquable
  sans rien faire (ce qui pouvait ressembler à un bug).
- Le message d'avertissement est plus clair : il précise que Firefox est
  concerné spécifiquement, que ce n'est pas un bug de l'app, et propose
  Chrome/Edge/Safari comme alternatives.
- **Le parcours reste entièrement utilisable sans micro** : chaque exercice
  vocal a un bouton de validation manuelle ("J'ai dit correctement" /
  "Je n'ai pas essayé" / "Terminer cette catégorie"). Ça marche déjà dans
  tous les navigateurs, y compris Firefox — juste sans la reconnaissance
  automatique.

## La seule vraie solution pour Firefox : un service tiers payant

Pour que la reconnaissance vocale marche vraiment partout, y compris
Firefox, il faut sortir du navigateur : enregistrer l'audio (l'API
`MediaRecorder`, elle, fonctionne dans tous les navigateurs modernes) puis
l'envoyer à un service de transcription externe. Concrètement :

1. **Un compte chez un service de speech-to-text** — par exemple Google
   Cloud Speech-to-Text, Azure Speech, ou une API Whisper hébergée. Chacun
   demande une clé API et facture à l'usage.
2. **Une Supabase Edge Function** qui reçoit l'audio enregistré côté
   patient et appelle ce service avec la clé API (jamais exposée côté
   client).
3. **Un changement côté app** : remplacer `SpeechRecognition` par un
   enregistrement `MediaRecorder` + un envoi à cette fonction, pour les
   navigateurs qui n'ont pas l'API native.

Même limite que pour les rappels par email (`js/reminders-edge-function.md`) :
je ne peux pas créer ou détenir de clé API à votre place. Si vous voulez
qu'on avance là-dessus, dites-moi et je prépare le code de l'Edge Function
et le changement côté app — il vous restera juste à créer le compte chez
le service choisi et à configurer la clé.
