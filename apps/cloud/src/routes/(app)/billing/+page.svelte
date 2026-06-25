<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const isAdmin = $derived(data.role === 'owner' || data.role === 'admin');
  const renews = $derived(
    data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString() : null,
  );
</script>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
  <h1 class="text-xl font-semibold tracking-tight">Billing</h1>

  {#if data.needsOrg}
    <p class="text-sm text-muted-foreground">
      Create an organization first on the <a class="text-primary hover:underline" href="/">home page</a>.
    </p>
  {:else}
    {#if data.notice === 'success'}
      <p class="rounded-md border border-border px-3 py-2 text-sm text-success">
        Subscription updated.
      </p>
    {/if}
    {#if form?.error}
      <p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {form.error}
      </p>
    {/if}

    <Card.Root>
      <Card.Content class="pt-5">
        <p class="text-sm text-muted-foreground">Current plan</p>
        <p class="text-lg font-semibold capitalize">{data.plan}</p>
        {#if data.plan === 'team'}
          <p class="mt-1 text-sm text-muted-foreground">
            {data.seats ?? data.memberCount} seat{(data.seats ?? data.memberCount) === 1 ? '' : 's'} · {data.status}
            {#if renews}· {data.cancelAtPeriodEnd ? 'ends' : 'renews'} {renews}{/if}
          </p>
        {/if}

        {#if isAdmin}
          <div class="mt-4">
            {#if data.plan === 'team'}
              <form method="POST" action="?/portal"><Button type="submit">Manage billing</Button></form>
            {:else}
              <form method="POST" action="?/checkout"><Button type="submit">Upgrade to Team</Button></form>
            {/if}
          </div>
        {:else}
          <p class="mt-2 text-xs text-muted-foreground">Only an admin can change billing.</p>
        {/if}
      </Card.Content>
    </Card.Root>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card.Root class={data.plan === 'free' ? 'border-primary ring-1 ring-primary' : ''}>
        <Card.Content class="p-4 text-sm">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">Free</p>
            {#if data.plan === 'free'}<Badge>Current</Badge>{/if}
          </div>
          <p class="text-muted-foreground">$0</p>
          <p class="mt-2 text-xs text-muted-foreground">Solo. Personal keys only.</p>
        </Card.Content>
      </Card.Root>
      <Card.Root class={data.plan === 'team' ? 'border-primary ring-1 ring-primary' : ''}>
        <Card.Content class="p-4 text-sm">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">Team</p>
            {#if data.plan === 'team'}<Badge>Current</Badge>{/if}
          </div>
          <p class="text-muted-foreground">$20 / seat / mo</p>
          <p class="mt-2 text-xs text-muted-foreground">Shared org keys, unlimited members.</p>
        </Card.Content>
      </Card.Root>
      <Card.Root class={data.plan === 'enterprise' ? 'border-primary ring-1 ring-primary' : ''}>
        <Card.Content class="p-4 text-sm">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">Enterprise</p>
            {#if data.plan === 'enterprise'}<Badge>Current</Badge>{/if}
          </div>
          <p class="text-muted-foreground">Custom</p>
          <p class="mt-2 text-xs text-muted-foreground">
            SSO, audit, SLA. <a class="text-primary hover:underline" href="mailto:support@incognitify.com">Contact us</a>.
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</main>
