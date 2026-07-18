# Brouillon de compte-rendu par IA — edge function à déployer

Comme pour Stripe et les rappels, cette fonction s'exécute **côté
serveur** (Supabase Edge Functions) : la clé API du fournisseur IA n'est
**jamais** dans le navigateur, et les données partent **anonymisées**.

## Ce que fait la fonction (garanties)

1. **Authentifie l'orthophoniste** (jeton de session Supabase Auth) et
   **vérifie le rattachement** au patient (`patient_assignments`) — un
   ortho ne peut générer un brouillon que pour SES patients.
2. **Anonymise avant tout appel IA** : le nom et le code du patient ne
   quittent JAMAIS Supabase. Le prompt ne contient que « le patient »
   et des données de suivi agrégées (séances, réussite, tendance,
   catégories d'erreurs, mots ciblés + verdicts vocaux).
3. **Plafonne** à 20 brouillons/jour/ortho (table `ia_usage`) — maîtrise
   du coût.
4. Renvoie un **brouillon éditable** — l'interface affiche clairement
   que l'ortho relit, corrige et reste signataire. L'IA ne diagnostique
   rien : elle met en forme des données existantes.

## 1. Créer la clé API

**Par défaut : Anthropic (Claude).** https://console.anthropic.com →
API Keys → créer une clé. Modèle utilisé : `claude-haiku-4-5` (rapide,
peu coûteux, largement suffisant pour de la mise en forme).

**Alternative européenne : Mistral** (argument RGPD vendeur auprès des
orthos). https://console.mistral.ai → clé API. La bascule est indiquée
en commentaire dans le code (2 lignes à changer : URL + format).

## 2. Ajouter les secrets dans Supabase

Tableau de bord Supabase → **Edge Functions** → **Secrets** :

```
ANTHROPIC_API_KEY=sk-ant-…        (ou MISTRAL_API_KEY=…)
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont déjà fournis
automatiquement aux edge functions.

## 3. Rejouer sql/schema.sql

La table `ia_usage` (plafond journalier) fait partie du schéma v6.175.

## 4. Déployer la fonction

```bash
supabase functions new generate-report-draft
# coller le code ci-dessous dans supabase/functions/generate-report-draft/index.ts
supabase functions deploy generate-report-draft
```

## 5. Le code complet

```ts
// supabase/functions/generate-report-draft/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_CAP = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    // --- 1. Authentifier l'orthophoniste (jeton de session, pas la clé anon)
    const authHeader = req.headers.get('Authorization') ?? '';
    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supaUser.auth.getUser();
    if (!user) return json({ error: 'non authentifié' }, 401);
    const orthoCode = user.id; // = orthophonists.code (voir schema.sql)

    const { patient_code, lang } = await req.json();
    if (!patient_code) return json({ error: 'patient_code requis' }, 400);

    // --- 2. Service role pour lire les données (RLS contournée EXPRÈS,
    //        donc on re-vérifie le rattachement nous-mêmes, toujours)
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // clé "service role", jamais côté client
    );
    const { data: assign } = await supa.from('patient_assignments')
      .select('patient_code').eq('patient_code', patient_code).eq('ortho_code', orthoCode).maybeSingle();
    if (!assign) return json({ error: 'patient non rattaché à ce compte' }, 403);

    // --- 3. Plafond journalier (maîtrise du coût)
    const since = new Date(Date.now() - 24*3600*1000).toISOString();
    const { count } = await supa.from('ia_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ortho_code', orthoCode).gte('at', since);
    if ((count ?? 0) >= DAILY_CAP) return json({ error: 'plafond journalier atteint' }, 429);

    // --- 4. Collecter les données de suivi — ANONYMISATION : ni nom ni
    //        code ne partent vers l'IA. Seulement des agrégats.
    const { data: p } = await supa.from('patients')
      .select('level, sessions, correct, total, streak, clinical_profile').eq('code', patient_code).single();
    const { data: hist } = await supa.from('sessions')
      .select('type, correct, total, at').eq('code', patient_code)
      .order('at', { ascending: false }).limit(30);
    const { data: errs } = await supa.from('error_events')
      .select('category').eq('code', patient_code)
      .order('at', { ascending: false }).limit(200);
    const { data: words } = await supa.from('caregiver_words')
      .select('word, source').eq('code', patient_code);
    const { data: voice } = await supa.from('voice_recordings')
      .select('word, verdict').eq('code', patient_code)
      .gte('created_at', new Date(Date.now() - 30*24*3600*1000).toISOString());

    const errCounts: Record<string, number> = {};
    (errs ?? []).forEach(e => { errCounts[e.category] = (errCounts[e.category] ?? 0) + 1; });

    const summary = {
      niveau: p?.level, seances: p?.sessions,
      reussite_globale: p?.total ? Math.round(100 * p.correct / p.total) + '%' : null,
      jours_consecutifs: p?.streak,
      profil_clinique: p?.clinical_profile ?? null,
      seances_recentes: (hist ?? []).map(s => ({ type: s.type, score: s.total ? Math.round(100*s.correct/s.total)+'%' : null, date: (s.at||'').slice(0,10) })),
      categories_erreurs: errCounts,
      mots_cibles: (words ?? []).map(w => ({ mot: w.word, origine: w.source })),
      productions_vocales: (voice ?? []).map(v => ({ mot: v.word, verdict: v.verdict })),
    };

    // --- 5. Appel IA (Anthropic par défaut).
    //     Bascule Mistral : url = https://api.mistral.ai/v1/chat/completions,
    //     header 'Authorization: Bearer …', corps au format OpenAI
    //     ({model:'mistral-small-latest', messages:[…]}), réponse dans
    //     data.choices[0].message.content.
    const system = `Tu aides un·e orthophoniste à rédiger un BROUILLON de compte-rendu de suivi
à partir de données objectives d'une application d'entraînement du langage.
Règles absolues :
- AUCUN diagnostic, AUCUNE interprétation clinique, AUCUNE recommandation
  thérapeutique : uniquement une mise en forme factuelle des données.
- Le patient est désigné « le patient » (aucun nom ne t'est fourni, n'en invente pas).
- Structure : période couverte, assiduité, résultats par type d'exercice,
  évolution, mots travaillés et retours vocaux. Ton professionnel et sobre.
- Termine par : ce brouillon est généré automatiquement et doit être relu,
  corrigé et validé par l'orthophoniste.
- Rédige en ${lang === 'fr' || !lang ? 'français' : `la langue de code "${lang}"`}.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: 'Données de suivi (JSON) :\n' + JSON.stringify(summary, null, 2) }],
      }),
    });
    if (!aiRes.ok) return json({ error: 'fournisseur IA indisponible (' + aiRes.status + ')' }, 502);
    const ai = await aiRes.json();
    const draft = (ai.content ?? []).map((c: { text?: string }) => c.text ?? '').join('\n').trim();
    if (!draft) return json({ error: 'brouillon vide' }, 502);

    // --- 6. Comptabiliser l'appel
    await supa.from('ia_usage').insert({ ortho_code: orthoCode });

    return json({ draft });
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

## Coût estimé

Avec `claude-haiku-4-5` : de l'ordre du **centime par brouillon** — le
plafond de 20/jour borne le pire cas à quelques dizaines de centimes par
ortho et par jour, largement couvert par l'abonnement Pro (9,99 €/mois).

## Rappel de conformité

Ajouter à la politique de confidentialité une mention du type : « des
données de suivi **anonymisées** peuvent être transmises à un
sous-traitant d'intelligence artificielle pour la rédaction assistée de
brouillons de comptes-rendus, activée uniquement par l'orthophoniste » —
à faire relire par un juriste (je n'en suis pas un). Si l'argument
« hébergement européen » compte pour tes prospects (FNO, France AVC),
la bascule Mistral documentée ci-dessus est faite pour ça.
