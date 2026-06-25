import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { organization, user } from './auth-schema';

// Re-export the Better Auth tables so the Drizzle client sees the full schema.
export * from './auth-schema';

/* ── enums ───────────────────────────────────────────────────────────── */
export const provider = pgEnum('provider', ['anthropic', 'openai']);
export const keyScope = pgEnum('key_scope', ['org', 'user']);
export const keyStatus = pgEnum('key_status', ['active', 'invalid', 'revoked']);
export const usageStatus = pgEnum('usage_status', ['success', 'error']);
export const plan = pgEnum('plan', ['free', 'team', 'enterprise']);
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);

/* ── org_encryption_key: wrapped per-org DEK ─────────────────────────── */
export const orgEncryptionKey = pgTable(
  'org_encryption_key',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    wrappedDek: text('wrapped_dek').notNull(), // base64( AES-256-GCM(KEK, DEK) )
    wrapIv: text('wrap_iv').notNull(),
    wrapAuthTag: text('wrap_auth_tag').notNull(),
    kekVersion: text('kek_version').notNull().default('v1'),
    status: text('status').notNull().default('active'), // 'active' | 'retired'
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    // at most one active DEK per org
    uniqueIndex('org_active_dek_idx')
      .on(t.organizationId)
      .where(sql`${t.status} = 'active'`),
  ],
);

/* ── provider_key: encrypted BYO keys (shared + personal) ────────────── */
export const providerKey = pgTable(
  'provider_key',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    scope: keyScope('scope').notNull(),
    ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'cascade' }),
    provider: provider('provider').notNull(),
    label: text('label').notNull(),
    last4: varchar('last4', { length: 4 }).notNull(),
    ciphertext: text('ciphertext').notNull(), // base64( AES-256-GCM(DEK, apiKey) )
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    dekId: uuid('dek_id')
      .notNull()
      .references(() => orgEncryptionKey.id),
    status: keyStatus('status').notNull().default('active'),
    lastValidatedAt: timestamp('last_validated_at'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('provider_key_org_idx').on(t.organizationId),
    index('provider_key_owner_idx').on(t.ownerUserId),
    // scope='user' ⇒ owner set; scope='org' ⇒ owner null
    check(
      'provider_key_scope_owner',
      sql`(${t.scope} = 'user' AND ${t.ownerUserId} IS NOT NULL) OR (${t.scope} = 'org' AND ${t.ownerUserId} IS NULL)`,
    ),
  ],
);

/* ── usage_event: append-only metering (NO content) ──────────────────── */
export const usageEvent = pgTable(
  'usage_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    providerKeyId: uuid('provider_key_id').references(() => providerKey.id, {
      onDelete: 'set null',
    }),
    provider: provider('provider').notNull(),
    model: text('model'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    maskedCount: integer('masked_count').notNull().default(0), // signature metric
    status: usageStatus('status').notNull(),
    errorCode: text('error_code'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('usage_org_time_idx').on(t.organizationId, t.createdAt)],
);

/* ── subscription: Stripe billing state (one per org) ────────────────── */
export const subscription = pgTable(
  'subscription',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .unique()
      .references(() => organization.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id'),
    plan: plan('plan').notNull().default('free'),
    status: subscriptionStatus('status').notNull().default('trialing'),
    seats: integer('seats'),
    currentPeriodEnd: timestamp('current_period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('subscription_customer_idx').on(t.stripeCustomerId)],
);

/* ── audit_log: security trail (optional for MVP) ────────────────────── */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // e.g. 'key.created', 'key.revoked'
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('audit_org_time_idx').on(t.organizationId, t.createdAt)],
);
