// =====================================================================
//  TESTS — Le placeholder "Ex : Marie" restait en français quelle que
//  soit la langue choisie (v6.90)
//  ---------------------------------------------------------------------
//  Retour utilisateur (captures d'écran en kabyle et en arabe) : le
//  <label> du champ prénom était bien traduit, mais son placeholder
//  ("Ex : Marie") n'avait jamais été relié au mécanisme
//  data-i18n-placeholder — même bug sur le champ nom de l'espace
//  orthophoniste. Corrigé pour les deux.
//
//  Lancer : node tests/placeholder-translation.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
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
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('index.html — placeholder du champ prénom (#name)');

await test('data-i18n-placeholder correctement posé dans le HTML', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(/<input id="name"[^>]*data-i18n-placeholder="field_name_ph"/.test(html));
});

await test('changer de langue traduit bien le placeholder, pas seulement le label', ()=>{
  const dom = loadPage('index.html');
  dom.window.eval("Prefs.setLang('en');");
  const input = dom.window.document.getElementById('name');
  assert.notStrictEqual(input.placeholder, 'Ex : Marie', 'le placeholder ne doit plus rester en français une fois la langue changée');
  // v6.160 : signalé par l'utilisateur — le placeholder changeait bien de
  // langue (corrigé ici en v6.90), mais le PRÉNOM D'EXEMPLE lui-même
  // restait "Marie" dans 7 langues sur 9, jamais vraiment localisé.
  // Vérifie maintenant que ce n'est plus le cas : l'anglais doit avoir
  // son propre prénom d'exemple, pas "Marie" en habits anglais.
  assert.ok(!/marie/i.test(input.placeholder), `le prénom d'exemple devrait être localisé, pas rester "Marie" : ${input.placeholder}`);
  assert.strictEqual(input.placeholder, 'E.g. Emma');
});

await test('arabe : le placeholder change bien lui aussi (cas signalé par l\'utilisateur)', ()=>{
  const dom = loadPage('index.html');
  dom.window.eval("Prefs.setLang('ar');");
  const input = dom.window.document.getElementById('name');
  assert.notStrictEqual(input.placeholder, 'Ex : Marie');
});

await test('kabyle : le placeholder change bien lui aussi (cas signalé par l\'utilisateur)', ()=>{
  const dom = loadPage('index.html');
  dom.window.eval("Prefs.setLang('kab');");
  const input = dom.window.document.getElementById('name');
  assert.notStrictEqual(input.placeholder, 'Ex : Marie');
});

console.log('\ndashboard-ortho.html — même bug, même correctif (#o-name)');

await test('data-i18n-placeholder correctement posé dans le HTML', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(/<input id="o-name"[^>]*data-i18n-placeholder="ortho_name_ph"/.test(html));
});

await test('changer de langue traduit bien le placeholder', ()=>{
  const dom = loadPage('dashboard-ortho.html');
  dom.window.eval("Prefs.setLang('es');");
  const input = dom.window.document.getElementById('o-name');
  assert.notStrictEqual(input.placeholder, 'Ex : Camille Dupont');
});

console.log('\nPrénom d\'exemple — localisation réelle, pas juste "Marie" partout (v6.160)');

await test('les 9 langues complètes ont chacune leur propre prénom d\'exemple localisé, aucune ne dit encore "Marie" en dehors du français', ()=>{
  const dom = loadPage('index.html');
  const I18N_STRINGS = dom.window.I18N_STRINGS;
  ['en','es','it','pt','de','ar','tr','pl','ja'].forEach(lang=>{
    const ph = I18N_STRINGS[lang].field_name_ph;
    assert.ok(!/marie/i.test(ph), `${lang} : prénom d'exemple pas encore localisé, contient toujours "Marie" — ${ph}`);
  });
});

console.log('\nCompagnon "Ami" — nom transcrit selon l\'écriture (v6.160)');

await test('"Ami" reste "Ami" dans les langues en alphabet latin', ()=>{
  const dom = loadPage('index.html');
  ['fr','en','es','it','pt','de','tr','pl','kab'].forEach(lang=>{
    dom.window.eval(`Prefs.setLang('${lang}')`);
    assert.strictEqual(dom.window.eval('Companion.name()'), 'Ami', lang);
  });
});

await test('"Ami" est transcrit phonétiquement pour les langues en écriture arabe ou japonaise', ()=>{
  const dom = loadPage('index.html');
  const expected = { ar:'آمي', ja:'アミ', dz:'آمي', ma:'آمي', tn:'آمي' };
  Object.entries(expected).forEach(([lang, name])=>{
    dom.window.eval(`Prefs.setLang('${lang}')`);
    assert.strictEqual(dom.window.eval('Companion.name()'), name, lang);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
