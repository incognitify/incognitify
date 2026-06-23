import { resolveOrgContext } from '$lib/server/keys';
import { runChat } from '$lib/server/proxy';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const schema = z.object({
  keyId: z.string().min(1),
  model: z.string().min(1),
  system: z.string().optional(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1) }))
    .min(1),
});

function badRequest(error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  // Require a JSON content-type — blocks "simple"-request CSRF; the browser CORS-preflights
  // cross-origin JSON, and the session cookie is SameSite=Lax, so this is defense in depth.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response('Unsupported Media Type', { status: 415 });
  }

  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) return badRequest('Create an organization first.');

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('Invalid request.');

  return runChat({ ctx, ...parsed.data });
};
