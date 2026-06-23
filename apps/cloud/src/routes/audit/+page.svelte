<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const details = (m: unknown) => (m ? JSON.stringify(m) : '');
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
    <a class="hover:underline" href="/usage">Usage</a>
    <a class="hover:underline" href="/">Home</a>
  </nav>
</header>

<main class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
  <h1 class="text-xl font-semibold tracking-tight">Audit log</h1>

  {#if data.state === 'needsOrg'}
    <p class="text-sm text-muted-foreground">
      Create an organization first on the <a class="text-primary hover:underline" href="/">home page</a>.
    </p>
  {:else if data.state === 'forbidden'}
    <p class="text-sm text-muted-foreground">Only an organization admin can view the audit log.</p>
  {:else}
    <Card.Root>
      <Card.Content class="pt-5">
        {#if data.entries.length === 0}
          <p class="text-sm text-muted-foreground">No activity recorded yet.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-xs text-muted-foreground">
                <tr>
                  <th class="py-1 pr-3">When</th>
                  <th class="py-1 pr-3">Actor</th>
                  <th class="py-1 pr-3">Action</th>
                  <th class="py-1 pr-3">Target</th>
                  <th class="py-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {#each data.entries as e (e.id)}
                  <tr class="border-t border-border align-top">
                    <td class="whitespace-nowrap py-2 pr-3 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                    <td class="py-2 pr-3">{e.actorEmail ?? 'system'}</td>
                    <td class="py-2 pr-3 font-mono text-xs">{e.action}</td>
                    <td class="max-w-[14rem] truncate py-2 pr-3">{e.targetId ?? ''}</td>
                    <td class="py-2 font-mono text-xs text-muted-foreground">{details(e.metadata)}</td>
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
