// =====================================================================
//  PRÉFÉRENCES D'ACCESSIBILITÉ
//  - Mode "lecture facilitée" (dyslexie) : interlignage et espacement
//    augmentés, texte plus grand, alignement à gauche, pas d'italique.
//  - Option police spécialisée (effet variable selon les personnes — la
//    recherche montre que l'espacement/la taille comptent davantage).
//  Les préférences sont stockées localement (toujours dans le navigateur,
//  même en mode cloud : ce sont des réglages d'affichage, pas des données
//  de santé).
// =====================================================================
const Prefs = {
  data:{ dyslexia:false, dysFont:false, lang:'fr' },

  load(){
    try{ const r=localStorage.getItem('reparole:prefs'); if(r) this.data={ ...this.data, ...JSON.parse(r) }; }catch(e){}
    this.apply();
  },
  save(){ localStorage.setItem('reparole:prefs', JSON.stringify(this.data)); },

  apply(){
    document.body.classList.toggle('dys', !!this.data.dyslexia);
    document.body.classList.toggle('dys-font', !!(this.data.dyslexia && this.data.dysFont));
    // reflète l'état sur les boutons s'ils existent
    document.querySelectorAll('[data-pref]').forEach(btn=>{
      btn.classList.toggle('on', !!this.data[btn.dataset.pref]);
    });
    this.renderLangSwitchers();
    const partialNote = document.getElementById('lang-partial-note');
    if(partialNote) partialNote.style.display = this.data.lang==='kab' ? '' : 'none';
    // v6.9 : la conversation guidée n'est traduite dans aucune langue pour
    // l'instant (scénarios de dialogue entiers, pas juste du vocabulaire) —
    // note affichée pour toute langue non française, y compris le kabyle.
    const convNote = document.getElementById('conversation-partial-note');
    if(convNote) convNote.style.display = this.data.lang!=='fr' ? '' : 'none';
    // v6.13 : "Votre assistant a appris" (AI.insight()) n'a de vraies
    // traductions que pour fr/en pour l'instant — pas encore pour le
    // kabyle (tag_* / insight_* absents de I18N_STRINGS.kab), donc
    // repli automatique sur le français. Notice affichée uniquement
    // dans ce cas précis, pas pour l'anglais qui est couvert.
    const insightNote = document.getElementById('insight-partial-note');
    if(insightNote) insightNote.style.display = this.data.lang==='kab' ? '' : 'none';
    if(window.I18N) I18N.apply(this.data.lang);
  },

  // v6.1 : génère les boutons de langue à partir de js/i18n.js (LANGUAGES),
  // dans chaque conteneur marqué data-lang-switcher — ajouter une langue au
  // registre suffit, pas besoin de toucher le HTML.
  renderLangSwitchers(){
    if(!window.LANGUAGES) return;
    document.querySelectorAll('[data-lang-switcher]').forEach(container=>{
      container.innerHTML = Object.entries(LANGUAGES).map(([code,meta])=>
        `<button class="access-toggle${code===this.data.lang?' on':''}" onclick="Prefs.setLang('${code}')">${meta.label}</button>`
      ).join('');
    });
  },

  toggle(key){
    this.data[key] = !this.data[key];
    if(key==='dyslexia' && !this.data.dyslexia) this.data.dysFont=false; // off => pas de police spéciale
    this.save(); this.apply();
  },

  // v6 : changement de langue de l'interface (français / kabyle / ...)
  setLang(lang){
    this.data.lang = lang;
    this.save(); this.apply();
  }
};
window.Prefs = Prefs;
