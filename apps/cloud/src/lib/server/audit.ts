import { desc, eq } from 'drizzle-orm';
import { getDb } from './db';
import { auditLog, user } from './db/schema';

export interface AuditEntry {
  orgId: string;
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** Append an audit-log row. Never throws — auditing must not break the underlying action. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await getDb().insert(auditLog).values({
      organizationId: entry.orgId,
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (e) {
    console.error('[audit] failed to record', entry.action, e);
  }
}

/** Recent audit entries for an org, joined to the actor's email. */
export function getRecentAudit(orgId: string, limit = 100) {
  return getDb()
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      actorEmail: user.email,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      metadata: auditLog.metadata,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.actorUserId, user.id))
    .where(eq(auditLog.organizationId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
