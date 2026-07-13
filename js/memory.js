// =====================================================================
//  JEU DE MÉMOIRE (v6.6)
//  ---------------------------------------------------------------------
//  Inspiré par l'idée générale des "jeux de mémoire" pour la récupération
//  après un AVC (source : article de blog généraliste, pas une référence
//  clinique — voir README). Contrairement aux autres exercices, celui-ci
//  ne fait pas appel à la voix : on montre une séquence d'images, puis on
//  demande de la reproduire en cliquant dans le bon ordre. Zéro risque
//  (pas de reconnaissance vocale, pas d'effort vocal), donc un bon point
//  d'entrée pour varier les types de stimulation cognitive.
// =====================================================================
const MEMORY_SYMBOLS = ['🐱','🍎','🏠','☀️','🚗','🐟','🌹','🍞','🎈','🎵','⭐','🍋'];

// v6.74 : vitesse réglable (retour utilisateur : proposer un vrai
// "lent" pour commencer, puis monter en vitesse) — 900ms fixe
// auparavant, quel que soit le niveau. Indépendant de la longueur de
// séquence (déjà adaptée au niveau, voir lengthByLevel dans start()) :
// on peut vouloir une séquence courte ET lente, ou l'inverse.
const MEMORY_SPEED_MS = { slow:1800, normal:1100, fast:650 };
function memorySpeedMs(){
  const speed = (window.Prefs && Prefs.data && Prefs.data.memorySpeed) || 'normal';
  return MEMORY_SPEED_MS[speed] || MEMORY_SPEED_MS.normal;
}

const Memory = {
  state:null,

  _el(){ return document.getElementById('memory-body'); },

  // Reflète Prefs.data.memorySpeed sur le sélecteur (appelé à l'arrivée
  // sur l'écran, voir index.html) — un seul endroit à mettre à jour si
  // l'utilisateur avait déjà choisi une vitesse lors d'une session
  // précédente.
  renderSpeedSelect(){
    const el = document.getElementById('memory-speed-select');
    if(!el) return;
    el.value = (window.Prefs && Prefs.data && Prefs.data.memorySpeed) || 'normal';
  },
  setSpeed(speed){
    if(!MEMORY_SPEED_MS[speed]) return;
    if(window.Prefs){ Prefs.data.memorySpeed = speed; Prefs.save(); }
  },

  start(){
    // v6.24 : le jeu de mémoire reste gratuit quel que soit le type,
    // mais respecte quand même la langue et le quota journalier —
    // sinon un compte gratuit pourrait le jouer sans limite pendant que
    // les autres exercices sont bloqués, ce qui serait incohérent.
    if(typeof lockReason==='function'){
      const reason = lockReason('memory');
      if(reason && reason!=='type'){ showUpsell(reason); return; }
      if(typeof recordDailySession==='function') recordDailySession();
    }
    const lengthByLevel = { 1:3, 2:4, 3:5 };
    if(window.Companion) Companion.explain('companion-memory', 'memory');
    this.renderSpeedSelect();
    this.state = {
      round:0, totalRounds:5,
      seqLength: lengthByLevel[user.level] || 3,
      ok:0, sequence:[], userSeq:[], showing:false
    };
    // v6.77 : BUG RÉEL trouvé par un retour utilisateur — la première
    // manche démarrait immédiatement à l'arrivée sur cet écran, avant
    // même d'avoir eu le temps de toucher au sélecteur de vitesse
    // (visible mais déjà trop tard). Corrigé en affichant un écran de
    // démarrage explicite : la première manche ne se lance qu'au clic
    // sur "Commencer", pas automatiquement. Les manches suivantes,
    // elles, s'enchaînent normalement (l'utilisateur a déjà eu
    // l'occasion de régler la vitesse à ce stade).
    this._renderIntro();
  },

  _renderIntro(){
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">${I18N.t('memory_title')}</h3></div>
        <p style="color:var(--ink-soft);margin-top:16px">${I18N.t('memory_watch')}</p>
        <button class="btn-primary" style="margin-top:16px" onclick="Memory._playRound()">▶️ ${I18N.t('memory_start_btn')}</button>
      </div>`;
  },

  _playRound(){
    const s=this.state;
    if(s.round>=s.totalRounds){ this._finish(); return; }
    // tire une séquence sans répétition consécutive du même symbole
    const pool=[...MEMORY_SYMBOLS];
    s.sequence = Array.from({length:s.seqLength}, ()=> pool[Math.floor(Math.random()*pool.length)]);
    s.userSeq = [];
    s.showing = true;
    this._renderShow();
  },

  _renderShow(){
    const s=this.state;
    const stepMs = memorySpeedMs();
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">${I18N.t('memory_title')}</h3><span style="color:var(--ink-soft);font-size:.9rem">${I18N.t('memory_round', s.round+1, s.totalRounds)}</span></div>
        <div class="progress"><span style="width:${100*s.round/s.totalRounds}%"></span></div>
        <p style="color:var(--ink-soft);margin-top:16px">${I18N.t('memory_watch')}</p>
        <div id="memory-stage" style="display:flex;gap:14px;justify-content:center;margin:24px 0;flex-wrap:wrap;min-height:70px"></div>
      </div>`;
    const stage=document.getElementById('memory-stage');
    s.sequence.forEach((sym,i)=>{
      setTimeout(()=>{
        stage.innerHTML = `<div style="font-size:3.2rem;animation:pop .3s">${sym}</div>`;
      }, i*stepMs);
    });
    setTimeout(()=>{ stage.innerHTML=''; this._renderAnswer(); }, s.sequence.length*stepMs + 400);
  },

  _renderAnswer(){
    const s=this.state;
    s.showing=false;
    // grille de boutons : les symboles de la séquence + quelques leurres, mélangés
    const distractors = MEMORY_SYMBOLS.filter(sym=>!s.sequence.includes(sym)).sort(()=>Math.random()-0.5).slice(0,3);
    const choices = [...new Set([...s.sequence, ...distractors])].sort(()=>Math.random()-0.5);
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">${I18N.t('memory_title')}</h3><span style="color:var(--ink-soft);font-size:.9rem">${I18N.t('memory_round', s.round+1, s.totalRounds)}</span></div>
        <div class="progress"><span style="width:${100*s.round/s.totalRounds}%"></span></div>
        <p style="color:var(--ink-soft);margin-top:16px">${I18N.t('memory_instruction')}</p>
        <div id="memory-picked" style="min-height:50px;display:flex;gap:10px;justify-content:center;margin:14px 0;font-size:2rem"></div>
        <div class="choices" id="memory-choices" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          ${choices.map(sym=>`<button class="choice" style="font-size:1.8rem;padding:14px 20px" onclick="Memory.pick('${sym}',this)">${sym}</button>`).join('')}
        </div>
      </div>`;
  },

  pick(sym, btn){
    const s=this.state;
    if(s.showing) return;
    s.userSeq.push(sym);
    document.getElementById('memory-picked').innerHTML = s.userSeq.map(x=>`<span>${x}</span>`).join('');
    if(s.userSeq.length>=s.sequence.length){
      document.querySelectorAll('#memory-choices .choice').forEach(b=>b.disabled=true);
      const ok = s.userSeq.every((x,i)=>x===s.sequence[i]);
      this._answer(ok);
    }
  },

  _answer(ok){
    const s=this.state;
    if(ok) s.ok++;
    // v6.6 : intégré à l'apprentissage adaptatif comme les autres exercices
    if(typeof AI!=='undefined') AI.record('memoire', 'sequence_'+s.seqLength, ok);
    // v6.101 : un bouton "Suivant" explicite remplace l'ancien
    // enchaînement automatique à 1.6s (retour utilisateur : la
    // correction — la séquence attendue en cas d'erreur — disparaissait
    // avant d'avoir eu le temps d'être lue). Même principe que les
    // autres écrans de résultat de l'app (ex: _finish() plus bas) : on
    // laisse la main au patient pour avancer à son rythme.
    const fb=document.createElement('div');
    fb.style.textAlign='center'; fb.style.marginTop='14px';
    const msg=document.createElement('p');
    msg.style.fontWeight='600';
    msg.style.color = ok ? 'var(--accent-dark)' : 'var(--error)';
    msg.textContent = ok ? I18N.t('memory_correct') : I18N.t('memory_wrong', s.sequence.join(' '));
    fb.appendChild(msg);
    const nextBtn=document.createElement('button');
    nextBtn.className='btn-primary';
    nextBtn.id='memory-next-btn';
    nextBtn.style.marginTop='10px';
    nextBtn.textContent=I18N.t('memory_next_btn');
    nextBtn.onclick=()=>{ s.round++; this._playRound(); };
    fb.appendChild(nextBtn);
    this._el().querySelector('.card').appendChild(fb);
    nextBtn.focus();
  },

  async _finish(){
    const s=this.state;
    if(typeof user!=='undefined' && user){
      user.sessions++; user.total+=s.totalRounds; user.correct+=s.ok;
      await Store.savePatient(userCode, user);
      await Store.logSession(userCode, { type:'memoire', score:s.ok, total:s.totalRounds, level:user.level });
      await Store.saveProfile(userCode, AI.dump());
    }
    const pct = Math.round(100*s.ok/s.totalRounds);
    this._el().innerHTML = `
      <div class="prompt-card">
        <div class="prompt-emoji">${pct>=70?'🌟':'🌱'}</div>
        <div class="prompt-main">${I18N.t('session_done')}</div>
        <div class="prompt-text">${I18N.t('memory_result', s.ok, s.totalRounds)}</div>
        <button class="btn-primary" style="margin-top:20px" onclick="Memory.start()">${I18N.t('memory_restart')}</button>
        <button class="btn-ghost" style="margin-top:12px;width:100%" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
      </div>`;
  }
};

window.Memory = Memory;
