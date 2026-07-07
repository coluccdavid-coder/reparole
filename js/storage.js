// =====================================================================
//  COUCHE DE STOCKAGE (v6) — avec authentification réelle et RLS
//  ---------------------------------------------------------------------
//  Deux modèles d'accès cohabitent (voir sql/schema.sql pour le détail
//  et la justification) :
//
//   - L'ORTHOPHONISTE a un vrai compte Supabase Auth (email + mot de
//     passe). Une fois connecté·e, ses lectures/écritures passent par
//     les tables directement, protégées par des règles RLS strictes.
//
//   - Le PATIENT garde un simple "code de suivi" (pas de mot de passe),
//     pour rester accessible aux personnes aphasiques. Comme ce code
//     n'est pas un jeton d'authentification cryptographique, TOUT accès
//     patient passe par des fonctions RPC "security definer" côté
//     Supabase (get_patient, upsert_patient, log_session, ...) : la
//     table brute n'est plus accessible à la clé publique, seule la
//     fonction l'est, et elle exige le code exact.
//
//  Si les clés Supabase ci-dessous restent vides, l'app tourne en mode
//  navigateur (localStorage) — parfait pour tester, mais évidemment sans
//  auth ni RLS puisqu'il n'y a pas de serveur.
// =====================================================================

// 👉 POUR ACTIVER LE CLOUD : colle ici les 2 valeurs de ton projet Supabase
//    (Project Settings > API).
const SUPABASE_URL = "";      // ex : "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // la clé "anon public"

const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let supa = null;

async function initCloud(){
  if(!CLOUD_ENABLED) return;
  if(!window.supabase){
    await new Promise((res, rej)=>{
      const s=document.createElement('script');
      s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload=res; s.onerror=rej; document.head.appendChild(s);
    });
  }
  if(!supa) supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// v6 : génère un code de suivi patient long et aléatoire (remplace les
// codes courts/devinables du prototype initial). ~62^12 combinaisons.
function generateCode(){
  const alphabet='abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  let out='p-';
  for(const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

// =====================================================================
//  File d'attente hors-ligne (v5, conservée)
// =====================================================================
const PENDING_KEY = 'reparole:pending';
function _pendingList(){ return JSON.parse(localStorage.getItem(PENDING_KEY)||'[]'); }
function _pendingSave(list){ localStorage.setItem(PENDING_KEY, JSON.stringify(list)); }
let _statusListeners = [];
function _notifyStatus(){ const n=_pendingList().length; _statusListeners.forEach(cb=>{ try{cb(n);}catch(e){} }); }
function _enqueue(kind, payload){ const list=_pendingList(); list.push({kind,payload,at:Date.now()}); _pendingSave(list); _notifyStatus(); }
async function _replayOne(item){
  if(item.kind==='patient') return supa.rpc('upsert_patient', item.payload);
  if(item.kind==='session') return supa.rpc('log_session', item.payload);
  if(item.kind==='error')   return supa.rpc('log_error', item.payload);
  return { error:null };
}
async function _flushPending(){
  if(!CLOUD_ENABLED) return;
  const list=_pendingList();
  if(!list.length) return;
  await initCloud();
  const remaining=[];
  for(const item of list){
    try{ const { error } = await _replayOne(item); if(error) remaining.push(item); }
    catch(e){ remaining.push(item); }
  }
  _pendingSave(remaining);
  _notifyStatus();
}
if(typeof window !== 'undefined'){
  window.addEventListener('online', _flushPending);
  window.addEventListener('load', ()=>setTimeout(_flushPending, 1500));
}

const ReParoleStore = {
  mode(){ return CLOUD_ENABLED ? 'cloud' : 'navigateur'; },
  generateCode,
  pendingCount(){ return _pendingList().length; },
  onSaveStatusChange(cb){ _statusListeners.push(cb); cb(this.pendingCount()); },

  // =====================================================================
  //  v6 — COMPTE ORTHOPHONISTE (vrai Supabase Auth : email + mot de passe)
  // =====================================================================
  async signUpOrtho(email, password, name){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { data, error } = await supa.auth.signUp({ email, password, options:{ data:{ name } } });
    if(error) return { error };
    // Si la confirmation par email est activée sur le projet Supabase, il n'y a
    // pas encore de session ici : le compte existe, mais la fiche `orthophonists`
    // ne peut être créée que lors de la première connexion réussie (voir signInOrtho).
    if(data.session){ await this._ensureOrthoRow(data.session.user, name); }
    return { needsEmailConfirmation: !data.session };
  },
  async signInOrtho(email, password){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if(error) return { error };
    // v6.24 : double authentification (TOTP) — si le compte en a une
    // activée, on ne termine pas la connexion tout de suite : on renvoie
    // un défi à relever (code à 6 chiffres) plutôt que le profil complet.
    const { data: aal } = await supa.auth.mfa.getAuthenticatorAssuranceLevel();
    if(aal && aal.nextLevel==='aal2' && aal.currentLevel!==aal.nextLevel){
      const { data: factors } = await supa.auth.mfa.listFactors();
      const totp = factors && factors.totp && factors.totp[0];
      if(totp){
        const { data: challenge, error: chErr } = await supa.auth.mfa.challenge({ factorId: totp.id });
        if(chErr) return { error: chErr };
        return { mfaRequired:true, factorId: totp.id, challengeId: challenge.id };
      }
    }
    const row = await this._ensureOrthoRow(data.session.user);
    return { code: data.session.user.id, name: row.name, plan: row.plan || 'free' };
  },
  // v6.24 : termine la connexion après vérification du code à 6 chiffres.
  async completeMfaSignIn(factorId, challengeId, code){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { error } = await supa.auth.mfa.verify({ factorId, challengeId, code });
    if(error) return { error };
    const { data:{ session } } = await supa.auth.getSession();
    const row = await this._ensureOrthoRow(session.user);
    return { code: session.user.id, name: row.name, plan: row.plan || 'free' };
  },
  async signOutOrtho(){ if(!CLOUD_ENABLED) return; await initCloud(); await supa.auth.signOut(); },
  async getOrthoSession(){
    if(!CLOUD_ENABLED) return null;
    await initCloud();
    const { data: { session } } = await supa.auth.getSession();
    if(!session) return null;
    const row = await this._ensureOrthoRow(session.user);
    return { code: session.user.id, name: row.name, plan: row.plan || 'free' };
  },

  // =====================================================================
  //  v6.24 — DOUBLE AUTHENTIFICATION (TOTP, via Supabase Auth MFA natif)
  //  ---------------------------------------------------------------------
  //  Aucune infrastructure maison : on utilise directement l'API MFA
  //  intégrée à Supabase (supabase.auth.mfa.*), la même que pour la
  //  connexion. Fonctionne avec n'importe quelle app d'authentification
  //  standard (Google Authenticator, Authy, 1Password, etc.) puisque
  //  TOTP est un standard ouvert, pas quelque chose de propriétaire.
  // =====================================================================
  async mfaEnroll(){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    return await supa.auth.mfa.enroll({ factorType:'totp' });
  },
  async mfaChallenge(factorId){
    await initCloud();
    return await supa.auth.mfa.challenge({ factorId });
  },
  async mfaVerify(factorId, challengeId, code){
    await initCloud();
    return await supa.auth.mfa.verify({ factorId, challengeId, code });
  },
  async mfaListFactors(){
    if(!CLOUD_ENABLED) return { data:{ totp:[] } };
    await initCloud();
    return await supa.auth.mfa.listFactors();
  },
  async mfaUnenroll(factorId){
    await initCloud();
    return await supa.auth.mfa.unenroll({ factorId });
  },

  // =====================================================================
  //  v6.26 — PAIEMENT (Stripe, via Supabase Edge Function)
  //  ---------------------------------------------------------------------
  //  Aucune clé secrète ici — uniquement l'appel réseau vers l'Edge
  //  Function `create-checkout-session` (voir js/stripe-edge-functions.md),
  //  qui elle seule connaît la clé secrète Stripe. Cette fonction ne fait
  //  que demander une URL de paiement Stripe et rediriger dessus.
  // =====================================================================
  async createCheckoutSession(planKey, accountCode, accountType){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    const base = SUPABASE_URL.replace(/\/$/,'');
    const successUrl = window.location.origin + window.location.pathname + '?upgraded=1';
    const cancelUrl = window.location.origin + window.location.pathname;
    try{
      const res = await fetch(base + '/functions/v1/create-checkout-session', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+SUPABASE_ANON_KEY },
        body: JSON.stringify({ planKey, accountCode, accountType, successUrl, cancelUrl })
      });
      const data = await res.json();
      if(!res.ok || data.error) return { error:new Error(data.error || 'Erreur de paiement') };
      return { url: data.url };
    }catch(e){
      return { error:e };
    }
  },
  // Crée la ligne `orthophonists` si elle n'existe pas encore (1ère connexion
  // après confirmation d'email). Idempotent.
  async _ensureOrthoRow(authUser, fallbackName){
    const { data: existing } = await supa.from('orthophonists').select('*').eq('code', authUser.id).maybeSingle();
    if(existing) return existing;
    const name = fallbackName || authUser.user_metadata?.name || (authUser.email||'').split('@')[0] || 'Orthophoniste';
    const { data, error } = await supa.from('orthophonists')
      .upsert({ code:authUser.id, name, email:authUser.email }, { onConflict:'code' })
      .select().maybeSingle();
    if(error){ console.warn('Supabase _ensureOrthoRow:', error.message); return { code:authUser.id, name }; }
    return data;
  },

  // =====================================================================
  //  PATIENT — accès par code, via fonctions RPC en mode cloud
  // =====================================================================
  async loadPatient(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_patient', { p_code: code });
      if(error){ console.warn('Supabase get_patient:', error.message); return null; }
      const row = Array.isArray(data) ? data[0] : data;
      if(!row) return null;
      return {
        name:row.name, level:row.level, sessions:row.sessions,
        correct:row.correct, total:row.total, streak:row.streak,
        clinical_profile:row.clinical_profile || null,
        reminder_opt_in: !!row.reminder_opt_in,
        reminder_email: row.reminder_email || null,
        caregiver_code: row.caregiver_code || null,
        last_seen:row.last_seen
      };
    } else {
      const raw = localStorage.getItem('reparole:'+code);
      return raw ? JSON.parse(raw) : null;
    }
  },
  async savePatient(code, p){
    const payload = { p_code:code, p_name:p.name, p_level:p.level, p_sessions:p.sessions,
      p_correct:p.correct, p_total:p.total, p_streak:p.streak };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('upsert_patient', payload);
      if(error){ console.warn('Supabase upsert_patient (mis en attente) :', error.message); _enqueue('patient', payload); }
    } else {
      const record = { code, name:p.name, level:p.level, sessions:p.sessions, correct:p.correct, total:p.total, streak:p.streak, last_seen:new Date().toISOString() };
      localStorage.setItem('reparole:'+code, JSON.stringify({ ...(JSON.parse(localStorage.getItem('reparole:'+code)||'{}')), ...record }));
    }
  },
  async logSession(code, entry){
    const payload = { p_code:code, p_type:entry.type, p_score:entry.score, p_total:entry.total, p_level:entry.level };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('log_session', payload);
      if(error){ console.warn('Supabase log_session (mis en attente) :', error.message); _enqueue('session', payload); }
    } else {
      const key='reparole:hist:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push({ code, type:entry.type, score:entry.score, total:entry.total, level:entry.level, at:new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
    }
  },
  async history(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_history', { p_code: code });
      if(error){ console.warn(error.message); return []; }
      return data||[];
    } else {
      return JSON.parse(localStorage.getItem('reparole:hist:'+code)||'[]');
    }
  },
  async loadProfile(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_patient_profile', { p_code: code });
      if(error) return null;
      return data || null;
    } else {
      const raw = localStorage.getItem('reparole:profile:'+code);
      return raw ? JSON.parse(raw) : null;
    }
  },
  async saveProfile(code, profile){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('save_patient_profile', { p_code:code, p_profile:profile });
      if(error) console.warn('Supabase save_patient_profile:', error.message);
    } else {
      localStorage.setItem('reparole:profile:'+code, JSON.stringify(profile));
    }
  },

  // v6 : le profil clinique reste modifiable UNIQUEMENT par un orthophoniste
  // authentifié (RLS "ortho modifie ses patients") — jamais par le patient.
  async updateClinicalProfile(code, profileKey){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.from('patients').update({ clinical_profile: profileKey }).eq('code', code);
      if(error) console.warn('Supabase updateClinicalProfile:', error.message);
    } else {
      const key='reparole:'+code;
      const rec = JSON.parse(localStorage.getItem(key)||'{}');
      rec.clinical_profile = profileKey;
      localStorage.setItem(key, JSON.stringify(rec));
    }
  },
  async setReminderPrefs(code, optIn, email){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('set_reminder_prefs', { p_code:code, p_opt_in: !!optIn, p_email: email||null });
      if(error) console.warn('Supabase set_reminder_prefs:', error.message);
    } else {
      const key='reparole:'+code;
      const rec = JSON.parse(localStorage.getItem(key)||'{}');
      rec.reminder_opt_in = !!optIn; rec.reminder_email = email||null;
      localStorage.setItem(key, JSON.stringify(rec));
    }
  },

  // =====================================================================
  //  v6.35 — ESPACE AIDANT
  //  ---------------------------------------------------------------------
  //  Le patient génère/révoque son propre code aidant. L'aidant, lui,
  //  n'a que loadCaregiverData(caregiverCode) : jamais le code patient,
  //  jamais un accès aux fonctions patient existantes (get_history,
  //  get_patient...), qui exigent le VRAI code patient — voir
  //  sql/schema.sql pour le détail de get_caregiver_data.
  // =====================================================================
  async generateCaregiverCode(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('generate_caregiver_code', { p_patient_code: code });
      if(error){ console.warn('Supabase generate_caregiver_code:', error.message); return null; }
      return data;
    } else {
      const alphabet='abcdefghijklmnopqrstuvwxyz0123456789';
      const bytes = new Uint8Array(12);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      let newCode='a-';
      for(const b of bytes) newCode += alphabet[b % alphabet.length];
      const key='reparole:'+code;
      const rec = JSON.parse(localStorage.getItem(key)||'{}');
      // régénérer révoque l'ancien code, comme en mode cloud
      if(rec.caregiver_code) localStorage.removeItem('reparole:caregiver-index:'+rec.caregiver_code);
      rec.caregiver_code = newCode;
      localStorage.setItem(key, JSON.stringify(rec));
      localStorage.setItem('reparole:caregiver-index:'+newCode, code);
      return newCode;
    }
  },
  async revokeCaregiverCode(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('revoke_caregiver_code', { p_patient_code: code });
      if(error) console.warn('Supabase revoke_caregiver_code:', error.message);
    } else {
      const key='reparole:'+code;
      const rec = JSON.parse(localStorage.getItem(key)||'{}');
      if(rec.caregiver_code) localStorage.removeItem('reparole:caregiver-index:'+rec.caregiver_code);
      delete rec.caregiver_code;
      localStorage.setItem(key, JSON.stringify(rec));
    }
  },
  // Vue limitée pour l'espace aidant — jamais la fiche patient complète.
  async loadCaregiverData(caregiverCode){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_caregiver_data', { p_caregiver_code: caregiverCode });
      if(error){ console.warn('Supabase get_caregiver_data:', error.message); return null; }
      return data || null;
    } else {
      const patientCode = localStorage.getItem('reparole:caregiver-index:'+caregiverCode);
      if(!patientCode) return null;
      const rec = JSON.parse(localStorage.getItem('reparole:'+patientCode)||'{}');
      if(!rec || !rec.name) return null;
      const sessions = JSON.parse(localStorage.getItem('reparole:hist:'+patientCode)||'[]').slice(-14).reverse();
      const errors = JSON.parse(localStorage.getItem('reparole:errors:'+patientCode)||'[]');
      const cutoff = Date.now() - 30*24*60*60*1000;
      const tally = {};
      errors.filter(e => new Date(e.at).getTime() > cutoff).forEach(e=>{ tally[e.category] = (tally[e.category]||0) + 1; });
      return {
        name: rec.name, level: rec.level, streak: rec.streak, sessions: rec.sessions,
        correct: rec.correct, total: rec.total, last_seen: rec.last_seen,
        recent_sessions: sessions, error_tally: tally
      };
    }
  },

  async logError(code, entry){
    const payload = { p_code:code, p_exercise:entry.exercise, p_category:entry.category,
      p_target:entry.target||null, p_given:entry.given||null, p_level:entry.level||null };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('log_error', payload);
      if(error){ console.warn('Supabase log_error (mis en attente) :', error.message); _enqueue('error', payload); }
    } else {
      const key='reparole:errors:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push({ code, exercise:entry.exercise, category:entry.category, target:entry.target||null, given:entry.given||null, level:entry.level||null, at:new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
    }
  },
  async errorHistory(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_error_history', { p_code: code });
      if(error){ console.warn(error.message); return []; }
      return data||[];
    } else {
      return JSON.parse(localStorage.getItem('reparole:errors:'+code)||'[]');
    }
  },

  toCSV(rows, columns){
    const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
    const head = columns.map(esc).join(',');
    const body = rows.map(r=>columns.map(c=>esc(r[c])).join(',')).join('\n');
    return head+'\n'+body;
  },

  // =====================================================================
  //  TABLEAU DE BORD ORTHOPHONISTE (accès direct aux tables, protégé par RLS)
  // =====================================================================
  async assignPatient(orthoCode, patientCode){
    if(!CLOUD_ENABLED) return { error:new Error('Mode cloud requis.') };
    await initCloud();
    // Vérifie que le dossier existe avant de créer le rattachement
    // (même fonction RPC que côté patient : elle exige le code exact).
    const { data } = await supa.rpc('get_patient', { p_code: patientCode });
    const row = Array.isArray(data) ? data[0] : data;
    if(!row) return { error:new Error("Aucun dossier avec ce code.") };
    const { error } = await supa.from('patient_assignments')
      .upsert({ ortho_code:orthoCode, patient_code:patientCode }, { onConflict:'ortho_code,patient_code' });
    if(error) return { error };
    return { name: row.name };
  },
  async listPatients(orthoCode){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa
      .from('patient_assignments')
      .select('patient_code, patients(*)')
      .eq('ortho_code', orthoCode);
    if(error){ console.warn('Supabase listPatients:', error.message); return []; }
    return (data||[]).map(row=>row.patients).filter(Boolean);
  },

  // =====================================================================
  //  PHOTOS PERSONNELLES DU PATIENT (patient_media)
  //  Le bucket de stockage doit être configuré en accès non-public avec des
  //  policies dédiées — voir sql/schema.sql et HEBERGEMENT.md.
  // =====================================================================
  async addMedia(code, label, file){
    if(CLOUD_ENABLED){
      await initCloud();
      const path = code+'/'+Date.now()+'-'+file.name;
      const { error: upErr } = await supa.storage.from('patient-media').upload(path, file);
      if(upErr){ console.warn('Supabase upload media:', upErr.message); return null; }
      const { data: pub } = supa.storage.from('patient-media').getPublicUrl(path);
      const { data, error } = await supa.rpc('add_media', { p_code:code, p_label:label, p_url:pub.publicUrl });
      if(error) console.warn('Supabase add_media:', error.message);
      return data || { label, url:pub.publicUrl };
    } else {
      const url = await new Promise((res,rej)=>{
        const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);
      });
      const key='reparole:media:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      const item={ id:Date.now(), label, url };
      arr.push(item); localStorage.setItem(key, JSON.stringify(arr));
      return item;
    }
  },
  async listMedia(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('list_media', { p_code: code });
      if(error){ console.warn(error.message); return []; }
      return data||[];
    } else {
      return JSON.parse(localStorage.getItem('reparole:media:'+code)||'[]');
    }
  },
  async deleteMedia(code, id){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('delete_media', { p_code:code, p_id:id });
      if(error) console.warn('Supabase delete_media:', error.message);
    } else {
      const key='reparole:media:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]').filter(m=>m.id!==id);
      localStorage.setItem(key, JSON.stringify(arr));
    }
  },

  // =====================================================================
  //  RAPPORTS (métadonnées) — réservés à l'orthophoniste (RLS "for all")
  // =====================================================================
  async saveReportMeta(code, orthoCode, summary, periodStart, periodEnd){
    const record = { code, ortho_code:orthoCode||null, summary,
      period_start:periodStart||null, period_end:periodEnd||null, generated_at:new Date().toISOString() };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.from('reports').insert(record);
      if(error) console.warn('Supabase saveReportMeta:', error.message);
    } else {
      const key='reparole:reports:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push(record); localStorage.setItem(key, JSON.stringify(arr));
    }
  },
  async listReports(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.from('reports').select('*').eq('code', code).order('generated_at',{ascending:false});
      if(error){ console.warn(error.message); return []; }
      return data||[];
    } else {
      return JSON.parse(localStorage.getItem('reparole:reports:'+code)||'[]').reverse();
    }
  },

  // =====================================================================
  //  NOTES CLINIQUES — entièrement réservées à l'orthophoniste (RLS "for all")
  // =====================================================================
  async addNote(code, orthoCode, content){
    const record = { code, ortho_code:orthoCode||null, content, created_at:new Date().toISOString() };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.from('notes').insert(record);
      if(error) console.warn('Supabase addNote:', error.message);
    } else {
      const key='reparole:notes:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push(record); localStorage.setItem(key, JSON.stringify(arr));
    }
  },
  async listNotes(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.from('notes').select('*').eq('code', code).order('created_at',{ascending:false});
      if(error){ console.warn(error.message); return []; }
      return data||[];
    } else {
      return JSON.parse(localStorage.getItem('reparole:notes:'+code)||'[]').reverse();
    }
  }
};

window.ReParoleStore = ReParoleStore;
