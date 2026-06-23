<script lang="ts">
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let busy = $state(false);
  let msg = $state('');

  const inviteUrl = $derived(`/accept-invite?id=${data.id}`);

  async function accept() {
    if (!data.id) return;
    busy = true;
    msg = '';
    const res = await authClient.organization.acceptInvitation({ invitationId: data.id });
    busy = false;
    if (res.error) {
      msg = res.error.message ?? 'Could not accept the invitation.';
      return;
    }
    await goto('/chat');
  }
</script>

<main class="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6 text-center">
  <img src="/logo.svg" alt="Incognitify Cloud" class="mx-auto h-8 w-auto" />

  {#if !data.invite}
    <p class="text-sm text-muted-foreground">This invitation is invalid or has expired.</p>
    <Button variant="link" href="/">Go home</Button>
  {:else if !data.loggedIn}
    <p class="text-sm">
      You've been invited to <strong>{data.invite.orgName}</strong>. Sign in or create an account
      with <strong>{data.invite.email}</strong> to accept.
    </p>
    <div class="flex justify-center gap-3">
      <Button href="/sign-up?redirect={encodeURIComponent(inviteUrl)}">Create account</Button>
      <Button variant="outline" href="/sign-in?redirect={encodeURIComponent(inviteUrl)}">Sign in</Button>
    </div>
  {:else}
    <p class="text-sm">Accept your invitation to <strong>{data.invite.orgName}</strong>?</p>
    <Button onclick={accept} disabled={busy}>{busy ? 'Accepting…' : 'Accept invitation'}</Button>
    {#if msg}<p class="text-sm text-destructive">{msg}</p>{/if}
  {/if}
</main>
