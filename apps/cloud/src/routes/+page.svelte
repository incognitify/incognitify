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

<header class="flex items-center justify-between border-b border-border px-6 py-4">
  <a href="/" class="inline-flex">
    <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
  </a>
</header>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  {#if data.user}
    <Card.Root>
      <Card.Content class="pt-5">
        <p class="text-sm text-muted-foreground">Signed in as</p>
        <p class="font-medium">{data.user.email}</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <Button href="/chat">Open chat</Button>
          <Button variant="outline" href="/keys">API keys</Button>
          <Button variant="outline" href="/members">Members</Button>
          <Button variant="outline" href="/billing">Billing</Button>
          <Button variant="outline" href="/usage">Usage</Button>
          <Button variant="outline" href="/audit">Audit</Button>
          <Button variant="outline" onclick={signOut}>Sign out</Button>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="pt-5">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Organizations</h2>
          <Button size="sm" onclick={createOrg} disabled={busy}>New organization</Button>
        </div>
        {#if orgs.length === 0}
          <p class="mt-3 text-sm text-muted-foreground">No organizations yet.</p>
        {:else}
          <ul class="mt-3 divide-y divide-border">
            {#each orgs as org (org.id)}<li class="py-2 text-sm">{org.name}</li>{/each}
          </ul>
        {/if}
      </Card.Content>
    </Card.Root>
  {:else}
    <section class="flex flex-col items-center gap-6 py-16 text-center">
      <p class="max-w-md text-muted-foreground">
        Mask sensitive data before it reaches your LLM — bring your own Claude &amp; OpenAI keys.
      </p>
      <div class="flex gap-3">
        <Button href="/sign-up">Create account</Button>
        <Button variant="outline" href="/sign-in">Sign in</Button>
      </div>
    </section>
  {/if}
</main>

<footer class="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
  © Udooku LLC ·
  <a class="hover:underline" href="/terms">Terms</a> ·
  <a class="hover:underline" href="/privacy">Privacy</a>
</footer>
