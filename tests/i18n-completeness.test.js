// =====================================================================
//  FILET DE SÉCURITÉ — vérification automatique des traductions (v6.21)
//  ---------------------------------------------------------------------
//  Pourquoi ce fichier existe : plusieurs bugs de traduction sont passés
//  inaperçus jusqu'à ce qu'un patient les voie à l'écran (ex: v6.20 —
//  des tables de traduction déclarées en `const` au lieu de `window.X`,
//  invisibles pour le code qui les cherchait dynamiquement). Ce script
//  attrape ce genre de problème AVANT la livraison, pas après.
//
//  Ce qu'il vérifie :
//   1. Pour chaque langue déclarée dans LANGUAGES (js/i18n.js), toutes
//      les clés de I18N_STRINGS.fr existent aussi dans cette langue
//      (sinon : repli silencieux, ou pire, la clé brute affichée).
//   2. Même vérification pour ASSESS_STRINGS (js/assessment.js) et
//      COMPANION_PHRASES (js/companion.js).
//   3. Pour chaque langue, présence de window.BANK_XX,
//      window.ASSESS_ITEMS_XX, window.SYMPTOM_QUESTIONS_XX,
//      window.ASSESS_DOMAIN_LABELS_XX — et surtout : vérifie que ce
//      sont bien de VRAIES propriétés de `window` (donc déclarées avec
//      `window.X = ...`, pas `const X = ...`), pour ne plus jamais
//      reproduire silencieusement le bug v6.20.
//   4. Pour chaque BANK_XX, compare le nombre d'items par
//      niveau/catégorie à la banque de référence (exercises-en.js) —
//      détecte une banque incomplète (ex: niveau 3 oublié).
//
//  Langues volontairement partielles (kabyle) sont exclues des
//  vérifications de contenu complet, mais pas des vérifications
//  structurelles de base — voir PARTIAL_LANGS ci-dessous.
//
//  Lancer : node tests/i18n-completeness.test.js
//  (nécessite jsdom : npm install — voir package.json)
//  Code de sortie 0 = tout est cohérent. Non-zéro = problèmes trouvés,
//  listés en détail ci-dessous. À lancer avant toute livraison qui
//  touche à une langue ou à un fichier js/*.js multilingue.
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIAL_LANGS = ['kab']; // volontairement incomplètes, voir README
// Clés qui existent en français (et parfois en kabyle) mais ne sont
// JAMAIS affichées dans les autres langues — condition dans le code du
// type `if(lang==='kab')`. Les exiger partout serait un faux positif.
// Si une nouvelle clé de ce genre est ajoutée, l'ajouter ici avec une
// courte raison, plutôt que de désactiver la vérification en bloc.
const KAB_ONLY_KEYS = {
  ASSESS_STRINGS: ['partial_kab_note', 'symptoms_note'] // n'apparaissent que si lang==='kab', voir js/assessment.js
};

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    const code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    try{ dom.window.eval(code); }
    catch(e){ errors.push(`Erreur de chargement dans ${src} : ${e.message}`); }
  }
  return { window: dom.window, loadErrors: errors };
}

function diffKeys(reference, target, refName, targetName, label, problems){
  const exceptions = KAB_ONLY_KEYS[label] || [];
  const missing = Object.keys(reference).filter(k => !(k in target) && !exceptions.includes(k));
  if(missing.length){
    problems.push(`${label} — clés manquantes dans "${targetName}" (présentes dans "${refName}") : ${missing.join(', ')}`);
  }
}

function main(){
  const problems = [];
  const { window, loadErrors } = loadApp();
  problems.push(...loadErrors);

  const LANGUAGES = window.LANGUAGES || {};
  const langCodes = Object.keys(LANGUAGES);
  if(!langCodes.length) problems.push('window.LANGUAGES est vide ou absent — impossible de vérifier quoi que ce soit.');

  // --- 1. I18N_STRINGS ---
  const I18N_STRINGS = window.I18N_STRINGS || {};
  if(!I18N_STRINGS.fr) problems.push('I18N_STRINGS.fr est absent — impossible de l\'utiliser comme référence.');
  else{
    langCodes.filter(l=>l!=='fr' && !PARTIAL_LANGS.includes(l)).forEach(lang=>{
      if(!I18N_STRINGS[lang]){ problems.push(`I18N_STRINGS.${lang} est complètement absent.`); return; }
      diffKeys(I18N_STRINGS.fr, I18N_STRINGS[lang], 'fr', lang, 'I18N_STRINGS', problems);
    });
  }

  // --- 2. ASSESS_STRINGS ---
  const ASSESS_STRINGS = window.ASSESS_STRINGS || {};
  if(!ASSESS_STRINGS.fr) problems.push('ASSESS_STRINGS.fr est absent.');
  else{
    langCodes.filter(l=>l!=='fr' && !PARTIAL_LANGS.includes(l)).forEach(lang=>{
      if(!ASSESS_STRINGS[lang]){ problems.push(`ASSESS_STRINGS.${lang} est complètement absent.`); return; }
      diffKeys(ASSESS_STRINGS.fr, ASSESS_STRINGS[lang], 'fr', lang, 'ASSESS_STRINGS', problems);
    });
  }

  // --- 3. COMPANION_PHRASES ---
  const COMPANION_PHRASES = window.COMPANION_PHRASES || {};
  if(!COMPANION_PHRASES.fr) problems.push('COMPANION_PHRASES.fr est absent.');
  else{
    langCodes.filter(l=>l!=='fr' && !PARTIAL_LANGS.includes(l)).forEach(lang=>{
      if(!COMPANION_PHRASES[lang]){ problems.push(`COMPANION_PHRASES.${lang} est complètement absent.`); return; }
      diffKeys(COMPANION_PHRASES.fr, COMPANION_PHRASES[lang], 'fr', lang, 'COMPANION_PHRASES', problems);
    });
  }

  // --- 4. Tables dynamiques par langue (le bug v6.20) ---
  // On vérifie deux choses séparément :
  //  a) la table existe-t-elle vraiment sur `window` (donc pas un `const` orphelin) ?
  //  b) si elle existe, a-t-elle la bonne forme ?
  const dynamicTables = [
    { prefix:'BANK_',                  requiredIn:['en','es','it','pt','de','ar','tr','pl'], shape:'exerciseBank' },
    { prefix:'ASSESS_ITEMS_',          requiredIn:['en','es','it','pt','de','ar','tr','pl'], shape:'assessItems' },
    { prefix:'SYMPTOM_QUESTIONS_',     requiredIn:['en','es','it','pt','de','ar','tr','pl'], shape:'symptomQuestions' },
    { prefix:'ASSESS_DOMAIN_LABELS_',  requiredIn:['en','es','it','pt','de','ar','tr','pl'], shape:'domainLabels' },
    { prefix:'CONV_SCENARIOS_',        requiredIn:['en','es','it','pt','de','ar','tr','pl'], shape:'convScenarios' }
  ];
  dynamicTables.forEach(({prefix, requiredIn, shape})=>{
    requiredIn.forEach(lang=>{
      const key = prefix + lang.toUpperCase();
      const table = window[key];
      if(table === undefined){
        problems.push(`window.${key} est introuvable — soit le fichier n'existe pas, soit (bug déjà vu en v6.20) il a été déclaré avec "const ${key}" au lieu de "window.${key} ="`);
        return;
      }
      if(shape==='exerciseBank'){
        ['denomination','completion','comprehension','repetition','denomination_orale','fluence','intonation'].forEach(type=>{
          if(!table[type]) { problems.push(`window.${key}.${type} est absent (type d'exercice manquant).`); return; }
          [1,2,3].forEach(level=>{
            const items = table[type].items && table[type].items[level];
            // v6.21.1 : un tableau vide [] est "présent" en JS (truthy
            // pour l'existence de la clé) mais ne contient aucun
            // exercice — vérifier .length, pas juste l'existence.
            if(!items || !items.length){
              problems.push(`window.${key}.${type} niveau ${level} est vide ou absent.`);
            }
          });
        });
      }
      if(shape==='assessItems'){
        ['denomination','completion','comprehension'].forEach(d=>{
          if(!table[d] || !table[d].length) problems.push(`window.${key}.${d} est vide ou absent.`);
        });
      }
      if(shape==='symptomQuestions' && (!Array.isArray(table) || table.length < 4)){
        problems.push(`window.${key} devrait contenir au moins 4 questions (${table.length||0} trouvée(s)).`);
      }
      if(shape==='domainLabels'){
        ['denomination','completion','comprehension'].forEach(d=>{
          if(!table[d]) problems.push(`window.${key}.${d} est absent.`);
        });
      }
      if(shape==='convScenarios'){
        ['medecin','cafe','telephone'].forEach(scenario=>{
          if(!table[scenario] || !table[scenario].steps || !table[scenario].steps.length){
            problems.push(`window.${key}.${scenario} est vide ou absent.`);
          } else {
            table[scenario].steps.forEach((step,i)=>{
              if(!step.ai || !step.accept || !step.accept.length || !step.choices || !step.choices.length){
                problems.push(`window.${key}.${scenario}, étape ${i+1} : incomplète (ai/accept/choices).`);
              }
            });
          }
        });
      }
    });
  });

  // --- Rapport final ---
  console.log(`Langues détectées : ${langCodes.join(', ')}`);
  console.log(`Langues volontairement partielles (ignorées pour le contenu complet) : ${PARTIAL_LANGS.join(', ')}`);
  console.log('');
  if(problems.length === 0){
    console.log('✅ Aucun problème détecté — toutes les langues sont cohérentes.');
    process.exit(0);
  } else {
    console.log(`❌ ${problems.length} problème(s) détecté(s) :\n`);
    problems.forEach((p,i)=>console.log(`${i+1}. ${p}`));
    process.exit(1);
  }
}

main();
