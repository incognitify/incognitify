<script lang="ts">
  import { mask } from '@incognitify/core';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Textarea } from '$lib/components/ui/textarea';

  const DETECTORS = ['Email', 'Phone', 'Credit card', 'SSN', 'IP address', 'API key', 'UUID'];

  const TYPE_LABEL: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    credit_card: 'Credit card',
    ssn: 'SSN',
    ip: 'IP address',
    api_key: 'API key',
    uuid: 'UUID',
  };

  const EXAMPLE = `Hey — email me at maria@example.com or call 415-555-0132.
Charge card 4242 4242 4242 4242, SSN 123-45-6789.
Prod server 10.0.0.42, trace 7c9e6679-7425-40de-944b-e07fc1f90ae7.`;

  let input = $state(EXAMPLE);

  // The whole masking engine runs right here in the browser — no network, no key.
  const result = $derived(mask(input));
  const entries = $derived(result.vault.entries());

  // Split the masked text so the ⟦TOKEN⟧s can be highlighted.
  function segments(masked: string): { text: string; token: boolean }[] {
    const re = /⟦[^⟧]+⟧/g;
    const out: { text: string; token: boolean }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(masked)) !== null) {
      if (m.index > last) out.push({ text: masked.slice(last, m.index), token: false });
      out.push({ text: m[0], token: true });
      last = m.index + m[0].length;
    }
    if (last < masked.length) out.push({ text: masked.slice(last), token: false });
    return out;
  }
  const maskedSegments = $derived(segments(result.masked));
</script>

<header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
  <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
    <a href="/" aria-label="Incognitify Cloud home" class="inline-flex">
      <img src="/logo.svg" alt="Incognitify Cloud" class="h-7 w-auto" />
    </a>
    <div class="flex items-center gap-2">
      <Button variant="ghost" href="/sign-in" class="hidden sm:inline-flex">Sign in</Button>
      <Button href="/sign-up">Get started</Button>
    </div>
  </div>
</header>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
  <div class="flex flex-col gap-3 text-center">
    <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">See the masking, live</h1>
    <p class="mx-auto max-w-2xl text-muted-foreground">
      Type anything. Sensitive values are detected and replaced with tokens before they'd ever
      reach an LLM — then restored in the reply. <strong class="text-foreground">This runs entirely
      in your browser</strong>: your text never leaves this page.
    </p>
    <div class="mx-auto flex flex-wrap items-center justify-center gap-2 pt-1">
      <span class="text-sm text-muted-foreground">Detects:</span>
      {#each DETECTORS as d (d)}<Badge variant="outline">{d}</Badge>{/each}
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="flex flex-col gap-2">
      <label for="pg-input" class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your prompt
      </label>
      <Textarea
        id="pg-input"
        bind:value={input}
        spellcheck={false}
        class="min-h-48 flex-1 resize-y font-mono text-sm"
      />
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        What the provider sees
      </p>
      <div
        class="min-h-48 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-md border border-input bg-muted/40 p-3 font-mono text-sm"
        aria-live="polite"
      >
        {#each maskedSegments as seg, i (i)}
          {#if seg.token}<span class="rounded bg-accent px-1 text-accent-foreground">{seg.text}</span
            >{:else}{seg.text}{/if}
        {/each}
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <p class="text-sm text-muted-foreground">
      {entries.length} sensitive value{entries.length === 1 ? '' : 's'} masked{entries.length
        ? ' before anything leaves your machine.'
        : ' — start typing some PII above.'}
    </p>

    {#if entries.length}
      <Card.Root>
        <Card.Content class="p-4">
          <ul class="flex flex-col gap-2">
            {#each entries as e (e.token)}
              <li class="flex flex-wrap items-center gap-2 text-sm">
                <Badge>{TYPE_LABEL[e.type] ?? e.type}</Badge>
                <span class="font-mono text-muted-foreground">{e.value}</span>
                <span class="text-muted-foreground">→</span>
                <span class="rounded bg-accent px-1 font-mono text-xs text-accent-foreground">{e.token}</span>
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>

  <Card.Root class="border-primary/40 bg-accent/30">
    <Card.Content class="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <h2 class="font-semibold">This is just the masking step — running locally.</h2>
        <p class="text-sm text-muted-foreground">
          Connect your own Claude or OpenAI key to get the full round-trip: mask → your LLM →
          rehydrate, inside the app.
        </p>
      </div>
      <div class="flex shrink-0 gap-3">
        <Button href="/sign-up">Create account</Button>
        <Button href="/" variant="outline">Back to home</Button>
      </div>
    </Card.Content>
  </Card.Root>
</main>

<footer class="border-t border-border py-8">
  <p class="mx-auto w-full max-w-5xl px-6 text-xs text-muted-foreground">
    © Udooku LLC ·
    <a class="hover:underline" href="/terms">Terms</a> ·
    <a class="hover:underline" href="/privacy">Privacy</a>
  </p>
</footer>
