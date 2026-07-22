# 🚀 Déploiement

Trois choses se déploient séparément : **le site**, **la base (SQL)**,
et **la fonction IA**. Les voix se génèrent à part (§4).

## 1. Le site (à chaque version)

1. Vérifier que la suite de tests est verte : `npm test` (0 échec).
2. Vérifier le bump de `CACHE_NAME` dans `sw.js` (ligne 30).
3. Téléverser le zip de version chez l'hébergeur (voir `HEBERGEMENT.md`).
4. ⚠️ **NE JAMAIS écraser le dossier `audio/`** en ligne : il contient
   les voix générées, qui ne sont PAS toutes dans le zip. Déposer le
   contenu du zip SANS supprimer `audio/`.
5. Contrôle : Ctrl+F5 sur le site → la version du service worker
   (console → Application → Service Workers) doit afficher le nouveau
   `CACHE_NAME`.

## 2. La fonction IA `ia-assist` (quand `js/ia-edge-function.md` change)

Pas-à-pas **éprouvé en conditions réelles** (Codespace GitHub, juillet
2026) — chaque piège ci-dessous a vraiment été rencontré.

1. Ouvrir le Codespace du dépôt → terminal.
2. `npx supabase login` → suivre le lien, coller le code de
   vérification. *(La session expire vite : refaire un login si
   « Access token not provided ».)*
3. `npx supabase link --project-ref <REF>` — le REF est la suite de
   **20 lettres minuscules** dans l'URL du dashboard
   (`supabase.com/dashboard/project/REF`). ⚠️ Pièges vécus : une
   majuscule le rend invalide ; l'**ORG ID** (Settings → Organization)
   n'est PAS le project ref (→ « Not Found »). En cas de doute :
   `npx supabase projects list` affiche le bon REFERENCE ID.
4. `npx supabase functions new ia-assist` (première fois uniquement).
   L'extension Deno proposée par VS Code est INUTILE au déploiement ;
   les centaines de « problèmes » affichés sans elle sont du bruit.
5. Mettre le code en place — **méthode fiable : le fichier, pas le
   presse-papiers.** Extraire le bloc ```ts de `js/ia-edge-function.md`
   vers `supabase/functions/ia-assist/index.ts`. ⚠️ Pièges vécus : le
   copier-coller depuis une visionneuse peut corrompre les accents
   graves (→ `Expected ';' at …` au bundling) ; un glisser-déposer
   peut nommer le fichier `index(1).ts` (→ « entrypoint path does not
   exist ») ; un dossier créé par le CLI peut appartenir à `root`
   (→ `sudo mkdir -p …` puis réessayer). Commande d'extraction sans
   souris, avec garde-fou :
   `node -e 'const fs=require("fs");const m=fs.readFileSync("js/ia-edge-function.md","utf8").match(/\`\`\`ts\n([\s\S]*?)\n\`\`\`/);fs.writeFileSync("supabase/functions/ia-assist/index.ts",m[1]);'`
6. `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-…` (clé créée sur
   console.anthropic.com ; crédits prépayés SANS rechargement
   automatique — impossible de dépasser le budget).
7. `npx supabase functions deploy ia-assist` → succès =
   « Deployed Functions on project <ref>: ia-assist ».
8. Logs en cas de souci : dashboard → Edge Functions → ia-assist → Logs.

## 3. La base (quand `sql/schema.sql` change)

Dashboard Supabase → **SQL Editor** → New query → coller **tout**
`sql/schema.sql` → Run. Le schéma est **rejouable sans danger**
(`if not exists` / `create or replace` partout) ; les avertissements
« already exists » sont normaux.

## 4. Les voix (quand du contenu PARLÉ change)

Un changement d'emoji seul est *voice-safe* (les voix sont par mot).
Sinon, dans le Codespace, **dans cet ordre** :
1. `node scripts/extract-voice-content.js`
2. le script de génération avec la clé TTS (voir
   `scripts/SETUP-VOIX-CLOUD.md`)
3. téléverser les nouveaux fichiers dans `audio/` chez l'hébergeur
   (sans rien supprimer).

## 5. Check-list de sortie de version

- [ ] `npm test` → 0 échec
- [ ] `CACHE_NAME` incrémenté
- [ ] Entrée `## v6.X` dans `README.md`
- [ ] `docs/INDEX.md` : ligne « Version documentée » mise à jour
      (le test `documentation.test.js` l'exige)
- [ ] Contenu parlé modifié ? → §4 voix
- [ ] `sql/schema.sql` modifié ? → §3
- [ ] `js/ia-edge-function.md` modifié ? → §2
- [ ] Zip : exclut `node_modules/`, `.git/`, `reparole-deploy-*.zip` ;
      contient les 2 `audio/(dz|kab)/README.md`
