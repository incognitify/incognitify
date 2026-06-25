import { listKeys, resolveOrgContext } from '$lib/server/keys';
import { MODELS } from '$lib/server/providers';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) return { needsOrg: true as const, keys: [], models: MODELS };
  const keys = await listKeys(ctx.orgId, ctx.userId);
  return { needsOrg: false as const, keys, models: MODELS };
};
