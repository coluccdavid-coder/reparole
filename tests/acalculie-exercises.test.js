// =====================================================================
//  TESTS — 5 nouveaux exercices d'acalculie (v6.156)
//  ---------------------------------------------------------------------
//  Demandé explicitement par l'utilisateur : l'acalculie (trouble
//  acquis du traitement des nombres après une lésion cérébrale) touche
//  une partie réelle du public de ReParole, souvent en plus de
//  l'aphasie, et reste peu prise en charge par les outils existants
//  (aucun test adapté n'existe pour les patients AVC — les batteries
//  comme Examath sont étalonnées sur des enfants).
//
//  5 nouveaux types, inspirés dans l'ESPRIT de la BENQ (tâches
//  concrètes du quotidien — heure, monnaie, prix) mais avec un contenu
//  intégralement original : heure, monnaie, calcul_quotidien,
//  comparaison_nombres, prix. Français uniquement pour l'instant
//  (rejoignent FRENCH_ONLY_EXERCISE_TYPES, masqués ailleurs) — mais
//  les libellés d'interface (titre + description des tuiles) sont
//  traduits dans les 14 langues dès maintenant, même précédent que
//  syntax/story/rhyme en leur temps.
//
//  Lancer : node tests/acalculie-exercises.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const TYPES = ['heure', 'monnaie', 'calcul_quotidien', 'comparaison_nombres', 'prix'];
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    if(src === 'js/app.js'){
      code += `\n        window.Store = Store;\n      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Contenu des 5 exercices — intégrité');

await test('les 5 types existent dans BANK, tous à 12/12/12 (v6.158 : "heure" n\'a plus de plafond depuis l\'horloge SVG)', ()=>{
  const dom = loadApp();
  const bank = dom.window.BANK;
  TYPES.forEach(type=>{
    assert.ok(bank[type], `${type} manquant de BANK`);
    [1,2,3].forEach(lvl=>{
      assert.strictEqual(bank[type].items[lvl].length, 12, `${type} niveau ${lvl}`);
    });
  });
});

await test('chaque item a sa bonne réponse dans ses propres choix, sans doublon (180 items vérifiés)', ()=>{
  const dom = loadApp();
  const bank = dom.window.BANK;
  let checked = 0;
  TYPES.forEach(type=>{
    [1,2,3].forEach(lvl=>{
      bank[type].items[lvl].forEach(it=>{
        assert.ok(it.choices.includes(it.answer), `${type} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${type} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      });
    });
  });
  assert.strictEqual(checked, 12*3*5); // 5 types × 3 niveaux × 12 items = 180
});

await test('v6.158 : "heure" utilise maintenant une vraie horloge SVG dessinée (plus de plafond Unicode), 36 heures toutes distinctes', ()=>{
  const dom = loadApp();
  const bank = dom.window.BANK;
  const answers = [];
  [1,2,3].forEach(lvl=>bank.heure.items[lvl].forEach(it=>{
    assert.ok(it.text.startsWith('<svg'), `attendu du SVG, trouvé : "${it.text.slice(0,30)}..."`);
    assert.ok(it.text.includes('class="clock-face"'), 'devrait utiliser la classe .clock-face (voir css/style.css)');
    answers.push(it.answer);
  }));
  assert.strictEqual(answers.length, 36);
  assert.strictEqual(new Set(answers).size, 36, 'chaque heure devrait être unique');
});

await test('v6.158 : le niveau 3 de "heure" couvre bien des quarts d\'heure (impossible avec l\'ancien format emoji)', ()=>{
  const dom = loadApp();
  const bank = dom.window.BANK;
  const l3answers = bank.heure.items[3].map(it=>it.answer);
  const hasQuarter = l3answers.some(a => a.includes('quart'));
  assert.ok(hasQuarter, 'le niveau 3 devrait contenir au moins un quart d\'heure');
});

console.log('\nIntégration dans le tableau de bord et le moteur d\'exercice');

await test('les 5 tuiles existent dans le tableau de bord (data-type)', ()=>{
  const dom = loadApp();
  TYPES.forEach(type=>{
    const tile = dom.window.document.querySelector(`.ex-item[data-type="${type}"]`);
    assert.ok(tile, `tuile manquante pour ${type}`);
  });
});

await test('startExercise() fonctionne pour chacun des 5 types, en français', async ()=>{
  const dom = loadApp();
  dom.window.eval(`Store.savePatient('ACALC', {name:'Test',level:1,sessions:0,correct:0,total:0,streak:1})`);
  dom.window.document.getElementById('name').value = 'Test';
  dom.window.document.getElementById('code').value = 'ACALC';
  await dom.window.eval('login()');
  for(const type of TYPES){
    await dom.window.eval(`startExercise('${type}')`);
    const active = dom.window.document.getElementById('exercise').classList.contains('active');
    assert.ok(active, `l'écran d'exercice devrait être actif pour ${type}`);
  }
});

console.log('\nMasquage en langue non traduite (même politique que syntax/story/rhyme)');

function isHidden(dom, type){
  const tile = dom.window.document.querySelector(`.ex-item[data-type="${type}"]`);
  return tile.style.display === 'none';
}

await test('les 5 exercices restent visibles en français', ()=>{
  const dom = loadApp();
  TYPES.forEach(type=> assert.strictEqual(isHidden(dom, type), false, type));
});

await test('les 5 exercices sont masqués en anglais (contenu non traduit)', ()=>{
  const dom = loadApp();
  dom.window.eval("Prefs.setLang('en')");
  TYPES.forEach(type=> assert.strictEqual(isHidden(dom, type), true, type));
});

await test('les 5 exercices sont masqués en darija algérienne (contenu non traduit)', ()=>{
  const dom = loadApp();
  dom.window.eval("Prefs.setLang('dz')");
  TYPES.forEach(type=> assert.strictEqual(isHidden(dom, type), true, type));
});

console.log('\nTraductions d\'interface (titre + description des tuiles) — les 14 langues');

await test('les 10 clés (5 titres + 5 descriptions) existent dans les 14 langues, sans exception', ()=>{
  const dom = loadApp();
  const I18N_STRINGS = dom.window.eval('I18N_STRINGS');
  const allLangs = dom.window.eval('Object.keys(LANGUAGES)');
  const keys = TYPES.flatMap(t => [`ex_${t}_t`, `ex_${t}_d`]);
  allLangs.forEach(lang=>{
    keys.forEach(k=>{
      const v = I18N_STRINGS[lang][k];
      assert.ok(v && v.length > 0, `${lang}.${k} manquant ou vide`);
    });
  });
});

await test('Ami a une explication pour chacun des 5 exercices, en français', ()=>{
  const dom = loadApp();
  const phrases = dom.window.eval('COMPANION_PHRASES.fr.explain');
  TYPES.forEach(type=>{
    assert.ok(phrases[type] && phrases[type].length > 0, `explication manquante pour ${type}`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
