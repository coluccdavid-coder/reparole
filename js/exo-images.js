// =====================================================================
//  IMAGES D'EXERCICE — v6.248
//  ---------------------------------------------------------------------
//  Demandé par le propriétaire : les emoji seuls font enfantin pour un
//  public d'adultes après un AVC. Ce module fait passer chaque support
//  visuel d'exercice par une résolution en cascade :
//
//    1. une VRAIE PHOTO dans img/<codepoints>.webp (puis .jpg) ;
//    2. à défaut, l'emoji — mais présenté dans une carte sobre
//       (.prompt-media), pas flottant dans le vide.
//
//  Pourquoi indexer par emoji et non par mot : l'emoji est LA CLÉ
//  PARTAGÉE des 14 langues (🐱 sert CHAT, CAT, GATO, KOT…). Une photo
//  de chat sert donc toutes les langues : 116 images couvrent tout,
//  au lieu de 116 × 14. Le nom de fichier est la suite de codepoints
//  (ex. 🐱 → 1f431.webp), stable et sans problème d'encodage.
//
//  Leçon de la v6.244 appliquée d'emblée : aucune rafale de requêtes
//  perdues. Un fichier absent est mémorisé pour la session (_absents),
//  et sw.js ne met jamais un 404 en cache.
//
//  Le dossier img/ suit les mêmes règles que audio/ : jamais supprimé,
//  exclu des zips de livraison, rempli progressivement côté hébergeur.
//  Détails et liste des fichiers attendus : docs/IMAGES.md.
// =====================================================================

const ExoImages = {

  // 🐱 -> "1f431" ; ☀️ -> "2600" (le sélecteur de variante FE0F est
  // retiré, comme le font Twemoji et consorts) ; 🧑‍🍳 -> "1f9d1-200d-1f373".
  codepoints(emoji){
    if(!emoji) return '';
    return [...String(emoji)]
      .map(c => c.codePointAt(0))
      .filter(cp => cp !== 0xFE0F)
      .map(cp => cp.toString(16))
      .join('-');
  },

  // Fichiers constatés absents pendant cette session : on ne les
  // redemande pas à chaque exercice.
  _absents: (typeof Set !== 'undefined') ? new Set() : { has:()=>false, add:()=>{} },

  // Rend le support visuel d'un mot d'exercice.
  // opts.small : variante compacte (mots croisés, anagrammes).
  html(emoji, opts){
    opts = opts || {};
    const cls = 'prompt-media' + (opts.small ? ' prompt-media-sm' : '');
    const secours = '<span class="prompt-emoji" aria-hidden="true">' + (emoji || '❓') + '</span>';
    const cp = this.codepoints(emoji);
    if(!cp || this._absents.has(cp)){
      return '<span class="' + cls + '">' + secours + '</span>';
    }
    // L'emoji est affiché D'ABORD, l'image cachée : si la photo arrive,
    // elle prend la place (onload) ; sinon on ne montre jamais d'icône
    // d'image cassée, et l'échec est mémorisé (onerror -> _echec).
    return '<span class="' + cls + '">' +
      '<img src="img/' + cp + '.webp" alt="" loading="lazy" style="display:none" ' +
        'data-cp="' + cp + '" data-etape="webp" ' +
        'onload="this.style.display=\'\';this.nextElementSibling.style.display=\'none\'" ' +
        'onerror="ExoImages._echec(this)">' +
      secours +
    '</span>';
  },

  // webp absent -> on tente jpg une fois ; jpg absent -> emoji définitif
  // pour la session. Jamais plus de deux requêtes par image et par session.
  _echec(img){
    const cp = img.dataset.cp;
    if(img.dataset.etape === 'webp'){
      img.dataset.etape = 'jpg';
      img.src = 'img/' + cp + '.jpg';
      return;
    }
    this._absents.add(cp);
    img.remove();  // l'emoji de secours, déjà visible, reste seul
  }
};

window.ExoImages = ExoImages;
