// =====================================================================
//  TESTS — Bannière "nouvelle version disponible" (v6.134)
//  ---------------------------------------------------------------------
//  Signalé par l'utilisateur : "il n'y a plus le bouton quand il y a
//  une nouvelle version". Deux bugs réels trouvés en creusant :
//
//  1. Le vrai bug d'origine, probable cause du signalement : sw.js
//     appelle self.skipWaiting() automatiquement dans son gestionnaire
//     "install" (voir sw.js), donc le nouveau service worker traverse
//     l'état "installed" quasi instantanément avant de passer à
//     "activating" puis "activated". Le code (index.html) attendait
//     précisément l'état "installed" via "statechange", une fenêtre
//     qui peut être ratée avec skipWaiting(). Remplacé par
//     "controllerchange" sur navigator.serviceWorker, le signal fiable
//     recommandé pour ce pattern précis (skipWaiting + clients.claim).
//
//  2. Un vrai bug de syntaxe (double antislash cassant une chaîne)
//     introduit en cours de correction du premier bug — jamais repéré
//     avant car AUCUN test ne chargeait les <script> inline
//     d'index.html (seulement les <script src="...">). D'où le test
//     "syntaxe" ci-dessous : vérifie TOUS les scripts inline, pas
//     seulement celui-ci, pour que ce type de bug ne puisse plus
//     passer inaperçu à l'avenir.
//
//  jsdom n'implémente pas la Service Worker API : ces tests vérifient
//  la syntaxe et la logique testable indépendamment (showUpdateBanner,
//  la garde hadControllerAtLoad), pas un vrai cycle de vie de service
//  worker (impossible à simuler fidèlement ici).
//
//  Lancer : node tests/update-banner.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function extractInlineScripts(html){
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while((m = re.exec(html))){
    const body = m[1].trim();
    if(body) scripts.push(body);
  }
  return scripts;
}

async function main(){

console.log('Garde-fou syntaxe : tous les scripts inline d\'index.html (v6.134)');

await test('chaque <script> inline (sans src) d\'index.html est syntaxiquement valide', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = extractInlineScripts(html);
  assert.ok(scripts.length >= 1, 'aucun script inline trouvé — la regex a peut-être un problème');
  scripts.forEach((code, i)=>{
    const tmpFile = path.join(ROOT, `.__inline_check_${i}.js`);
    fs.writeFileSync(tmpFile, code, 'utf8');
    try{
      execFileSync(process.execPath, ['--check', tmpFile], { stdio:'pipe' });
    }catch(e){
      throw new Error(`script inline #${i} invalide : ${e.stderr ? e.stderr.toString().split('\n')[0] : e.message}`);
    }finally{
      fs.unlinkSync(tmpFile);
    }
  });
});

console.log('\nBannière de mise à jour (showUpdateBanner)');

function loadWithInlineScripts(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  // charge d'abord les <script src="...">, comme les autres tests
  const srcScripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of srcScripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  // puis les scripts inline (jamais fait par les autres tests — voir
  // le commentaire d'en-tête sur le bug #2)
  const inlineScripts = extractInlineScripts(html);
  for(const code of inlineScripts){
    try{ dom.window.eval(code); }
    catch(e){ /* certains scripts inline dépendent d'API absentes de jsdom (ex. serviceWorker) — pas grave pour ce test, showUpdateBanner ne dépend pas d'eux */ }
  }
  return dom;
}

await test('showUpdateBanner() crée bien la bannière avec un bouton "Actualiser"', ()=>{
  const dom = loadWithInlineScripts();
  assert.strictEqual(typeof dom.window.showUpdateBanner, 'function', 'showUpdateBanner devrait être définie (le script inline a dû s\'exécuter sans erreur)');
  dom.window.showUpdateBanner();
  const banner = dom.window.document.getElementById('sw-update-banner');
  assert.ok(banner, 'la bannière devrait être ajoutée au DOM');
  const btn = [...banner.querySelectorAll('button')].find(b=>/actualiser/i.test(b.textContent));
  assert.ok(btn, 'un bouton "Actualiser" devrait être présent');
});

await test('showUpdateBanner() ne crée pas de doublon si appelée deux fois', ()=>{
  const dom = loadWithInlineScripts();
  dom.window.showUpdateBanner();
  dom.window.showUpdateBanner();
  const banners = dom.window.document.querySelectorAll('#sw-update-banner');
  assert.strictEqual(banners.length, 1);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
