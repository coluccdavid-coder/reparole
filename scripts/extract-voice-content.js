// =====================================================================
//  EXTRACTION DU CONTENU À VOIX — v6.150 (préparation des voix cloud)
//  ---------------------------------------------------------------------
//  Fait tourner l'app réelle (comme les tests) pour chaque langue
//  complète, avance manuellement à travers CHAQUE item de CHAQUE
//  exercice, et capture le texte exact que speak() recevrait — plutôt
//  que de reconstruire la logique séparément (risque de décalage si
//  le code change). Produit un manifeste JSON : {lang: [texte, ...]}.
//
//  Exclusion volontaire : le bouton "Écouter" du texte de bilan
//  (js/assessment.js, "listen_beginning") lit un texte téléversé par
//  le patient — dynamique par nature, ne peut pas être pré-généré.
//  Reste sur la synthèse vocale du navigateur, comme aujourd'hui —
//  c'est le comportement voulu, pas un oubli.
//
//  Lancer : node scripts/extract-voice-content.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LANGS = ['fr','en','es','it','pt','de','ar','tr','pl','ja'];
const SIMPLE_TYPES = ['denomination','denomination_orale','completion','comprehension','association','syntax','rhyme','story','heure','monnaie','calcul_quotidien','comparaison_nombres','prix']; // v6.164 : les 5 types d'acalculie ajoutés — absents depuis leur création (v6.156+), cette liste n'avait jamais été mise à jour depuis l'écriture du script (v6.150). Signalé par l'utilisateur : voix jamais générées pour ces exercices, donc toujours repli sur la voix du navigateur malgré la génération déjà faite pour le reste.

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
      code += `
        window.Store = Store;
        window.__testGetCurrent = function(){ return current; };
        // v6.150 : bypass volontaire de l'échantillonnage de session
        // (startExercise() ne montre qu'un sous-ensemble par séance,
        // voir FREE_QUESTIONS_PER_SESSION) — on doit couvrir CHAQUE
        // item de CHAQUE niveau pour la génération audio, pas juste ce
        // qu'une session tirerait au hasard.
        window.__testRenderItem = function(type, queue, index){
          const bankDef = (window['BANK_'+((window.Prefs&&Prefs.data.lang)||'fr').toUpperCase()] || window.BANK)[type] || window.BANK[type];
          current = { type, queue, index, total: queue.length, correctInRow:0, wrongInRow:0, _fluencyFound:[],
                      voice: !!(bankDef && bankDef.voice), fluency: type==='fluence' };
          renderQuestion();
        };
      `;
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

function extractSpeakButtonTexts(dom){
  // Les boutons "Écouter..." portent onclick="speak(...)" avec le texte
  // JSON-échappé — on laisse le vrai parseur JSON du texte du DOM s'en
  // charger plutôt que de le reconstruire à la main (fiable même si
  // le texte contient des guillemets, apostrophes, etc.)
  const texts = [];
  dom.window.document.querySelectorAll('.speak-btn').forEach(btn=>{
    const onclick = btn.getAttribute('onclick') || '';
    const m = onclick.match(/^speak\((.*)\)$/s);
    if(!m) return;
    let arg = m[1];
    // deux formes rencontrées dans le code : speak('texte') ou speak("texte" avec &quot;)
    arg = arg.replace(/&quot;/g, '"');
    try{
      if(arg.startsWith('"') || arg.startsWith("'")){
        // normalise en JSON valide puis parse
        const jsonLike = arg.startsWith('"') ? arg : arg.replace(/^'(.*)'$/s, (full, inner) => '"' + inner.replace(/\\'/g, "'").replace(/"/g,'\\"') + '"');
        texts.push(JSON.parse(jsonLike));
      }
    }catch(e){ /* forme non reconnue, ignorée volontairement plutôt que de produire une entrée fausse */ }
  });
  return texts;
}

async function main(){
  const manifest = {};

  for(const lang of LANGS){
    const dom = loadApp();
    const set = new Set();

    await dom.window.eval(`Store.savePatient('EXTRACT', {name:'Extract',level:1,sessions:0,correct:0,total:0,streak:1})`);
    dom.window.document.getElementById('name').value = 'Extract';
    dom.window.document.getElementById('code').value = 'EXTRACT';
    await dom.window.eval('login()');
    dom.window.eval(`Prefs.setLang('${lang}')`);

    const bankKey = lang==='fr' ? 'BANK' : 'BANK_'+lang.toUpperCase();
    const bank = dom.window[bankKey] || dom.window.BANK;

    for(const type of SIMPLE_TYPES){
      // v6.150 : "association" est un cas particulier — ses items
      // (des émojis, universels) ne vivent que dans BANK.association
      // (la banque française/de base), jamais dupliqués dans
      // BANK_XX puisqu'un émoji n'a pas besoin de traduction. Mais sa
      // CONSIGNE (association_prompt) est bien traduite par langue —
      // donc on utilise les items de la banque de base, tout en
      // laissant renderQuestion() (déjà positionné sur la bonne
      // langue via Prefs.setLang) produire le texte traduit. Même
      // repli que startExercise() en production pour ce cas précis.
      const typeBank = bank[type] || (type==='association' ? dom.window.BANK[type] : null);
      if(!typeBank) continue; // ex : "rhyme" n'existe que pour le français, volontairement (v6.144/149)
      [1,2,3].forEach(level=>{
        const items = typeBank.items[level];
        if(!items) return;
        // v6.150 : appelle renderQuestion() pour CHAQUE item du niveau
        // directement (voir __testRenderItem plus haut) — couvre 100%
        // du contenu, pas un échantillon de session.
        for(let i=0;i<items.length;i++){
          dom.window.eval(`__testRenderItem('${type}', ${JSON.stringify(items)}, ${i})`);
          extractSpeakButtonTexts(dom).forEach(t=>set.add(t));
        }
      });
    }

    // Assessment (bilan initial) — questions du mini-test, toutes langues/niveaux
    try{
      const symptomKey = 'SYMPTOM_QUESTIONS' + (lang==='fr' ? '' : '_'+lang.toUpperCase());
      const questions = dom.window[symptomKey] || dom.window.SYMPTOM_QUESTIONS || [];
      questions.forEach(q=>{ if(q && q.q) set.add(q.q); });
    }catch(e){}

    // Consigne de fluence : préfixe + chaque catégorie utilisée dans le contenu de cette langue
    try{
      if(bank.fluence){
        Object.values(bank.fluence.items).forEach(levelItems=>{
          levelItems.forEach(it=>{
            if(it && it.cat){
              const prefix = dom.window.I18N.t('fluency_prompt');
              set.add(prefix + ' ' + it.cat);
            }
          });
        });
      }
    }catch(e){}

    // Répétition + intonation : "écouter le mot" (mot cible fixe de la
    // banque) — v6.150, trouvé en déboguant le faible nombre de textes
    // capturés au premier passage : ce bouton vit dans une fonction de
    // rendu séparée (renderVoice), pas celle des exercices à choix
    // multiple. photos_perso est volontairement exclu : le mot y est
    // celui tapé par le patient/aidant pour SA photo, différent pour
    // chaque personne — ne peut pas être pré-généré à l'avance.
    ['repetition','intonation'].forEach(type=>{
      if(!bank[type]) return;
      [1,2,3].forEach(level=>{
        const items = bank[type].items[level];
        if(!items) return;
        items.forEach(it=>{ if(it && it.word) set.add(it.word); });
      });
    });

    manifest[lang] = [...set].filter(t => t && t.trim().length > 0);
    console.log(lang, ':', manifest[lang].length, 'textes uniques');
  }

  fs.writeFileSync(path.join(ROOT, 'scripts/voice-manifest.json'), JSON.stringify(manifest, null, 2));
  const total = Object.values(manifest).reduce((n,a)=>n+a.length, 0);
  console.log('\nTotal :', total, 'textes à générer, dans', LANGS.length, 'langues.');
  console.log('Écrit dans scripts/voice-manifest.json');
}

main();
