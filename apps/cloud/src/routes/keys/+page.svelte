<script lang="ts">
  import { enhance } from '$app/forms';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const canShare = $derived(data.role === 'owner' || data.role === 'admin');
  const sharedKeys = $derived(data.keys.filter((k) => k.scope === 'org'));
  const myKeys = $derived(data.keys.filter((k) => k.scope === 'user'));

  const providerLabel: Record<string, string> = { anthropic: 'Claude', openai: 'OpenAI' };

  const selectClass =
    'h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold tracking-tight">API keys</h1>
    <a class="text-sm text-muted-foreground hover:underline" href="/">← Back</a>
  </div>

  {#if data.needsOrg}
    <p class="text-sm text-muted-foreground">
      Create an organization first on the <a class="text-primary hover:underline" href="/">home page</a>.
    </p>
  {:else}
    {#if form?.error}
      <p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {form.error}
      </p>
    {/if}
    {#if form?.success}
      <p class="rounded-md border border-border px-3 py-2 text-sm text-success">Saved.</p>
    {/if}

    <Card.Root>
      <Card.Header><Card.Title>Add a key</Card.Title></Card.Header>
      <Card.Content>
        <form method="POST" action="?/add" use:enhance class="grid gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="text-muted-foreground">Scope</span>
            <select name="scope" class={selectClass}>
              <option value="user">Personal (only you)</option>
              {#if canShare}<option value="org">Shared (whole org)</option>{/if}
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="text-muted-foreground">Provider</span>
            <select name="provider" class={selectClass}>
              <option value="anthropic">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="text-muted-foreground">Label</span>
            <Input name="label" required placeholder="e.g. Team key" />
          </label>
          <label class="flex flex-col gap-1.5 text-sm">
            <span class="text-muted-foreground">API key</span>
            <Input name="apiKey" type="password" required placeholder="sk-…" class="font-mono" />
          </label>
          <div class="sm:col-span-2">
            <Button type="submit">Validate &amp; save</Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header><Card.Title>Shared keys</Card.Title></Card.Header>
      <Card.Content>
        {#if sharedKeys.length === 0}
          <p class="text-sm text-muted-foreground">No shared keys yet.</p>
        {:else}
          <ul class="divide-y divide-border">
            {#each sharedKeys as k (k.id)}{@render keyRow(k)}{/each}
          </ul>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header><Card.Title>My keys</Card.Title></Card.Header>
      <Card.Content>
        {#if myKeys.length === 0}
          <p class="text-sm text-muted-foreground">No personal keys yet.</p>
        {:else}
          <ul class="divide-y divide-border">
            {#each myKeys as k (k.id)}{@render keyRow(k)}{/each}
          </ul>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</main>

{#snippet keyRow(k: (typeof data.keys)[number])}
  <li class="flex items-center justify-between py-3 text-sm">
    <div class="flex items-center gap-3">
      <Badge>{providerLabel[k.provider] ?? k.provider}</Badge>
      <span class="font-medium">{k.label}</span>
      <span class="font-mono text-muted-foreground">····{k.last4}</span>
      {#if k.status !== 'active'}<span class="text-xs text-destructive">{k.status}</span>{/if}
    </div>
    <form method="POST" action="?/remove" use:enhance>
      <input type="hidden" name="keyId" value={k.id} />
      <Button type="submit" variant="outline" size="sm">Remove</Button>
    </form>
  </li>
{/snippet}
