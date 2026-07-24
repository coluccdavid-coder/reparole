"use strict";
// =====================================================================
//  v6.238 — BANNIÈRE DE MISE À JOUR POUR LES AUTRES ESPACES
//  ---------------------------------------------------------------------
//  Jusqu'ici, seul index.html (l'application patient) enregistrait le
//  service worker et savait annoncer une nouvelle version. Les espaces
//  orthophoniste, aidant et administrateur n'affichaient donc JAMAIS de
//  bannière : un professionnel pouvait rester des jours sur une version
//  périmée sans le savoir. Signalé par l'utilisateur.
//
//  Ce module reprend exactement la même logique que index.html :
//    • deux signaux de détection (controllerchange ET updatefound), car
//      sw.js appelle skipWaiting() : l'état « installed » passe si vite
//      qu'un seul signal peut être manqué ;
//    • aucune bannière lors de la toute première activation (il n'y a
//      alors pas de mise à jour, juste une installation) ;
//    • revérification à chaque retour au premier plan (onglet rouvert
//      ou PWA reprise sur téléphone) ;
//    • jamais de rechargement forcé : l'utilisateur choisit son moment.
// =====================================================================
(function(){
  if(!('serviceWorker' in navigator)) return;

  var registration = null;
  var hadControllerAtLoad = !!navigator.serviceWorker.controller;

  function showUpdateBanner(){
    if(document.getElementById('sw-update-banner')) return; // déjà affichée
    var banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));' +
      'transform:translateX(-50%);z-index:9999;background:var(--accent-dark);color:#fff;padding:12px 16px;' +
      'border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;' +
      'font-size:.9rem;max-width:92vw';
    banner.innerHTML = '<span>🔄 Nouvelle version disponible</span>' +
      '<button style="background:#fff;color:var(--accent-dark);border:none;border-radius:8px;padding:6px 12px;' +
      'font-weight:600;cursor:pointer" onclick="window.location.reload()">Actualiser</button>' +
      '<button aria-label="Fermer" style="background:transparent;color:#fff;border:none;font-size:1.1rem;' +
      'cursor:pointer;padding:0 4px" onclick="this.closest(\'#sw-update-banner\').remove()">✕</button>';
    document.body.appendChild(banner);
  }

  function checkForUpdate(){
    if(registration) registration.update().catch(function(){});
  }

  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      registration = reg;
      reg.update().catch(function(){});

      // Signal 1 : le nouveau service worker prend le contrôle.
      if(!navigator.serviceWorker.__reparoleSharedBound){
        navigator.serviceWorker.__reparoleSharedBound = true;
        navigator.serviceWorker.addEventListener('controllerchange', function(){
          if(!hadControllerAtLoad) return; // première installation, pas une mise à jour
          showUpdateBanner();
        });
      }

      // Signal 2 : une nouvelle version vient d'être téléchargée.
      reg.addEventListener('updatefound', function(){
        var sw = reg.installing;
        if(!sw) return;
        sw.addEventListener('statechange', function(){
          if((sw.state === 'installed' || sw.state === 'activated') &&
             navigator.serviceWorker.controller){
            showUpdateBanner();
          }
        });
      });

      // Filet : mise à jour déjà en attente avant l'ouverture de la page.
      if(reg.waiting && navigator.serviceWorker.controller){
        showUpdateBanner();
      }
    }).catch(function(err){
      console.warn('Service worker non enregistré (l\'espace fonctionne quand même) :', err && err.message);
    });
  });

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible') checkForUpdate();
  });
})();
