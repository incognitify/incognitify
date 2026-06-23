<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const isAdmin = $derived(data.role === 'owner' || data.role === 'admin');
  let inviteEmail = $state('');
  let inviteRole = $state<'member' | 'admin'>('member');
  let busy = $state(false);
  let msg = $state('');

  async function invite(e: Event) {
    e.preventDefault();
    if (!inviteEmail.trim() || !data.orgId) return;
    busy = true;
    msg = '';
    const res = await authClient.organization.inviteMember({
      email: inviteEmail.trim(),
      role: inviteRole,
      organizationId: data.orgId,
    });
    busy = false;
    if (res.error) {
      msg = res.error.message ?? 'Could not send the invitation.';
      return;
    }
    inviteEmail = '';
    msg = 'Invitation sent.';
    await invalidateAll();
  }

  async function cancelInvite(invitationId: string) {
    await authClient.organization.cancelInvitation({ invitationId });
    await invalidateAll();
  }

  async function removeMember(memberId: string) {
    if (!data.orgId) return;
    await authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId: data.orgId });
    await invalidateAll();
  }
</script>

<header class="flex items-center justify-between border-b border-border px-6 py-4">
  <a href="/" class="inline-flex">
    <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
  </a>
  <nav class="flex gap-4 text-sm text-muted-foreground">
    <a class="hover:underline" href="/chat">Chat</a>
    <a class="hover:underline" href="/keys">Keys</a>
    <a class="hover:underline" href="/billing">Billing</a>
    <a class="hover:underline" href="/usage">Usage</a>
    <a class="hover:underline" href="/">Home</a>
  </nav>
</header>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  <h1 class="text-xl font-semibold tracking-tight">Members</h1>

  {#if data.needsOrg}
    <p class="text-sm text-muted-foreground">
      Create an organization first on the <a class="text-primary hover:underline" href="/">home page</a>.
    </p>
  {:else}
    {#if isAdmin}
      <Card.Root>
        <Card.Header><Card.Title>Invite a teammate</Card.Title></Card.Header>
        <Card.Content>
          <form class="flex flex-wrap items-end gap-3" onsubmit={invite}>
            <label class="flex flex-1 flex-col gap-1.5 text-sm">
              <span class="text-muted-foreground">Email</span>
              <Input type="email" bind:value={inviteEmail} required placeholder="teammate@example.com" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm">
              <span class="text-muted-foreground">Role</span>
              <select
                bind:value={inviteRole}
                class="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <Button type="submit" disabled={busy}>Send invite</Button>
          </form>
          {#if msg}<p class="mt-2 text-sm text-muted-foreground">{msg}</p>{/if}
        </Card.Content>
      </Card.Root>
    {/if}

    <Card.Root>
      <Card.Header><Card.Title>Team</Card.Title></Card.Header>
      <Card.Content>
        <ul class="divide-y divide-border">
          {#each data.members as m (m.id)}
            <li class="flex items-center justify-between py-3 text-sm">
              <div class="flex items-center gap-3">
                <span class="font-medium">{m.name || m.email}</span>
                <span class="text-muted-foreground">{m.email}</span>
                <Badge>{m.role}</Badge>
              </div>
              {#if isAdmin && m.role !== 'owner' && m.userId !== data.selfUserId}
                <Button variant="outline" size="sm" onclick={() => removeMember(m.id)}>Remove</Button>
              {/if}
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>

    {#if data.invitations.length > 0}
      <Card.Root>
        <Card.Header><Card.Title>Pending invitations</Card.Title></Card.Header>
        <Card.Content>
          <ul class="divide-y divide-border">
            {#each data.invitations as inv (inv.id)}
              <li class="flex items-center justify-between py-3 text-sm">
                <div class="flex items-center gap-3">
                  <span class="font-medium">{inv.email}</span>
                  <Badge variant="secondary">{inv.role ?? 'member'}</Badge>
                </div>
                {#if isAdmin}
                  <Button variant="outline" size="sm" onclick={() => cancelInvite(inv.id)}>Cancel</Button>
                {/if}
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
</main>
