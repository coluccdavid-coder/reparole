// =====================================================================
//  PARCOURS D'ACCUEIL (première connexion)
//  ---------------------------------------------------------------------
//  1) Questionnaire court sur les symptômes RESSENTIS (auto-évaluation).
//  2) Bilan rapide : quelques items dans chaque domaine pour mesurer
//     objectivement les points forts / faibles.
//  3) Le résultat initialise le profil de l'IA (Learner), qui oriente
//     ensuite les exercices.
//
//  ⚠️ Ce n'est PAS un diagnostic médical. C'est un point de départ pour
//     personnaliser l'entraînement. Un bilan orthophonique réel reste
//     indispensable.
// =====================================================================

// --- Les domaines évalués, reliés aux types d'exercices ---
const ASSESS_DOMAINS = [
  { key:'denomination',  label:"Trouver le nom des objets" },
  { key:'completion',    label:"Compléter des phrases" },
  { key:'comprehension', label:"Comprendre des consignes" }
];

// --- Questionnaire symptômes (ressenti, pas de diagnostic) ---
const SYMPTOM_QUESTIONS = [
  { key:'mots',   q:"Vous arrive-t-il de chercher vos mots ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'compr',  q:"Avez-vous du mal à comprendre ce qu'on vous dit ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'parole', q:"Votre parole est-elle difficile à articuler ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'lecture',q:"La lecture vous demande-t-elle beaucoup d'effort ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] }
];

// --- Bilan : 3 items rapides par domaine (niveau intermédiaire) ---
const ASSESS_ITEMS = {
  denomination:[
    {emoji:'🐶',answer:'CHIEN',choices:['CHIEN','CHAT','CHEVAL']},
    {emoji:'🚲',answer:'VÉLO',choices:['VÉLO','MOTO','VOITURE']},
    {emoji:'🌧️',answer:'PLUIE',choices:['PLUIE','NEIGE','SOLEIL']}
  ],
  completion:[
    {text:'Je bois mon café dans une ___',answer:'TASSE',choices:['TASSE','CHAISE','PORTE']},
    {text:'La nuit, je vois la ___',answer:'LUNE',choices:['LUNE','TABLE','MAIN']},
    {text:'Pour couper le pain, je prends un ___',answer:'COUTEAU',choices:['COUTEAU','LIVRE','VERRE']}
  ],
  comprehension:[
    {text:'Quel animal vole ?',answer:"L'OISEAU",choices:["L'OISEAU",'LE CHIEN','LE POISSON']},
    {text:'Où range-t-on les livres ?',answer:'SUR UNE ÉTAGÈRE',choices:['SUR UNE ÉTAGÈRE','DANS LE FRIGO','DANS LA BAIGNOIRE']},
    {text:'Que fait-on avec des ciseaux ?',answer:'COUPER',choices:['COUPER','BOIRE','DORMIR']}
  ]
};

// =====================================================================
//  v6 — TRADUCTION PARTIELLE EN KABYLE DU BILAN INITIAL
//  ---------------------------------------------------------------------
//  Même principe de prudence que js/exercises-kab.js : les mots isolés
//  (dénomination) sont traduits et vérifiés auprès de sources kabyles
//  (Glosbe, kabyle.com). Les phrases complètes (questionnaire de
//  ressenti, complétion, compréhension) restent en français : elles
//  demandent des accords grammaticaux que je préfère laisser à une
//  relecture native plutôt que d'improviser. Voir js/exercises-kab.js
//  pour le détail de cette règle.
// =====================================================================
const ASSESS_ITEMS_KAB = {
  denomination:[
    // aqjun = chien (confirmé) / amcic = chat (confirmé) / aɛewdiw = cheval (non vérifié par une source)
    {emoji:'🐶',answer:'AQJUN',choices:['AQJUN','AMCIC','AƐEWDIW']},
    // avilu = vélo (confirmé Wiktionnaire+Glosbe) / takeṛṛust = voiture (confirmé) / aɛewdiw = cheval (non vérifié par une source, réutilisé comme distracteur faute de mot vérifié pour "moto")
    {emoji:'🚲',answer:'AVILU',choices:['AVILU','TAKEṚṚUST','AƐEWDIW']},
    // ageffur = pluie (confirmé Glosbe) / adfel = neige (confirmé Glosbe) / tafukt = soleil (confirmé)
    {emoji:'🌧️',answer:'AGEFFUR',choices:['AGEFFUR','ADFEL','TAFUKT']}
  ]
  // completion, comprehension : restent en français (voir note ci-dessus).
};

// Textes d'interface du bilan (français / kabyle). Les questions de
// ressenti et les phrases de complétion/compréhension restent en
// français dans les deux langues (voir note ci-dessus).
const ASSESS_STRINGS = {
  fr:{
    welcome:'Bienvenue', welcome_p1:"Avant de commencer, prenons un instant pour mieux vous connaître. Cela nous aidera à choisir les exercices les plus utiles pour vous.",
    welcome_p2:"Il y a quelques étapes courtes. Il n'y a pas de bonne ou mauvaise façon de répondre.",
    not_diagnosis:"ℹ️ Ce test n'est pas un diagnostic médical. Il sert uniquement à personnaliser votre entraînement.",
    start:'Commencer', ready:'Je suis prêt·e',
    small_test:'Petit test', small_test_p:"Quelques questions simples pour repérer ensemble vos points forts et ce qu'on peut travailler. Prenez votre temps.",
    partial_kab_note:"ℹ️ Certaines questions de ce bilan restent en français pour l'instant (voir « à propos » pour le détail).",
    import_title:'Avez-vous un bilan ?',
    import_p1:"Si vous avez un compte-rendu (orthophonique, médical…), vous pouvez le déposer. L'application l'affichera pour vous aider à repérer les points à travailler, puis l'effacera aussitôt.",
    import_note:"🔒 Votre fichier reste sur votre appareil. Il n'est ni envoyé, ni enregistré. Il est effacé dès que vous quittez cette étape.",
    import_upload:'📎 Cliquez pour choisir un fichier (PDF ou texte)',
    skip_step:'Passer cette étape →',
    symptoms_note:"ℹ️ Ces questions restent en français pour l'instant.",
    result_title:'Votre point de départ', result_thanks:"Merci ! Voici ce que j'ai compris pour bien démarrer :",
    priority_label:'À travailler en priorité', level_label:'Niveau de départ conseillé',
    result_disclaimer:"ℹ️ Ceci personnalise votre entraînement, mais ne remplace pas un bilan orthophonique.",
    begin_exercises:'Commencer mes exercices',
    imported_from_bilan:"D'après votre bilan"
  },
  kab:{
    welcome:'Ansuf', welcome_p1:"Send ad nebdu, a nefk kra n wakud akken a k-nissin ugar. Ayagi ad aɣ-yeɛawen a nefren isuraf ilhan i kečč.",
    welcome_p2:"Llan kra n yiwenniten iwezlanen. Ulac tiririt tameqqrant neɣ tadeffirt.",
    not_diagnosis:"ℹ️ Ahil-agi mačči d asenqed uzeddig. Ipseqdac kan akken ad nsezgi aselmed-ik.",
    start:'Bdu', ready:'Heggaɣ',
    small_test:'Aqerru amecṭuḥ', small_test_p:"Kra n yisteqsiyen fessusen akken a d-naf yigerrujen-ik akked wayen izemren ad yettwaselmed. Awi-d lweqt-ik.",
    partial_kab_note:"ℹ️ Kra n yisteqsiyen n ubeddel-agi mazal-iten s tefransist alamma tura.",
    skip_step:'Ɛeddi asuraf-agi →',
    symptoms_note:"ℹ️ Isteqsiyen-agi mazal-iten s tefransist alamma tura.",
    // v6.2 : l'écran "Avez-vous un bilan ?" reste volontairement en français
    // (pas de clés import_* ici) — c'est un texte sur la confidentialité
    // d'un fichier médical (jamais envoyé, effacé aussitôt) : une nuance de
    // sens mal traduite ici serait plus grave qu'ailleurs. Repli automatique
    // sur le français (I18N.t), avec cette note pour l'expliquer :
    import_partial_note:"ℹ️ Aggur-agi yeqqim s tefransist: d awal ɣef tbaḍnit n ufaylu-inek, ur t-yebɣi ara lɣelṭ."
  }
};
function AS(key){
  const lang=(window.Prefs && Prefs.data.lang) || 'fr';
  return (ASSESS_STRINGS[lang] && ASSESS_STRINGS[lang][key]) || ASSESS_STRINGS.fr[key] || key;
}

const Assessment = {
  state:null,

  // Démarre tout le parcours d'accueil. onDone(profileSeed) est appelé à la fin.
  start(onDone){
    this.state = { step:'intro', symptomIdx:0, symptoms:{}, domainIdx:0, itemIdx:0, scores:{},
                   importedPriorities:[], onDone };
    ASSESS_DOMAINS.forEach(d=>this.state.scores[d.key]={ok:0,total:0});
    this._render();
  },

  _el(){ return document.getElementById('assess-body'); },

  _render(){
    const s=this.state;
    if(s.step==='intro') return this._intro();
    if(s.step==='import') return this._import();
    if(s.step==='symptoms') return this._symptom();
    if(s.step==='bilanIntro') return this._bilanIntro();
    if(s.step==='bilan') return this._bilanItem();
    if(s.step==='result') return this._result();
  },

  _intro(){
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">👋</div>
        <div class="prompt-main" style="text-align:center;font-size:1.6rem">${AS('welcome')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('welcome_p1')}</p>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('welcome_p2')}</p>
        <div class="voice-warn" style="background:var(--accent-soft);color:var(--accent-dark)">${AS('not_diagnosis')}</div>
        ${(window.Prefs && Prefs.data.lang==='kab') ? `<div class="voice-warn" style="margin-top:8px">${AS('partial_kab_note')}</div>` : ''}
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.next()">${AS('start')}</button>
      </div>`;
  },

  // ÉTAPE OPTIONNELLE : déposer un bilan existant. Le fichier est lu UNIQUEMENT
  // dans le navigateur, jamais envoyé ni stocké, et effacé après lecture.
  // La personne reste décideuse : elle coche elle-même les points à travailler.
  _import(){
    const kabNote = (window.Prefs && Prefs.data.lang==='kab') ? `<div class="voice-warn" style="margin-bottom:10px">${AS('import_partial_note')}</div>` : '';
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">📄</div>
        <div class="prompt-main" style="text-align:center;font-size:1.45rem">${AS('import_title')}</div>
        ${kabNote}
        <p style="color:var(--ink-soft);margin-top:10px">${AS('import_p1')}</p>
        <div class="erased-note">${AS('import_note')}</div>
        <div class="upload-zone" onclick="document.getElementById('bilan-file').click()">
          ${AS('import_upload')}
          <input id="bilan-file" type="file" accept=".pdf,.txt,text/plain,application/pdf" style="display:none" onchange="Assessment.readFile(this.files[0])">
        </div>
        <div id="bilan-output"></div>
        <button class="btn-ghost" style="margin-top:18px;width:100%" onclick="Assessment.skipImport()">${AS('skip_step')}</button>
      </div>`;
  },

  async readFile(file){
    if(!file) return;
    const out=document.getElementById('bilan-output');
    out.innerHTML=`<p style="color:var(--ink-soft);margin-top:12px">Lecture en cours…</p>`;
    let text='';
    try{
      if(file.type==='application/pdf' || file.name.toLowerCase().endsWith('.pdf')){
        text = await this._readPdf(file);
      } else {
        text = await file.text();
      }
    }catch(e){ text=''; console.warn('Lecture bilan:', e); }

    // EFFACEMENT immédiat : on ne garde aucune référence au fichier
    try{ document.getElementById('bilan-file').value=''; }catch(e){}

    if(!text || !text.trim()){
      out.innerHTML=`<div class="voice-warn">Je n'ai pas réussi à lire ce fichier (il est peut-être scanné en image). Vous pouvez cocher manuellement vos points à travailler ci-dessous.</div>${this._checklistHTML()}`;
      return;
    }
    // Affichage du texte (lecture seule) + bouton pour l'écouter + checklist
    const safe = text.replace(/[<>]/g,'').slice(0, 4000);
    out.innerHTML=`
      <p style="margin-top:14px;font-weight:600">Contenu lu (non enregistré) :</p>
      <div class="bilan-text" id="bilan-text">${safe}</div>
      <button class="speak-btn" onclick="speak(document.getElementById('bilan-text').textContent.slice(0,600))">🔊 Écouter le début</button>
      <p style="margin-top:16px;font-weight:600">D'après ce bilan, que souhaitez-vous travailler en priorité ?</p>
      ${this._checklistHTML()}
      <div class="erased-note">Ce texte sera effacé quand vous continuerez. Seuls vos choix cochés seront conservés.</div>`;
    // suggestion : si le texte mentionne un domaine, on pré-coche
    this._autoSuggest(text);
  },

  _readPdf(file){
    return new Promise(async (resolve,reject)=>{
      try{
        if(!window.pdfjsLib){
          await new Promise((res,rej)=>{ const s=document.createElement('script');
            s.src='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs'; s.type='module';
            s.onload=res; s.onerror=rej; document.head.appendChild(s); });
        }
        // pdf.min.mjs expose pdfjsLib en module ; fallback simple si indisponible
        const lib = window.pdfjsLib;
        if(!lib){ return resolve(''); }
        const buf = await file.arrayBuffer();
        const pdf = await lib.getDocument({data:buf}).promise;
        let txt='';
        for(let i=1;i<=pdf.numPages;i++){
          const page=await pdf.getPage(i); const c=await page.getTextContent();
          txt += c.items.map(it=>it.str).join(' ')+'\n';
        }
        resolve(txt);
      }catch(e){ resolve(''); }
    });
  },

  _checklistHTML(){
    return `<div class="bilan-checklist">`+ASSESS_DOMAINS.map(d=>
      `<label class="bilan-check"><input type="checkbox" value="${d.key}" onchange="Assessment.togglePriority('${d.key}',this.checked)"> <span>${d.label}</span></label>`
    ).join('')+`</div>
    <button class="btn-primary" style="margin-top:14px" onclick="Assessment.confirmImport()">Valider mes choix et continuer</button>`;
  },
  _autoSuggest(text){
    const t=text.toLowerCase();
    const map={denomination:['dénomination','manque du mot','trouver les mots','anomie'],
      completion:['syntaxe','phrase','grammaire','construction'],
      comprehension:['compréhension','comprendre','réceptif']};
    // mots qui signalent qu'un domaine est au contraire préservé (on ne coche pas)
    const preserved=['préservé','preserve','intact','normal','bon niveau','sans difficulté'];
    for(const [key,kw] of Object.entries(map)){
      const idx = kw.map(k=>t.indexOf(k)).filter(i=>i>=0);
      if(!idx.length) continue;
      // si "préservé/normal" apparaît juste après le mot-clé, on ne pré-coche pas
      const near = idx.some(i=>{ const window=t.slice(i, i+60); return preserved.some(p=>window.includes(p)); });
      if(near) continue;
      const box=document.querySelector(`.bilan-check input[value="${key}"]`);
      if(box && !box.checked){ box.checked=true; this.togglePriority(key,true); }
    }
  },
  togglePriority(key,on){
    const s=this.state; s.importedPriorities=s.importedPriorities.filter(k=>k!==key);
    if(on) s.importedPriorities.push(key);
  },
  confirmImport(){
    // on efface tout contenu affiché du bilan ; seuls les choix cochés restent
    const out=document.getElementById('bilan-output'); if(out) out.innerHTML='';
    this.state.step='symptoms'; this._render();
  },
  skipImport(){ this.state.step='symptoms'; this._render(); },

  _symptom(){
    const s=this.state, qq=SYMPTOM_QUESTIONS[s.symptomIdx];
    const opts=qq.options.map(([lab,val])=>`<button class="choice" onclick="Assessment.answerSymptom('${qq.key}',${val})">${lab}</button>`).join('');
    const kabNote = (window.Prefs && Prefs.data.lang==='kab') ? `<div class="voice-warn" style="margin-bottom:10px">${AS('symptoms_note')}</div>` : '';
    this._el().innerHTML=`
      <div class="ex-header"><h2 style="font-size:1.2rem">Vos ressentis</h2><span style="color:var(--ink-soft);font-size:.9rem">${s.symptomIdx+1} / ${SYMPTOM_QUESTIONS.length}</span></div>
      ${kabNote}
      <div class="prompt-card">
        <div class="prompt-main" style="font-size:1.4rem">${qq.q}</div>
        <button class="speak-btn" onclick="speak('${qq.q.replace(/'/g,"\\'")}')">🔊 Écouter la question</button>
      </div>
      <div class="choices">${opts}</div>`;
  },
  answerSymptom(key,val){
    const s=this.state; s.symptoms[key]=val; s.symptomIdx++;
    if(s.symptomIdx>=SYMPTOM_QUESTIONS.length){ s.step='bilanIntro'; }
    this._render();
  },

  _bilanIntro(){
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">📝</div>
        <div class="prompt-main" style="text-align:center;font-size:1.5rem">${AS('small_test')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('small_test_p')}</p>
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.next()">${AS('ready')}</button>
      </div>`;
  },

  _bilanItem(){
    const s=this.state;
    const domain=ASSESS_DOMAINS[s.domainIdx];
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    // v6 : seule la dénomination a une version kabyle vérifiée pour l'instant
    const useKab = lang==='kab' && domain.key==='denomination' && ASSESS_ITEMS_KAB.denomination;
    const items=useKab ? ASSESS_ITEMS_KAB[domain.key] : ASSESS_ITEMS[domain.key];
    const q=items[s.itemIdx];
    const totalItems=ASSESS_DOMAINS.reduce((n,d)=>n+ASSESS_ITEMS[d.key].length,0);
    const doneItems=ASSESS_DOMAINS.slice(0,s.domainIdx).reduce((n,d)=>n+ASSESS_ITEMS[d.key].length,0)+s.itemIdx;
    let promptHTML='', consigne='';
    if(domain.key==='denomination'){
      consigne = useKab ? BANK_KAB.denomination.consigne : 'Quel est ce mot ?';
      promptHTML=`<div class="prompt-emoji">${q.emoji}</div><div class="prompt-text">${consigne}</div>`;
    }
    else if(domain.key==='completion'){ promptHTML=`<div class="prompt-text">Complétez :</div><div class="prompt-main">${q.text.replace('___','<span class=blank>____</span>')}</div>`; consigne='Complétez : '+q.text.replace('___','...'); }
    else { promptHTML=`<div class="prompt-main" style="font-size:1.4rem">${q.text}</div>`; consigne=q.text; }
    const shuffled=[...q.choices].sort(()=>Math.random()-0.5);
    const opts=shuffled.map(ch=>`<button class="choice" onclick="Assessment.answerBilan('${ch.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')">${ch}</button>`).join('');
    // v6.3 : quand les items sont en kabyle, le titre du domaine l'est aussi
    // (évite le mélange "titre français + mots kabyles" repéré en test)
    const domainLabel = useKab ? BANK_KAB.denomination.title : domain.label;
    // v6.3 : pas de bouton "Écouter" sur la consigne kabyle — la synthèse
    // vocale du navigateur la prononcerait en français, ce qui serait faux.
    const listenBtn = useKab ? '' : `<button class="speak-btn" onclick="speak(${JSON.stringify(consigne).replace(/"/g,'&quot;')})">🔊 Écouter</button>`;
    this._el().innerHTML=`
      <div class="ex-header"><h2 style="font-size:1.2rem">${domainLabel}</h2><span style="color:var(--ink-soft);font-size:.9rem">${doneItems+1} / ${totalItems}</span></div>
      <div class="progress"><span style="width:${100*doneItems/totalItems}%"></span></div>
      <div class="prompt-card">${promptHTML}${listenBtn}</div>
      <div class="choices">${opts}</div>`;
  },
  answerBilan(chosen,answer){
    const s=this.state, domain=ASSESS_DOMAINS[s.domainIdx];
    const ok=chosen===answer;
    s.scores[domain.key].total++; if(ok) s.scores[domain.key].ok++;
    // marquer visuellement
    document.querySelectorAll('.choice').forEach(b=>{ b.disabled=true;
      if(b.textContent===answer) b.classList.add('correct');
      else if(b.textContent===chosen) b.classList.add('wrong'); });
    s.itemIdx++;
    const items=ASSESS_ITEMS[domain.key];
    setTimeout(()=>{
      if(s.itemIdx>=items.length){ s.itemIdx=0; s.domainIdx++; }
      if(s.domainIdx>=ASSESS_DOMAINS.length){ s.step='result'; }
      this._render();
    }, ok?700:1100);
  },

  next(){
    const s=this.state;
    if(s.step==='intro'){ s.step='import'; }
    else if(s.step==='bilanIntro'){ s.step='bilan'; }
    this._render();
  },

  // Construit le profil initial pour l'IA à partir des résultats du bilan.
  _buildSeed(){
    const s=this.state;
    const seed={ byType:{}, byTag:{}, updated:new Date().toISOString(),
                 symptoms:s.symptoms, assessedAt:new Date().toISOString() };
    // injecte les résultats du bilan comme premières observations de l'IA
    ASSESS_DOMAINS.forEach(d=>{
      const sc=s.scores[d.key];
      seed.byType[d.key]={ seen:sc.total, ok:sc.ok };
    });
    // priorités cochées par la personne d'après son bilan : on les marque comme
    // axes de travail (observations "à renforcer" sans fausser les scores réels)
    (s.importedPriorities||[]).forEach(key=>{
      if(seed.byType[key]){ seed.byType[key].flagged=true; }
    });
    seed.userPriorities = s.importedPriorities||[];
    return seed;
  },

  // Recommande un niveau de départ selon le score global du bilan
  _suggestLevel(){
    const s=this.state;
    let ok=0,total=0;
    ASSESS_DOMAINS.forEach(d=>{ ok+=s.scores[d.key].ok; total+=s.scores[d.key].total; });
    const r=total?ok/total:0.5;
    if(r<0.4) return 1;       // Doux
    if(r<0.8) return 2;       // Intermédiaire
    return 3;                 // Avancé
  },

  _result(){
    const s=this.state;
    const seed=this._buildSeed();
    const level=this._suggestLevel();
    // domaine le plus faible (à travailler en priorité)
    const sorted=[...ASSESS_DOMAINS].sort((a,b)=>{
      const ra=s.scores[a.key].total?s.scores[a.key].ok/s.scores[a.key].total:1;
      const rb=s.scores[b.key].total?s.scores[b.key].ok/s.scores[b.key].total:1;
      return ra-rb;
    });
    const weakest=sorted[0], rWeak=s.scores[weakest.key].ok+'/'+s.scores[weakest.key].total;
    const LEVEL_NAMES={1:'Doux',2:'Intermédiaire',3:'Avancé'};
    const labelOf=k=>(ASSESS_DOMAINS.find(d=>d.key===k)||{}).label||k;

    const importedBlock = (s.importedPriorities&&s.importedPriorities.length)
      ? `<div class="ai-note"><span>📄</span><div><b>${AS('imported_from_bilan')}</b>Vous avez indiqué vouloir travailler : ${s.importedPriorities.map(labelOf).join(', ')}. J'en tiens compte en priorité.</div></div>`
      : '';
    // v6.3 : "à travailler en priorité" / "niveau conseillé" restent en
    // français : labelOf() et LEVEL_NAMES ne sont pas traduits (mêmes clés
    // que le reste de l'app, voir js/i18n.js), donc mélanger juste le titre
    // en kabyle autour de valeurs françaises serait plus confus qu'utile.
    const kabResultNote = (window.Prefs && Prefs.data.lang==='kab')
      ? `<div class="voice-warn" style="margin-top:10px">ℹ️ Ce résumé reste en français (les noms d'exercices et de niveaux ne sont pas encore traduits).</div>` : '';

    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">🌱</div>
        <div class="prompt-main" style="text-align:center;font-size:1.5rem">${AS('result_title')}</div>
        <p style="color:var(--ink-soft);margin-top:12px">${AS('result_thanks')}</p>
        ${kabResultNote}
        ${importedBlock}
        <div class="ai-note" style="margin-top:12px"><span>🎯</span><div><b>${AS('priority_label')}</b>${weakest.label} (${rWeak} au test). Je vous proposerai cet entraînement en premier.</div></div>
        <div class="ai-note"><span>📊</span><div><b>${AS('level_label')}</b>${LEVEL_NAMES[level]}. Il s'ajustera automatiquement selon vos progrès.</div></div>
        <div class="voice-warn" style="background:var(--accent-soft);color:var(--accent-dark);margin-top:14px">${AS('result_disclaimer')}</div>
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.finish()">${AS('begin_exercises')}</button>
      </div>`;
    s._seed=seed; s._level=level;
  },

  finish(){
    const s=this.state;
    if(s.onDone) s.onDone({ seed:s._seed, level:s._level });
  }
};

window.Assessment = Assessment;
