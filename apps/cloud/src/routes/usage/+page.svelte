<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const providerLabel: Record<string, string> = { anthropic: 'Claude', openai: 'OpenAI' };
  const fmt = (n: number) => n.toLocaleString();

  const totals = $derived({
    requests: data.byProvider.reduce((a, p) => a + p.requests, 0),
    masked: data.byProvider.reduce((a, p) => a + p.masked, 0),
    tokens: data.byProvider.reduce((a, p) => a + p.promptTokens + p.completionTokens, 0),
  });
</script>

<header class="flex items-center justify-between border-b border-border px-6 py-4">
  <a href="/" class="inline-flex">
    <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
  </a>
  <nav class="flex gap-4 text-sm text-muted-foreground">
    <a class="hover:underline" href="/chat">Chat</a>
    <a class="hover:underline" href="/keys">Keys</a>
    <a class="hover:underline" href="/members">Members</a>
    <a class="hover:underline" href="/billing">Billing</a>
    <a class="hover:underline" href="/">Home</a>
  </nav>
</header>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
  <div class="flex items-baseline justify-between">
    <h1 class="text-xl font-semibold tracking-tight">Usage</h1>
    <span class="text-xs text-muted-foreground">Last {data.windowDays} days</span>
  </div>

  {#if data.needsOrg}
    <p class="text-sm text-muted-foreground">
      Create an organization first on the <a class="text-primary hover:underline" href="/">home page</a>.
    </p>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card.Root><Card.Content class="p-4"><p class="text-xs text-muted-foreground">Requests</p><p class="text-xl font-semibold">{fmt(totals.requests)}</p></Card.Content></Card.Root>
      <Card.Root><Card.Content class="p-4"><p class="text-xs text-muted-foreground">Values masked</p><p class="text-xl font-semibold">{fmt(totals.masked)}</p></Card.Content></Card.Root>
      <Card.Root><Card.Content class="p-4"><p class="text-xs text-muted-foreground">Tokens</p><p class="text-xl font-semibold">{fmt(totals.tokens)}</p></Card.Content></Card.Root>
      <Card.Root><Card.Content class="p-4"><p class="text-xs text-muted-foreground">Errors</p><p class="text-xl font-semibold">{fmt(data.status.error)}</p></Card.Content></Card.Root>
    </div>

    <Card.Root>
      <Card.Header><Card.Title>By provider</Card.Title></Card.Header>
      <Card.Content>
        {#if data.byProvider.length === 0}
          <p class="text-sm text-muted-foreground">No requests yet.</p>
        {:else}
          <table class="w-full text-sm">
            <thead class="text-left text-xs text-muted-foreground">
              <tr><th class="py-1">Provider</th><th class="py-1 text-right">Requests</th><th class="py-1 text-right">Masked</th><th class="py-1 text-right">Tokens</th></tr>
            </thead>
            <tbody>
              {#each data.byProvider as p (p.provider)}
                <tr class="border-t border-border">
                  <td class="py-2">{providerLabel[p.provider] ?? p.provider}</td>
                  <td class="py-2 text-right">{fmt(p.requests)}</td>
                  <td class="py-2 text-right">{fmt(p.masked)}</td>
                  <td class="py-2 text-right">{fmt(p.promptTokens + p.completionTokens)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header><Card.Title>Recent requests</Card.Title></Card.Header>
      <Card.Content>
        {#if data.recent.length === 0}
          <p class="text-sm text-muted-foreground">Nothing here yet.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-xs text-muted-foreground">
                <tr>
                  <th class="py-1 pr-3">When</th>
                  <th class="py-1 pr-3">Who</th>
                  <th class="py-1 pr-3">Provider</th>
                  <th class="py-1 pr-3">Model</th>
                  <th class="py-1 pr-3 text-right">Masked</th>
                  <th class="py-1 pr-3 text-right">Tokens</th>
                  <th class="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each data.recent as r (r.id)}
                  <tr class="border-t border-border">
                    <td class="whitespace-nowrap py-2 pr-3 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                    <td class="py-2 pr-3">{r.email ?? '—'}</td>
                    <td class="py-2 pr-3">{providerLabel[r.provider] ?? r.provider}</td>
                    <td class="py-2 pr-3 font-mono text-xs">{r.model ?? '—'}</td>
                    <td class="py-2 pr-3 text-right">{r.maskedCount}</td>
                    <td class="py-2 pr-3 text-right">{fmt((r.promptTokens ?? 0) + (r.completionTokens ?? 0))}</td>
                    <td class="py-2">
                      {#if r.status === 'success'}
                        <span class="text-success">ok</span>
                      {:else}
                        <span class="text-destructive">{r.status}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</main>
