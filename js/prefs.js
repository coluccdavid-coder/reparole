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
  data:{ dyslexia:false, dysFont:false, lang:'fr', shortSession:false },

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
    // v6.22 : la conversation guidée est maintenant traduite dans 6
    // langues (EN/ES/IT/PT/DE/AR) — la notice ne doit plus s'afficher
    // que pour celles qui n'ont vraiment pas de contenu (le kabyle).
    const convNote = document.getElementById('conversation-partial-note');
    if(convNote) convNote.style.display = (this.data.lang!=='fr' && !window['CONV_SCENARIOS_'+this.data.lang.toUpperCase()]) ? '' : 'none';
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
  // v6.18 : passage à un vrai menu déroulant plutôt qu'un bouton par
  // langue — avec 8 langues au compteur (fr/kab/en/es/ar/it/pt/de), une
  // rangée de boutons devenait trop large, surtout sur mobile. Toujours
  // généré depuis js/i18n.js (LANGUAGES) : ajouter une langue au registre
  // suffit, aucune modification du HTML nécessaire.
  renderLangSwitchers(){
    if(!window.LANGUAGES) return;
    document.querySelectorAll('[data-lang-switcher]').forEach(container=>{
      const options = Object.entries(LANGUAGES).map(([code,meta])=>
        `<option value="${code}"${code===this.data.lang?' selected':''}>${meta.label}</option>`
      ).join('');
      container.innerHTML = `<select class="lang-select" aria-label="Choisir la langue / Choose language" onchange="Prefs.setLang(this.value)">${options}</select>`;
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
    // v6.24.1 : les badges "Pro" dépendent de la langue active (verrou
    // FREE_LANGS) — les rafraîchir immédiatement si le tableau de bord
    // est visible, sans attendre une prochaine navigation.
    if(typeof updateExerciseLocks==='function') updateExerciseLocks();
    // v6.49 : I18N.apply() (appelé juste au-dessus) ne touche que les
    // éléments [data-i18n] statiques — tout ce qui est généré
    // dynamiquement en JS (salutation "Bonjour Marie", niveau adapté,
    // journal, carte espace aidant, graphique...) restait figé dans
    // l'ancienne langue jusqu'au prochain rechargement complet. Corrigé
    // en regénérant le tableau de bord s'il est actuellement affiché
    // (aidant.html/admin.html n'ont pas renderDashboard : sans danger).
    if(typeof renderDashboard==='function'){
      const dashEl = document.getElementById('dashboard');
      if(dashEl && dashEl.classList.contains('active')) renderDashboard();
    }
  }
};
window.Prefs = Prefs;
