// =====================================================================
//  TESTS — 3 nouveautés de l'espace aidant (v6.168)
//  ---------------------------------------------------------------------
//  Demandé explicitement, après un retour "je trouve l'espace aidant
//  un peu vide" : mots à revoir (lecture seule, complémentaire de
//  l'ajout de mot déjà existant), frise d'activité sur 14 jours
//  calendaires, et badge de langue de travail actuelle.
//
//  Nécessite côté SQL (sql/schema.sql) : colonne sessions.lang
//  (nouvelle), get_caregiver_data() enrichie de 3 champs
//  (frequent_words, active_days, current_lang), log_session() avec un
//  6ᵉ paramètre p_lang.
//
//  Lancer : node tests/caregiver-enrichments.test.js
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

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'aidant.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable' });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    if(src === 'js/caregiver.js'){ code += `\n        window.setCaregiverData = function(d){ caregiverData = d; };\n      `; }
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

console.log('SQL — les 3 nouveaux champs bien présents dans get_caregiver_data()');

await test('sql/schema.sql : sessions.lang existe (alter table)', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  assert.ok(/alter table sessions add column if not exists lang/.test(sql));
});

await test('sql/schema.sql : log_session() accepte un 6ᵉ paramètre p_lang', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  assert.ok(/function log_session\(p_code text, p_type text, p_score int, p_total int, p_level int, p_lang text/.test(sql));
});

await test('sql/schema.sql : get_caregiver_data() renvoie frequent_words, active_days, current_lang', ()=>{
  const sql = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  const fnStart = sql.indexOf('create or replace function get_caregiver_data');
  const fnEnd = sql.indexOf('$$;', fnStart) + 3;
  const fnBody = sql.slice(fnStart, fnEnd);
  assert.ok(fnBody.includes("'frequent_words', v_frequent_words"));
  assert.ok(fnBody.includes("'active_days', v_active_days"));
  assert.ok(fnBody.includes("'current_lang', v_current_lang"));
});

console.log('\nJS — logSession() transmet bien la langue active');

await test('js/storage.js : logSession() envoie Prefs.data.lang comme p_lang', ()=>{
  const code = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  assert.ok(/p_lang:\s*lang/.test(code));
});

console.log('\nRendu — les 3 nouvelles sections s\'affichent correctement');

await test('mots à revoir : s\'affichent en chips à partir de frequent_words', ()=>{
  const dom = loadApp();
  dom.window.setCaregiverData({ name:'Test', frequent_words:[{target:'chat',cnt:5},{target:'maison',cnt:3}], levels:{}, active_days:[], current_lang:'fr' });
  dom.window.renderCaregiverDashboard();
  const html = dom.window.document.getElementById('cg-frequent-words').innerHTML;
  assert.ok(html.includes('chat') && html.includes('maison'));
});

await test('mots à revoir : message vide si aucun mot fréquent', ()=>{
  const dom = loadApp();
  dom.window.setCaregiverData({ name:'Test', frequent_words:[], levels:{}, active_days:[], current_lang:'fr' });
  dom.window.renderCaregiverDashboard();
  const html = dom.window.document.getElementById('cg-frequent-words').innerHTML;
  assert.ok(html.length > 0, 'devrait afficher un message plutôt que rester vide');
});

await test('frise d\'activité : toujours 14 points, le bon nombre actifs selon active_days', ()=>{
  const dom = loadApp();
  const today = new Date().toISOString().slice(0,10);
  dom.window.setCaregiverData({ name:'Test', frequent_words:[], levels:{}, active_days:[today], current_lang:'fr' });
  dom.window.renderCaregiverDashboard();
  const strip = dom.window.document.getElementById('cg-activity-strip');
  assert.strictEqual(strip.querySelectorAll('.cg-day-dot').length, 14);
  assert.strictEqual(strip.querySelectorAll('.cg-day-active').length, 1);
});

await test('badge de langue : masqué en français, visible avec drapeau+nom sinon', ()=>{
  const dom = loadApp();
  dom.window.setCaregiverData({ name:'Test', frequent_words:[], levels:{}, active_days:[], current_lang:'fr' });
  dom.window.renderCaregiverDashboard();
  assert.strictEqual(dom.window.document.getElementById('cg-current-lang').style.display, 'none', 'masqué en français');

  dom.window.setCaregiverData({ name:'Test', frequent_words:[], levels:{}, active_days:[], current_lang:'ja' });
  dom.window.renderCaregiverDashboard();
  const langEl = dom.window.document.getElementById('cg-current-lang');
  assert.notStrictEqual(langEl.style.display, 'none', 'visible en japonais');
  assert.ok(langEl.textContent.includes('日本語'));
});

console.log('\nTraductions — les 5 nouvelles clés existent dans les 14 langues');

await test('les 5 clés (cg_activity_strip_label, cg_frequent_words_title/sub, cg_no_frequent_words, cg_current_lang_prefix) existent partout', ()=>{
  const dom = loadApp();
  const I18N_STRINGS = dom.window.I18N_STRINGS;
  const KEYS = ['cg_activity_strip_label','cg_frequent_words_title','cg_frequent_words_sub','cg_no_frequent_words','cg_current_lang_prefix'];
  Object.keys(I18N_STRINGS).forEach(lang=>{
    KEYS.forEach(k=>{
      assert.ok(I18N_STRINGS[lang][k] && I18N_STRINGS[lang][k].length > 0, `${lang}.${k} manquant ou vide`);
    });
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
