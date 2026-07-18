// =====================================================================
//  FORMULAIRE DE CONTRIBUTION PUBLIQUE (v6.38)
//  ---------------------------------------------------------------------
//  N'importe qui peut proposer un mot, une phrase, ou une idée
//  d'exercice. Rien n'est jamais visible des patients avant qu'un·e
//  administrateur·rice ne valide (voir admin.html, sql/schema.sql).
// =====================================================================

const KIND_MAP = {
  'vocabulary':              { kind:'vocabulary', domain:'denomination' },
  'sentence-completion':     { kind:'sentence',    domain:'completion' },
  'sentence-comprehension':  { kind:'sentence',    domain:'comprehension' },
  'exercise':                { kind:'exercise',    domain:'exercise_libre' }
};

function splitDistractors(raw){
  return (raw || '').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
}

const Contribute = {
  onKindChange(){
    const kind = document.getElementById('c-kind').value;
    const emojiField = document.getElementById('c-emoji-field');
    emojiField.style.display = (kind === 'vocabulary') ? '' : 'none';
  },

  async submit(){
    const statusEl = document.getElementById('contribute-status');
    statusEl.textContent = '';
    statusEl.style.color = '';

    const kindKey = document.getElementById('c-kind').value;
    const level = parseInt(document.getElementById('c-level').value, 10);
    const content = document.getElementById('c-content').value.trim();
    const answer = document.getElementById('c-answer').value.trim();
    const emoji = document.getElementById('c-emoji').value.trim();
    const distractors = splitDistractors(document.getElementById('c-distractors').value);
    const translation = document.getElementById('c-translation').value.trim();
    const sources = document.getElementById('c-sources').value.trim();
    const name = document.getElementById('c-name').value.trim();
    const contact = document.getElementById('c-contact').value.trim();
    const note = document.getElementById('c-note').value.trim();

    if(!content || !answer){
      statusEl.textContent = 'Merci de remplir au moins le contenu proposé et la réponse attendue.';
      statusEl.style.color = '#b23b3b';
      return;
    }
    if(!sources){
      statusEl.textContent = "Merci d'indiquer une source, même courte (dictionnaire, personne consultée…) — c'est ce qui permet à la relecture d'aller plus vite.";
      statusEl.style.color = '#b23b3b';
      return;
    }
    if(kindKey === 'vocabulary' && !emoji){
      statusEl.textContent = "Un émoji est nécessaire pour un mot isolé (c'est ce qui s'affiche dans l'exercice « Nommer les images »).";
      statusEl.style.color = '#b23b3b';
      return;
    }

    const map = KIND_MAP[kindKey];
    const answerUpper = answer.toUpperCase();
    let payload;
    if(map.kind === 'vocabulary'){
      payload = { emoji, answer: answerUpper, choices: [answerUpper, ...distractors] };
    } else if(map.kind === 'sentence'){
      payload = { text: content, answer: answerUpper, choices: [answerUpper, ...distractors], translation_fr: translation || null };
    } else {
      payload = { content, answer: answerUpper, translation_fr: translation || null, distractors };
    }

    statusEl.textContent = 'Envoi en cours…';
    const { error } = await ReParoleStore.submitContent({
      language: 'kab', // v6.38 : kabyle uniquement pour l'instant, mécanisme déjà extensible
      domain: map.domain, level, kind: map.kind, payload, sources,
      contributorName: name || null, contributorContact: contact || null, contributorNote: note || null
    });

    if(error){
      statusEl.textContent = "Ça n'a pas fonctionné : " + error.message;
      statusEl.style.color = '#b23b3b';
      return;
    }

    statusEl.textContent = '✅ Merci ! Votre proposition a bien été envoyée et sera relue prochainement.';
    statusEl.style.color = 'var(--accent-dark)';
    document.getElementById('contribute-form').reset();
    Contribute.onKindChange();
  }
};

if(typeof window !== 'undefined'){ window.Contribute = Contribute; }
if(typeof module !== 'undefined' && module.exports){ module.exports = { Contribute, KIND_MAP, splitDistractors }; }
