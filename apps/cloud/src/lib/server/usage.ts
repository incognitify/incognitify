import { and, count, desc, eq, gte, sum } from 'drizzle-orm';
import { getDb } from './db';
import { usageEvent, user } from './db/schema';

export interface ProviderUsage {
  provider: string;
  requests: number;
  masked: number;
  promptTokens: number;
  completionTokens: number;
}

/** Aggregate requests / masked values / tokens per provider since a given time. */
export async function getUsageByProvider(orgId: string, since: Date): Promise<ProviderUsage[]> {
  const rows = await getDb()
    .select({
      provider: usageEvent.provider,
      requests: count(),
      masked: sum(usageEvent.maskedCount),
      promptTokens: sum(usageEvent.promptTokens),
      completionTokens: sum(usageEvent.completionTokens),
    })
    .from(usageEvent)
    .where(and(eq(usageEvent.organizationId, orgId), gte(usageEvent.createdAt, since)))
    .groupBy(usageEvent.provider);

  return rows.map((r) => ({
    provider: r.provider,
    requests: Number(r.requests),
    masked: Number(r.masked ?? 0),
    promptTokens: Number(r.promptTokens ?? 0),
    completionTokens: Number(r.completionTokens ?? 0),
  }));
}

export async function getStatusCounts(
  orgId: string,
  since: Date,
): Promise<{ success: number; error: number }> {
  const rows = await getDb()
    .select({ status: usageEvent.status, c: count() })
    .from(usageEvent)
    .where(and(eq(usageEvent.organizationId, orgId), gte(usageEvent.createdAt, since)))
    .groupBy(usageEvent.status);

  let success = 0;
  let error = 0;
  for (const r of rows) {
    if (r.status === 'success') success = Number(r.c);
    else if (r.status === 'error') error = Number(r.c);
  }
  return { success, error };
}

export interface UsageRow {
  id: string;
  createdAt: Date;
  email: string | null;
  provider: string;
  model: string | null;
  maskedCount: number;
  promptTokens: number | null;
  completionTokens: number | null;
  status: string;
}

/** Most recent proxied requests for the org (metadata only — no content is stored). */
export function getRecentUsage(orgId: string, limit = 25): Promise<UsageRow[]> {
  return getDb()
    .select({
      id: usageEvent.id,
      createdAt: usageEvent.createdAt,
      email: user.email,
      provider: usageEvent.provider,
      model: usageEvent.model,
      maskedCount: usageEvent.maskedCount,
      promptTokens: usageEvent.promptTokens,
      completionTokens: usageEvent.completionTokens,
      status: usageEvent.status,
    })
    .from(usageEvent)
    .leftJoin(user, eq(usageEvent.userId, user.id))
    .where(eq(usageEvent.organizationId, orgId))
    .orderBy(desc(usageEvent.createdAt))
    .limit(limit);
}
