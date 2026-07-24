// =====================================================================
//  scripts/liste-images.js — v6.248
//  Régénère le tableau des images attendues dans docs/IMAGES.md à partir
//  des banques de mots réelles. À relancer si des mots/emoji changent :
//      node scripts/liste-images.js
// =====================================================================
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function codepoints(emoji){
  return [...String(emoji)].map(c=>c.codePointAt(0)).filter(cp=>cp!==0xFE0F).map(cp=>cp.toString(16)).join('-');
}

// Récolte {emoji -> {fr, en}} depuis toutes les banques d'exercices.
const entrees = new Map();
for(const f of fs.readdirSync(path.join(ROOT,'js')).filter(f=>/^exercises.*\.js$/.test(f))){
  const src = fs.readFileSync(path.join(ROOT,'js',f),'utf8');
  for(const m of src.matchAll(/emoji:'([^']+)'\s*,\s*answer:'([^']+)'/g)){
    const [ , emoji, answer ] = m;
    if(!entrees.has(emoji)) entrees.set(emoji, {});
    const langM = f.match(/exercises-([a-z]{2,3})\.js/);
    const lang = langM ? langM[1] : 'fr';
    if(lang==='fr' || lang==='en'){
      if(!entrees.get(emoji)[lang]) entrees.get(emoji)[lang] = answer;
    }
  }
}

const lignes = [...entrees.entries()]
  .map(([emoji, mots]) => ({ emoji, cp: codepoints(emoji), fr: mots.fr||'', en: mots.en||'' }))
  .sort((a,b) => a.cp.localeCompare(b.cp));

const tableau = ['| Emoji | Fichier attendu | Mot (fr) | Mot (en) |','|---|---|---|---|']
  .concat(lignes.map(l => `| ${l.emoji} | \`${l.cp}.webp\` | ${l.fr} | ${l.en} |`))
  .join('\n');

const DEBUT = '<!-- TABLE-IMAGES:DEBUT -->', FIN = '<!-- TABLE-IMAGES:FIN -->';
const doc = path.join(ROOT,'docs/IMAGES.md');
let s = fs.readFileSync(doc,'utf8');
const avant = s.slice(0, s.indexOf(DEBUT)+DEBUT.length);
const apres = s.slice(s.indexOf(FIN));
fs.writeFileSync(doc, avant + '\n' + tableau + '\n' + apres);
console.log(lignes.length + ' images listées dans docs/IMAGES.md');
