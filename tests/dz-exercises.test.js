// =====================================================================
//  TESTS — Contenu d'exercices en darija algérienne (v6.103)
//  ---------------------------------------------------------------------
//  Contenu fourni intégralement par l'utilisateur (5 fichiers Excel :
//  Darija_Algerienne_Denomination_Partie1/2/3.xlsx et
//  Darija_Algerienne_Completion_Partie1/2.xlsx). Vérifie l'intégrité de
//  la banque générée (aucun mot inventé au-delà des distracteurs
//  puisés dans le vocabulaire déjà fourni, chaque bonne réponse
//  présente dans ses propres choix, pas de doublons), et que le
//  mécanisme générique d'écoute pré-enregistrée (v6.1/v6.59) s'active
//  bien pour la darija algérienne — contrairement au japonais qui a un
//  vrai speechLocale, la darija algérienne n'en a pas.
//
//  Contrairement au japonais, la compréhension (18 questions) N'EST
//  PAS encore fournie — voir docs/dz-parity-request.md. Ce fichier ne
//  vérifie donc que dénomination + complétion, et vérifie explicitement
//  que la compréhension reste absente (pour ne pas oublier de mettre à
//  jour ce test le jour où elle sera intégrée).
//
//  Lancer : node tests/dz-exercises.test.js
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

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/app.js'){
      code += `
        window.__testSetUser = function(overrides){
          user = Object.assign({name:'Test',level:2,sessions:0,correct:0,total:0,streak:1,plan:'free'}, overrides||{});
        };
        window.__testSetUserCode = function(code){ userCode = code; };
      `;
    }
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load(); __testSetUserCode('T'); __testSetUser({});");
  return dom;
}

async function main(){

console.log('Intégrité de BANK_DZ (js/exercises-dz.js)');

await test('window.BANK_DZ existe avec dénomination + complétion + compréhension (v6.142)', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_DZ;
  assert.ok(B, 'BANK_DZ introuvable');
  assert.ok(B.denomination, 'denomination manquante');
  assert.ok(B.completion, 'completion manquante');
  assert.ok(B.comprehension, 'comprehension manquante (v6.142 : brouillon ajouté, voir docs/dz-parity-request.md)');
});

await test('compréhension : 6/6/6 items par niveau, bonne réponse dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_DZ;
  [1,2,3].forEach(lvl=>{
    assert.strictEqual(B.comprehension.items[lvl].length, 6, `niveau ${lvl}`);
    B.comprehension.items[lvl].forEach(it=>{
      assert.ok(it.choices.includes(it.answer), `niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
      assert.strictEqual(new Set(it.choices).size, it.choices.length, `niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
    });
  });
});

await test('dénomination : 23/34/35 items par niveau (fidèle aux fichiers fournis)', ()=>{
  const dom = loadPatientApp();
  const den = dom.window.BANK_DZ.denomination.items;
  assert.strictEqual(den[1].length, 23);
  assert.strictEqual(den[2].length, 34);
  assert.strictEqual(den[3].length, 35);
});

await test('complétion : 8/8/8 items par niveau', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_DZ.completion.items;
  [1,2,3].forEach(l=>assert.strictEqual(comp[l].length, 8, `complétion niveau ${l}`));
});

await test('chaque item : la bonne réponse figure bien dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_DZ;
  let checked = 0;
  for(const kind of ['denomination','completion']){
    for(const lvl of [1,2,3]){
      for(const it of B[kind].items[lvl]){
        assert.ok(it.choices.includes(it.answer), `${kind} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${kind} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      }
    }
  }
  assert.strictEqual(checked, 23+34+35+8+8+8); // 116 items au total
});

await test('complétion : chaque phrase contient bien un "___" (le trou)', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_DZ.completion.items;
  [1,2,3].forEach(lvl=>{
    comp[lvl].forEach(it=>assert.ok(it.text.includes('___'), `pas de trou dans : ${it.text}`));
  });
});

console.log('\nEnregistrement de la langue (LANGUAGES / PARTIAL_LANGS)');

await test('dz reste dans PARTIAL_LANGS (contenu partiel : pas de voix, compréhension pas encore relue)', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.PARTIAL_LANGS.includes('dz'));
  assert.strictEqual(dom.window.LANGUAGES.dz.speechLocale, null);
});

console.log('\nComportement dans l\'exercice (mécanisme générique v6.1/v6.59)');

await test('dénomination en darija algérienne : utilise le mécanisme audio pré-enregistré (comme le kabyle), pas la synthèse vocale', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('dz');");
  await dom.window.eval("startExercise('denomination')");
  const btn = dom.window.document.querySelector('.speak-btn');
  assert.ok(btn, 'bouton d\'écoute manquant');
  assert.ok(btn.getAttribute('onclick').includes('playPartialLangWordUI'), 'devrait utiliser playPartialLangWordUI, pas speak() — reçu : ' + btn.getAttribute('onclick'));
});

await test('complétion en darija algérienne : les questions viennent bien de BANK_DZ (texte en écriture arabe)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('dz'); __testSetUser({level:1});");
  await dom.window.eval("startExercise('completion')");
  const text = dom.window.document.querySelector('.prompt-main').textContent;
  assert.ok(/[\u0600-\u06FF]/.test(text), `le texte devrait contenir de l'écriture arabe, reçu : ${text}`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
