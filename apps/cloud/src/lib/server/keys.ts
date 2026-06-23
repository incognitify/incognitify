import { and, desc, eq, or } from 'drizzle-orm';
import { recordAudit } from './audit';
import { seal, open, generateDek, unwrapDek, wrapDek } from './crypto/envelope';
import { getDb } from './db';
import { member, orgEncryptionKey, providerKey } from './db/schema';
import { getKek } from './env';
import { type Provider, validateProviderKey } from './providers';

export interface OrgContext {
  userId: string;
  orgId: string;
  role: string;
}

/**
 * Resolve the caller's active organization + role. Uses the session's active org if
 * set, otherwise the user's first membership. Returns null if the user has no org.
 */
export async function getOrgContext(
  userId: string,
  activeOrganizationId: string | null,
): Promise<OrgContext | null> {
  const db = getDb();
  const rows = await db.select().from(member).where(eq(member.userId, userId));
  const active = activeOrganizationId
    ? rows.find((r) => r.organizationId === activeOrganizationId)
    : undefined;
  const m = active ?? rows[0];
  if (!m) return null;
  return { userId, orgId: m.organizationId, role: m.role };
}

export function resolveOrgContext(
  user: { id: string } | null,
  session: { activeOrganizationId?: string | null } | null,
): Promise<OrgContext | null> {
  if (!user) return Promise.resolve(null);
  return getOrgContext(user.id, session?.activeOrganizationId ?? null);
}

/** Load the org's active DEK, creating one (wrapped by the KEK) on first use. */
async function getOrgDek(orgId: string): Promise<{ dek: Buffer; dekId: string }> {
  const db = getDb();
  const kek = getKek();

  const existing = await db
    .select()
    .from(orgEncryptionKey)
    .where(and(eq(orgEncryptionKey.organizationId, orgId), eq(orgEncryptionKey.status, 'active')))
    .limit(1);
  const row = existing[0];
  if (row) {
    const dek = unwrapDek(kek, { ciphertext: row.wrappedDek, iv: row.wrapIv, authTag: row.wrapAuthTag });
    return { dek, dekId: row.id };
  }

  // First key for this org. The partial-unique index guards against a concurrent
  // second active DEK (the loser's insert throws, surfaced as an action error).
  const dek = generateDek();
  const wrapped = wrapDek(kek, dek);
  const inserted = await db
    .insert(orgEncryptionKey)
    .values({
      organizationId: orgId,
      wrappedDek: wrapped.ciphertext,
      wrapIv: wrapped.iv,
      wrapAuthTag: wrapped.authTag,
    })
    .returning({ id: orgEncryptionKey.id });
  const created = inserted[0];
  if (!created) throw new Error('failed to create org encryption key');
  return { dek, dekId: created.id };
}

/** Shared (org) keys + the caller's own personal keys. No secret material returned. */
export function listKeys(orgId: string, userId: string) {
  return getDb()
    .select({
      id: providerKey.id,
      provider: providerKey.provider,
      label: providerKey.label,
      last4: providerKey.last4,
      scope: providerKey.scope,
      status: providerKey.status,
      createdAt: providerKey.createdAt,
    })
    .from(providerKey)
    .where(
      and(
        eq(providerKey.organizationId, orgId),
        or(
          eq(providerKey.scope, 'org'),
          and(eq(providerKey.scope, 'user'), eq(providerKey.ownerUserId, userId)),
        ),
      ),
    )
    .orderBy(desc(providerKey.createdAt));
}

export async function provisionKey(input: {
  ctx: OrgContext;
  scope: 'org' | 'user';
  provider: Provider;
  label: string;
  apiKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { ctx, scope, provider, label, apiKey } = input;
  if (scope === 'org' && !isAdmin(ctx.role)) {
    return { ok: false, error: 'Only an admin can add shared keys.' };
  }

  const valid = await validateProviderKey(provider, apiKey);
  if (!valid.ok) return valid;

  const { dek, dekId } = await getOrgDek(ctx.orgId);
  const sealed = seal(dek, apiKey);
  await getDb().insert(providerKey).values({
    organizationId: ctx.orgId,
    scope,
    ownerUserId: scope === 'user' ? ctx.userId : null,
    provider,
    label,
    last4: apiKey.slice(-4),
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    authTag: sealed.authTag,
    dekId,
    createdByUserId: ctx.userId,
    lastValidatedAt: new Date(),
  });

  await recordAudit({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: 'key.created',
    targetType: 'provider_key',
    metadata: { provider, scope, label, last4: apiKey.slice(-4) },
  });
  return { ok: true };
}

export async function removeKey(
  ctx: OrgContext,
  keyId: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(providerKey)
    .where(and(eq(providerKey.id, keyId), eq(providerKey.organizationId, ctx.orgId)))
    .limit(1);
  const key = rows[0];
  if (!key) return { ok: false, error: 'Key not found.' };

  if (key.scope === 'org' && !isAdmin(ctx.role)) {
    return { ok: false, error: 'Only an admin can remove shared keys.' };
  }
  if (key.scope === 'user' && key.ownerUserId !== ctx.userId) {
    return { ok: false, error: 'You can only remove your own keys.' };
  }

  await db.delete(providerKey).where(eq(providerKey.id, keyId));

  await recordAudit({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: 'key.removed',
    targetType: 'provider_key',
    targetId: keyId,
    metadata: { provider: key.provider, scope: key.scope, label: key.label },
  });
  return { ok: true };
}

/** Decrypt a stored key back to plaintext for the proxy. Server-only; never log it. */
export async function decryptProviderKey(orgId: string, keyId: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(providerKey)
    .where(and(eq(providerKey.id, keyId), eq(providerKey.organizationId, orgId)))
    .limit(1);
  const key = rows[0];
  if (!key) return null;

  const dekRows = await db
    .select()
    .from(orgEncryptionKey)
    .where(eq(orgEncryptionKey.id, key.dekId))
    .limit(1);
  const dekRow = dekRows[0];
  if (!dekRow) return null;

  const dek = unwrapDek(getKek(), {
    ciphertext: dekRow.wrappedDek,
    iv: dekRow.wrapIv,
    authTag: dekRow.wrapAuthTag,
  });
  return open(dek, { ciphertext: key.ciphertext, iv: key.iv, authTag: key.authTag });
}

/**
 * Resolve a key for the proxy: enforce access (personal keys are owner-only), confirm
 * it's active, and return its provider + decrypted secret. Never log the result.
 */
export async function getUsableKey(
  ctx: OrgContext,
  keyId: string,
): Promise<{ ok: true; provider: Provider; apiKey: string } | { ok: false; error: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(providerKey)
    .where(and(eq(providerKey.id, keyId), eq(providerKey.organizationId, ctx.orgId)))
    .limit(1);
  const key = rows[0];
  if (!key) return { ok: false, error: 'Key not found.' };
  if (key.scope === 'user' && key.ownerUserId !== ctx.userId) {
    return { ok: false, error: 'You can only use your own personal keys.' };
  }
  if (key.status !== 'active') return { ok: false, error: 'This key is not active.' };

  const apiKey = await decryptProviderKey(ctx.orgId, keyId);
  if (!apiKey) return { ok: false, error: 'Could not decrypt the key.' };
  return { ok: true, provider: key.provider, apiKey };
}

function isAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin';
}
