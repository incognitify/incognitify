import { applyStripeSubscription } from '$lib/server/billing';
import { getStripe } from '$lib/server/stripe';
import type Stripe from 'stripe';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');
  if (!secret || !sig) return new Response('Webhook not configured', { status: 400 });

  // Stripe needs the raw body for signature verification.
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applyStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const sub = session.subscription;
        if (sub) {
          const id = typeof sub === 'string' ? sub : sub.id;
          await applyStripeSubscription(await getStripe().subscriptions.retrieve(id));
        }
        break;
      }
    }
  } catch (e) {
    console.error('[stripe] webhook handler error', e);
    return new Response('Handler error', { status: 500 });
  }

  return new Response('ok');
};
