// =====================================================================
//  AIDE AUX TESTS — source complète des traductions (v6.247)
//  ---------------------------------------------------------------------
//  Depuis v6.247, js/i18n.js ne contient plus que le noyau : les 14
//  langues sont dans js/i18n/<code>.js, et le navigateur n'en télécharge
//  qu'une. Les tests, eux, doivent continuer à voir l'ensemble.
//
//  Ce module rend le texte source de TOUT (noyau + 14 langues), pour les
//  tests qui inspectaient js/i18n.js comme un seul fichier.
// =====================================================================
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DOSSIER = path.join(ROOT, 'js/i18n');

function fichiersLangue(){
  return fs.readdirSync(DOSSIER).filter(f => f.endsWith('.js')).sort();
}

function codesLangue(){
  return fichiersLangue().map(f => f.replace(/\.js$/, ''));
}

function texteComplet(){
  return [fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8')]
    .concat(fichiersLangue().map(f => fs.readFileSync(path.join(DOSSIER, f), 'utf8')))
    .join('\n');
}

function texteLangue(code){
  return fs.readFileSync(path.join(DOSSIER, code + '.js'), 'utf8');
}

module.exports = { texteComplet, texteLangue, fichiersLangue, codesLangue, DOSSIER };
