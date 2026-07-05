// =====================================================================
//  CONVERSATION GUIDÉE (v4)
//  ---------------------------------------------------------------------
//  ⚠️ Ce n'est PAS une IA générative : aucun dialogue libre, aucun texte
//  n'est généré par un modèle de langage. Ce sont des parcours SCRIPTÉS,
//  écrits à l'avance, avec un jeu fermé de réponses attendues — comme le
//  reste de l'application. Une conversation vraiment libre nécessiterait
//  un modèle de langage et des garde-fous spécifiques à un usage santé,
//  à n'envisager qu'avec validation clinique (voir README).
//
//  Chaque scénario = une suite d'échanges. À chaque étape :
//   - l'assistant "dit" sa réplique (synthèse vocale) ;
//   - le patient répond, au choix : à voix haute (micro) ou en touchant
//     la phrase correspondante (accessible si le micro n'est pas
//     disponible ou si la voix est difficile ce jour-là) ;
//   - la réponse est comparée aux formulations attendues (tolérance,
//     comme pour les autres exercices vocaux).
// =====================================================================

const CONV_SCENARIOS = {
  medecin:{
    title:'Chez le médecin',
    icon:'🩺',
    steps:[
      { ai:"Bonjour ! Qu'est-ce qui vous amène aujourd'hui ?",
        accept:["j'ai mal", "je ne me sens pas bien", "j'ai un problème", "je viens pour un controle", "je viens pour une visite"],
        choices:["J'ai mal.", "Je viens pour un contrôle.", "Je ne me sens pas bien."] },
      { ai:"Où avez-vous mal, exactement ?",
        accept:["a la tete","au ventre","au dos","au bras","a la jambe","nulle part"],
        choices:["À la tête.", "Au dos.", "Nulle part, c'est un contrôle."] },
      { ai:"Depuis combien de temps ?",
        accept:["depuis hier","depuis une semaine","depuis longtemps","depuis ce matin"],
        choices:["Depuis hier.", "Depuis une semaine.", "Depuis ce matin."] },
      { ai:"Très bien, merci. Avez-vous des questions pour moi ?",
        accept:["oui","non","j'ai une question"],
        choices:["Non, merci.", "Oui, j'ai une question."] }
    ]
  },
  cafe:{
    title:'Au café',
    icon:'☕',
    steps:[
      { ai:"Bonjour, qu'est-ce que je vous sers ?",
        accept:["un cafe","un the","un jus d'orange","une eau","un chocolat chaud"],
        choices:["Un café, s'il vous plaît.", "Un thé.", "Une eau."] },
      { ai:"Sur place ou à emporter ?",
        accept:["sur place","a emporter"],
        choices:["Sur place.", "À emporter."] },
      { ai:"Voulez-vous autre chose avec ça ?",
        accept:["non merci","oui un croissant","oui un gateau"],
        choices:["Non, merci.", "Oui, un croissant."] },
      { ai:"Voilà, ça fera trois euros cinquante. Bonne journée !",
        accept:["merci","au revoir","merci beaucoup"],
        choices:["Merci, au revoir.", "Merci beaucoup."] }
    ]
  },
  telephone:{
    title:'Appel téléphonique',
    icon:'📞',
    steps:[
      { ai:"Allô, bonjour ?",
        accept:["bonjour","allo bonjour","allo"],
        choices:["Bonjour.", "Allô, bonjour."] },
      { ai:"C'est de la part de qui ?",
        accept:["c'est moi-meme","c'est de la part de"],
        choices:["C'est moi-même.", "C'est de la part de..."] },
      { ai:"Je vous appelle pour prendre rendez-vous. Quel jour vous conviendrait ?",
        accept:["lundi","mardi","mercredi","jeudi","vendredi","n'importe quel jour"],
        choices:["Lundi.", "Mercredi.", "N'importe quel jour."] },
      { ai:"Parfait, c'est noté. Bonne journée à vous !",
        accept:["merci","au revoir","bonne journee a vous aussi"],
        choices:["Merci, au revoir.", "Bonne journée à vous aussi."] }
    ]
  }
};

const Conversation = {
  state:null,

  _el(){ return document.getElementById('conv-body'); },

  // Écran d'accueil : choix du scénario
  menu(){
    const cards = Object.entries(CONV_SCENARIOS).map(([key,s])=>`
      <div class="ex-item" onclick="Conversation.start('${key}')">
        <div class="ex-icon">${s.icon}</div>
        <div><div class="t">${s.title}</div><div class="d">${s.steps.length} échanges guidés</div></div>
      </div>`).join('');
    this._el().innerHTML = `
      <div class="card">
        <h3>Choisissez une mise en situation</h3>
        <p style="color:var(--ink-soft);font-size:.88rem;margin-bottom:14px">
          Ce sont des parcours préparés à l'avance (pas de dialogue libre), pour vous entraîner
          à des échanges du quotidien, à votre rythme.
        </p>
        <div class="ex-list">${cards}</div>
      </div>`;
  },

  start(key){
    const scenario = CONV_SCENARIOS[key];
    this.state = { key, scenario, index:0, ok:0, total:scenario.steps.length, given:null };
    this._renderStep();
  },

  _renderStep(){
    const st=this.state, step=st.scenario.steps[st.index];
    const warn = (typeof voiceSupported==='function' && voiceSupported()) ? '' :
      `<div class="voice-warn">⚠️ Reconnaissance vocale indisponible ici — choisissez votre réponse ci-dessous.</div>`;
    const choicesHTML = step.choices.map(c=>`<button class="choice" onclick="Conversation.answer(${JSON.stringify(c).replace(/"/g,'&quot;')})">${c}</button>`).join('');
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">${st.scenario.icon} ${st.scenario.title}</h3><span style="color:var(--ink-soft);font-size:.9rem">${st.index+1} / ${st.total}</span></div>
        <div class="progress"><span style="width:${100*st.index/st.total}%"></span></div>
        <div class="prompt-card" style="margin-top:16px">
          <div class="prompt-text" style="font-size:1rem;color:var(--ink-soft)">L'interlocuteur dit :</div>
          <div class="prompt-main" style="font-size:1.35rem">« ${step.ai} »</div>
          <button class="speak-btn" onclick="speak(${JSON.stringify(step.ai).replace(/"/g,'&quot;')})">🔊 Réécouter</button>
          <p style="margin-top:18px;color:var(--ink-soft);font-size:.9rem">À vous de répondre — à voix haute ou en choisissant ci-dessous :</p>
          <button class="mic-btn" id="mic" aria-label="Activer le microphone pour répondre" onclick="Conversation.toggleListen()">🎤</button>
          <div class="heard" id="heard"></div>${warn}
          <div class="choices" style="margin-top:18px">${choicesHTML}</div>
        </div>
      </div>`;
  },

  toggleListen(){
    if(typeof voiceSupported!=='function' || !voiceSupported()) return;
    const mic=document.getElementById('mic'), heard=document.getElementById('heard');
    if(typeof recognition!=='undefined' && recognition){ stopRecognition(); mic.classList.remove('listening'); return; }
    const step=this.state.scenario.steps[this.state.index];
    const SRlocal = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SRlocal(); recognition.lang='fr-FR'; recognition.interimResults=false; recognition.maxAlternatives=3;
    mic.classList.add('listening'); heard.innerHTML='🎧 Je vous écoute…';
    recognition.onresult=(e)=>{
      const said=[...e.results[0]].map(r=>r.transcript)[0];
      heard.innerHTML=`Entendu : <b>« ${said} »</b>`;
      mic.classList.remove('listening'); stopRecognition();
      setTimeout(()=>Conversation.answer(said),400);
    };
    recognition.onerror=(e)=>{ heard.innerHTML=`<span style="color:var(--error)">Micro indisponible (${e.error}). Choisissez une réponse.</span>`; mic.classList.remove('listening'); stopRecognition(); };
    recognition.onend=()=>{ mic.classList.remove('listening'); };
    recognition.start();
  },

  async answer(given){
    stopRecognition();
    const st=this.state, step=st.scenario.steps[st.index];
    const ok = step.accept.some(a=>isCloseEnough(given,a)) || step.choices.some(c=>isCloseEnough(given,c));
    if(ok) st.ok++;
    else if(typeof AI!=='undefined' && Store){
      // v4 : journalise l'écart pour l'orthophoniste (piste, pas un diagnostic)
      const category = AI.recordError('comprehension', step.accept[0], given);
      Store.logError(userCode, { exercise:'conversation_'+st.key, category, target:step.accept[0], given:given||'', level:user?user.level:null });
    }
    st.index++;
    if(st.index>=st.total){ this._finish(); return; }
    this._renderStep();
  },

  async _finish(){
    const st=this.state;
    if(typeof user!=='undefined' && user){
      user.sessions++; user.total+=st.total; user.correct+=st.ok;
      await Store.savePatient(userCode, user);
      await Store.logSession(userCode, { type:'conversation_'+st.key, score:st.ok, total:st.total, level:user.level });
      await Store.saveProfile(userCode, AI.dump());
    }
    this._el().innerHTML = `
      <div class="prompt-card">
        <div class="prompt-emoji">${st.ok>=st.total*0.7?'🌟':'🌱'}</div>
        <div class="prompt-main">Conversation terminée</div>
        <div class="prompt-text">${st.ok} échange(s) réussi(s) sur ${st.total}.</div>
        <button class="btn-primary" style="margin-top:20px" onclick="Conversation.menu()">Essayer une autre situation</button>
        <button class="btn-ghost" style="margin-top:12px;width:100%" onclick="goDashboard()">Revenir à l'accueil</button>
      </div>`;
  }
};

window.Conversation = Conversation;
