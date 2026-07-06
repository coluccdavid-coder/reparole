// =====================================================================
//  FILET DE SÉCURITÉ — CACHE_NAME du service worker (v6.25)
//  ---------------------------------------------------------------------
//  Vrai bug vécu deux fois de suite : le contenu de js/app.js,
//  js/prefs.js et js/storage.js a changé sur plusieurs livraisons
//  (v6.24, v6.25) sans jamais incrémenter CACHE_NAME dans sw.js —
//  malgré l'avertissement en tête de ce fichier. Les navigateurs qui
//  avaient déjà visité l'app ont continué à servir les anciens
//  fichiers en cache : un correctif livré et confirmé par les tests ne
//  changeait rien en pratique pour la personne qui teste sur le vrai
//  site (voir capture : le bug d'i18n du tableau de bord persistait
//  après un correctif pourtant déjà testé et vert).
//
//  Ce test empêche que ça se reproduise une troisième fois : il calcule
//  une empreinte du contenu réel des fichiers de l'app shell (APP_SHELL
//  dans sw.js) et la compare à celle enregistrée la dernière fois que
//  CACHE_NAME a changé (tests/.sw-fingerprint.json, versionné avec le
//  reste du code). Si le contenu a changé mais que CACHE_NAME est resté
//  identique : échec explicite. Si CACHE_NAME a changé : le fichier
//  d'empreinte est mis à jour automatiquement (nouvelle base de
//  référence), le test passe.
//
//  Lancer : node tests/sw-cache-version.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const FINGERPRINT_PATH = path.join(__dirname, '.sw-fingerprint.json');
let ok = true;
function fail(msg){ console.error('  ✘', msg); ok = false; }
function pass(msg){ console.log('  ✔', msg); }

const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

const cacheNameMatch = swSource.match(/const CACHE_NAME = ['"]([^'"]+)['"]/);
if(!cacheNameMatch){
  fail("Impossible de trouver `const CACHE_NAME = '...'` dans sw.js — a-t-il été renommé/restructuré ?");
  process.exit(1);
}
const cacheName = cacheNameMatch[1];

// Extrait la liste APP_SHELL (tableau de chemins entre guillemets simples/doubles).
const shellMatch = swSource.match(/const APP_SHELL = \[([\s\S]*?)\];/);
if(!shellMatch){
  fail("Impossible de trouver `const APP_SHELL = [...]` dans sw.js — a-t-il été renommé/restructuré ?");
  process.exit(1);
}
const files = [...shellMatch[1].matchAll(/['"]([^'"]+)['"]/g)]
  .map(m => m[1])
  .filter(f => f !== './'); // le répertoire racine n'est pas un fichier à hasher

const hash = crypto.createHash('sha256');
let missing = [];
for(const f of files.sort()){ // tri : ordre stable, indépendant de l'ordre dans APP_SHELL
  const abs = path.join(ROOT, f.replace(/^\.\//, ''));
  try{
    hash.update(f + ':');
    hash.update(fs.readFileSync(abs));
  }catch(e){
    missing.push(f); // déjà signalé par tests/pwa-check.test.js, pas la peine de dupliquer l'échec ici
  }
}
const contentHash = hash.digest('hex');

let baseline = null;
try{ baseline = JSON.parse(fs.readFileSync(FINGERPRINT_PATH, 'utf8')); }catch(e){ /* premier lancement */ }

if(!baseline){
  fs.writeFileSync(FINGERPRINT_PATH, JSON.stringify({ cacheName, contentHash }, null, 2) + '\n');
  pass(`Première exécution : référence enregistrée pour CACHE_NAME="${cacheName}".`);
} else if(baseline.cacheName === cacheName && baseline.contentHash !== contentHash){
  fail(
    `Le contenu des fichiers de l'app shell (sw.js: APP_SHELL) a changé, ` +
    `mais CACHE_NAME est toujours "${cacheName}". Les navigateurs qui ont ` +
    `déjà visité l'app vont continuer à servir les ANCIENS fichiers en cache ` +
    `— incrémente CACHE_NAME dans sw.js avant de livrer (ex: "${cacheName}".replace(/\\d+$/, n => +n+1)).`
  );
} else if(baseline.cacheName !== cacheName){
  fs.writeFileSync(FINGERPRINT_PATH, JSON.stringify({ cacheName, contentHash }, null, 2) + '\n');
  pass(`CACHE_NAME a bien été incrémenté ("${baseline.cacheName}" → "${cacheName}") — nouvelle référence enregistrée.`);
} else {
  pass(`CACHE_NAME ("${cacheName}") et contenu de l'app shell cohérents — rien n'a changé depuis la dernière référence.`);
}

if(ok){
  console.log('\n✅ Aucun problème détecté — le cache hors-ligne sera bien invalidé si besoin.');
} else {
  console.log('\n❌ Des problèmes ont été détectés ci-dessus.');
  process.exitCode = 1;
}
