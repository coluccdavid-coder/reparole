// =====================================================================
//  v6.97 — SUIVI DES ERREURS TECHNIQUES CÔTÉ CLIENT
//  ---------------------------------------------------------------------
//  Réponse à "les erreurs rencontrées" (vraies erreurs techniques du
//  site, pas les erreurs des patients dans leurs exercices — celles-là
//  existent déjà, voir error_events/ortho_error_analysis_title).
//
//  Capture les erreurs JS non gérées et les rejets de promesse non
//  gérés, les envoie à Supabase pour qu'un∙e administrateur∙rice
//  puisse les consulter (voir AdminPanel.renderClientErrors,
//  js/admin.js) — jamais bloquant, jamais visible par la personne qui
//  rencontre l'erreur, jamais capable de faire planter l'app en
//  retour (voir ReParoleStore.logClientError, entièrement silencieux
//  en cas d'échec).
// =====================================================================
(function(){
  function report(message, stack){
    if(typeof ReParoleStore === 'undefined' || !ReParoleStore.logClientError) return;
    try{
      ReParoleStore.logClientError(
        String(message || 'Erreur inconnue').slice(0, 500),
        window.location.pathname,
        String(stack || '').slice(0, 2000),
        navigator.userAgent
      );
    }catch(e){ /* volontairement silencieux */ }
  }

  window.addEventListener('error', function(e){
    report(e.message, e.error && e.error.stack);
  });

  window.addEventListener('unhandledrejection', function(e){
    const reason = e.reason;
    report(
      (reason && reason.message) || String(reason),
      reason && reason.stack
    );
  });
})();
