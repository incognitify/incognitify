import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// `/` is the public marketing page. Signed-in users belong in the app, so send
// them to their dashboard instead of showing them the landing page.
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(302, '/dashboard');
};
