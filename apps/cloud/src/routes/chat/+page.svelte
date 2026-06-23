<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let selectedKeyId = $state('');
  let selectedModel = $state('');
  let input = $state('');
  let sending = $state(false);
  let errorMsg = $state('');
  let maskedCount = $state(0);
  let detections = $state<{ type: string; token: string; value: string }[]>([]);
  let showInspector = $state(false);
  let messages = $state<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const selectedKey = $derived(data.keys.find((k) => k.id === selectedKeyId));
  const provider = $derived(selectedKey?.provider);
  const modelOptions = $derived(provider ? data.models[provider] : []);

  const selectClass =
    'h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

  $effect(() => {
    if (!selectedKeyId && data.keys.length > 0) selectedKeyId = data.keys[0]?.id ?? '';
    if (modelOptions.length > 0 && !modelOptions.includes(selectedModel)) {
      selectedModel = modelOptions[0] ?? '';
    }
  });

  async function send() {
    const text = input.trim();
    if (!text || !selectedKeyId || !selectedModel || sending) return;
    errorMsg = '';
    sending = true;
    messages.push({ role: 'user', content: text });
    input = '';
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    messages.push({ role: 'assistant', content: '' });
    const aIdx = messages.length - 1;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ keyId: selectedKeyId, model: selectedModel, messages: history }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        errorMsg = j.error ?? 'Request failed.';
        messages.splice(aIdx, 1);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === 'meta') {
            maskedCount = ev.maskedCount;
            detections = ev.detections;
          } else if (ev.type === 'delta') {
            const a = messages[aIdx];
            if (a) a.content += ev.text;
          } else if (ev.type === 'error') {
            errorMsg = ev.message;
          }
        }
      }
    } catch {
      errorMsg = 'Network error.';
    } finally {
      sending = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
</script>

<header class="flex items-center justify-between border-b border-border px-6 py-4">
  <a href="/" class="inline-flex">
    <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
  </a>
  <nav class="flex gap-4 text-sm text-muted-foreground">
    <a class="hover:underline" href="/keys">Keys</a>
    <a class="hover:underline" href="/members">Members</a>
    <a class="hover:underline" href="/billing">Billing</a>
    <a class="hover:underline" href="/usage">Usage</a>
    <a class="hover:underline" href="/">Home</a>
  </nav>
</header>

<main class="mx-auto flex h-[calc(100vh-65px)] w-full max-w-2xl flex-col gap-4 p-6">
  {#if data.needsOrg || data.keys.length === 0}
    <p class="text-sm text-muted-foreground">
      Add a provider key first on the
      <a class="text-primary hover:underline" href="/keys">API keys</a> page.
    </p>
  {:else}
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1 text-xs">
        <span class="text-muted-foreground">Key</span>
        <select bind:value={selectedKeyId} class={selectClass}>
          {#each data.keys as k (k.id)}
            <option value={k.id}>{k.label} · {k.provider} · ····{k.last4}</option>
          {/each}
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs">
        <span class="text-muted-foreground">Model</span>
        <select bind:value={selectedModel} class={selectClass}>
          {#each modelOptions as m (m)}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </label>
      {#if maskedCount > 0}
        <Button variant="outline" size="sm" onclick={() => (showInspector = !showInspector)}>
          {maskedCount} masked
        </Button>
      {/if}
    </div>

    {#if showInspector && detections.length > 0}
      <div class="rounded-lg border border-border bg-muted p-3 text-xs">
        <p class="mb-2 text-muted-foreground">Masked before reaching the provider:</p>
        <ul class="flex flex-col gap-1">
          {#each detections as d (d.token)}
            <li class="flex items-center gap-2">
              <Badge>{d.type}</Badge>
              <span class="font-mono">{d.value}</span>
              <span class="text-muted-foreground">→</span>
              <span class="font-mono">{d.token}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-4">
      {#if messages.length === 0}
        <p class="m-auto max-w-sm text-center text-sm text-muted-foreground">
          Send a message. Sensitive values are masked before they reach the provider, then
          restored in the reply.
        </p>
      {/if}
      {#each messages as m, i (i)}
        <div class="flex {m.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div
            class="max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm {m.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'}"
          >
            {m.content || (sending && m.role === 'assistant' ? '…' : '')}
          </div>
        </div>
      {/each}
    </div>

    {#if errorMsg}
      <p class="text-sm text-destructive">{errorMsg}</p>
    {/if}

    <div class="flex items-end gap-2">
      <Textarea
        bind:value={input}
        onkeydown={onKeydown}
        rows={2}
        placeholder="Message…"
        class="flex-1 resize-none"
      />
      <Button onclick={send} disabled={sending || !input.trim()}>
        {sending ? '…' : 'Send'}
      </Button>
    </div>
  {/if}
</main>
