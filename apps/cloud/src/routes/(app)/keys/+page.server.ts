import { listKeys, provisionKey, removeKey, resolveOrgContext } from '$lib/server/keys';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const addSchema = z.object({
  scope: z.enum(['org', 'user']),
  provider: z.enum(['anthropic', 'openai']),
  label: z.string().trim().min(1).max(100),
  apiKey: z.string().trim().min(8),
});

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) return { needsOrg: true, keys: [], role: null };
  const keys = await listKeys(ctx.orgId, ctx.userId);
  return { needsOrg: false, keys, role: ctx.role };
};

export const actions: Actions = {
  add: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, '/sign-in');
    const ctx = await resolveOrgContext(locals.user, locals.session);
    if (!ctx) return fail(400, { success: false, error: 'Create an organization first.' });

    const parsed = addSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { success: false, error: 'Please fill in every field.' });

    const result = await provisionKey({ ctx, ...parsed.data });
    if (!result.ok) return fail(400, { success: false, error: result.error });
    return { success: true, error: null };
  },

  remove: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, '/sign-in');
    const ctx = await resolveOrgContext(locals.user, locals.session);
    if (!ctx) return fail(400, { success: false, error: 'No organization.' });

    const keyId = String((await request.formData()).get('keyId') ?? '');
    if (!keyId) return fail(400, { success: false, error: 'Missing key id.' });

    const result = await removeKey(ctx, keyId);
    if (!result.ok)
      return fail(400, { success: false, error: result.error ?? 'Failed to remove.' });
    return { success: true, error: null };
  },
};
