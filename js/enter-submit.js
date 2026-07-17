// =====================================================================
//  v6.99 — "ENTRÉE" VALIDE LE FORMULAIRE
//  ---------------------------------------------------------------------
//  Réponse à "j'aimerais que l'option ENTRÉE fonctionne quand on
//  renseigne des éléments". Aucun <form> n'est utilisé nulle part dans
//  l'app (boutons déclenchés par onclick="..."), donc la touche Entrée
//  ne fait rien nativement dans un <input> — il fallait un mécanisme
//  explicite, construit une seule fois ici plutôt que dupliqué page par
//  page.
//
//  Usage : sur un <input>, ajouter data-enter-submit="id-du-bouton"
//  (le bouton à "cliquer" quand Entrée est pressée dans ce champ).
//  Aucune modification de js/app.js, js/admin.js, etc. nécessaire —
//  réutilise directement les onclick déjà en place, juste déclenchés
//  différemment.
// =====================================================================
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  const el = e.target;
  if(!el || el.tagName !== 'INPUT') return;
  const targetId = el.dataset.enterSubmit;
  if(!targetId) return;
  const btn = document.getElementById(targetId);
  if(!btn || btn.disabled) return;
  e.preventDefault();
  btn.click();
});
