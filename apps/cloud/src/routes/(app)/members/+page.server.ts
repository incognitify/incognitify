import { getDb } from '$lib/server/db';
import { invitation, member, user } from '$lib/server/db/schema';
import { resolveOrgContext } from '$lib/server/keys';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/sign-in');
  const selfUserId = locals.user.id;

  const ctx = await resolveOrgContext(locals.user, locals.session);
  if (!ctx) {
    return {
      needsOrg: true as const,
      orgId: null,
      role: null,
      selfUserId,
      members: [],
      invitations: [],
    };
  }

  const db = getDb();
  const members = await db
    .select({
      id: member.id,
      userId: member.userId,
      role: member.role,
      email: user.email,
      name: user.name,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, ctx.orgId));

  const invitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    })
    .from(invitation)
    .where(and(eq(invitation.organizationId, ctx.orgId), eq(invitation.status, 'pending')));

  return {
    needsOrg: false as const,
    orgId: ctx.orgId,
    role: ctx.role,
    selfUserId,
    members,
    invitations,
  };
};
