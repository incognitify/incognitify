import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Single auth gate for the whole authenticated app. Individual pages keep their
// own guards too (their loads touch user/org context), but this centralizes the
// "must be signed in" redirect for every route in the (app) group.
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  return { user: locals.user };
};
