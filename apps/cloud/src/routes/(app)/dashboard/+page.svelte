<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';

  let { data } = $props();

  type Org = { id: string; name: string; slug: string | null };
  let orgs = $state<Org[]>([]);
  let busy = $state(false);
  let newOrgName = $state('');
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  let error = $state('');

  async function loadOrgs() {
    const res = await authClient.organization.list();
    orgs = (res.data ?? []) as Org[];
  }

  $effect(() => {
    if (data.user) loadOrgs();
  });

  // Names aren't unique but slugs are, so derive a slug and keep it collision-safe.
  function slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'org'}-${Date.now().toString(36)}`;
  }

  async function createOrg(e: Event) {
    e.preventDefault();
    const name = newOrgName.trim();
    if (!name || busy) return;
    busy = true;
    error = '';
    const res = await authClient.organization.create({ name, slug: slugify(name) });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Could not create the organization.';
      return;
    }
    newOrgName = '';
    await loadOrgs();
  }

  function startRename(org: Org) {
    editingId = org.id;
    editingName = org.name;
    error = '';
  }

  function cancelRename() {
    editingId = null;
    editingName = '';
  }

  async function saveRename(org: Org) {
    const name = editingName.trim();
    if (!name || busy) return;
    busy = true;
    error = '';
    const res = await authClient.organization.update({ data: { name }, organizationId: org.id });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Could not rename the organization.';
      return;
    }
    cancelRename();
    await loadOrgs();
  }
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
    <p class="text-sm text-muted-foreground">Signed in as {data.user?.email}</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Organizations</Card.Title>
      <Card.Description>Create an organization to add shared keys and invite members.</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <form class="flex flex-wrap items-end gap-3" onsubmit={createOrg}>
        <label class="flex flex-1 flex-col gap-1.5 text-sm">
          <span class="text-muted-foreground">Organization name</span>
          <Input bind:value={newOrgName} required placeholder="Example Inc." />
        </label>
        <Button type="submit" disabled={busy || !newOrgName.trim()}>Create</Button>
      </form>

      {#if error}<p class="text-sm text-destructive">{error}</p>{/if}

      {#if orgs.length === 0}
        <p class="text-sm text-muted-foreground">No organizations yet.</p>
      {:else}
        <ul class="divide-y divide-border">
          {#each orgs as org (org.id)}
            <li class="flex items-center justify-between gap-3 py-2 text-sm">
              {#if editingId === org.id}
                <Input bind:value={editingName} aria-label="Organization name" class="flex-1" />
                <div class="flex shrink-0 gap-2">
                  <Button size="sm" onclick={() => saveRename(org)} disabled={busy || !editingName.trim()}>Save</Button>
                  <Button size="sm" variant="ghost" onclick={cancelRename}>Cancel</Button>
                </div>
              {:else}
                <span class="font-medium">{org.name}</span>
                <Button size="sm" variant="outline" onclick={() => startRename(org)}>Rename</Button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </Card.Content>
  </Card.Root>
</main>
