// =====================================================================
//  TESTS — Mode sombre + retour à l'accueil sur aidant.html et
//  dashboard-ortho.html (v6.75)
//  ---------------------------------------------------------------------
//  Retour utilisateur direct : le mode sombre (v6.71) n'existait que
//  sur index.html, et l'espace orthophoniste n'avait aucun lien retour
//  vers l'accueil. Ces tests vérifient que js/prefs.js se charge sans
//  planter sur ces deux pages (qui n'ont pas js/i18n.js — Prefs.apply()
//  doit rester silencieux dans ce cas), que le bouton mode sombre
//  fonctionne, et que les liens "← Accueil" existent bien.
//
//  Lancer : node tests/dark-mode-other-spaces.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadPage(file){
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
    // v6.247 : les 14 langues vivent dans js/i18n/<code>.js et les pages
    // n'en chargent qu'une. En test, on les charge toutes.
    if(typeof src !== 'undefined' && src === 'js/i18n.js') fs.readdirSync(path.join(ROOT, 'js/i18n'))
      .forEach(lf => dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n', lf), 'utf8')));
  }
  return dom;
}

console.log("Espace aidant (aidant.html)");

test("js/prefs.js se charge et Prefs.load() ne plante pas (pas de js/i18n.js sur cette page)", ()=>{
  const dom = loadPage('aidant.html');
  assert.doesNotThrow(()=>{ dom.window.eval('Prefs.load();'); });
});

test('bouton mode sombre présent, applique body.dark-mode', ()=>{
  const dom = loadPage('aidant.html');
  dom.window.eval('Prefs.load();');
  const btn = dom.window.document.querySelector('[data-pref="darkMode"]');
  assert.ok(btn, 'bouton mode sombre introuvable');
  dom.window.eval("Prefs.toggle('darkMode')");
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), true);
});

test('lien "← Accueil" présent sur le tableau de bord aidant (vers index.html)', ()=>{
  const dom = loadPage('aidant.html');
  const link = [...dom.window.document.querySelectorAll('#caregiver-dashboard a[href="index.html"]')];
  assert.ok(link.length >= 1, 'lien vers index.html introuvable dans le tableau de bord aidant');
});

console.log("\nEspace orthophoniste (dashboard-ortho.html)");

test("js/prefs.js se charge et Prefs.load() ne plante pas", ()=>{
  const dom = loadPage('dashboard-ortho.html');
  assert.doesNotThrow(()=>{ dom.window.eval('Prefs.load();'); });
});

test('bouton mode sombre présent sur le tableau de bord principal, applique body.dark-mode', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval('Prefs.load();');
  const btn = dom.window.document.querySelector('#ortho-list [data-pref="darkMode"]');
  assert.ok(btn, 'bouton mode sombre introuvable dans #ortho-list');
  dom.window.eval("Prefs.toggle('darkMode')");
  assert.strictEqual(dom.window.document.body.classList.contains('dark-mode'), true);
});

test('lien "← Revenir à l\'accueil" présent sur l\'écran de connexion (absent auparavant)', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  const link = dom.window.document.querySelector('#ortho-login a[href="index.html"]');
  assert.ok(link, 'lien vers index.html introuvable sur #ortho-login');
});

test('lien "← Accueil" présent sur le tableau de bord principal', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  const link = dom.window.document.querySelector('#ortho-list a[href="index.html"]');
  assert.ok(link, 'lien vers index.html introuvable dans #ortho-list');
});

test('la navigation interne existante (Quitter, ← Retour, ← Patients) n\'a pas été cassée par l\'ajout', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  const html = dom.window.document.body.innerHTML;
  assert.ok(html.includes('OrthoApp.logout()'), 'bouton Quitter manquant');
  assert.ok(html.includes("show('ortho-list')"), 'bouton ← Retour manquant');
  assert.ok(html.includes('OrthoApp.backToList()'), 'bouton ← Patients manquant');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
