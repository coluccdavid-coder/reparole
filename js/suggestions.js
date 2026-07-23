// =====================================================================
//  BOÎTE À IDÉES ("Une idée, une remarque ?") — v6.80
//  ---------------------------------------------------------------------
//  Un seul petit module, réutilisé tel quel dans index.html, aidant.html
//  et dashboard-ortho.html (même bloc HTML dans les trois, seule la
//  source passée à submit() change) — évite de tripler la logique.
//  Voir ReParoleStore.submitSuggestion (js/storage.js) et sql/schema.sql
//  (table suggestions) pour ce qui se passe côté serveur.
// =====================================================================
const SuggestionBox = {
  async submit(source){
    const msgEl = document.getElementById('suggestion-message');
    const contactEl = document.getElementById('suggestion-contact');
    const statusEl = document.getElementById('suggestion-status');
    if(!msgEl) return;
    const message = msgEl.value.trim();
    const t = (key)=> (window.I18N ? I18N.t(key) : key);
    if(statusEl){ statusEl.textContent = ''; statusEl.style.color = ''; }

    if(!message){
      if(statusEl){ statusEl.textContent = t('suggestion_err_empty'); statusEl.style.color = 'var(--error)'; }
      return;
    }

    const { error } = await ReParoleStore.submitSuggestion(source, message, contactEl ? contactEl.value : '');
    if(error){
      if(statusEl){ statusEl.textContent = t('suggestion_err_generic'); statusEl.style.color = 'var(--error)'; }
      return;
    }

    msgEl.value = '';
    if(contactEl) contactEl.value = '';
    if(statusEl){ statusEl.textContent = t('suggestion_thanks'); statusEl.style.color = 'var(--accent-dark)'; }
  }
};

if(typeof window !== 'undefined'){ window.SuggestionBox = SuggestionBox; }
if(typeof module !== 'undefined' && module.exports){ module.exports = { SuggestionBox }; }
