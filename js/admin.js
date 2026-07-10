// =====================================================================
//  PANNEAU D'ADMINISTRATION (v6.38)
//  ---------------------------------------------------------------------
//  Connexion réservée aux comptes déjà présents dans la table `admins`
//  (ajoutés à la main par le propriétaire du projet — voir
//  sql/schema.sql). Un compte Supabase Auth normal, sans ligne dans
//  `admins`, se voit refuser l'accès par Store.signInAdmin.
// =====================================================================

let adminSession = null;

const CATEGORY_LABELS = {
  semantic:'Sémantique (mot proche par le sens)',
  phonological:'Phonologique (son proche)',
  syntax:'Syntaxe',
  omission:'Omission (pas de réponse)'
};
const KIND_LABELS = { vocabulary:'Mot isolé', sentence:'Phrase', exercise:'Idée d\'exercice' };

const AdminPanel = {
  async login(){
    const email = document.getElementById('a-email').value.trim();
    const password = document.getElementById('a-password').value;
    const errEl = document.getElementById('admin-login-error');
    errEl.textContent = '';
    if(!email || !password){ errEl.textContent = 'Email et mot de passe requis.'; return; }

    const res = await ReParoleStore.signInAdmin(email, password);
    if(res.error){ errEl.textContent = res.error.message; return; }

    adminSession = res;
    document.getElementById('admin-who').textContent = res.name;
    // v6.61 : même bug que l'espace aidant corrigé le même jour — voir
    // le commentaire détaillé dans js/caregiver.js. En résumé : .style.display
    // ne suffit pas pour admin-dashboard, qui n'a jamais la classe "active"
    // que la CSS attend ; il reste caché malgré tout, sans erreur JS.
    document.getElementById('admin-login').classList.remove('active');
    document.getElementById('admin-dashboard').classList.add('active');
    AdminPanel.renderQueue();
    AdminPanel.renderTrends();
  },

  async logout(){
    await ReParoleStore.signOutAdmin();
    adminSession = null;
    document.getElementById('admin-dashboard').classList.remove('active');
    document.getElementById('admin-login').classList.add('active');
    document.getElementById('a-email').value = '';
    document.getElementById('a-password').value = '';
  },

  async renderQueue(){
    const el = document.getElementById('admin-queue');
    const items = await ReParoleStore.listPendingContent();
    if(!items.length){ el.innerHTML = '<p class="hint">Rien en attente pour l\'instant.</p>'; return; }

    el.innerHTML = items.map(it => {
      const p = it.payload || {};
      const preview = it.kind === 'vocabulary'
        ? `${p.emoji || ''} <b>${p.answer}</b> — choix : ${(p.choices||[]).join(', ')}`
        : it.kind === 'sentence'
        ? `<b>${p.text}</b><br>réponse : ${p.answer} — choix : ${(p.choices||[]).join(', ')}${p.translation_fr ? '<br>traduction : '+p.translation_fr : ''}`
        : `${p.content || ''}${p.translation_fr ? '<br>traduction : '+p.translation_fr : ''}`;
      return `
      <div class="patient-row" style="flex-direction:column;align-items:stretch;gap:8px;cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div>
            <span class="pro-tag" style="background:var(--accent)">${KIND_LABELS[it.kind]||it.kind}</span>
            <span style="font-size:.78rem;color:var(--ink-soft)"> ${it.language} · ${it.domain} · niveau ${it.level ?? '—'}</span>
          </div>
          <span style="font-size:.72rem;color:var(--ink-soft)">${new Date(it.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div style="font-size:.95rem">${preview}</div>
        <div style="font-size:.82rem;color:var(--ink-soft)"><b>Sources :</b> ${it.sources || '<i>non renseignées</i>'}</div>
        ${it.contributor_name || it.contributor_contact ? `<div style="font-size:.78rem;color:var(--ink-soft)">Proposé par ${it.contributor_name||'anonyme'}${it.contributor_contact ? ' ('+it.contributor_contact+')' : ''}</div>` : ''}
        ${it.contributor_note ? `<div style="font-size:.78rem;color:var(--ink-soft)">Note : ${it.contributor_note}</div>` : ''}
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
    if(error){ alert("Ça n'a pas fonctionné : " + error.message); return; }
    AdminPanel.renderQueue();
  },

  async renderTrends(){
    const el = document.getElementById('admin-trends');
    const data = await ReParoleStore.getAdminTrends();
    if(!data){ el.innerHTML = '<p class="hint">Pas encore de données, ou accès non autorisé.</p>'; return; }

    const errCats = data.error_categories_30d || {};
    const sessTypes = data.sessions_by_type_30d || {};
    const errRows = Object.entries(errCats).sort((a,b)=>b[1]-a[1])
      .map(([cat,count])=>`<div class="history-row"><span>${CATEGORY_LABELS[cat]||cat}</span><span>${count}</span></div>`).join('');
    const sessRows = Object.entries(sessTypes).sort((a,b)=>b[1]-a[1])
      .map(([type,count])=>`<div class="history-row"><span>${type}</span><span>${count}</span></div>`).join('');

    el.innerHTML = `
      <p style="font-weight:600;margin-bottom:6px">Catégories d'erreurs (tous patients)</p>
      ${errRows || '<p class="hint">Aucune donnée.</p>'}
      <p style="font-weight:600;margin:14px 0 6px">Séances par type d'exercice</p>
      ${sessRows || '<p class="hint">Aucune donnée.</p>'}
    `;
  }
};

if(typeof window !== 'undefined'){ window.AdminPanel = AdminPanel; }
if(typeof module !== 'undefined' && module.exports){ module.exports = { AdminPanel }; }
