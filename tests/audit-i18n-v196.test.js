// =====================================================================
//  TESTS — v6.196 : AUDIT PERMANENT DES TRADUCTIONS + ÉTHIQUE VOCALE.
//  ---------------------------------------------------------------------
//  Né de l'audit « rien au hasard » demandé par le propriétaire, qui a
//  débusqué : 14 clés utilisées mais absentes de 10 langues (du français
//  s'affichait en anglais/espagnol/japonais…), 13 doublons latents, un
//  calque « pas mal » devenu « pas bien » dans 3 darijas, et une ligne
//  éthique vocale sans verrou. Ce fichier rend ces classes de bugs
//  IMPOSSIBLES à réintroduire.
//  Lancer : node tests/audit-i18n-v196.test.js
// =====================================================================
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}
const I18NSRC = require('./i18n-source').texteComplet();
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const COMP = fs.readFileSync(path.join(ROOT, 'js/companion.js'), 'utf8');

// découpe robuste des blocs de langue (niveau 1 de l'objet)
// v6.247 : les langues ne sont plus des blocs `  fr: {` dans i18n.js mais
// des appels `I18N.register('fr', {` dans js/i18n/<code>.js — le découpeur
// reconnaît les deux formes, l'ancienne restant utile pour d'éventuels
// blocs internes.
function langBlocks(src){
  const blocks = {}; let cur = null, depth = 0, buf = [];
  for(const line of src.split('\n')){
    const m = line.match(/^  ([a-z]{2,3}): \{$/) ||
              line.match(/^I18N\.register\('([a-z]{2,3})', \{$/);
    if(m && depth === 0 && cur === null){ cur = m[1]; buf = []; depth = 1; continue; }
    if(cur !== null){
      depth += (line.match(/\{/g)||[]).length - (line.match(/\}/g)||[]).length;
      if(depth <= 0){ blocks[cur] = buf; cur = null; depth = 0; continue; }
      buf.push(line);
    }
  }
  return blocks;
}
function keysOf(lines){
  const ks = [];
  for(const l of lines){ const m = l.match(/^    ([a-zA-Z0-9_]+):/); if(m) ks.push(m[1]); }
  return ks;
}
const BLOCKS = langBlocks(I18NSRC);
const ALL_LANGS = ['fr','en','es','it','pt','de','ar','tr','pl','ja','kab','dz','ma','tn'];
const COMPLETE = ['en','es','it','pt','de','ar','tr','pl','ja'];

(async () => {

  await test('les 14 langues existent et AUCUNE ne contient de clé en double (la dernière écrase la première en silence)', () => {
    for(const l of ALL_LANGS) assert.ok(BLOCKS[l], 'bloc absent : ' + l);
    for(const l of ALL_LANGS){
      const ks = keysOf(BLOCKS[l]);
      const seen = new Set(); const dups = [];
      ks.forEach(k => { if(seen.has(k)) dups.push(k); seen.add(k); });
      assert.strictEqual(dups.length, 0, l + ' contient des doublons : ' + dups.slice(0,5).join(','));
    }
  });

  await test('parité totale : les 9 langues complètes ont EXACTEMENT les clés du français (0 manquante)', () => {
    const fr = new Set(keysOf(BLOCKS.fr));
    for(const l of COMPLETE){
      const s = new Set(keysOf(BLOCKS[l]));
      const missing = [...fr].filter(k => !s.has(k));
      assert.strictEqual(missing.length, 0, l + ' : clés manquantes ' + missing.slice(0,5).join(','));
    }
  });

  await test('toute clé data-i18n des pages patient/aidant est définie dans les 14 langues (fin des clés fantômes)', () => {
    const html = ['index.html','aidant.html'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const used = new Set([...html.matchAll(/data-i18n="([a-zA-Z0-9_]+)"/g)].map(m => m[1]));
    for(const l of ALL_LANGS){
      const s = new Set(keysOf(BLOCKS[l]));
      const miss = [...used].filter(k => !s.has(k));
      assert.strictEqual(miss.length, 0, l + ' : data-i18n sans traduction ' + miss.slice(0,6).join(','));
    }
  });

  await test('plus JAMAIS de calque « ماشي/موش مليح » dans les félicitations (signifie « pas bien » en arabe)', () => {
    assert.ok(!/ماشي مليح|موش مليح/.test(COMP), 'calque détecté dans companion.js');
    assert.ok(!/ماشي مليح|موش مليح/.test(I18NSRC), 'calque détecté dans i18n.js');
  });

  await test('Ami parle les 14 langues (dont dz) avec une indentation uniforme', () => {
    const cl = [...COMP.matchAll(/^  ([a-z]{2,3}): \{$/gm)].map(m => m[1]);
    for(const l of ALL_LANGS) assert.ok(cl.includes(l), 'Ami muet en : ' + l);
  });

  await test('ÉTHIQUE VOCALE : la reconnaissance peut féliciter, jamais sanctionner (aucun answer_feedback(false) dans ses gestionnaires)', () => {
    const fn = APP.match(/function toggleListen\(target\)\{[\s\S]*?\n\}/)[0];
    assert.ok(/ne peut plus SANCTIONNER/.test(fn), 'le commentaire-contrat éthique doit rester dans le code');
    assert.ok(/answer_feedback\(true/.test(fn), 'la félicitation sur mot reconnu doit exister');
    assert.ok(!/answer_feedback\(false/.test(fn), 'INTERDIT : la reco vocale ne doit jamais compter un échec');
    assert.ok(/reco_not_sure/.test(fn), 'le message neutre de non-reconnaissance doit exister');
    // le message neutre ne doit contenir aucun terme de verdict négatif en français
    const frBlock = BLOCKS.fr.join('\n');
    const m = frBlock.match(/reco_not_sure:"([^"]+)"/);
    assert.ok(m && !/faux|raté|échec|erreur|incorrect/i.test(m[1]), 'reco_not_sure doit rester neutre, sans verdict');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
