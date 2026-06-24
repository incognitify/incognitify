import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { recordAudit } from './audit';
import { syncSeats } from './billing';
import { getDb } from './db';
import * as schema from './db/schema';
import { sendEmail } from './email';

/**
 * Better Auth server instance. Kept free of SvelteKit virtuals ($env/$app/$lib) so the
 * `@better-auth/cli` can load it for schema generation. Secrets come from process.env.
 */
const appUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

/** Escape user-controlled values before interpolating into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Reconcile Stripe seats after a membership change; never let it break the operation. */
async function safeSyncSeats(orgId: string): Promise<void> {
  try {
    await syncSeats(orgId);
  } catch (e) {
    console.error('[billing] seat sync failed', e);
  }
}

export const auth = betterAuth({
  appName: 'Incognitify Cloud',
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
  // Email ownership must be proven before the account can be used. Email is only a
  // verification channel here, never an authenticator (NIST 800-63B): the password
  // stays the login factor.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    async sendResetPassword({ user, url }) {
      const safeName = escapeHtml(user.name || user.email);
      await sendEmail({
        to: user.email,
        subject: 'Reset your Incognitify Cloud password',
        text: `Reset your password using this link:\n${url}\n\nThis link expires in 1 hour. If you didn't request a reset, ignore this email — your password won't change.`,
        html: `<img src="${appUrl}/logo.png" alt="Incognitify Cloud" height="40" style="display:block;margin-bottom:16px" /><p>Hi ${safeName},</p><p>We received a request to reset your <strong>Incognitify Cloud</strong> password.</p><p><a href="${url}">Reset my password</a></p><p style="color:#64748b;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.</p>`,
      });
    },
  },
  emailVerification: {
    // Sign-up sends the link (requireEmailVerification → unverified users); an
    // unverified sign-in attempt resends it. Single-use token, expires in 1 hour.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      const safeName = escapeHtml(user.name || user.email);
      await sendEmail({
        to: user.email,
        subject: 'Verify your email for Incognitify Cloud',
        text: `Confirm your email to activate your Incognitify Cloud account:\n${url}\n\nThis link expires in 1 hour. If you didn't create this account, you can ignore this email.`,
        html: `<img src="${appUrl}/logo.png" alt="Incognitify Cloud" height="40" style="display:block;margin-bottom:16px" /><p>Hi ${safeName},</p><p>Confirm your email to activate your <strong>Incognitify Cloud</strong> account.</p><p><a href="${url}">Verify my email</a></p><p style="color:#64748b;font-size:12px">This link expires in 1 hour. If you didn't create this account, you can ignore this email.</p>`,
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        // An invitee already proved control of their inbox by receiving the invite,
        // so pre-verify them and skip the redundant second email.
        before: async (newUser) => {
          try {
            const rows = await getDb()
              .select({ id: schema.invitation.id })
              .from(schema.invitation)
              .where(
                and(eq(schema.invitation.email, newUser.email), eq(schema.invitation.status, 'pending')),
              )
              .limit(1);
            if (rows.length > 0) return { data: { ...newUser, emailVerified: true } };
          } catch (e) {
            console.error('[auth] pending-invite pre-verify check failed', e);
          }
        },
      },
    },
  },
  // Orgs = accounts. Admin provisions shared keys; members use them or add their own.
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const link = `${appUrl}/accept-invite?id=${encodeURIComponent(data.id)}`;
        const orgName = data.organization?.name ?? 'an organization';
        const inviter = data.inviter?.user?.email ?? 'A teammate';
        const safeOrg = escapeHtml(orgName);
        const safeInviter = escapeHtml(inviter);
        await sendEmail({
          to: data.email,
          subject: `You're invited to ${orgName} on Incognitify Cloud`,
          text: `${inviter} invited you to join ${orgName} on Incognitify Cloud.\n\nAccept: ${link}`,
          html: `<img src="${appUrl}/logo.png" alt="Incognitify Cloud" height="40" style="display:block;margin-bottom:16px" /><p>${safeInviter} invited you to join <strong>${safeOrg}</strong> on Incognitify Cloud.</p><p><a href="${link}">Accept the invitation</a></p>`,
        });
      },
      // Per-seat billing (keep Stripe quantity == member count) + audit trail.
      organizationHooks: {
        afterAddMember: async ({ member }) => {
          await safeSyncSeats(member.organizationId);
        },
        afterRemoveMember: async ({ member, user }) => {
          await safeSyncSeats(member.organizationId);
          await recordAudit({
            orgId: member.organizationId,
            action: 'member.removed',
            targetType: 'user',
            targetId: member.userId,
            metadata: { email: user.email, role: member.role },
          });
        },
        afterAcceptInvitation: async ({ member, user }) => {
          await safeSyncSeats(member.organizationId);
          await recordAudit({
            orgId: member.organizationId,
            actorUserId: user.id,
            action: 'member.joined',
            targetType: 'user',
            targetId: user.id,
            metadata: { role: member.role },
          });
        },
        afterCreateInvitation: async ({ invitation, inviter, organization }) => {
          await recordAudit({
            orgId: organization.id,
            actorUserId: inviter.id,
            action: 'invitation.created',
            targetType: 'email',
            targetId: invitation.email,
            metadata: { role: invitation.role },
          });
        },
        afterCancelInvitation: async ({ invitation, cancelledBy, organization }) => {
          await recordAudit({
            orgId: organization.id,
            actorUserId: cancelledBy.id,
            action: 'invitation.canceled',
            targetType: 'email',
            targetId: invitation.email,
          });
        },
        afterUpdateMemberRole: async ({ member, previousRole, user }) => {
          await recordAudit({
            orgId: member.organizationId,
            action: 'member.role_updated',
            targetType: 'user',
            targetId: member.userId,
            metadata: { from: previousRole, to: member.role, email: user.email },
          });
        },
      },
    }),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
