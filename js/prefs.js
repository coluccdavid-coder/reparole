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
  data:{ dyslexia:false, dysFont:false, lang:'fr', shortSession:false, bigTargets:false, darkMode:false, oneHanded:false, soundFeedback:false, warmUp:false, memorySpeed:'normal', voiceURI:'', amiLevel:'normal' },

  load(){
    let hadSavedPrefs = false;
    try{
      const r=localStorage.getItem('reparole:prefs');
      if(r){ this.data={ ...this.data, ...JSON.parse(r) }; hadSavedPrefs = true; }
    }catch(e){}
    // v6.67 : première visite uniquement (aucune préférence encore
    // enregistrée) — si le navigateur/appareil est configuré en kabyle
    // (ou une autre langue de PARTIAL_LANGS), on la propose directement
    // plutôt que de toujours partir du français. Volontairement limité
    // à PARTIAL_LANGS : ce sont les langues les plus difficiles à
    // découvrir dans le sélecteur manuel, alors que les autres langues
    // déjà proposées (anglais, espagnol...) n'ont pas ce problème de
    // découvrabilité — rebasculer silencieusement tout le monde vers la
    // langue système serait plus perturbant qu'utile pour un public de
    // patients en rééducation. La bannière "langue partielle" continue
    // de s'afficher normalement dans ce cas (voir apply() ci-dessous) :
    // pas de fausse promesse de traduction complète (garde-fou n°4).
    if(!hadSavedPrefs){
      const detected = this.detectPartialLangFromBrowser();
      if(detected){ this.data.lang = detected; this.save(); }
    }
    this.apply();
  },

  // Fait correspondre navigator.languages à une langue partielle supportée
  // (sous-étiquette primaire uniquement, ex. 'kab-DZ' -> 'kab').
  detectPartialLangFromBrowser(){
    try{
      // v6.151 : sango retiré de PARTIAL_LANGS (langue retirée de l'app,
      // demandé par l'utilisateur) — repli mis à jour en cohérence.
      const partials = (typeof PARTIAL_LANGS!=='undefined' && PARTIAL_LANGS) || ['kab'];
      const candidates = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language].filter(Boolean);
      for(const raw of candidates){
        if(!raw) continue;
        const primary = raw.toLowerCase().split('-')[0];
        if(partials.includes(primary)) return primary;
      }
    }catch(e){}
    return null;
  },
  // v6.245 : protégé comme les écritures de js/storage.js. Les préférences
  // (langue, thème, profil) sont écrites à chaque changement d'écran ; si
  // le stockage est plein, l'exception cassait l'action en cours au lieu
  // de simplement ne pas mémoriser le réglage.
  save(){
    try{ localStorage.setItem('reparole:prefs', JSON.stringify(this.data)); return true; }
    catch(e){ console.warn('Préférences non mémorisées (espace du navigateur plein ?) :', e && e.name); return false; }
  },

  // v6.191 ④ : niveau d'accompagnement d'Ami (présent / discret /
  // silencieux) — LE réglage qui rend le compagnon respectueux.
  setAmiLevel(v){
    if(!['normal','discret','silencieux'].includes(v)) return;
    this.data.amiLevel = v;
    this.save();
  },

  apply(){
    document.body.classList.toggle('dys', !!this.data.dyslexia);
    document.body.classList.toggle('dys-font', !!(this.data.dyslexia && this.data.dysFont));
    // v6.68 : "cibles agrandies" — pensé pour les séquelles motrices
    // fréquentes après un AVC (tremblement, spasticité, hémiplégie...),
    // pas seulement pour le langage : agrandit les zones tactiles
    // (boutons, choix, sélecteurs) et l'espacement entre elles pour
    // réduire les appuis accidentels, quelle que soit la main utilisée.
    // Voir css/style.css (.big-targets).
    document.body.classList.toggle('big-targets', !!this.data.bigTargets);
    // v6.71 : mode sombre — confort visuel / fatigue oculaire.
    document.body.classList.toggle('dark-mode', !!this.data.darkMode);
    // v6.131 : "usage à une main" — séquelle motrice fréquente
    // post-AVC (hémiplégie). Les boutons de réponse sont déjà pleine
    // largeur (une seule colonne), donc pas de "côté" à changer — le
    // vrai problème à une main, c'est de devoir remonter en haut de
    // l'écran pour l'action principale (Suivant, Valider...) après
    // avoir lu un contenu qui dépasse la hauteur visible. Ce mode fixe
    // le bouton d'action principal en bas de l'écran, toujours
    // accessible au pouce sans avoir à faire défiler ni à utiliser une
    // deuxième main pour stabiliser l'appareil. Voir css/style.css.
    document.body.classList.toggle('one-handed', !!this.data.oneHanded);
    // reflète l'état sur les boutons s'ils existent
    document.querySelectorAll('[data-pref]').forEach(btn=>{
      btn.classList.toggle('on', !!this.data[btn.dataset.pref]);
    });
    this.renderLangSwitchers();
    const partialNote = document.getElementById('lang-partial-note');
    // v6.59 : généralisé de "kab" en dur à PARTIAL_LANGS (toute langue
    // sans traduction complète de l'interface) — voir js/i18n.js.
    if(partialNote) partialNote.style.display = (window.PARTIAL_LANGS||['kab']).includes(this.data.lang) ? '' : 'none';
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
    if(insightNote) insightNote.style.display = (window.PARTIAL_LANGS||['kab']).includes(this.data.lang) ? '' : 'none';
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
  // v6.247 : les traductions ne sont plus toutes en mémoire. On charge le
  // fichier de la langue AVANT de basculer, pour ne jamais afficher un
  // écran à moitié traduit. Si le chargement échoue (réseau coupé), on
  // bascule quand même : t() retombera sur le français, ce qui reste
  // utilisable — contrairement à un écran figé.
  setLang(lang){
    if(window.I18N && I18N.charger && !I18N.estChargee(lang)){
      const suite = () => this._setLangMaintenant(lang);
      I18N.charger(lang).then(suite, suite);
      return;
    }
    this._setLangMaintenant(lang);
  },

  _setLangMaintenant(lang){
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
    // v6.92 : les voix disponibles dépendent de la langue (ex : les voix
    // arabes ne sont pas les mêmes que les voix anglaises) — la liste
    // doit se rafraîchir à chaque changement de langue, pas rester
    // figée sur celle de la langue précédente.
    if(typeof renderVoiceSelector==='function') renderVoiceSelector();
    // v6.76 : même correctif que ci-dessus pour aidant.html (conseils du
    // jour, salutation, date de dernière séance — tout ça vient de
    // js/caregiver.js, pas de [data-i18n]).
    if(typeof renderCaregiverDashboard==='function'){
      const cgEl = document.getElementById('caregiver-dashboard');
      if(cgEl && cgEl.classList.contains('active') && typeof caregiverData!=='undefined' && caregiverData) renderCaregiverDashboard();
    }
    // v6.76 : idem pour dashboard-ortho.html — la liste des patients et
    // le détail patient (tendance, catégories d'erreur...) sont générés
    // en JS par js/dashboard-ortho.js.
    if(window.OrthoApp && typeof OrthoApp.refreshList==='function'){
      const listEl = document.getElementById('ortho-list');
      if(listEl && listEl.classList.contains('active')) OrthoApp.refreshList();
      const detailEl = document.getElementById('ortho-detail');
      if(detailEl && detailEl.classList.contains('active') && typeof OrthoApp.refreshDetail==='function') OrthoApp.refreshDetail();
    }
  }
};
window.Prefs = Prefs;
