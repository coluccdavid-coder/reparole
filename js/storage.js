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
const SUPABASE_URL = "https://bwxlshedzpfaeszwktdx.supabase.co";      // ex : "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGxzaGVkenBmYWVzendrdGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjQyODEsImV4cCI6MjA5ODg0MDI4MX0.5jFrFEqNr_wbVSjjXebzO-vAWR_eR7qi_u9Lb1lbwVI"; // la clé "anon public"

const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let supa = null;

async function initCloud(){
  if(!CLOUD_ENABLED) return;
  if(!window.supabase){
    // v6.177 : le SDK est désormais AUTO-HÉBERGÉ (js/vendor/, extrait du
    // paquet npm officiel @supabase/supabase-js@2.108.2). Pourquoi :
    // 1) le chargement CDN (jsdelivr) pouvait être bloqué par un
    //    bloqueur de pub / proxy — symptôme réel constaté : « NetworkError »
    //    ou bouton de connexion muet sur la page admin ;
    // 2) recommandation de l'audit v6.171 (chaîne d'approvisionnement) :
    //    un fichier local ne peut être ni bloqué ni substitué, et il est
    //    servi par notre service worker (donc dispo hors-ligne ensuite).
    // Le CDN reste en SECOURS si le fichier local manquait (déploiement
    // partiel), version toujours figée à 2.108.2.
    const load = (src)=> new Promise((res, rej)=>{
      const s=document.createElement('script');
      s.src=src;
      s.onload=res;
      s.onerror=()=> rej(new Error('Chargement impossible : '+src));
      document.head.appendChild(s);
    });
    try{
      await load('js/vendor/supabase-2.108.2.js');
    }catch(e){
      try{
        await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2');
      }catch(e2){
        throw new Error('La bibliothèque de connexion n\'a pas pu être chargée (fichier local absent et CDN inaccessible — bloqueur de publicité ?).');
      }
    }
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
    this.logLoginEvent('ortho', row.name); // v6.97 : ne bloque jamais le login (pas de await)
    return { code: data.session.user.id, name: row.name, plan: row.plan || 'free', stripe_customer_id: row.stripe_customer_id || null };
  },
  // v6.24 : termine la connexion après vérification du code à 6 chiffres.
  async completeMfaSignIn(factorId, challengeId, code){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { error } = await supa.auth.mfa.verify({ factorId, challengeId, code });
    if(error) return { error };
    const { data:{ session } } = await supa.auth.getSession();
    const row = await this._ensureOrthoRow(session.user);
    this.logLoginEvent('ortho', row.name);
    return { code: session.user.id, name: row.name, plan: row.plan || 'free', stripe_customer_id: row.stripe_customer_id || null };
  },
  async signOutOrtho(){ if(!CLOUD_ENABLED) return; await initCloud(); await supa.auth.signOut(); },
  async getOrthoSession(){
    if(!CLOUD_ENABLED) return null;
    await initCloud();
    const { data: { session } } = await supa.auth.getSession();
    if(!session) return null;
    const row = await this._ensureOrthoRow(session.user);
    return { code: session.user.id, name: row.name, plan: row.plan || 'free', stripe_customer_id: row.stripe_customer_id || null };
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
  // v6.56 : résiliation "en 3 clics" — ouvre le Customer Portal Stripe
  // (factures, moyen de paiement, résiliation), même principe que
  // createCheckoutSession ci-dessus mais sans tarif à choisir : Stripe
  // a juste besoin de savoir QUEL client (customerId), pas quel plan.
  async createPortalSession(customerId, returnUrl){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    const base = SUPABASE_URL.replace(/\/$/,'');
    try{
      const res = await fetch(base + '/functions/v1/create-portal-session', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+SUPABASE_ANON_KEY },
        body: JSON.stringify({ customerId, returnUrl })
      });
      const data = await res.json();
      if(!res.ok || data.error) return { error:new Error(data.error || 'Erreur') };
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
        // v6.56 : correctif d'un vrai bug — ces deux champs n'étaient
        // jamais renvoyés au client, alors que isPro() lit user.plan.
        // Concrètement : un patient qui venait de payer (le webhook
        // Stripe met bien plan='pro' en base) se retrouvait "free" à
        // la prochaine connexion, puisque `user` était reconstruit à
        // partir de cet objet-ci, sans le champ plan. Trouvé en
        // câblant le Customer Portal (qui a besoin de
        // stripe_customer_id, jamais exposé non plus jusqu'ici).
        plan: row.plan || 'free',
        stripe_customer_id: row.stripe_customer_id || null,
        // v6.132 : niveau par type d'exercice + compteur de pratique par
        // type, tous les deux dans la même colonne jsonb "levels" pour
        // ne pas multiplier les migrations. {} si la migration
        // sql/schema.sql n'a pas encore été appliquée. user.level (le
        // champ scalaire ci-dessus) continue de fonctionner dans tous
        // les cas.
        levels: (row.levels && row.levels.levels) || {},
        levelAttempts: (row.levels && row.levels.attempts) || {},
        last_seen:row.last_seen
      };
    } else {
      const raw = localStorage.getItem('reparole:'+code);
      return raw ? JSON.parse(raw) : null;
    }
  },

  // =====================================================================
  //  v6.87 — DROIT À L'EFFACEMENT (RGPD/LGPD)
  //  ---------------------------------------------------------------------
  //  VRAI MANQUE corrigé : RGPD.md mentionnait déjà ce droit, mais rien
  //  ne permettait de l'exercer. En mode cloud, une seule fonction RPC
  //  suffit (les tables liées ont déjà "on delete cascade" — voir
  //  sql/schema.sql). En mode navigateur, nettoie explicitement chaque
  //  clé localStorage — pas de cascade automatique ici.
  // =====================================================================
  async deleteAccount(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('delete_patient_account', { p_code: code });
      return { error };
    } else {
      // v6.87 : le code aidant est indexé par SA PROPRE valeur (clé =
      // le code aidant, pas le code patient) — il faut donc le lire
      // depuis la fiche patient avant de la supprimer, sinon son
      // entrée d'index resterait orpheline en local.
      const raw = localStorage.getItem('reparole:'+code);
      const rec = raw ? JSON.parse(raw) : null;
      if(rec && rec.caregiver_code) localStorage.removeItem('reparole:caregiver-index:'+rec.caregiver_code);
      [
        'reparole:'+code, 'reparole:hist:'+code, 'reparole:journal:'+code,
        'reparole:profile:'+code, 'reparole:caregiver-words:'+code,
        'reparole:favorites:'+code, 'reparole:errors:'+code,
        'reparole:media:'+code, 'reparole:reports:'+code, 'reparole:notes:'+code
      ].forEach(k => localStorage.removeItem(k));
      return { error: null };
    }
  },
  // v6.132 : niveau par type d'exercice + compteur de pratique par type
  // — appel séparé et isolé (voir sql/schema.sql pour le pourquoi).
  // Échec silencieux si la migration n'est pas encore appliquée : ne
  // doit jamais bloquer une séance normale pour un détail de
  // personnalisation.
  async saveLevels(code, levels, attempts){
    const combined = { levels: levels||{}, attempts: attempts||{} };
    if(!CLOUD_ENABLED){
      const raw = localStorage.getItem('reparole:'+code);
      const record = raw ? JSON.parse(raw) : {};
      localStorage.setItem('reparole:'+code, JSON.stringify({ ...record, levels: levels||{}, levelAttempts: attempts||{} }));
      return;
    }
    try{
      await initCloud();
      await supa.rpc('save_patient_levels', { p_code: code, p_levels: combined });
    }catch(e){ /* migration pas encore appliquée, ou hors-ligne — pas grave, on réessaiera à la prochaine séance */ }
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
  // v6.128 : compteur de connexions patients par jour, demandé par
  // l'utilisateur ("juste un compteur par jour, aucun nom, rien
  // d'autre"). Le code n'est jamais stocké en clair côté serveur — voir
  // sql/schema.sql, log_patient_connection() (hash + dédoublonné par
  // jour). Volontairement silencieux en cas d'échec : ça ne doit
  // jamais bloquer une connexion normale, ni être mis en file d'attente
  // comme les autres écritures (pas grave si un comptage est raté).
  // Pas d'équivalent en mode navigateur (localStorage) : rien à
  // compter globalement sans serveur partagé.
  async logConnection(code){
    if(!CLOUD_ENABLED) return;
    try{
      await initCloud();
      const { error } = await supa.rpc('log_patient_connection', { p_code: code });
      // v6.153 : signalé par l'utilisateur — le compteur admin restait
      // à zéro malgré un usage réel (séances bien enregistrées). Ce
      // catch reste volontairement non-bloquant (un comptage raté ne
      // doit jamais empêcher une connexion), mais était TOTALEMENT
      // silencieux jusqu'ici — impossible de diagnostiquer quoi que ce
      // soit sans ça. Un console.warn ne gêne personne en usage normal
      // (rien ne s'affiche à l'écran), mais révèle l'erreur réelle dans
      // les outils de développement si quelqu'un vérifie.
      if(error) console.warn('Supabase log_patient_connection :', error.message);
    }catch(e){ console.warn('Supabase log_patient_connection (exception) :', e.message); }
  },
  async logSession(code, entry){
    const lang = (window.Prefs && Prefs.data && Prefs.data.lang) || 'fr';
    const payload = { p_code:code, p_type:entry.type, p_score:entry.score, p_total:entry.total, p_level:entry.level, p_lang:lang };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('log_session', payload);
      if(error){ console.warn('Supabase log_session (mis en attente) :', error.message); _enqueue('session', payload); }
    } else {
      const key='reparole:hist:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push({ code, type:entry.type, score:entry.score, total:entry.total, level:entry.level, lang, at:new Date().toISOString() });
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

  // =====================================================================
  //  v6.41 — JOURNAL DE RESSENTI LIBRE
  //  ---------------------------------------------------------------------
  //  Texte libre, pas un questionnaire structuré (voir Assessment pour
  //  ça). Jamais analysé automatiquement, jamais montré à personne
  //  d'autre que le patient — sauf s'il choisit de partager le résumé
  //  imprimable qui peut l'inclure (mon-resume.html).
  // =====================================================================
  async addJournalEntry(code, text){
    const trimmed = (text||'').trim();
    if(!trimmed) return { error:new Error('Le texte ne peut pas être vide.') };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('add_journal_entry', { p_code:code, p_text:trimmed });
      if(error){ console.warn('Supabase add_journal_entry:', error.message); return { error }; }
      return {};
    } else {
      const key='reparole:journal:'+code;
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.unshift({ code, text:trimmed, created_at:new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
      return {};
    }
  },
  async loadJournalEntries(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_journal_entries', { p_code: code });
      if(error){ console.warn('Supabase get_journal_entries:', error.message); return []; }
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('reparole:journal:'+code)||'[]');
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
      const allSessions = JSON.parse(localStorage.getItem('reparole:hist:'+patientCode)||'[]');
      const sessions = allSessions.slice(-14).reverse();
      const errors = JSON.parse(localStorage.getItem('reparole:errors:'+patientCode)||'[]');
      const cutoff = Date.now() - 30*24*60*60*1000;
      const tally = {};
      errors.filter(e => new Date(e.at).getTime() > cutoff).forEach(e=>{ tally[e.category] = (tally[e.category]||0) + 1; });
      // v6.168 : les 3 mêmes ajouts que côté cloud (get_caregiver_data
      // en SQL) — mots à revoir, jours actifs sur 14 jours, langue de
      // la dernière séance — pour que le mode local (sans Supabase)
      // se comporte de la même façon, pas juste le mode cloud.
      const wordCutoff = Date.now() - 30*24*60*60*1000;
      const wordTally = {};
      errors.filter(e => e.target && new Date(e.at).getTime() > wordCutoff).forEach(e=>{ wordTally[e.target] = (wordTally[e.target]||0) + 1; });
      const frequentWords = Object.entries(wordTally).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([target,cnt])=>({target,cnt}));
      const dayCutoff = Date.now() - 14*24*60*60*1000;
      const activeDays = [...new Set(allSessions.filter(s=>new Date(s.at).getTime() > dayCutoff).map(s=>new Date(s.at).toISOString().slice(0,10)))];
      const currentLang = (allSessions.length ? allSessions[allSessions.length-1].lang : null) || 'fr';
      return {
        name: rec.name, level: rec.level, levels: rec.levels || {}, streak: rec.streak, sessions: rec.sessions,
        correct: rec.correct, total: rec.total, last_seen: rec.last_seen,
        recent_sessions: sessions, error_tally: tally,
        frequent_words: frequentWords, active_days: activeDays, current_lang: currentLang
      };
    }
  },

  // =====================================================================
  //  v6.43 — MOTS PERSONNALISÉS PROPOSÉS PAR L'AIDANT
  //  ---------------------------------------------------------------------
  //  Liés au patient précis que l'aidant accompagne, intégrés SANS
  //  validation admin (décision utilisateur — voir sql/schema.sql pour
  //  le raisonnement complet). addCaregiverWord() prend le CODE AIDANT ;
  //  loadCaregiverWords() prend le CODE PATIENT (utilisé côté app
  //  patient pour fusionner ces mots dans les exercices).
  // =====================================================================
  async addCaregiverWord(caregiverCode, word, emoji){
    const trimmed = (word||'').trim();
    if(!trimmed) return { error:new Error('Le mot ne peut pas être vide.') };
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('add_caregiver_word', { p_caregiver_code:caregiverCode, p_word:trimmed, p_emoji:emoji||null });
      if(error){ console.warn('Supabase add_caregiver_word:', error.message); return { error }; }
      return {};
    } else {
      const patientCode = localStorage.getItem('reparole:caregiver-index:'+caregiverCode);
      if(!patientCode) return { error:new Error('Code aidant invalide.') };
      const key = 'reparole:caregiver-words:'+patientCode;
      const arr = JSON.parse(localStorage.getItem(key)||'[]');
      arr.unshift({ code:patientCode, word:trimmed, emoji:emoji||null, created_at:new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
      return {};
    }
  },
  // Côté PATIENT (son propre code) — pour fusionner ces mots dans ses exercices.
  async loadCaregiverWords(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_caregiver_words', { p_code: code });
      if(error){ console.warn('Supabase get_caregiver_words:', error.message); return []; }
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('reparole:caregiver-words:'+code)||'[]');
    }
  },
  // Côté AIDANT (son code aidant) — pour voir ce qu'il/elle a déjà proposé.
  async loadCaregiverAddedWords(caregiverCode){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_caregiver_added_words', { p_caregiver_code: caregiverCode });
      if(error){ console.warn('Supabase get_caregiver_added_words:', error.message); return []; }
      return data || [];
    } else {
      const patientCode = localStorage.getItem('reparole:caregiver-index:'+caregiverCode);
      if(!patientCode) return [];
      return JSON.parse(localStorage.getItem('reparole:caregiver-words:'+patientCode)||'[]');
    }
  },

  // =====================================================================
  //  v6.72 — MOTS FAVORIS ("Mots à revoir")
  //  ---------------------------------------------------------------------
  //  Repli local automatique si la table favorite_words n'existe pas
  //  encore côté Supabase (migration à appliquer manuellement, voir
  //  sql/schema.sql) : le bouton étoile continue de fonctionner sur cet
  //  appareil, sans planter, simplement pas encore synchronisé.
  // =====================================================================
  async toggleFavoriteWord(code, word){
    const trimmed = (word||'').trim();
    if(!trimmed) return { error:new Error('Mot vide.') };
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('toggle_favorite_word', { p_code:code, p_word:trimmed });
      if(error){
        console.warn('Supabase toggle_favorite_word (migration favorite_words pas encore appliquée ?) :', error.message);
        return { error };
      }
      return { isFavorite: !!data };
    } else {
      const key = 'reparole:favorites:'+code;
      const arr = JSON.parse(localStorage.getItem(key)||'[]');
      const idx = arr.indexOf(trimmed);
      if(idx>=0){ arr.splice(idx,1); localStorage.setItem(key, JSON.stringify(arr)); return { isFavorite:false }; }
      arr.unshift(trimmed);
      localStorage.setItem(key, JSON.stringify(arr));
      return { isFavorite:true };
    }
  },
  async loadFavoriteWords(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_favorite_words', { p_code: code });
      if(error){ console.warn('Supabase get_favorite_words (migration favorite_words pas encore appliquée ?) :', error.message); return []; }
      return (data||[]).map(r=>r.word);
    } else {
      return JSON.parse(localStorage.getItem('reparole:favorites:'+code)||'[]');
    }
  },

  // =====================================================================
  //  v6.80 — BOÎTE À IDÉES ("Une idée, une remarque ?")
  //  ---------------------------------------------------------------------
  //  Canal de retour libre, séparé de la base de connaissances
  //  communautaire ci-dessous (pas de statut approuvé/refusé, pas de
  //  fusion possible dans l'app — juste un message trié par un∙e
  //  administrateur∙rice). Repli local si le mode cloud n'est pas
  //  configuré, pour ne jamais donner l'impression que le message a
  //  disparu — même s'il ne sera vu par personne tant que le mode
  //  cloud n'est pas actif (aucun espace admin en mode navigateur).
  // =====================================================================
  async submitSuggestion(source, message, contact){
    const trimmed = (message||'').trim();
    if(!trimmed) return { error:new Error('Message vide.') };
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('submit_suggestion', {
        p_source: source, p_message: trimmed, p_contact: (contact||'').trim() || null
      });
      if(error){ console.warn('Supabase submit_suggestion :', error.message); return { error }; }
      return { id: data };
    } else {
      const key = 'reparole:suggestions-local';
      const arr = JSON.parse(localStorage.getItem(key)||'[]');
      const entry = { id: Date.now(), source, message: trimmed, contact: (contact||'').trim() || null, status:'new', created_at: new Date().toISOString() };
      arr.unshift(entry);
      localStorage.setItem(key, JSON.stringify(arr));
      return { id: entry.id };
    }
  },
  async listSuggestions(){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_suggestions');
      if(error){ console.warn('Supabase get_suggestions :', error.message); return []; }
      return data || [];
    } else {
      return JSON.parse(localStorage.getItem('reparole:suggestions-local')||'[]');
    }
  },
  async updateSuggestionStatus(id, status){
    if(CLOUD_ENABLED){
      await initCloud();
      const { error } = await supa.rpc('update_suggestion_status', { p_id:id, p_status:status });
      if(error) console.warn('Supabase update_suggestion_status :', error.message);
      return { error };
    } else {
      const key = 'reparole:suggestions-local';
      const arr = JSON.parse(localStorage.getItem(key)||'[]');
      const item = arr.find(s=>s.id===id);
      if(item) item.status = status;
      localStorage.setItem(key, JSON.stringify(arr));
      return { error:null };
    }
  },

  // =====================================================================
  //  v6.38 — BASE DE CONNAISSANCES COMMUNAUTAIRE (kabyle et au-delà)
  //  ---------------------------------------------------------------------
  //  N'importe qui peut proposer (submitContent) — rien n'est visible
  //  des patients avant qu'un·e administrateur·rice ne valide
  //  (reviewContent). Voir sql/schema.sql pour la RLS complète.
  // =====================================================================
  async submitContent({ language, domain, level, kind, payload, sources, contributorName, contributorContact, contributorNote }){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré — les contributions ne peuvent pas être enregistrées pour l\'instant.') };
    await initCloud();
    const { data, error } = await supa.rpc('submit_content', {
      p_language: language, p_domain: domain, p_level: level ?? null, p_kind: kind,
      p_payload: payload, p_sources: sources || null,
      p_contributor_name: contributorName || null, p_contributor_contact: contributorContact || null,
      p_contributor_note: contributorNote || null
    });
    if(error) return { error };
    return { id: data };
  },
  // Contenu déjà approuvé, pour un couple langue/domaine donné — c'est ce
  // qui vient s'ajouter au vocabulaire figé de js/exercises-kab.js (ou
  // équivalent) au chargement de l'app. Toujours vide en mode navigateur
  // (pas de base partagée sans compte cloud).
  async loadApprovedContent(language, domain){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.from('content_items')
      .select('level, kind, payload')
      .eq('language', language).eq('domain', domain).eq('status', 'approved');
    if(error){ console.warn('Supabase loadApprovedContent:', error.message); return []; }
    return data || [];
  },

  // --- Comptes administrateur (validation des contributions) ---
  // Pas de "signUpAdmin" avec privilège automatique : un compte Supabase
  // Auth normal ne donne AUCUN droit tant que sa ligne n'existe pas dans
  // `admins`, ajoutée à la main par le propriétaire du projet (voir
  // sql/schema.sql). signInAdmin échoue proprement si ce n'est pas le cas.
  async signInAdmin(email, password){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if(error) return { error };
    // v6.82 : double authentification (TOTP) — même mécanisme que côté
    // orthophoniste (voir signInOrtho), repris ici pour l'espace admin,
    // qui n'en avait pas jusque-là malgré l'accès à des données
    // sensibles (contenu des suggestions, contacts personnels).
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
    const { data: row, error: rowErr } = await supa.from('admins').select('*').eq('code', data.session.user.id).maybeSingle();
    if(rowErr || !row){
      await supa.auth.signOut();
      return { error: new Error('Ce compte existe mais n\'a pas les droits administrateur.') };
    }
    this.logLoginEvent('admin', row.name); // v6.97 : ne bloque jamais le login (pas de await)
    return { code: row.code, name: row.name };
  },
  // v6.82 : termine la connexion admin après vérification du code à 6
  // chiffres — équivalent de completeMfaSignIn (ortho), mais vérifie la
  // table `admins` plutôt que `orthophonists`.
  async completeMfaSignInAdmin(factorId, challengeId, code){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { error } = await supa.auth.mfa.verify({ factorId, challengeId, code });
    if(error) return { error };
    const { data:{ session } } = await supa.auth.getSession();
    const { data: row, error: rowErr } = await supa.from('admins').select('*').eq('code', session.user.id).maybeSingle();
    if(rowErr || !row){
      await supa.auth.signOut();
      return { error: new Error('Ce compte existe mais n\'a pas les droits administrateur.') };
    }
    this.logLoginEvent('admin', row.name);
    return { code: row.code, name: row.name };
  },
  async signOutAdmin(){ if(!CLOUD_ENABLED) return; await initCloud(); await supa.auth.signOut(); },

  // =====================================================================
  //  v6.81 — MOT DE PASSE OUBLIÉ (comptes admin ET orthophoniste)
  //  ---------------------------------------------------------------------
  //  VRAI BUG trouvé en usage réel : envoyer un email de récupération
  //  depuis le tableau Supabase (bouton "Send password recovery")
  //  redirigeait vers l'accueil de l'app, sans aucun moyen de saisir le
  //  nouveau mot de passe — reset-password.html n'existait pas encore.
  //  Ajouté ici : resetPasswordForEmail() pour déclencher l'email
  //  depuis l'app elle-même (avec le bon lien de redirection cette
  //  fois), et updatePassword() pour l'écran reset-password.html qui le
  //  reçoit. Partagé entre admin.html et dashboard-ortho.html — même
  //  mécanisme Supabase Auth des deux côtés.
  // =====================================================================
  async resetPasswordForEmail(email){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const redirectTo = window.location.origin + window.location.pathname.replace(/[^/]*$/, 'reset-password.html');
    const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  },
  async updatePassword(newPassword){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { error } = await supa.auth.updateUser({ password: newPassword });
    return { error };
  },
  async getAdminSession(){
    if(!CLOUD_ENABLED) return null;
    await initCloud();
    const { data: { session } } = await supa.auth.getSession();
    if(!session) return null;
    const { data: row } = await supa.from('admins').select('*').eq('code', session.user.id).maybeSingle();
    if(!row) return null;
    return { code: row.code, name: row.name };
  },
  async listPendingContent(){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.from('content_items').select('*').eq('status','pending').order('created_at',{ascending:true});
    if(error){ console.warn('Supabase listPendingContent:', error.message); return []; }
    return data || [];
  },
  async reviewContent(id, status, adminCode, adminNotes){
    if(!CLOUD_ENABLED) return { error:new Error('Le mode cloud n\'est pas configuré.') };
    await initCloud();
    const { error } = await supa.from('content_items').update({
      status, reviewed_by: adminCode, admin_notes: adminNotes || null, reviewed_at: new Date().toISOString()
    }).eq('id', id);
    if(error) return { error };
    return {};
  },
  // Tendances agrégées et anonymisées (jamais un contenu généré) —
  // réservées aux administrateurs et orthophonistes authentifiés.
  async getAdminTrends(){
    if(!CLOUD_ENABLED) return null;
    await initCloud();
    const { data, error } = await supa.rpc('get_admin_trends');
    if(error){ console.warn('Supabase get_admin_trends:', error.message); return null; }
    return data || null;
  },

  // v6.128 : renvoie uniquement { day, count } — jamais de ligne
  // individuelle, jamais de code ni de nom (voir sql/schema.sql,
  // get_daily_connection_counts(), qui applique la même restriction
  // côté serveur).
  async getDailyConnectionCounts(days){
    if(!CLOUD_ENABLED) return null;
    await initCloud();
    const { data, error } = await supa.rpc('get_daily_connection_counts', { p_days: days || 30 });
    if(error){ console.warn('Supabase get_daily_connection_counts:', error.message); return null; }
    return data || null;
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

  // v6.169 : activité récente (14 jours) de TOUS les patients rattachés,
  // en un seul appel, pour la mini-frise par ligne dans la liste ortho.
  // Fonction SQL sécurisée par auth.uid() (voir sql/schema.sql). Renvoie
  // un objet { "<code patient>": ["YYYY-MM-DD", ...] }. Pas d'équivalent
  // en mode navigateur : l'espace ortho n'existe qu'en mode cloud.
  async orthoActivity(){
    if(!CLOUD_ENABLED) return {};
    await initCloud();
    const { data, error } = await supa.rpc('get_ortho_activity');
    if(error){ console.warn('Supabase get_ortho_activity:', error.message); return {}; }
    return data || {};
  },

  // v6.173 : mots ciblés par l'orthophoniste — même table et même
  // pipeline d'exercices que les mots de l'aidant (caregiver_words),
  // avec source='ortho'. Identité vérifiée côté SQL via auth.uid()
  // (l'ortho doit être rattaché·e au patient). Espace ortho = cloud
  // uniquement, comme orthoActivity.
  async orthoAddWord(patientCode, word, emoji){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('add_ortho_word', { p_patient_code: patientCode, p_word: word, p_emoji: emoji || null });
    if(error){ console.warn('Supabase add_ortho_word:', error.message); return { error: error.message }; }
    return {};
  },
  async orthoDeleteWord(id){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('delete_target_word', { p_id: id });
    if(error){ console.warn('Supabase delete_target_word:', error.message); return { error: error.message }; }
    return {};
  },

  // =====================================================================
  //  v6.174 — BOUCLE VOCALE ASYNCHRONE (voir sql/schema.sql, même bloc)
  //  Cloud uniquement : les enregistrements transitent par le bucket
  //  patient-media sous <code>/voice/ (couvert par la purge de compte),
  //  le consentement est vérifié CÔTÉ SQL, la rétention est de 30 jours.
  // =====================================================================
  async setVoiceConsent(code, consent){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('set_voice_consent', { p_code: code, p_consent: !!consent });
    if(error){ console.warn('Supabase set_voice_consent:', error.message); return { error: error.message }; }
    return {};
  },
  async addVoiceRecording(code, word, blob){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const path = code + '/voice/' + Date.now() + '.webm';
    const { error: upErr } = await supa.storage.from('patient-media').upload(path, blob, { contentType: blob.type || 'audio/webm' });
    if(upErr){ console.warn('Supabase upload voice:', upErr.message); return { error: upErr.message }; }
    const { data: pub } = supa.storage.from('patient-media').getPublicUrl(path);
    const { error } = await supa.rpc('add_voice_recording', { p_code: code, p_word: word, p_url: pub.publicUrl });
    if(error){ console.warn('Supabase add_voice_recording:', error.message); return { error: error.message }; }
    return { url: pub.publicUrl };
  },
  async listVoiceRecordings(code){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.rpc('get_voice_recordings', { p_code: code });
    if(error){ console.warn('Supabase get_voice_recordings:', error.message); return []; }
    return data || [];
  },
  async orthoListVoiceRecordings(patientCode){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.rpc('get_patient_voice_recordings', { p_patient_code: patientCode });
    if(error){ console.warn('Supabase get_patient_voice_recordings:', error.message); return []; }
    return data || [];
  },
  async orthoSetVoiceVerdict(id, verdict){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('set_voice_verdict', { p_id: id, p_verdict: verdict });
    if(error){ console.warn('Supabase set_voice_verdict:', error.message); return { error: error.message }; }
    return {};
  },
  async purgeOldVoiceRecordings(){
    if(!CLOUD_ENABLED) return;
    await initCloud();
    // purge opportuniste (best effort) — la vraie planification est
    // pg_cron côté serveur si disponible.
    try{ await supa.rpc('purge_old_voice_recordings'); }catch(e){ /* silencieux */ }
  },

  // v6.175-182 : assistant IA multi-tâches. L'edge function `ia-assist`
  // (voir js/ia-edge-function.md) authentifie par JETON DE SESSION,
  // re-vérifie le rôle (rattachement patient pour l'ortho, table admins
  // pour l'admin), ANONYMISE et plafonne. Principe : l'IA prépare,
  // l'humain décide — rien n'est appliqué automatiquement.
  async iaAssist(task, payload){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { data: sess } = await supa.auth.getSession();
    const token = sess && sess.session && sess.session.access_token;
    if(!token) return { error: 'session expirée' };
    const base = SUPABASE_URL.replace(/\/$/,'');
    try{
      const res = await fetch(base + '/functions/v1/ia-assist', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify(Object.assign({ task }, payload || {}))
      });
      if(res.status === 404) return { error: 'indisponible' };
      const data = await res.json();
      if(!res.ok || data.error) return { error: data.error || ('erreur '+res.status) };
      return { result: data.result };
    }catch(e){
      // v6.186 : une fonction NON DÉPLOYÉE ne renvoie pas un 404 propre —
      // le pré-vol CORS échoue et fetch lève un NetworkError brut (vu en
      // capture : « NetworkError when attempting to fetch resource »).
      // On le mappe vers 'indisponible' pour afficher le message
      // actionnable (guide js/ia-edge-function.md) au lieu du jargon.
      return { error: 'indisponible' };
    }
  },
  async orthoGenerateReportDraft(patientCode, lang){
    const r = await this.iaAssist('report_draft', { patient_code: patientCode, lang: lang || 'fr' });
    return r.error ? r : { draft: r.result };
  },

  // v6.183 : atelier d'exercices IA — l'enregistrement (add) est réservé
  // au clic « Proposer au patient » de l'ortho : c'est l'acte de
  // validation, vérifié côté SQL (auth.uid + rattachement).
  async addCustomExercise(patientCode, title, payload){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('add_custom_exercise', { p_patient_code: patientCode, p_title: title, p_payload: payload });
    if(error){ console.warn('Supabase add_custom_exercise:', error.message); return { error: error.message }; }
    return {};
  },
  async deleteCustomExercise(id){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('delete_custom_exercise', { p_id: id });
    if(error){ console.warn('Supabase delete_custom_exercise:', error.message); return { error: error.message }; }
    return {};
  },
  async listCustomExercises(code){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.rpc('get_custom_exercises', { p_code: code });
    if(error){ console.warn('Supabase get_custom_exercises:', error.message); return []; }
    return data || [];
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
      // v6.84 : BUG RÉEL corrigé — en cas d'échec de la fonction RPC
      // add_media (ex. migration pas encore appliquée), cette fonction
      // renvoyait quand même un objet "réussite" de repli — l'appelant
      // (uploadMedia() dans js/app.js) n'avait alors aucun moyen de
      // savoir que l'écriture en base avait en fait échoué.
      if(error){ console.warn('Supabase add_media:', error.message); return null; }
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
  //  NOTES CLINIQUES — réservées à l'orthophoniste par défaut (RLS "for
  //  all"), sauf celles explicitement marquées visibles par le patient
  //  (v6.95 — voir get_patient_visible_notes, sql/schema.sql).
  // =====================================================================
  async addNote(code, orthoCode, content, visibleToPatient){
    const record = { code, ortho_code:orthoCode||null, content, visible_to_patient: !!visibleToPatient, created_at:new Date().toISOString() };
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
  },
  // v6.95 : côté patient — ne renvoie jamais que les notes marquées
  // visibles ; en mode navigateur, filtre localement puisque la même
  // clé localStorage sert aux deux (pas de séparation ortho/patient
  // possible sur un seul appareil de toute façon dans ce mode).
  async loadPatientVisibleNotes(code){
    if(CLOUD_ENABLED){
      await initCloud();
      const { data, error } = await supa.rpc('get_patient_visible_notes', { p_code: code });
      if(error){ console.warn('Supabase get_patient_visible_notes:', error.message); return []; }
      return data || [];
    } else {
      const arr = JSON.parse(localStorage.getItem('reparole:notes:'+code)||'[]');
      return arr.filter(n=>n.visible_to_patient).reverse();
    }
  },

  // =====================================================================
  //  v6.97 — HISTORIQUE DES CONNEXIONS (admin/orthophoniste)
  //  ---------------------------------------------------------------------
  //  Réponse à "tableau de bord sur le nom de connexion". Pas de repli
  //  local (mode navigateur) : un historique de connexions n'a de sens
  //  qu'en mode cloud, avec de vrais comptes Supabase Auth.
  // =====================================================================
  async logLoginEvent(accountType, name){
    if(!CLOUD_ENABLED) return;
    await initCloud();
    const { error } = await supa.rpc('log_login_event', { p_account_type: accountType, p_name: name || null });
    if(error) console.warn('Supabase log_login_event:', error.message);
  },
  async getLoginHistory(){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.rpc('get_login_history');
    if(error){ console.warn('Supabase get_login_history:', error.message); return []; }
    return data || [];
  },
  // v6.186 : ménage — supprime les connexions de plus de 30 jours
  // (fonction SQL gatée par la table admins).
  async purgeLoginEvents(){
    if(!CLOUD_ENABLED) return { error: 'cloud requis' };
    await initCloud();
    const { error } = await supa.rpc('purge_login_events');
    if(error){ console.warn('Supabase purge_login_events:', error.message); return { error: error.message }; }
    return {};
  },

  // =====================================================================
  //  v6.97 — ERREURS TECHNIQUES CÔTÉ CLIENT (voir js/error-tracking.js)
  //  ---------------------------------------------------------------------
  //  logClientError() ne doit JAMAIS faire planter l'app en essayant de
  //  signaler un plantage — toujours silencieux en cas d'échec.
  // =====================================================================
  async logClientError(message, page, stack, userAgent){
    if(!CLOUD_ENABLED) return;
    try{
      await initCloud();
      await supa.rpc('log_client_error', { p_message:message, p_page:page, p_stack:stack, p_user_agent:userAgent });
    }catch(e){ /* volontairement silencieux */ }
  },
  async getRecentClientErrors(){
    if(!CLOUD_ENABLED) return [];
    await initCloud();
    const { data, error } = await supa.rpc('get_recent_client_errors');
    if(error){ console.warn('Supabase get_recent_client_errors:', error.message); return []; }
    return data || [];
  }
};

window.ReParoleStore = ReParoleStore;
