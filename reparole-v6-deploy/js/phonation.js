// =====================================================================
//  TENUE VOCALE MINUTÉE (v6.6)
//  ---------------------------------------------------------------------
//  Inspiré de la fiche "Le temps maximum phonatoire" (mémoire d'ortho-
//  phonie, Clermont Auvergne, 2022) : tenir un son de façon continue,
//  chronométré. C'est un exercice VOCAL ACTIF (pas juste de la
//  reconnaissance de mots) — donc plus sensible que le reste de l'app.
//  Choix de sécurité appliqués ici :
//   - Aucune comparaison à une "norme" n'est montrée au patient (les
//     repères cliniques 15-20 sec / <15 sec pathologique restent dans
//     la documentation, pas dans l'interface patient — cf. discussion
//     sur le risque d'auto-diagnostic anxiogène).
//   - Aucun encouragement à "tenir plus longtemps" ou "faire mieux que
//     la dernière fois" : la mesure est neutre, informative.
//   - Consigne explicite de confort et d'arrêt en cas de gêne.
//   - Pas d'enregistrement dans les statistiques globales de réussite
//     (il n'y a pas de "bonne réponse" ici) — seulement une mesure.
//
//  Technique : pas de reconnaissance vocale ici, mais une mesure de
//  volume via l'API Web Audio (AnalyserNode), pour détecter début/fin
//  de la phonation sans avoir à comprendre ce qui est dit.
// =====================================================================
const Phonation = {
  _stream:null, _ctx:null, _raf:null, _running:false, _startedAt:null, _lastAboveAt:null,

  intro(){
    document.getElementById('phonation-body').innerHTML = `
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">🫁</div>
        <div class="prompt-main" style="text-align:center;font-size:1.4rem">${I18N.t('ex_phonation_t')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${I18N.t('phonation_intro')}</p>
        <div class="voice-warn" style="background:var(--accent-soft);color:var(--accent-dark)">
          ${I18N.t('phonation_disclaimer')}
        </div>
        <button class="btn-primary" style="margin-top:18px" onclick="Phonation.start()">${I18N.t('phonation_ready_btn')}</button>
        <button class="btn-ghost" style="margin-top:10px;width:100%" onclick="goDashboard()">${I18N.t('phonation_cancel')}</button>
      </div>`;
  },

  async start(){
    const body=document.getElementById('phonation-body');
    try{
      this._stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    } catch(e){
      body.innerHTML = `<div class="prompt-card"><div class="voice-warn">${I18N.t('phonation_mic_error')}</div>
        <button class="btn-ghost" style="margin-top:14px;width:100%" onclick="Phonation.intro()">${I18N.t('phonation_retry')}</button></div>`;
      return;
    }
    this._ctx = new (window.AudioContext||window.webkitAudioContext)();
    const source = this._ctx.createMediaStreamSource(this._stream);
    const analyser = this._ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    body.innerHTML = `
      <div class="prompt-card" style="text-align:center">
        <p style="color:var(--ink-soft)">${I18N.t('phonation_hold_now')}</p>
        <div style="font-size:3rem;font-family:monospace;color:var(--accent-dark);margin:20px 0" id="phon-timer">0.0 s</div>
        <button class="btn-primary" onclick="Phonation.stop()">${I18N.t('phonation_stop_btn')}</button>
      </div>`;

    this._running = true; this._startedAt = null; this._lastAboveAt = null;
    const THRESHOLD = 12; // seuil d'amplitude (empirique, sur 0-128 centré)
    const loop = ()=>{
      if(!this._running) return;
      analyser.getByteTimeDomainData(data);
      let sum=0; for(let i=0;i<data.length;i++){ const v=data[i]-128; sum+=v*v; }
      const rms = Math.sqrt(sum/data.length);
      const now = performance.now();
      if(rms > THRESHOLD){
        if(!this._startedAt) this._startedAt = now;
        this._lastAboveAt = now;
      }
      const el=document.getElementById('phon-timer');
      if(el){
        const elapsed = this._startedAt ? ((this._lastAboveAt||now) - this._startedAt)/1000 : 0;
        el.textContent = elapsed.toFixed(1)+' s';
      }
      // arrêt automatique si silence prolongé après un début détecté (évite d'oublier d'arrêter)
      if(this._startedAt && now - this._lastAboveAt > 2500){ this.stop(); return; }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  async stop(){
    this._running = false;
    if(this._raf) cancelAnimationFrame(this._raf);
    const duration = (this._startedAt && this._lastAboveAt) ? (this._lastAboveAt-this._startedAt)/1000 : 0;
    if(this._stream){ this._stream.getTracks().forEach(t=>t.stop()); this._stream=null; }
    if(this._ctx){ try{ await this._ctx.close(); }catch(e){} this._ctx=null; }

    // v6.6 : mesure informative uniquement — volontairement PAS ajoutée aux
    // statistiques de réussite globales (pas de notion de "bonne réponse"
    // ici), voir l'en-tête de ce fichier.
    document.getElementById('phonation-body').innerHTML = `
      <div class="prompt-card" style="text-align:center">
        <div class="prompt-emoji">🫁</div>
        <div class="prompt-main">${duration.toFixed(1)} ${I18N.t('seconds_suffix')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${I18N.t('phonation_result_note')}</p>
        <button class="btn-primary" style="margin-top:18px" onclick="Phonation.intro()">${I18N.t('phonation_restart')}</button>
        <button class="btn-ghost" style="margin-top:10px;width:100%" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
      </div>`;
  }
};

window.Phonation = Phonation;
