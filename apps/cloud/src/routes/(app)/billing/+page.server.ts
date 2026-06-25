import {
  countMembers,
  createCheckout,
  createPortal,
  getSubscriptionRow,
} from '$lib/server/billing';
import { resolveOrgContext } from '$lib/server/keys';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const appUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';
const isAdmin = (role: string | null) => role === 'owner' || role === 'admin';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const notice = url.searchParams.get('status');

  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) {
    return {
      needsOrg: true as const,
      role: null,
      plan: 'free' as const,
      status: null,
      seats: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      memberCount: 0,
      notice,
    };
  }

  const row = await getSubscriptionRow(ctx.orgId);
  const memberCount = await countMembers(ctx.orgId);
  return {
    needsOrg: false as const,
    role: ctx.role,
    plan: row?.plan ?? 'free',
    status: row?.status ?? null,
    seats: row?.seats ?? null,
    currentPeriodEnd: row?.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    memberCount,
    notice,
  };
};

export const actions: Actions = {
  checkout: async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/sign-in');
    const ctx = await resolveOrgContext(locals.user, locals.session);
    if (!ctx) return fail(400, { error: 'Create an organization first.' });
    if (!isAdmin(ctx.role)) return fail(403, { error: 'Only an admin can manage billing.' });

    let dest: string | null;
    try {
      dest = await createCheckout(ctx.orgId, locals.user.email, `${appUrl}/billing`);
    } catch (e) {
      console.error('[billing] checkout failed', e);
      return fail(500, { error: 'Could not start checkout. Please try again.' });
    }
    if (!dest) return fail(500, { error: 'Could not start checkout.' });
    throw redirect(303, dest);
  },

  portal: async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/sign-in');
    const ctx = await resolveOrgContext(locals.user, locals.session);
    if (!ctx) return fail(400, { error: 'Create an organization first.' });
    if (!isAdmin(ctx.role)) return fail(403, { error: 'Only an admin can manage billing.' });

    let dest: string | null;
    try {
      dest = await createPortal(ctx.orgId, `${appUrl}/billing`);
    } catch (e) {
      console.error('[billing] portal failed', e);
      return fail(500, { error: 'Could not open billing. Please try again.' });
    }
    if (!dest) return fail(400, { error: 'No billing account yet — upgrade first.' });
    throw redirect(303, dest);
  },
};
