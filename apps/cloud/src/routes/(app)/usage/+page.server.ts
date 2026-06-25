import { resolveOrgContext } from '$lib/server/keys';
import { getRecentUsage, getStatusCounts, getUsageByProvider } from '$lib/server/usage';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const WINDOW_DAYS = 30;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) {
    return {
      needsOrg: true as const,
      windowDays: WINDOW_DAYS,
      byProvider: [],
      status: { success: 0, error: 0 },
      recent: [],
    };
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [byProvider, status, recent] = await Promise.all([
    getUsageByProvider(ctx.orgId, since),
    getStatusCounts(ctx.orgId, since),
    getRecentUsage(ctx.orgId, 25),
  ]);

  return {
    needsOrg: false as const,
    windowDays: WINDOW_DAYS,
    byProvider,
    status,
    recent: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
};
