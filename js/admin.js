// =====================================================================
//  PANNEAU D'ADMINISTRATION (v6.38)
//  ---------------------------------------------------------------------
//  Connexion réservée aux comptes déjà présents dans la table `admins`
//  (ajoutés à la main par le propriétaire du projet — voir
//  sql/schema.sql). Un compte Supabase Auth normal, sans ligne dans
//  `admins`, se voit refuser l'accès par Store.signInAdmin.
// =====================================================================

let adminSession = null;

// v6.83 : VRAI BUG DE SÉCURITÉ corrigé — le contenu des propositions de
// traduction (mot, phrase, traduction, nom/contact/note du
// contributeur) s'affichait sans échappement dans cette page. C'est
// le point le plus exposé de toute l'app : `contribuer.html` est
// accessible SANS connexion, donc n'importe qui pouvait soumettre du
// HTML/JS actif qui se serait exécuté directement dans le navigateur
// de l'administrateur·rice à la simple ouverture de la file d'attente.
// Trouvé en réponse à une demande explicite de revue de sécurité.
function escapeHTML(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const CATEGORY_LABELS = {
  semantic:'Sémantique (mot proche par le sens)',
  phonological:'Phonologique (son proche)',
  syntax:'Syntaxe',
  omission:'Omission (pas de réponse)'
};
const KIND_LABELS = { vocabulary:'Mot isolé', sentence:'Phrase', exercise:'Idée d\'exercice' };
// v6.80 : boîte à idées — labels d'affichage pour la source du message
// (patient/aidant/orthophoniste/autre), voir js/suggestions.js pour
// l'envoi côté patient/aidant/ortho.
const SUGGESTION_SOURCE_LABELS = { patient:'Patient', caregiver:'Aidant∙e', ortho:'Orthophoniste', other:'Autre' };
let suggestionFilter = 'new';

const AdminPanel = {
  _pendingMfa: null,

  async login(){
    const email = document.getElementById('a-email').value.trim();
    const password = document.getElementById('a-password').value;
    const errEl = document.getElementById('admin-login-error');
    errEl.textContent = '';
    if(!email || !password){ errEl.textContent = 'Email et mot de passe requis.'; return; }

    const res = await ReParoleStore.signInAdmin(email, password);
    if(res.error){ errEl.textContent = res.error.message; return; }

    // v6.82 : double authentification — le compte peut demander un
    // second facteur avant de terminer la connexion (même mécanisme
    // que côté orthophoniste, voir js/dashboard-ortho.js).
    if(res.mfaRequired){
      AdminPanel._pendingMfa = { factorId: res.factorId, challengeId: res.challengeId };
      document.getElementById('admin-mfa-error').textContent = '';
      document.getElementById('admin-mfa-code').value = '';
      document.getElementById('admin-login').classList.remove('active');
      document.getElementById('admin-mfa-challenge').classList.add('active');
      return;
    }

    AdminPanel._afterLogin(res);
  },

  // v6.82 : extrait de login() pour être réutilisé après un défi MFA
  // réussi (submitMfaCode ci-dessous), sans dupliquer la bascule
  // d'écran et le premier rendu du tableau de bord.
  _afterLogin(res){
    adminSession = res;
    document.getElementById('admin-who').textContent = res.name;
    // v6.61 : même bug que l'espace aidant corrigé le même jour — voir
    // le commentaire détaillé dans js/caregiver.js. En résumé : .style.display
    // ne suffit pas pour admin-dashboard, qui n'a jamais la classe "active"
    // que la CSS attend ; il reste caché malgré tout, sans erreur JS.
    document.getElementById('admin-login').classList.remove('active');
    document.getElementById('admin-mfa-challenge').classList.remove('active');
    document.getElementById('admin-dashboard').classList.add('active');
    AdminPanel.renderQueue();
    AdminPanel.renderTrends();
    AdminPanel.renderSuggestions();
    AdminPanel.refreshMfaStatus();
  },

  async submitMfaCode(){
    const code = document.getElementById('admin-mfa-code').value.trim();
    const errEl = document.getElementById('admin-mfa-error');
    if(!/^\d{6}$/.test(code)){ errEl.textContent = 'Entrez les 6 chiffres du code.'; return; }
    const pending = AdminPanel._pendingMfa;
    if(!pending){ errEl.textContent = 'Session expirée, reconnectez-vous.'; AdminPanel.cancelMfaChallenge(); return; }
    const res = await ReParoleStore.completeMfaSignInAdmin(pending.factorId, pending.challengeId, code);
    if(res.error){ errEl.textContent = 'Code invalide ou expiré. Réessayez.'; return; }
    AdminPanel._pendingMfa = null;
    AdminPanel._afterLogin(res);
  },

  cancelMfaChallenge(){
    AdminPanel._pendingMfa = null;
    document.getElementById('admin-mfa-challenge').classList.remove('active');
    document.getElementById('admin-login').classList.add('active');
  },

  // v6.82 : envoie l'email de récupération depuis l'app elle-même
  // (avec le bon lien de redirection vers reset-password.html) plutôt
  // que de dépendre du bouton "Send password recovery" du tableau
  // Supabase, qui redirigeait vers l'accueil faute de page dédiée.
  async forgotPassword(){
    const email = document.getElementById('a-email').value.trim();
    const errEl = document.getElementById('admin-login-error');
    if(!email){ errEl.textContent = 'Saisissez votre email ci-dessus, puis cliquez à nouveau sur "Mot de passe oublié ?".'; return; }
    errEl.style.color = 'var(--accent-dark)';
    errEl.textContent = 'Email envoyé (si ce compte existe) — vérifiez votre boîte de réception.';
    await ReParoleStore.resetPasswordForEmail(email);
  },

  async logout(){
    await ReParoleStore.signOutAdmin();
    adminSession = null;
    document.getElementById('admin-dashboard').classList.remove('active');
    document.getElementById('admin-login').classList.add('active');
    document.getElementById('a-email').value = '';
    document.getElementById('a-password').value = '';
  },

  // =====================================================================
  //  v6.82 — GESTION DE LA DOUBLE AUTHENTIFICATION (depuis le tableau de bord)
  //  ---------------------------------------------------------------------
  //  Repris tel quel du mécanisme déjà en place côté orthophoniste
  //  (js/dashboard-ortho.js) — les fonctions ReParoleStore.mfaEnroll/
  //  mfaChallenge/mfaVerify/mfaListFactors/mfaUnenroll sont génériques,
  //  elles opèrent sur la session Supabase active quelle qu'elle soit.
  // =====================================================================
  async refreshMfaStatus(){
    const res = await ReParoleStore.mfaListFactors();
    const statusEl = document.getElementById('admin-mfa-status');
    const step1 = document.getElementById('admin-mfa-enroll-step1');
    const step2 = document.getElementById('admin-mfa-enroll-step2');
    const disableBtn = document.getElementById('admin-mfa-disable-btn');
    if(!statusEl) return;
    if(res.error){ statusEl.textContent = 'Impossible de vérifier (hors-ligne ?)'; return; }
    const verified = (res.data.totp || []).filter(f => f.status==='verified');
    if(verified.length){
      statusEl.textContent = 'Activée ✅';
      step1.style.display = 'none';
      step2.style.display = 'none';
      disableBtn.style.display = '';
    } else {
      statusEl.textContent = 'Non activée';
      step1.style.display = '';
      step2.style.display = 'none';
      disableBtn.style.display = 'none';
    }
  },

  async startMfaEnroll(){
    const msg = document.getElementById('admin-mfa-enroll-msg');
    msg.textContent = '';
    const res = await ReParoleStore.mfaEnroll();
    if(res.error){ msg.textContent = 'Erreur : ' + res.error.message; return; }
    AdminPanel._enrollFactorId = res.data.id;
    document.getElementById('admin-mfa-qr').innerHTML = res.data.totp.qr_code;
    document.getElementById('admin-mfa-secret').textContent = res.data.totp.secret;
    document.getElementById('admin-mfa-enroll-step1').style.display = 'none';
    document.getElementById('admin-mfa-enroll-step2').style.display = '';
  },

  async confirmMfaEnroll(){
    const code = document.getElementById('admin-mfa-confirm-code').value.trim();
    const msg = document.getElementById('admin-mfa-enroll-msg');
    if(!/^\d{6}$/.test(code)){ msg.textContent = "Entrez les 6 chiffres du code affiché par votre application."; return; }
    const factorId = AdminPanel._enrollFactorId;
    if(!factorId){ msg.textContent = 'Recommencez depuis le début.'; return; }
    const chRes = await ReParoleStore.mfaChallenge(factorId);
    if(chRes.error){ msg.textContent = 'Erreur : ' + chRes.error.message; return; }
    const vRes = await ReParoleStore.mfaVerify(factorId, chRes.data.id, code);
    if(vRes.error){ msg.textContent = 'Code invalide, réessayez.'; return; }
    msg.textContent = '✅ Double authentification activée.';
    document.getElementById('admin-mfa-confirm-code').value = '';
    await AdminPanel.refreshMfaStatus();
  },

  async disableMfa(){
    const msg = document.getElementById('admin-mfa-enroll-msg');
    if(!confirm('Désactiver la double authentification ? Votre compte sera protégé uniquement par le mot de passe.')) return;
    const res = await ReParoleStore.mfaListFactors();
    if(res.error){ msg.textContent = 'Erreur : ' + res.error.message; return; }
    for(const f of (res.data.totp || [])){
      await ReParoleStore.mfaUnenroll(f.id);
    }
    msg.textContent = 'Double authentification désactivée.';
    await AdminPanel.refreshMfaStatus();
  },

  async renderQueue(){
    const el = document.getElementById('admin-queue');
    const items = await ReParoleStore.listPendingContent();
    if(!items.length){ el.innerHTML = '<p class="hint">Rien en attente pour l\'instant.</p>'; return; }

    el.innerHTML = items.map(it => {
      const p = it.payload || {};
      const choices = (p.choices||[]).map(escapeHTML).join(', ');
      const preview = it.kind === 'vocabulary'
        ? `${escapeHTML(p.emoji || '')} <b>${escapeHTML(p.answer)}</b> — choix : ${choices}`
        : it.kind === 'sentence'
        ? `<b>${escapeHTML(p.text)}</b><br>réponse : ${escapeHTML(p.answer)} — choix : ${choices}${p.translation_fr ? '<br>traduction : '+escapeHTML(p.translation_fr) : ''}`
        : `${escapeHTML(p.content || '')}${p.translation_fr ? '<br>traduction : '+escapeHTML(p.translation_fr) : ''}`;
      return `
      <div class="patient-row" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div>
            <span class="pro-tag" style="background:var(--accent)">${KIND_LABELS[it.kind]||it.kind}</span>
            <span style="font-size:.78rem;color:var(--ink-soft)"> ${escapeHTML(it.language)} · ${escapeHTML(it.domain)} · niveau ${it.level ?? '—'}</span>
          </div>
          <span style="font-size:.72rem;color:var(--ink-soft)">${new Date(it.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div style="font-size:.95rem">${preview}</div>
        <div style="font-size:.82rem;color:var(--ink-soft)"><b>Sources :</b> ${it.sources || '<i>non renseignées</i>'}</div>
        ${it.contributor_name || it.contributor_contact ? `<div style="font-size:.78rem;color:var(--ink-soft)">Proposé par ${escapeHTML(it.contributor_name||'anonyme')}${it.contributor_contact ? ' ('+escapeHTML(it.contributor_contact)+')' : ''}</div>` : ''}
        ${it.contributor_note ? `<div style="font-size:.78rem;color:var(--ink-soft)">Note : ${escapeHTML(it.contributor_note)}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:4px">
          <button class="btn-primary" style="width:auto;padding:8px 16px" onclick="AdminPanel.review(${it.id},'approved')">✅ Valider</button>
          <button class="btn-ghost" style="color:#b23b3b;border-color:#b23b3b" onclick="AdminPanel.review(${it.id},'rejected')">✖ Refuser</button>
        </div>
      </div>`;
    }).join('');
  },

  async review(id, status){
    if(!adminSession) return;
    let notes = null;
    if(status === 'rejected'){
      notes = prompt('Pourquoi refuser cette proposition ? (facultatif, aide le contributeur à comprendre)') || null;
    }
    const { error } = await ReParoleStore.reviewContent(id, status, adminSession.code, notes);
    const statusEl = document.getElementById('admin-queue-status');
    if(statusEl) statusEl.textContent = '';
    if(error){ if(statusEl) statusEl.textContent = "Ça n'a pas fonctionné : " + error.message; return; }
    AdminPanel.renderQueue();
  },

  async renderTrends(){
    const el = document.getElementById('admin-trends');
    const data = await ReParoleStore.getAdminTrends();
    if(!data){ el.innerHTML = '<p class="hint">Pas encore de données, ou accès non autorisé.</p>'; return; }

    const errCats = data.error_categories_30d || {};
    const sessTypes = data.sessions_by_type_30d || {};
    const errRows = Object.entries(errCats).sort((a,b)=>b[1]-a[1])
      .map(([cat,count])=>`<div class="history-row"><span>${escapeHTML(CATEGORY_LABELS[cat]||cat)}</span><span>${count}</span></div>`).join('');
    const sessRows = Object.entries(sessTypes).sort((a,b)=>b[1]-a[1])
      .map(([type,count])=>`<div class="history-row"><span>${escapeHTML(type)}</span><span>${count}</span></div>`).join('');

    el.innerHTML = `
      <p style="font-weight:600;margin-bottom:6px">Catégories d'erreurs (tous patients)</p>
      ${errRows || '<p class="hint">Aucune donnée.</p>'}
      <p style="font-weight:600;margin:14px 0 6px">Séances par type d'exercice</p>
      ${sessRows || '<p class="hint">Aucune donnée.</p>'}
    `;
  },

  // v6.80 : boîte à idées — même page que la file de contributions,
  // mais volontairement une section à part (pas de statut
  // approuvé/refusé, pas de lien avec le contenu de l'app).
  setSuggestionFilter(filter){
    suggestionFilter = filter;
    AdminPanel.renderSuggestions();
  },

  async renderSuggestions(){
    const el = document.getElementById('admin-suggestions');
    const all = await ReParoleStore.listSuggestions();
    const items = suggestionFilter === 'all' ? all
      : suggestionFilter === 'archived' ? all.filter(s=>s.status==='archived')
      : all.filter(s=>s.status==='new');

    if(!items.length){ el.innerHTML = '<p class="hint">Rien ici pour l\'instant.</p>'; return; }

    el.innerHTML = items.map(it => `
      <div class="patient-row" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div>
            <span class="pro-tag" style="background:var(--accent)">${SUGGESTION_SOURCE_LABELS[it.source]||it.source}</span>
            ${it.status==='new' ? '<span class="pro-tag" style="background:#b23b3b;margin-left:6px">Nouveau</span>' : ''}
          </div>
          <span style="font-size:.72rem;color:var(--ink-soft)">${new Date(it.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div style="font-size:.95rem;white-space:pre-wrap">${(it.message||'').replace(/</g,'&lt;')}</div>
        ${it.contact ? `<div style="font-size:.78rem;color:var(--ink-soft)">Contact : ${it.contact.replace(/</g,'&lt;')}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:4px">
          ${it.status !== 'read' ? `<button class="btn-ghost" style="width:auto;padding:6px 14px;font-size:.8rem" onclick="AdminPanel.updateSuggestion(${it.id},'read')">Marquer lu</button>` : ''}
          ${it.status !== 'archived' ? `<button class="btn-ghost" style="width:auto;padding:6px 14px;font-size:.8rem" onclick="AdminPanel.updateSuggestion(${it.id},'archived')">Archiver</button>` : ''}
        </div>
      </div>`).join('');
  },

  async updateSuggestion(id, status){
    await ReParoleStore.updateSuggestionStatus(id, status);
    AdminPanel.renderSuggestions();
  }
};

if(typeof window !== 'undefined'){ window.AdminPanel = AdminPanel; }
if(typeof module !== 'undefined' && module.exports){ module.exports = { AdminPanel }; }
