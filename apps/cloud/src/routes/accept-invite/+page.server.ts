import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { invitation, organization } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const id = url.searchParams.get('id') ?? '';
  let invite: { email: string; orgName: string } | null = null;

  if (id) {
    const rows = await getDb()
      .select({ email: invitation.email, orgName: organization.name })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .where(eq(invitation.id, id))
      .limit(1);
    invite = rows[0] ?? null;
  }

  return { id, loggedIn: !!locals.user, invite };
};
