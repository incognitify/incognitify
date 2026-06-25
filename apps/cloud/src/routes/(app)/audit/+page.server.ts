import { getRecentAudit } from '$lib/server/audit';
import { resolveOrgContext } from '$lib/server/keys';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) return { state: 'needsOrg' as const, entries: [] };
  if (!(ctx.role === 'owner' || ctx.role === 'admin')) {
    return { state: 'forbidden' as const, entries: [] };
  }

  const rows = await getRecentAudit(ctx.orgId, 100);
  return {
    state: 'ok' as const,
    entries: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
};
