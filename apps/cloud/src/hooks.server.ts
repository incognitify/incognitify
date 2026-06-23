import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Resolve the session into locals for load functions / pages.
  if (building) {
    event.locals.user = null;
    event.locals.session = null;
  } else {
    const result = await auth.api.getSession({ headers: event.request.headers }).catch(() => null);
    event.locals.user = result?.user ?? null;
    event.locals.session = result?.session ?? null;
  }

  // Mounts Better Auth at /api/auth/*; passes everything else through.
  const response = await svelteKitHandler({ auth, event, resolve, building });

  // Baseline hardening headers.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
};
