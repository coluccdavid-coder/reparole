// =====================================================================
//  BULLE D'AIDE — survol / appui long sur les icônes et boutons peu
//  clairs (v6.33). Demande explicite de l'utilisateur.
//  ---------------------------------------------------------------------
//  Fonctionnement : délégation d'événements sur `document` plutôt qu'un
//  listener par élément — ça marche automatiquement pour tout élément
//  `[data-help="clé_i18n"]`, même ajouté dynamiquement après coup (ex :
//  Ami est re-rendu à chaque changement d'humeur, voir js/companion.js).
//
//  Comportement :
//   - Souris : survol pendant 350ms -> bulle affichée. La souris qui
//     quitte annule/masque immédiatement (pas d'affichage si on ne fait
//     que passer dessus rapidement).
//   - Clavier (accessibilité) : Tab jusqu'à l'élément (focus) -> bulle
//     affichée immédiatement ; Tab suivant (blur) -> masquée.
//   - Tactile : appui MAINTENU 500ms -> bulle affichée, ET l'action du
//     bouton (clic/toggle) est annulée pour CET appui précis (sinon la
//     bulle s'afficherait EN MÊME TEMPS que l'action se déclenche, ce
//     qui serait déroutant). Un tap normal, relâché avant 500ms,
//     déclenche l'action comme d'habitude — la bulle ne s'affiche
//     jamais pour un tap normal.
//   - Échap, ou un tap/clic ailleurs sur la page : masque la bulle
//     ouverte.
//
//  Notes :
//   - `mouseenter`/`mouseleave` ne se propagent pas en phase de bulle
//     (bubbling) par nature, mais la phase de CAPTURE existe bien pour
//     tous les événements — d'où `{capture:true}` (4ᵉ argument `true`)
//     ci-dessous : c'est la technique standard pour déléguer ces deux
//     événements sans devoir attacher un listener par élément.
//   - Elle ne dépend d'aucune structure de page précise : n'importe
//     quelle page qui charge ce fichier et ajoute `data-help="clé"` sur
//     un élément profite du mécanisme, sans autre câblage.
// =====================================================================

const HelpTooltip = {
  el: null,
  timer: null,
  longPressFired: false,
  activeTarget: null,

  _ensureEl(){
    if(this.el) return this.el;
    const div = document.createElement('div');
    div.className = 'help-tooltip';
    div.setAttribute('role', 'tooltip');
    div.setAttribute('aria-live', 'polite');
    document.body.appendChild(div);
    this.el = div;
    return div;
  },

  show(target){
    const key = target.getAttribute('data-help');
    if(!key || !window.I18N) return;
    const el = this._ensureEl();
    el.textContent = I18N.t(key);
    el.style.display = 'block';
    el.style.left = '0px'; el.style.top = '0px'; // reset avant mesure
    const r = target.getBoundingClientRect();
    const tipRect = el.getBoundingClientRect();
    let left = window.scrollX + r.left;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - tipRect.width - 12;
    if(left > maxLeft) left = Math.max(12, maxLeft);
    const top = window.scrollY + r.bottom + 8;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    this.activeTarget = target;
  },

  hide(){
    if(this.el) this.el.style.display = 'none';
    this.activeTarget = null;
  },

  init(){
    if(this._inited) return; // évite un double-branchement si init() est rappelé
    this._inited = true;

    // --- Souris ---
    document.addEventListener('mouseenter', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(!t) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(()=>this.show(t), 350);
    }, true);
    document.addEventListener('mouseleave', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(!t) return;
      clearTimeout(this.timer);
      if(this.activeTarget===t) this.hide();
    }, true);

    // --- Clavier ---
    document.addEventListener('focusin', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(t) this.show(t);
    });
    document.addEventListener('focusout', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(t && this.activeTarget===t) this.hide();
    });

    // --- Tactile : appui long ---
    document.addEventListener('touchstart', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(!t) return;
      this.longPressFired = false;
      clearTimeout(this.timer);
      this.timer = setTimeout(()=>{ this.longPressFired = true; this.show(t); }, 500);
    }, { passive:true });
    document.addEventListener('touchend', (e)=>{
      const t = e.target.closest && e.target.closest('[data-help]');
      if(!t) return;
      clearTimeout(this.timer);
      if(this.longPressFired){
        e.preventDefault(); // bloque le clic de synthèse : on montre l'aide, pas l'action du bouton
        this.longPressFired = false;
      }
    });
    document.addEventListener('touchmove', ()=>{ clearTimeout(this.timer); });
    document.addEventListener('touchcancel', ()=>{ clearTimeout(this.timer); });

    // --- Fermeture globale ---
    document.addEventListener('click', (e)=>{
      if(this.activeTarget && !(e.target.closest && e.target.closest('[data-help]'))) this.hide();
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape') this.hide();
    });
  }
};

window.HelpTooltip = HelpTooltip;
HelpTooltip.init();
