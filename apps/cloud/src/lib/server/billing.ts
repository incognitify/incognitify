import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { recordAudit } from './audit';
import { getDb } from './db';
import { member, organization, subscription } from './db/schema';
import { getStripe } from './stripe';

const SUB_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
] as const;
type SubStatus = (typeof SUB_STATUSES)[number];

export function getSubscriptionRow(orgId: string) {
  return getDb()
    .select()
    .from(subscription)
    .where(eq(subscription.organizationId, orgId))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function countMembers(orgId: string): Promise<number> {
  const rows = await getDb()
    .select({ id: member.id })
    .from(member)
    .where(eq(member.organizationId, orgId));
  return rows.length;
}

/** Ensure a Stripe customer + subscription row exist for the org; return the customer id. */
export async function ensureCustomer(orgId: string, email: string): Promise<string> {
  const existing = await getSubscriptionRow(orgId);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const db = getDb();
  const org = (
    await db.select({ name: organization.name }).from(organization).where(eq(organization.id, orgId)).limit(1)
  )[0];

  const customer = await getStripe().customers.create({
    email,
    name: org?.name ?? undefined,
    metadata: { organizationId: orgId },
  });

  if (existing) {
    await db
      .update(subscription)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(subscription.organizationId, orgId));
  } else {
    await db.insert(subscription).values({
      organizationId: orgId,
      stripeCustomerId: customer.id,
      plan: 'free',
      status: 'canceled',
    });
  }
  return customer.id;
}

/** Start a Checkout session for the Team plan (per-seat, quantity = member count). */
export async function createCheckout(orgId: string, email: string, returnUrl: string): Promise<string | null> {
  const priceId = process.env.STRIPE_PRICE_TEAM;
  if (!priceId) throw new Error('STRIPE_PRICE_TEAM is not set');

  const customerId = await ensureCustomer(orgId, email);
  const seats = Math.max(1, await countMembers(orgId));

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: seats }],
    allow_promotion_codes: true,
    success_url: `${returnUrl}?status=success`,
    cancel_url: `${returnUrl}?status=cancel`,
    subscription_data: { metadata: { organizationId: orgId } },
  });
  return session.url;
}

/** Open the Stripe Billing Portal (manage seats, payment method, cancel). */
export async function createPortal(orgId: string, returnUrl: string): Promise<string | null> {
  const row = await getSubscriptionRow(orgId);
  if (!row?.stripeCustomerId) return null;
  const session = await getStripe().billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

/** Reconcile our subscription row from a Stripe subscription (called by the webhook). */
export async function applyStripeSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const db = getDb();
  const row = (
    await db.select().from(subscription).where(eq(subscription.stripeCustomerId, customerId)).limit(1)
  )[0];
  if (!row) return;

  const status = mapStatus(sub.status);
  const active = status === 'active' || status === 'trialing' || status === 'past_due';
  const plan = active ? 'team' : 'free';
  const item = sub.items.data[0];

  await db
    .update(subscription)
    .set({
      stripeSubscriptionId: sub.id,
      plan,
      status,
      seats: item?.quantity ?? null,
      currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscription.organizationId, row.organizationId));

  if (row.plan !== plan || row.status !== status) {
    await recordAudit({
      orgId: row.organizationId,
      action: 'subscription.changed',
      targetType: 'subscription',
      metadata: { from: { plan: row.plan, status: row.status }, to: { plan, status }, seats: item?.quantity ?? null },
    });
  }
}

function mapStatus(s: string): SubStatus {
  return (SUB_STATUSES as readonly string[]).includes(s) ? (s as SubStatus) : 'canceled';
}

/**
 * Reconcile the Stripe subscription quantity to the org's current member count.
 * No-op for free orgs / inactive subscriptions, and idempotent (skips if already in sync).
 */
export async function syncSeats(orgId: string): Promise<void> {
  const row = await getSubscriptionRow(orgId);
  if (!row?.stripeSubscriptionId) return;
  if (!(row.status === 'active' || row.status === 'trialing' || row.status === 'past_due')) return;

  const seats = Math.max(1, await countMembers(orgId));
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
  const item = sub.items.data[0];
  if (!item || item.quantity === seats) return;

  await stripe.subscriptions.update(row.stripeSubscriptionId, {
    items: [{ id: item.id, quantity: seats }],
    proration_behavior: 'create_prorations',
  });
  await getDb()
    .update(subscription)
    .set({ seats, updatedAt: new Date() })
    .where(eq(subscription.organizationId, orgId));
}
