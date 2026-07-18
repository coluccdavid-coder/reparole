# Assistant IA de ReParole — edge function `ia-assist` (multi-tâches)

Une seule fonction serveur pour TOUS les usages IA du site. Principe
absolu, dans chaque prompt : **l'IA prépare, l'humain décide** — rien de
ce qu'elle produit n'est appliqué sans validation de l'orthophoniste ou
de l'admin.

## Les tâches

| Tâche | Qui | Ce que ça produit | Qui décide |
|---|---|---|---|
| `report_draft` | ortho (Pro) | brouillon de compte-rendu | l'ortho relit, corrige, signe |
| `suggest_words` | ortho (Pro) | 5-6 mots à cibler (JSON) d'après les erreurs récurrentes | l'ortho valide chaque mot d'un clic |
| `prep_note` | ortho (Pro) | note de préparation de séance (5-8 lignes) | lecture seule, éditable, jamais stockée automatiquement |
| `rewrite_note` | ortho (Pro) | reformulation propre d'un brouillon de note | remplit le champ, l'ortho modifie puis ajoute lui-même |
| `triage_suggestions` | admin | classement de la boîte à idées par thème + bugs probables | l'admin trie et répond |
| `errors_digest` | admin | résumé des erreurs techniques par cause probable | l'admin débogue |

## Garanties (identiques pour toutes les tâches)

1. **Authentification par jeton de session** (Supabase Auth). Tâches
   ortho : rattachement au patient re-vérifié (`patient_assignments`).
   Tâches admin : appartenance à la table `admins` re-vérifiée.
2. **Anonymisation** : ni nom ni code patient ne partent vers l'IA —
   uniquement des agrégats et « le patient ». Pour l'admin, les
   suggestions sont transmises SANS les emails de contact.
3. **Plafond 40 appels/jour/compte** (table `ia_usage`, toutes tâches
   confondues) — coût borné.
4. **Clé API en secret serveur** (`ANTHROPIC_API_KEY`), jamais côté
   client. Bascule Mistral documentée en commentaire (2 lignes).

## Déploiement

1. Clé API : https://console.anthropic.com (ou Mistral, voir le code).
2. Secret Supabase : `ANTHROPIC_API_KEY=sk-ant-…`
3. Rejouer `sql/schema.sql` (table `ia_usage`).
4. ```bash
   supabase functions new ia-assist
   # coller le code ci-dessous dans supabase/functions/ia-assist/index.ts
   supabase functions deploy ia-assist
   ```

## Le code complet

```ts
// supabase/functions/ia-assist/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_CAP = 40;
const ORTHO_TASKS = ['report_draft', 'suggest_words', 'prep_note', 'rewrite_note'];
const ADMIN_TASKS = ['triage_suggestions', 'errors_digest'];

const HUMAN_RULE = `Règle absolue : tu PRÉPARES, l'humain DÉCIDE. Tu ne poses
AUCUN diagnostic, tu ne prends AUCUNE décision clinique ou produit, tu ne
donnes AUCUNE recommandation thérapeutique. Le patient est désigné
« le patient » (aucun nom ne t'est fourni, n'en invente pas).`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    // --- 1. Authentification par jeton de session
    const authHeader = req.headers.get('Authorization') ?? '';
    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supaUser.auth.getUser();
    if (!user) return json({ error: 'non authentifié' }, 401);
    const accountCode = user.id;

    const { task, patient_code, text, lang } = await req.json();
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // clé service role, jamais côté client
    );

    // --- 2. Contrôle de rôle par tâche
    if (ORTHO_TASKS.includes(task)) {
      if (!patient_code) return json({ error: 'patient_code requis' }, 400);
      const { data: assign } = await supa.from('patient_assignments')
        .select('patient_code').eq('patient_code', patient_code).eq('ortho_code', accountCode).maybeSingle();
      if (!assign) return json({ error: 'patient non rattaché à ce compte' }, 403);
    } else if (ADMIN_TASKS.includes(task)) {
      const { data: adm } = await supa.from('admins')
        .select('user_id').eq('user_id', accountCode).maybeSingle();
      if (!adm) return json({ error: 'réservé aux administrateurs' }, 403);
    } else {
      return json({ error: 'tâche inconnue' }, 400);
    }

    // --- 3. Plafond journalier (toutes tâches confondues)
    const since = new Date(Date.now() - 24*3600*1000).toISOString();
    const { count } = await supa.from('ia_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ortho_code', accountCode).gte('at', since);
    if ((count ?? 0) >= DAILY_CAP) return json({ error: 'plafond journalier atteint' }, 429);

    // --- 4. Construire données + prompt selon la tâche (ANONYMISÉ)
    const L = lang === 'fr' || !lang ? 'français' : `la langue de code "${lang}"`;
    let system = '', userMsg = '', wantJson = false;

    if (task === 'report_draft' || task === 'prep_note' || task === 'suggest_words') {
      const { data: p } = await supa.from('patients')
        .select('level, sessions, correct, total, streak, clinical_profile').eq('code', patient_code).single();
      const { data: hist } = await supa.from('sessions')
        .select('type, correct, total, at').eq('code', patient_code).order('at', { ascending: false }).limit(30);
      const { data: errs } = await supa.from('error_events')
        .select('category, word').eq('code', patient_code).order('at', { ascending: false }).limit(200);
      const { data: words } = await supa.from('caregiver_words').select('word, source').eq('code', patient_code);
      const { data: voice } = await supa.from('voice_recordings')
        .select('word, verdict').eq('code', patient_code)
        .gte('created_at', new Date(Date.now() - 30*24*3600*1000).toISOString());

      const errCounts: Record<string, number> = {};
      const errWords: Record<string, number> = {};
      (errs ?? []).forEach(e => {
        errCounts[e.category] = (errCounts[e.category] ?? 0) + 1;
        if (e.word) errWords[e.word] = (errWords[e.word] ?? 0) + 1;
      });
      const summary = {
        niveau: p?.level, seances: p?.sessions,
        reussite_globale: p?.total ? Math.round(100 * p.correct / p.total) + '%' : null,
        jours_consecutifs: p?.streak, profil_clinique: p?.clinical_profile ?? null,
        seances_recentes: (hist ?? []).map(s => ({ type: s.type, score: s.total ? Math.round(100*s.correct/s.total)+'%' : null, date: (s.at||'').slice(0,10) })),
        categories_erreurs: errCounts,
        mots_souvent_en_erreur: Object.entries(errWords).sort((a,b)=>b[1]-a[1]).slice(0,15),
        mots_deja_cibles: (words ?? []).map(w => ({ mot: w.word, origine: w.source })),
        productions_vocales: (voice ?? []).map(v => ({ mot: v.word, verdict: v.verdict })),
      };
      userMsg = 'Données de suivi (JSON) :\n' + JSON.stringify(summary, null, 2);

      if (task === 'report_draft') {
        system = `${HUMAN_RULE}
Rédige un BROUILLON de compte-rendu de suivi factuel : période, assiduité,
résultats par type d'exercice, évolution, mots travaillés, retours vocaux.
Ton professionnel et sobre. Termine par : ce brouillon est généré
automatiquement et doit être relu, corrigé et validé par l'orthophoniste.
Rédige en ${L}.`;
      } else if (task === 'prep_note') {
        system = `${HUMAN_RULE}
Rédige une NOTE DE PRÉPARATION de séance de 5 à 8 lignes, à lire en 30
secondes avant le rendez-vous : depuis la dernière séance (volume,
tendance), 2-3 points d'attention factuels (mots récurrents en erreur,
verdicts vocaux en attente, baisse ou progrès net). Uniquement des faits
tirés des données. Rédige en ${L}.`;
      } else {
        wantJson = true;
        system = `${HUMAN_RULE}
Propose 5 à 6 MOTS à travailler en priorité, choisis d'après les mots
souvent en erreur et les catégories dominantes — en évitant les mots déjà
ciblés. Ce sont des PROPOSITIONS : l'orthophoniste validera un par un.
Réponds UNIQUEMENT en JSON strict, sans texte autour ni balises :
{"suggestions":[{"mot":"…","emoji":"…","raison":"… (6 mots max)"}]}
Les mots et raisons en ${L}.`;
      }
    }

    if (task === 'rewrite_note') {
      if (!text || !String(text).trim()) return json({ error: 'text requis' }, 400);
      system = `${HUMAN_RULE}
Reformule ce brouillon de note clinique en une note claire, concise et
professionnelle. Conserve STRICTEMENT les faits — n'ajoute rien, ne
supprime aucune information, n'interprète pas. Rédige en ${L}.`;
      userMsg = String(text).slice(0, 4000);
    }

    if (task === 'triage_suggestions') {
      const { data: suggs } = await supa.from('suggestions')
        .select('role, message, created_at, status').order('created_at', { ascending: false }).limit(100);
      // ANONYMISATION : les emails de contact ne sont PAS transmis.
      system = `${HUMAN_RULE}
Tu aides l'administrateur à trier sa boîte à idées. Classe les
suggestions par thème (visuel/ergonomie, contenu, bug probable, autre),
résume chaque thème en 1-2 phrases, signale en tête celles qui décrivent
un BUG probable. Ne réponds à personne : l'admin trie et répond. En ${L}.`;
      userMsg = 'Suggestions (JSON) :\n' + JSON.stringify(suggs ?? [], null, 2);
    }

    if (task === 'errors_digest') {
      const { data: errors } = await supa.from('client_errors')
        .select('message, page, stack, created_at').order('created_at', { ascending: false }).limit(100);
      system = `${HUMAN_RULE}
Tu aides le développeur : regroupe ces erreurs techniques par cause
probable, indique la fréquence de chaque groupe et, si possible, la piste
de correction la plus plausible. Sois concret et bref. En ${L}.`;
      userMsg = 'Erreurs (JSON) :\n' + JSON.stringify(errors ?? [], null, 2);
    }

    // --- 5. Appel IA (Anthropic ; bascule Mistral : url
    //     https://api.mistral.ai/v1/chat/completions, corps format OpenAI,
    //     réponse dans data.choices[0].message.content)
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', max_tokens: 1200, system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    if (!aiRes.ok) return json({ error: 'fournisseur IA indisponible (' + aiRes.status + ')' }, 502);
    const ai = await aiRes.json();
    let out = (ai.content ?? []).map((c: { text?: string }) => c.text ?? '').join('\n').trim();
    if (!out) return json({ error: 'réponse vide' }, 502);

    if (wantJson) {
      try { out = JSON.parse(out.replace(/```json|```/g, '').trim()); }
      catch { return json({ error: 'réponse IA non exploitable' }, 502); }
    }

    // --- 6. Comptabiliser
    await supa.from('ia_usage').insert({ ortho_code: accountCode });
    return json({ result: out });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

## Coût

`claude-haiku-4-5` : de l'ordre du centime par appel — plafond 40/jour ⇒
pire cas quelques dizaines de centimes/jour/compte, couvert par
l'abonnement Pro (9,99 €/mois). Les tâches admin comptent dans le même
plafond (c'est ton propre compte).

## Conformité

Mention « sous-traitant IA (données anonymisées) » à ajouter dans la
politique de confidentialité — à faire relire par un juriste. Bascule
Mistral (hébergement européen) documentée dans le code si l'argument
compte pour la FNO / France AVC.
