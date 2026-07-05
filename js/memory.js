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

const Memory = {
  state:null,

  _el(){ return document.getElementById('memory-body'); },

  start(){
    const lengthByLevel = { 1:3, 2:4, 3:5 };
    this.state = {
      round:0, totalRounds:5,
      seqLength: lengthByLevel[user.level] || 3,
      ok:0, sequence:[], userSeq:[], showing:false
    };
    this._playRound();
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
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">Jeu de mémoire</h3><span style="color:var(--ink-soft);font-size:.9rem">Manche ${s.round+1} / ${s.totalRounds}</span></div>
        <div class="progress"><span style="width:${100*s.round/s.totalRounds}%"></span></div>
        <p style="color:var(--ink-soft);margin-top:16px">Regardez bien l'ordre d'apparition…</p>
        <div id="memory-stage" style="display:flex;gap:14px;justify-content:center;margin:24px 0;flex-wrap:wrap;min-height:70px"></div>
      </div>`;
    const stage=document.getElementById('memory-stage');
    s.sequence.forEach((sym,i)=>{
      setTimeout(()=>{
        stage.innerHTML = `<div style="font-size:3.2rem;animation:pop .3s">${sym}</div>`;
      }, i*900);
    });
    setTimeout(()=>{ stage.innerHTML=''; this._renderAnswer(); }, s.sequence.length*900 + 400);
  },

  _renderAnswer(){
    const s=this.state;
    s.showing=false;
    // grille de boutons : les symboles de la séquence + quelques leurres, mélangés
    const distractors = MEMORY_SYMBOLS.filter(sym=>!s.sequence.includes(sym)).sort(()=>Math.random()-0.5).slice(0,3);
    const choices = [...new Set([...s.sequence, ...distractors])].sort(()=>Math.random()-0.5);
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">Jeu de mémoire</h3><span style="color:var(--ink-soft);font-size:.9rem">Manche ${s.round+1} / ${s.totalRounds}</span></div>
        <div class="progress"><span style="width:${100*s.round/s.totalRounds}%"></span></div>
        <p style="color:var(--ink-soft);margin-top:16px">À vous : cliquez les images dans le même ordre.</p>
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

  async _answer(ok){
    const s=this.state;
    if(ok) s.ok++;
    // v6.6 : intégré à l'apprentissage adaptatif comme les autres exercices
    if(typeof AI!=='undefined') AI.record('memoire', 'sequence_'+s.seqLength, ok);
    const fb=document.createElement('p');
    fb.style.textAlign='center'; fb.style.marginTop='14px'; fb.style.fontWeight='600';
    fb.style.color = ok ? 'var(--accent-dark)' : 'var(--error)';
    fb.textContent = ok ? 'Bravo, le bon ordre ! 🎉' : `Pas tout à fait — la séquence était : ${s.sequence.join(' ')}`;
    this._el().querySelector('.card').appendChild(fb);
    await new Promise(r=>setTimeout(r, 1600));
    s.round++;
    this._playRound();
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
        <div class="prompt-main">Séance terminée</div>
        <div class="prompt-text">${s.ok} séquence(s) juste(s) sur ${s.totalRounds}.</div>
        <button class="btn-primary" style="margin-top:20px" onclick="Memory.start()">Recommencer</button>
        <button class="btn-ghost" style="margin-top:12px;width:100%" onclick="goDashboard()">Revenir à l'accueil</button>
      </div>`;
  }
};

window.Memory = Memory;
