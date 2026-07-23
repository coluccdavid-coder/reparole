// =====================================================================
//  GÉNÉRATION DES FICHIERS AUDIO — v6.150 (voix cloud, Google Text-to-Speech)
//  ---------------------------------------------------------------------
//  Génère un fichier MP3 par texte unique de scripts/voice-manifest.json
//  (produit par extract-voice-content.js), pour chacune des 10 langues
//  complètes. Idempotent : si le fichier existe déjà, il n'est pas
//  régénéré — relancer ce script après un ajout de contenu ne
//  regénère QUE les nouveaux textes.
//
//  ⚠️ PRÉREQUIS (à faire par l'utilisateur, je ne peux pas le faire à
//  sa place) :
//   1. Un projet Google Cloud avec facturation activée.
//   2. L'API "Cloud Text-to-Speech" activée sur ce projet
//      (console.cloud.google.com > APIs & Services > Enable APIs).
//   3. Une clé API (APIs & Services > Identifiants > Créer des
//      identifiants > Clé API) — de préférence restreinte à l'API
//      Text-to-Speech uniquement.
//   4. La variable d'environnement GOOGLE_TTS_API_KEY définie avant de
//      lancer ce script (jamais la clé écrite en dur dans ce fichier).
//
//  Lancer : GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js
//
//  Coût réel estimé : ~48 000 caractères au total, toutes langues
//  confondues → entre 0,20 € et 1,50 € SELON le modèle de voix choisi
//  ci-dessous (Neural2 recommandé, bon compromis qualité/prix). Ce
//  n'est PAS un abonnement : une fois généré, le fichier existe, plus
//  aucun coût pour le rejouer.
// =====================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const API_KEY = process.env.GOOGLE_TTS_API_KEY;

if(!API_KEY){
  console.error('❌ Variable d\'environnement GOOGLE_TTS_API_KEY manquante.');
  console.error('   Lancer avec : GOOGLE_TTS_API_KEY=votre_clé node scripts/generate-voice-audio.js');
  process.exit(1);
}

// v6.150 : même fonction de hachage (FNV-1a, 32 bits) que celle
// utilisée côté app (js/app.js, speak()) — DOIT rester identique dans
// les deux fichiers, c'est ce qui permet à l'app de retrouver le bon
// fichier audio pour un texte donné sans avoir besoin d'un index
// séparé à tenir à jour.
function fnv1a(str){
  let hash = 0x811c9dc5;
  for(let i=0;i<str.length;i++){
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// v6.150 : plutôt que de figer un nom de voix précis dans ce fichier
// (risque réel : le catalogue de voix de Google évolue, un nom exact
// écrit ici aujourd'hui pourrait ne plus exister demain, ou ne
// jamais avoir existé si je me trompe), le script interroge
// l'endpoint voices:list de Google au moment de l'exécution et
// choisit lui-même la meilleure voix RÉELLEMENT disponible pour
// chaque langue — Neural2 en priorité, puis WaveNet, puis Standard en
// dernier recours. Toujours à jour, jamais un nom deviné à l'avance.
const LANGUAGE_CODES = {
  fr:'fr-FR', en:'en-US', es:'es-ES', it:'it-IT', pt:'pt-PT',
  de:'de-DE', ar:'ar-XA', tr:'tr-TR', pl:'pl-PL', ja:'ja-JP',
};

function httpsGetJSON(url){
  return new Promise((resolve, reject)=>{
    https.get(url, res=>{
      let data = '';
      res.on('data', d=>data+=d);
      res.on('end', ()=>{
        try{ resolve(JSON.parse(data)); }catch(e){ reject(e); }
      });
    }).on('error', reject);
  });
}

async function pickBestVoice(languageCode){
  const url = `https://texttospeech.googleapis.com/v1/voices?languageCode=${languageCode}&key=${API_KEY}`;
  const json = await httpsGetJSON(url);
  if(json.error) throw new Error(json.error.message);
  const voices = json.voices || [];
  const byTier = tier => voices.find(v => v.name.includes(tier));
  const chosen = byTier('Neural2') || byTier('Wavenet') || byTier('Standard') || voices[0];
  if(!chosen) throw new Error(`Aucune voix trouvée pour ${languageCode}`);
  return { languageCode, name: chosen.name };
}

function callTTS(text, voiceConfig){
  return new Promise((resolve, reject)=>{
    const body = JSON.stringify({
      input: { text },
      voice: { languageCode: voiceConfig.languageCode, name: voiceConfig.name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 }
    });
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: '/v1/text:synthesize?key=' + API_KEY,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res=>{
      let data = '';
      res.on('data', d=>data+=d);
      res.on('end', ()=>{
        try{
          const json = JSON.parse(data);
          if(json.error){ reject(new Error(json.error.message)); return; }
          resolve(Buffer.from(json.audioContent, 'base64'));
        }catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main(){
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/voice-manifest.json'), 'utf8'));
  let generated = 0, skipped = 0, failed = 0;

  console.log('Découverte des meilleures voix disponibles...\n');
  const voiceByLang = {};
  for(const lang of Object.keys(manifest)){
    const languageCode = LANGUAGE_CODES[lang];
    if(!languageCode){ console.warn('⚠️  Pas de code de langue pour', lang, '— ignoré'); continue; }
    try{
      voiceByLang[lang] = await pickBestVoice(languageCode);
      console.log(lang, '→', voiceByLang[lang].name);
    }catch(e){
      console.error('❌ Impossible de choisir une voix pour', lang, ':', e.message);
    }
  }
  console.log('');

  for(const lang of Object.keys(manifest)){
    const voiceConfig = voiceByLang[lang];
    if(!voiceConfig){ continue; }
    const dir = path.join(ROOT, 'audio', lang);
    fs.mkdirSync(dir, { recursive:true });

    for(const text of manifest[lang]){
      const filename = fnv1a(text) + '.mp3';
      const filepath = path.join(dir, filename);
      if(fs.existsSync(filepath)){ skipped++; continue; }
      try{
        const audio = await callTTS(text, voiceConfig);
        fs.writeFileSync(filepath, audio);
        generated++;
        if(generated % 20 === 0) console.log(generated, 'fichiers générés...');
      }catch(e){
        failed++;
        console.error('❌', lang, ':', text.slice(0,40), '—', e.message);
      }
    }
  }

  console.log('\n--- Terminé ---');
  console.log('Générés :', generated);
  console.log('Déjà présents (ignorés) :', skipped);
  console.log('Échecs :', failed);
  if(failed > 0) console.log('\nRelancer ce script reprendra uniquement les fichiers manquants.');
}

main();
