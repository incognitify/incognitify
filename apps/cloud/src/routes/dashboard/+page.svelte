<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';

  let { data } = $props();

  type Org = { id: string; name: string; slug: string | null };
  let orgs = $state<Org[]>([]);
  let busy = $state(false);

  async function loadOrgs() {
    const res = await authClient.organization.list();
    orgs = (res.data ?? []) as Org[];
  }

  $effect(() => {
    if (data.user) loadOrgs();
  });

  async function createOrg() {
    busy = true;
    const n = orgs.length + 1;
    await authClient.organization.create({ name: `Organization ${n}`, slug: `org-${n}-${Date.now()}` });
    await loadOrgs();
    busy = false;
  }

  async function signOut() {
    await authClient.signOut();
    await invalidateAll();
    await goto('/sign-in');
  }
</script>

<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
  <a href="/dashboard" class="inline-flex">
    <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
  </a>
  <nav class="flex flex-wrap gap-4 text-sm text-muted-foreground">
    <a class="hover:text-foreground" href="/chat">Chat</a>
    <a class="hover:text-foreground" href="/keys">Keys</a>
    <a class="hover:text-foreground" href="/members">Members</a>
    <a class="hover:text-foreground" href="/billing">Billing</a>
    <a class="hover:text-foreground" href="/usage">Usage</a>
    <a class="hover:text-foreground" href="/audit">Audit</a>
  </nav>
</header>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
    <p class="text-sm text-muted-foreground">Signed in as {data.user?.email}</p>
  </div>

  <Card.Root>
    <Card.Content class="flex flex-col gap-4 pt-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Organizations</h2>
        <Button size="sm" onclick={createOrg} disabled={busy}>New organization</Button>
      </div>
      {#if orgs.length === 0}
        <p class="text-sm text-muted-foreground">
          No organizations yet. Create one to add shared keys and invite members.
        </p>
      {:else}
        <ul class="divide-y divide-border">
          {#each orgs as org (org.id)}<li class="py-2 text-sm">{org.name}</li>{/each}
        </ul>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Content class="flex flex-wrap gap-3 pt-5">
      <Button href="/chat">Open chat</Button>
      <Button variant="outline" href="/keys">API keys</Button>
      <Button variant="outline" href="/billing">Billing</Button>
      <Button variant="outline" onclick={signOut}>Sign out</Button>
    </Card.Content>
  </Card.Root>
</main>

<footer class="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
  © Udooku LLC ·
  <a class="hover:underline" href="/terms">Terms</a> ·
  <a class="hover:underline" href="/privacy">Privacy</a>
</footer>
