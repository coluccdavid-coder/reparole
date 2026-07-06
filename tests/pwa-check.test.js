// =====================================================================
//  FILET DE SÉCURITÉ — vérification du service worker (v6.23)
//  ---------------------------------------------------------------------
//  Vérifie que :
//   1. manifest.json est un JSON valide avec les champs essentiels.
//   2. Tous les fichiers listés dans sw.js (APP_SHELL) existent
//      réellement sur le disque — un seul fichier manquant fait
//      échouer TOUT le cache.addAll() au premier chargement.
//   3. Tous les fichiers CSS/JS réellement utilisés par index.html sont
//      bien présents dans APP_SHELL (pour ne pas oublier d'ajouter un
//      nouveau fichier au cache hors-ligne plus tard).
//
//  Lancer : node tests/pwa-check.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const problems = [];

// --- 1. manifest.json ---
let manifest;
try{
  manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
}catch(e){
  problems.push(`manifest.json invalide ou absent : ${e.message}`);
}
if(manifest){
  ['name','short_name','start_url','display','icons'].forEach(field=>{
    if(!manifest[field]) problems.push(`manifest.json : champ "${field}" manquant.`);
  });
  if(manifest.icons){
    manifest.icons.forEach(icon=>{
      const iconPath = path.join(ROOT, icon.src);
      if(!fs.existsSync(iconPath)) problems.push(`manifest.json référence une icône introuvable : ${icon.src}`);
    });
  }
}

// --- 2. Fichiers listés dans sw.js existent-ils ? ---
const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const listedFiles = [...swSource.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]).filter(f => f !== '');
listedFiles.forEach(f=>{
  if(!fs.existsSync(path.join(ROOT, f))) problems.push(`sw.js référence un fichier introuvable : ${f}`);
});

// --- 3. Tous les CSS/JS réels sont-ils dans le cache hors-ligne ? ---
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const referencedAssets = [...indexHtml.matchAll(/(?:src|href)="(css\/[^"]+\.css|js\/[^"]+\.js)"/g)].map(m => m[1]);
referencedAssets.forEach(asset=>{
  if(!listedFiles.includes(asset)){
    problems.push(`index.html charge "${asset}" mais ce fichier n'est PAS dans le cache hors-ligne (sw.js) — il ne fonctionnera pas sans connexion.`);
  }
});

console.log(`Fichiers dans le cache hors-ligne (sw.js) : ${listedFiles.length}`);
console.log(`Fichiers CSS/JS chargés par index.html : ${referencedAssets.length}`);
console.log('');
if(problems.length === 0){
  console.log('✅ Aucun problème détecté — manifest et service worker cohérents.');
  process.exit(0);
} else {
  console.log(`❌ ${problems.length} problème(s) détecté(s) :\n`);
  problems.forEach((p,i)=>console.log(`${i+1}. ${p}`));
  process.exit(1);
}
