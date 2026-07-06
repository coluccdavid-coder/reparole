# Paiement réel (Stripe) — comment l'activer vous-même

Comme pour Supabase et GitHub, je ne peux pas créer de compte Stripe à
votre place. Voici comment le mettre en place, en environ 30-40 minutes.
Une fois fait, envoyez-moi les identifiants demandés et je termine le
branchement.

**Pourquoi Stripe plutôt que PayPal séparément** : Stripe peut afficher
PayPal comme moyen de paiement dans son propre système — une seule
intégration technique, deux moyens de paiement pour vos patients/ortho.

**Pourquoi pas Oney pour l'instant** : c'est un partenariat commercial
(dossier, SIRET, vérifications), pas une simple inscription en ligne —
disproportionné pour un abonnement à quelques euros. À reconsidérer plus
tard si le projet grandit.

## 1. Créer un compte Stripe

[https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
— gratuit, aucun frais tant qu'il n'y a pas de paiement réel. Restez en
**mode test** au début (bascule en haut à droite du tableau de bord) :
ça permet de tout essayer avec de fausses cartes bancaires avant
d'activer le vrai paiement.

## 2. Activer PayPal comme moyen de paiement

Dans le tableau de bord Stripe : **Paramètres** → **Moyens de paiement**
→ activez **PayPal** (peut nécessiter de confirmer quelques informations
sur votre activité — c'est direct, pas un partenariat séparé).

## 3. Créer les 4 tarifs (Products → Prices)

**Produits** → **Ajouter un produit**, à répéter 4 fois :

| Produit | Prix | Facturation |
|---|---|---|
| ReParole Pro (patient) | 2,99 € | Mensuelle, récurrente |
| ReParole Pro (patient) — annuel | 19,99 € | Annuelle, récurrente |
| ReParole Pro (orthophoniste) | 9,99 € | Mensuelle, récurrente |
| ReParole Pro (orthophoniste) — annuel | 79,00 € | Annuelle, récurrente |

Pour chaque tarif créé, notez son **identifiant** (commence par `price_...`,
visible sur la page du produit) — il en faut 4 au total.

## 4. Récupérer les clés API

**Développeurs** → **Clés API** :
- **Clé publiable** (`pk_test_...` en mode test) — pas secrète, peut
  être utilisée côté navigateur.
- **Clé secrète** (`sk_test_...`) — **ne jamais mettre côté client**,
  uniquement dans l'Edge Function (secrets Supabase, jamais dans un
  fichier `.js` livré au navigateur).

## 5. Créer les deux Supabase Edge Functions

### 5a. `create-checkout-session` — démarre un paiement

Dans Supabase : **Edge Functions** → **Create a function**, nommez-la
`create-checkout-session` :

```ts
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

// v6.26 : correspondance entre le "planKey" envoyé par l'app et le vrai
// identifiant de tarif Stripe — gardée côté serveur pour qu'un patient
// ne puisse jamais forcer un tarif différent en modifiant le code
// JavaScript de son navigateur.
const PRICE_IDS: Record<string,string> = {
  patient_monthly: Deno.env.get('STRIPE_PRICE_PATIENT_MONTHLY')!,
  patient_annual:  Deno.env.get('STRIPE_PRICE_PATIENT_ANNUAL')!,
  ortho_monthly:   Deno.env.get('STRIPE_PRICE_ORTHO_MONTHLY')!,
  ortho_annual:    Deno.env.get('STRIPE_PRICE_ORTHO_ANNUAL')!,
}

Deno.serve(async (req) => {
  // CORS : votre app tourne sur un autre domaine que supabase.co
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  try {
    const { planKey, accountCode, accountType, successUrl, cancelUrl } = await req.json()
    const priceId = PRICE_IDS[planKey]
    if (!priceId) return new Response(JSON.stringify({ error: 'Offre inconnue' }), { status: 400, headers })
    if (!accountCode || !['patient','ortho'].includes(accountType)) {
      return new Response(JSON.stringify({ error: 'Compte invalide' }), { status: 400, headers })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: accountCode,
      metadata: { accountType, accountCode },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), { headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers })
  }
})
```

### 5b. `stripe-webhook` — confirme le paiement et active le compte pro

Nouvelle fonction `stripe-webhook` :

```ts
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // clé "service role", jamais côté client
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  // v6.26 : vérifie que l'appel vient VRAIMENT de Stripe (signature
  // cryptographique) — sans ça, n'importe qui pourrait appeler cette
  // URL et s'auto-déclarer "payé".
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (e) {
    return new Response(`Signature invalide : ${e.message}`, { status: 400 })
  }

  const table = (accountType: string) => accountType === 'ortho' ? 'orthophonists' : 'patients'

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const accountCode = session.client_reference_id
    const accountType = session.metadata?.accountType || 'patient'
    await supabase.from(table(accountType)).update({
      plan: 'pro',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    }).eq('code', accountCode)
  }

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as any
    if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due') {
      // Repasse en gratuit dans les deux tables (on ne sait pas laquelle sans requêter)
      await supabase.from('patients').update({ plan: 'free' }).eq('stripe_subscription_id', sub.id)
      await supabase.from('orthophonists').update({ plan: 'free' }).eq('stripe_subscription_id', sub.id)
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
```

## 6. Configurer les secrets des deux fonctions

**Edge Functions → (chaque fonction) → Secrets**, ajoutez :
- `STRIPE_SECRET_KEY` (celle du point 4, jamais la clé publiable)
- `STRIPE_PRICE_PATIENT_MONTHLY`, `STRIPE_PRICE_PATIENT_ANNUAL`,
  `STRIPE_PRICE_ORTHO_MONTHLY`, `STRIPE_PRICE_ORTHO_ANNUAL` (les 4
  identifiants `price_...` du point 3)
- `STRIPE_WEBHOOK_SECRET` (obtenu à l'étape 7 ci-dessous — vous
  reviendrez compléter ce secret après avoir créé le webhook)

## 7. Configurer le webhook côté Stripe

Dans Stripe : **Développeurs** → **Webhooks** → **Ajouter un point de
terminaison** :
- URL : `https://VOTRE-PROJET.supabase.co/functions/v1/stripe-webhook`
- Événements à écouter : `checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Une fois créé, Stripe affiche un **secret de signature** (`whsec_...`)
— copiez-le dans le secret `STRIPE_WEBHOOK_SECRET` de l'étape 6.

## 8. Ce qu'il me faut de votre part

Une fois tout ça fait, envoyez-moi :
- La **clé publiable** Stripe (`pk_test_...` ou `pk_live_...`)
- L'URL de votre projet Supabase (déjà transmise si le mode cloud est
  configuré)

Je m'occupe de câbler le bouton "Passer à Pro" pour qu'il appelle
`create-checkout-session` et redirige vers Stripe.

## ⚠️ Mode test avant mode réel

Testez tout le parcours avec une [carte de test Stripe](https://stripe.com/docs/testing)
(`4242 4242 4242 4242`, n'importe quelle date future, n'importe quel
CVC) avant de basculer en mode production (bouton en haut du tableau de
bord Stripe) et de remplacer les clés `pk_test_`/`sk_test_` par leurs
équivalents `pk_live_`/`sk_live_`.
