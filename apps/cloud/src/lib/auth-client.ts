import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

/**
 * Browser auth client. Talks to the Better Auth endpoints mounted at /api/auth.
 * The organization plugin exposes authClient.organization.{create,list,setActive,...}.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
