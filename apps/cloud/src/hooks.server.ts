import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { type Handle, redirect } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

// One deployment, two hosts:
//   incognitify.com        → marketing (the paths below)
//   cloud.incognitify.com  → the authenticated app (everything else: the (app) group,
//                            auth pages, /api). Auth cookies + Better Auth's baseURL
//                            (PUBLIC_APP_URL) live on this host.
const ROOT_HOST = 'incognitify.com';
const APP_HOST = 'cloud.incognitify.com';

// The marketing surface is small and stable; the app surface is large and grows. So
// allowlist marketing and treat everything else as app — adding an app page needs no
// edit here, only adding a marketing page does.
const MARKETING_PATHS = new Set(['/', '/playground', '/privacy', '/terms']);

export const handle: Handle = async ({ event, resolve }) => {
  // Host-based routing. Read the forwarded host (Railway sets x-forwarded-host; raw
  // Host is the fallback) so the real request host drives the decision per request.
  if (!building) {
    const host = event.request.headers.get('x-forwarded-host') ?? event.request.headers.get('host');
    const { pathname, search } = event.url;
    const marketing = MARKETING_PATHS.has(pathname);

    if (host === `www.${ROOT_HOST}`) {
      // www → bare apex.
      redirect(308, `https://${ROOT_HOST}${pathname}${search}`);
    } else if (host === ROOT_HOST && !marketing) {
      // App path landed on the marketing host → move it to the app host.
      redirect(308, `https://${APP_HOST}${pathname}${search}`);
    } else if (host === APP_HOST && marketing) {
      // Marketing path on the app host → one canonical home (SEO hygiene). The app
      // host's root lands in the app, not on the marketing page.
      redirect(
        308,
        pathname === '/'
          ? `https://${APP_HOST}/dashboard`
          : `https://${ROOT_HOST}${pathname}${search}`,
      );
    }
  }

  // Resolve the session into locals for load functions / pages.
  if (building) {
    event.locals.user = null;
    event.locals.session = null;
  } else {
    const result = await auth.api.getSession({ headers: event.request.headers }).catch((err) => {
      // Treat an auth/DB failure as logged-out rather than 500'ing the page — but LOG it.
      // Silently swallowing this is what made the prod hang/0-byte response undiagnosable.
      console.error('[hooks] getSession failed', err);
      return null;
    });
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
