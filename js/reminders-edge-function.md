# Rappels par email — comment les activer réellement

Ce prototype **prépare** les rappels (case à cocher patient, colonnes
`reminder_opt_in` / `reminder_email` dans `patients`), mais **n'envoie pas
d'email lui-même**. C'est un choix assumé : envoyer un vrai email demande un
service tiers (Resend, Postmark, SendGrid...) et une clé API secrète, que je
ne peux pas créer ou détenir à votre place. Voici comment le brancher
vous-même, en 15–20 minutes.

**v6.133 (point 18 de la demande d'amélioration)** : le rappel générique
("vous n'êtes pas venu·e depuis quelques jours") a été rendu contextuel
— il mentionne maintenant un mot précis à retravailler, tiré des erreurs
déjà journalisées. C'est la seule partie que je peux réellement livrer :
le déclenchement et l'envoi restent entièrement de votre côté (service
tiers + clé API), comme expliqué ci-dessus.

## 1. Créer un compte sur un service d'envoi d'email

Par exemple [Resend](https://resend.com) (offre gratuite suffisante pour
commencer). Récupérez une clé API.

## 2. Créer une Supabase Edge Function

Dans votre projet Supabase : **Edge Functions** → **Create a function**,
nommez-la `send-reminders`. Collez un code de ce style :

```ts
// supabase/functions/send-reminders/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // clé "service role", jamais côté client
  )

  // Patients qui ont demandé des rappels et ne sont pas venus depuis 3 jours
  const threeDaysAgo = new Date(Date.now() - 3*24*3600*1000).toISOString()
  const { data: patients, error } = await supabase
    .from('patients')
    .select('code,name,reminder_email')
    .eq('reminder_opt_in', true)
    .not('reminder_email', 'is', null)
    .lt('last_seen', threeDaysAgo)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  for (const p of patients ?? []) {
    // v6.133 (point 18) : rappel contextuel plutôt que générique — un
    // mot précis à retravailler donne une vraie raison d'y retourner,
    // plutôt que "vous n'êtes pas venu·e depuis quelques jours" seul.
    // Réutilise les erreurs déjà journalisées (error_events), aucune
    // nouvelle donnée à collecter.
    const { data: recentErrors } = await supabase
      .from('error_events')
      .select('target')
      .eq('code', p.code)
      .not('target', 'is', null)
      .order('at', { ascending: false })
      .limit(20)

    // Le mot qui revient le plus souvent dans les erreurs récentes —
    // même logique que "Mots à revoir" côté patient (js/app.js,
    // renderWordsToReview). Repli sur un message générique si aucune
    // erreur récente n'existe (compte tout neuf, par exemple).
    const counts: Record<string, number> = {}
    for (const e of recentErrors ?? []) {
      if (e.target) counts[e.target] = (counts[e.target] || 0) + 1
    }
    const topWord = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]

    const text = topWord
      ? `Bonjour ${p.name}, ça fait quelques jours — il vous restait "${topWord.toLowerCase()}" à retravailler, une courte séance vous attend quand vous voulez.`
      : `Bonjour ${p.name}, ça fait quelques jours — une courte séance vous attend quand vous voulez.`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ReParole <rappels@votredomaine.fr>',
        to: p.reminder_email,
        subject: 'Un petit rappel pour votre séance ReParole',
        text
      })
    })
  }

  return new Response(JSON.stringify({ sent: patients?.length ?? 0 }))
})
```

## 3. Configurer les secrets

Dans Supabase : **Edge Functions → send-reminders → Secrets**, ajoutez
`RESEND_API_KEY` et vérifiez que `SUPABASE_SERVICE_ROLE_KEY` /
`SUPABASE_URL` sont disponibles (généralement déjà présents par défaut sur
Supabase).

## 4. Planifier l'exécution (cron)

Supabase propose **Database → Cron Jobs** (extension `pg_cron`) pour
déclencher la fonction chaque jour, par exemple :

```sql
select cron.schedule(
  'reparole-daily-reminders',
  '0 9 * * *',  -- tous les jours à 9h
  $$ select net.http_post(
    url:='https://VOTRE-PROJET.supabase.co/functions/v1/send-reminders',
    headers:='{"Authorization": "Bearer VOTRE_ANON_KEY"}'::jsonb
  ) $$
);
```

## ⚠️ RGPD

L'email du patient est une donnée personnelle. Assurez-vous que :
- la case à cocher est bien un consentement explicite (opt-in, jamais coché par défaut — c'est déjà le cas dans l'app) ;
- le patient peut se désinscrire facilement (décocher dans son tableau de bord suffit, déjà supporté) ;
- l'email d'expédition indique clairement qui envoie et pourquoi.
