// =====================================================================
//  TESTS — Ajout du japonais (v6.89)
//  ---------------------------------------------------------------------
//  Contenu fourni intégralement par l'utilisateur (Japonais_Complet.xlsx).
//  Vérifie l'intégrité de la banque générée (aucun mot inventé, chaque
//  bonne réponse présente dans ses propres choix, pas de doublons), le
//  bon enregistrement de la langue (LANGUAGES, PARTIAL_LANGS), et que le
//  mécanisme générique de repli (v6.9/v6.59) fonctionne correctement :
//  contrairement au kabyle, le japonais a un vrai speechLocale et
//  doit donc utiliser la synthèse vocale normale, PAS le mécanisme
//  "consigne + audio pré-enregistré".
//
//  Lancer : node tests/japanese-language.test.js
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
        window.__testGetCurrent = function(){ return current; };
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

console.log('Intégrité de BANK_JA (js/exercises-ja.js)');

await test('window.BANK_JA existe avec TOUS les types d\'exercice attendus (v6.151 : denomination_orale/repetition/intonation comblés)', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_JA;
  assert.ok(B, 'BANK_JA introuvable');
  ['denomination','completion','comprehension','denomination_orale','repetition','intonation'].forEach(k=>assert.ok(B[k], `${k} manquant`));
});

await test('v6.151 : denomination_orale (6/6/6), repetition (8/8/8), intonation (6/6/6) — même échelle que les 8 autres langues complètes', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_JA;
  [1,2,3].forEach(l=>{
    assert.strictEqual(B.denomination_orale.items[l].length, 6, `denomination_orale niveau ${l}`);
    assert.strictEqual(B.repetition.items[l].length, 8, `repetition niveau ${l}`);
    assert.strictEqual(B.intonation.items[l].length, 6, `intonation niveau ${l}`);
  });
});

await test('v6.151 : intonation — chaque item a un "cue" valide (question/descriptive/exclamative)', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_JA;
  [1,2,3].forEach(l=>{
    B.intonation.items[l].forEach(it=>{
      assert.ok(['question','descriptive','exclamative'].includes(it.cue), `cue invalide : "${it.cue}"`);
      assert.ok(it.word && it.word.length > 0, 'word manquant ou vide');
    });
  });
});

await test('dénomination : 23/34/35 items par niveau (fidèle au fichier fourni)', ()=>{
  const dom = loadPatientApp();
  const den = dom.window.BANK_JA.denomination.items;
  assert.strictEqual(den[1].length, 23);
  assert.strictEqual(den[2].length, 34);
  assert.strictEqual(den[3].length, 35);
});

await test('complétion et compréhension : 8/8/8 et 6/6/6 par niveau', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_JA.completion.items;
  const compre = dom.window.BANK_JA.comprehension.items;
  [1,2,3].forEach(l=>assert.strictEqual(comp[l].length, 8, `complétion niveau ${l}`));
  [1,2,3].forEach(l=>assert.strictEqual(compre[l].length, 6, `compréhension niveau ${l}`));
});

await test('chaque item : la bonne réponse figure bien dans ses propres choix, sans doublon', ()=>{
  const dom = loadPatientApp();
  const B = dom.window.BANK_JA;
  let checked = 0;
  for(const kind of ['denomination','completion','comprehension']){
    for(const lvl of [1,2,3]){
      for(const it of B[kind].items[lvl]){
        assert.ok(it.choices.includes(it.answer), `${kind} niveau ${lvl} : "${it.answer}" absent de ses propres choix`);
        assert.strictEqual(new Set(it.choices).size, it.choices.length, `${kind} niveau ${lvl} : doublon dans les choix de "${it.answer}"`);
        checked++;
      }
    }
  }
  assert.strictEqual(checked, 23+34+35+8+8+8+6+6+6); // 130 items au total
});

await test('complétion : chaque phrase contient bien un "___" (le trou)', ()=>{
  const dom = loadPatientApp();
  const comp = dom.window.BANK_JA.completion.items;
  [1,2,3].forEach(lvl=>{
    comp[lvl].forEach(it=>assert.ok(it.text.includes('___'), `pas de trou dans : ${it.text}`));
  });
});

console.log('\nEnregistrement de la langue (LANGUAGES / PARTIAL_LANGS)');

await test('ja présent dans LANGUAGES avec un speechLocale (contrairement au kabyle)', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.LANGUAGES.ja, 'LANGUAGES.ja manquant');
  assert.strictEqual(dom.window.LANGUAGES.ja.speechLocale, 'ja-JP');
  assert.strictEqual(dom.window.LANGUAGES.kab.speechLocale, null, 'référence : le kabyle n\'a pas de speechLocale');
});

await test('ja n\'est plus dans PARTIAL_LANGS depuis la traduction complète de l\'interface (v6.91)', ()=>{
  const dom = loadPatientApp();
  assert.ok(!dom.window.PARTIAL_LANGS.includes('ja'), 'ja est maintenant une langue complète, comme les 9 autres');
});

await test('l\'interface elle-même est traduite en japonais (pas seulement le contenu des exercices)', ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('ja');");
  const title = dom.window.document.querySelector('[data-i18n="login_title"]').textContent;
  assert.ok(title.includes('こんにちは'), `le titre d'accueil doit être traduit en japonais, reçu : ${title}`);
  const btn = dom.window.document.querySelector('[data-i18n="btn_login"]').textContent;
  assert.strictEqual(btn, 'ログイン');
});

await test('le sélecteur de langue propose bien le japonais (généré automatiquement depuis LANGUAGES)', ()=>{
  const dom = loadPatientApp();
  const select = dom.window.document.querySelector('.lang-select');
  const labels = [...select.querySelectorAll('option')].map(o=>o.textContent);
  assert.ok(labels.some(l => l.includes('日本語')));
});

console.log('\nComportement dans l\'exercice (repli générique v6.9/v6.59)');

await test('dénomination en japonais : utilise BANK_JA, PAS le mécanisme audio pré-enregistré (isKabDenom doit être faux)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('ja');");
  await dom.window.eval("startExercise('denomination')");
  const btn = dom.window.document.querySelector('.speak-btn');
  assert.ok(btn, 'bouton d\'écoute manquant');
  // Contrairement au kabyle, le bouton doit appeler speak() (synthèse
  // vocale normale), jamais playPartialLangWordUI (réservé aux langues
  // sans speechLocale).
  assert.ok(!btn.getAttribute('onclick').includes('playPartialLangWordUI'), 'ne devrait pas utiliser le mécanisme audio pré-enregistré');
  assert.ok(btn.getAttribute('onclick').includes('speak('), 'devrait utiliser la synthèse vocale normale');
});

await test('dénomination en japonais : les choix affichés viennent bien de BANK_JA (kanji, pas de français)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('ja');");
  await dom.window.eval("startExercise('denomination')");
  const choiceTexts = [...dom.window.document.querySelectorAll('.choice')].map(b=>b.textContent);
  assert.ok(choiceTexts.length >= 2);
  // aucun choix ne doit être un mot français en capitales (signe qu'on
  // serait retombé par erreur sur la banque française)
  choiceTexts.forEach(t=>assert.ok(!/^[A-ZÀ-Ü ]+$/.test(t), `choix suspect (a l'air français) : ${t}`));
});

await test('complétion en japonais : utilise BANK_JA avec un trou visible', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('ja');");
  await dom.window.eval("startExercise('completion')");
  const promptMain = dom.window.document.querySelector('.prompt-main');
  assert.ok(promptMain, 'zone de texte à trou manquante');
  assert.ok(promptMain.innerHTML.includes('blank'), 'le trou doit être visuellement marqué');
});

await test('v6.151 : répétition en japonais utilise maintenant du vrai contenu japonais (avant : repli sur le français, le manque n\'existait pas encore)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('ja');");
  await dom.window.eval("startExercise('repetition')");
  assert.ok(dom.window.document.getElementById('exercise').classList.contains('active'));
  const c = dom.window.eval('__testGetCurrent()');
  // v6.151 : le patient de test par défaut est au niveau 2 (voir
  // __testSetUser ci-dessus) — comparer contre le bon niveau, pas
  // toujours le niveau 1.
  const bankWords = dom.window.eval("BANK_JA.repetition.items[2].map(it=>it.word)");
  assert.ok(bankWords.includes(c.queue[0].word), `attendu un mot de BANK_JA.repetition, trouvé "${c.queue[0].word}"`);
});

await test('exercice vocal toujours absent d\'une langue (cas générique, ex. kabyle) : repli propre sur le français, pas de plantage', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("Prefs.setLang('kab');");
  await dom.window.eval("startExercise('repetition')");
  // Le mécanisme générique existant (v6.9) doit gérer ce cas sans erreur —
  // on vérifie juste qu'un écran d'exercice s'affiche malgré tout.
  assert.ok(dom.window.document.getElementById('exercise').classList.contains('active'));
});

console.log('\nTraduction complète (v6.91) : COMPANION_PHRASES et ASSESS_STRINGS aussi, pas seulement I18N_STRINGS');

await test('COMPANION_PHRASES.ja existe avec toutes les catégories de phrases', ()=>{
  const dom = loadPatientApp();
  const ja = dom.window.COMPANION_PHRASES.ja;
  assert.ok(ja, 'COMPANION_PHRASES.ja manquant');
  ['welcome','welcome_back','tip','correct','encourage','sessionEnd_high','explain'].forEach(k=>{
    assert.ok(ja[k], `COMPANION_PHRASES.ja.${k} manquant`);
  });
  assert.ok(ja.explain.denomination.length > 0);
});

await test('ASSESS_STRINGS.ja existe et fonctionne (y compris les valeurs-fonctions)', ()=>{
  const dom = loadPatientApp();
  const ja = dom.window.ASSESS_STRINGS.ja;
  assert.ok(ja, 'ASSESS_STRINGS.ja manquant');
  assert.strictEqual(ja.start, '始める');
  assert.ok(ja.priority_detail('テスト').includes('テスト'));
});

console.log('\nv6.161 : "fluence" manquait entièrement pour le japonais — trouvé en auditant tous les domaines cœur');

await test('BANK_JA.fluence existe désormais, avec 2 catégories par niveau', ()=>{
  const dom = loadPatientApp();
  const fluence = dom.window.BANK_JA.fluence;
  assert.ok(fluence, 'BANK_JA.fluence manquant');
  assert.strictEqual(fluence.voice, true);
  [1,2,3].forEach(lvl=>{
    assert.strictEqual(fluence.items[lvl].length, 2, `niveau ${lvl}`);
    fluence.items[lvl].forEach(it=>{
      assert.ok(it.cat && it.cat.length > 0, 'catégorie manquante');
      assert.ok(Array.isArray(it.accept) && it.accept.length > 10, `liste de mots acceptés trop courte pour "${it.cat}"`);
    });
  });
});

await test('démarrer "fluence" en japonais utilise bien BANK_JA, pas un repli silencieux vers le français (le vrai bug trouvé)', async ()=>{
  const dom = loadPatientApp();
  dom.window.eval("__testSetUser({}); __testSetUserCode('FLTEST');");
  dom.window.eval("Prefs.setLang('ja')");
  await dom.window.eval("startExercise('fluence')");
  const title = dom.window.document.getElementById('ex-title').textContent;
  assert.strictEqual(title, '言葉の流暢性', `attendu le titre japonais, trouvé : "${title}" (repli français silencieux si ce test échoue)`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
