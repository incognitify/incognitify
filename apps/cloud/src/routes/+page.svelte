<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import ImagePlaceholder from '$lib/components/image-placeholder.svelte';

  const detectors = ['Email', 'Phone', 'Credit card', 'SSN', 'IP address', 'API keys', 'UUID'];

  const steps = [
    {
      n: '01',
      title: 'Detect & mask',
      body: 'Incognitify scans your prompt for emails, phone numbers, cards, SSNs, API keys and more — replacing each with a safe, reversible token.',
    },
    {
      n: '02',
      title: 'Call your own LLM',
      body: 'The masked prompt is sent with your own Claude or OpenAI key. The provider only ever sees tokens like ⟦EMAIL_1⟧, never the real values.',
    },
    {
      n: '03',
      title: 'Rehydrate the reply',
      body: 'Tokens in the response are swapped back to the original values in memory, so your team reads a complete, natural answer.',
    },
  ];

  const features = [
    {
      title: 'Bring your own keys',
      body: 'Use your own Claude and OpenAI keys. No per-token markup — you keep full control of model choice and spend.',
    },
    {
      title: 'Detectors built in',
      body: 'Emails, phone numbers, credit cards, SSNs, IP addresses, API keys and UUIDs are caught out of the box.',
    },
    {
      title: 'Ephemeral vault',
      body: 'The token-to-value map lives in memory for a single request and is never written to disk.',
    },
    {
      title: 'Encrypted key storage',
      body: 'Provider keys are sealed with envelope encryption (AES-256-GCM). Only the last four characters are stored in plaintext.',
    },
    {
      title: 'Team & org controls',
      body: 'Share keys across your organization or keep them personal. Invite members and assign roles.',
    },
    {
      title: 'Audit & usage',
      body: 'Every masked request is logged with what was detected, so you can review activity and track usage.',
    },
  ];

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      cadence: '',
      blurb: 'For solo work and trying things out.',
      features: [
        'Personal provider keys',
        'All built-in detectors',
        'Masked chat playground',
        'Ephemeral in-memory vault',
      ],
      cta: 'Start free',
      href: '/sign-up',
      featured: false,
    },
    {
      name: 'Team',
      price: '$20',
      cadence: '/ seat / mo',
      blurb: 'For teams that share access and need oversight.',
      features: [
        'Everything in Free',
        'Shared organization keys',
        'Unlimited members & roles',
        'Audit log & usage tracking',
      ],
      cta: 'Get started',
      href: '/sign-up',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      cadence: '',
      blurb: 'For organizations with security and scale needs.',
      features: [
        'Everything in Team',
        'SSO & advanced security',
        'SLA & dedicated support',
        'Custom contract & invoicing',
      ],
      cta: 'Contact sales',
      href: 'mailto:support@incognitify.com',
      featured: false,
    },
  ];

  const faqs = [
    {
      q: 'Which LLM providers are supported?',
      a: 'Anthropic (Claude) and OpenAI-compatible APIs today, with more provider adapters on the way. You connect your own key for each.',
    },
    {
      q: 'Do you ever see my API keys?',
      a: 'Your keys are encrypted at rest with envelope encryption. At request time the proxy decrypts a key in memory to call your provider — it is never logged or stored in plaintext. Only the last four characters are kept, for display.',
    },
    {
      q: 'Is my prompt data stored?',
      a: 'No. The token-to-value vault is in-memory and scoped to a single request — it is never written to disk. We record metadata for the audit log (which types were detected), not your raw values.',
    },
    {
      q: 'How accurate is detection?',
      a: 'Incognitify removes a large class of sensitive data automatically, but no detector is perfect. Treat it as a strong safety net that reduces risk — not a guarantee, and not a replacement for your own compliance review.',
    },
    {
      q: 'Can I self-host?',
      a: 'The core masking engine is open source, so you can run it yourself. Incognitify Cloud is the hosted, team-ready layer with shared keys, billing and audit.',
    },
  ];
</script>

{#snippet check()}
  <svg class="mt-0.5 h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fill-rule="evenodd"
      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
      clip-rule="evenodd"
    />
  </svg>
{/snippet}

<a
  href="#main"
  class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
>
  Skip to content
</a>

<header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
  <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
    <a href="/" aria-label="Incognitify Cloud home" class="inline-flex">
      <img src="/logo.svg" alt="Incognitify Cloud" class="h-7 w-auto" />
    </a>
    <nav aria-label="Primary" class="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
      <a class="transition-colors hover:text-foreground" href="#how-it-works">How it works</a>
      <a class="transition-colors hover:text-foreground" href="#features">Features</a>
      <a class="transition-colors hover:text-foreground" href="#pricing">Pricing</a>
      <a class="transition-colors hover:text-foreground" href="#faq">FAQ</a>
    </nav>
    <div class="flex items-center gap-2">
      <Button variant="ghost" href="/sign-in" class="hidden sm:inline-flex">Sign in</Button>
      <Button href="/sign-up">Get started</Button>
    </div>
  </div>
</header>

<main id="main">
  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] bg-gradient-to-b from-accent to-transparent"
    ></div>

    <div class="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pb-16 pt-20 text-center sm:pt-28">
      <Badge variant="secondary" class="gap-2">
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
        Bring your own Claude &amp; OpenAI keys
      </Badge>
      <h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        Use AI without exposing your sensitive data
      </h1>
      <p class="max-w-xl text-lg text-muted-foreground">
        Incognitify masks PII, secrets and identifiers in your prompts before they reach an LLM —
        then restores the real values in the response. Your team gets clean answers; the provider
        never sees the raw data.
      </p>
      <div class="flex flex-col gap-3 sm:flex-row">
        <Button href="/sign-up" size="lg">Start free</Button>
        <Button href="#how-it-works" size="lg" variant="outline">See how it works</Button>
      </div>
      <p class="text-xs text-muted-foreground">
        No credit card required · Keys encrypted at rest · Vault never written to disk
      </p>
    </div>

    <!-- Live masking mock (real markup, not an image) -->
    <div class="relative z-10 mx-auto w-full max-w-4xl px-6 pb-20">
      <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div class="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <span class="h-3 w-3 rounded-full bg-destructive/50"></span>
          <span class="h-3 w-3 rounded-full bg-warning/60"></span>
          <span class="h-3 w-3 rounded-full bg-success/60"></span>
          <span class="ml-2 font-mono text-xs text-muted-foreground">incognitify · masked request</span>
        </div>
        <div class="grid md:grid-cols-2">
          <div class="border-b border-border p-5 md:border-b-0 md:border-r">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your prompt</p>
            <p class="text-sm leading-relaxed text-foreground">
              Look up the account for
              <mark class="rounded bg-destructive/15 px-1 text-destructive">john@acme.com</mark>, SSN
              <mark class="rounded bg-destructive/15 px-1 text-destructive">123-45-6789</mark>, callback
              <mark class="rounded bg-destructive/15 px-1 text-destructive">415-555-0132</mark>.
            </p>
          </div>
          <div class="p-5">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What the provider sees
            </p>
            <p class="text-sm leading-relaxed text-foreground">
              Look up the account for
              <span class="rounded bg-accent px-1 font-mono text-xs text-accent-foreground">⟦EMAIL_1⟧</span>, SSN
              <span class="rounded bg-accent px-1 font-mono text-xs text-accent-foreground">⟦SSN_1⟧</span>, callback
              <span class="rounded bg-accent px-1 font-mono text-xs text-accent-foreground">⟦PHONE_1⟧</span>.
            </p>
          </div>
        </div>
        <div class="border-t border-border bg-muted/30 px-5 py-4">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Masked before it left your machine
          </p>
          <ul class="grid gap-2 sm:grid-cols-3">
            <li class="flex items-center gap-2 text-xs">
              <Badge>EMAIL</Badge><span class="truncate font-mono text-muted-foreground">john@acme.com</span>
            </li>
            <li class="flex items-center gap-2 text-xs">
              <Badge>SSN</Badge><span class="truncate font-mono text-muted-foreground">123-45-6789</span>
            </li>
            <li class="flex items-center gap-2 text-xs">
              <Badge>PHONE</Badge><span class="truncate font-mono text-muted-foreground">415-555-0132</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section id="how-it-works" aria-labelledby="how-heading" class="scroll-mt-24 border-t border-border bg-muted/20 py-20">
    <div class="mx-auto w-full max-w-5xl px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="how-heading" class="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
        <p class="mt-3 text-muted-foreground">
          A round trip: mask on the way out, restore on the way back. Your data never leaves in the clear.
        </p>
      </div>
      <ol class="mt-12 grid gap-6 md:grid-cols-3">
        {#each steps as step (step.n)}
          <li>
            <Card.Root class="h-full">
              <Card.Content class="flex h-full flex-col gap-3 p-6">
                <span class="font-mono text-sm font-semibold text-primary">{step.n}</span>
                <h3 class="text-lg font-semibold">{step.title}</h3>
                <p class="text-sm text-muted-foreground">{step.body}</p>
              </Card.Content>
            </Card.Root>
          </li>
        {/each}
      </ol>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-2">
        <span class="text-sm text-muted-foreground">Detected out of the box:</span>
        {#each detectors as d (d)}
          <Badge variant="outline">{d}</Badge>
        {/each}
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" aria-labelledby="features-heading" class="scroll-mt-24 border-t border-border py-20">
    <div class="mx-auto w-full max-w-5xl px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="features-heading" class="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for teams that take data seriously
        </h2>
        <p class="mt-3 text-muted-foreground">
          Everything you need to put a safety layer between your prompts and your LLM provider.
        </p>
      </div>
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each features as feature (feature.title)}
          <Card.Root class="h-full">
            <Card.Content class="flex h-full flex-col gap-3 p-6">
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                {@render check()}
              </span>
              <h3 class="font-semibold">{feature.title}</h3>
              <p class="text-sm text-muted-foreground">{feature.body}</p>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </section>

  <!-- Map your own data (upcoming) -->
  <section aria-labelledby="custom-heading" class="scroll-mt-24 border-t border-border bg-muted/20 py-20">
    <div class="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
      <div class="flex flex-col items-start gap-4">
        <Badge variant="secondary">Coming soon</Badge>
        <h2 id="custom-heading" class="text-3xl font-bold tracking-tight sm:text-4xl">Map your own data</h2>
        <p class="text-muted-foreground">
          Beyond the built-in detectors, you'll be able to define custom rules for the identifiers
          unique to your business — internal customer IDs, project codenames, employee numbers,
          account references — so they're masked automatically, every time.
        </p>
        <ul class="flex flex-col gap-2 text-sm text-muted-foreground">
          <li class="flex items-start gap-2">{@render check()}<span>Point at a field or pattern and choose how it's masked</span></li>
          <li class="flex items-start gap-2">{@render check()}<span>Reusable rule packs shared across your organization</span></li>
          <li class="flex items-start gap-2">{@render check()}<span>Consistent tokens, so your model still reasons correctly</span></li>
        </ul>
      </div>
      <ImagePlaceholder
        caption="Custom rule builder"
        ratio="aspect-[4/3]"
        prompt={`A clean, modern SaaS UI screenshot of a "custom data mapping" rule builder. Light theme, indigo (#4F46E5) accent, Inter font, rounded corners, soft shadows, generous whitespace, enterprise aesthetic. Left panel: a list of detection rules (Customer ID, Project codename, Employee number). Center: a rule editor with a field-name input, a pattern field, and a "mask as" dropdown. Bottom: a sample-text preview where matched values are highlighted and replaced with tokens like ⟦CUSTOMER_ID_1⟧.`}
      />
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" aria-labelledby="pricing-heading" class="scroll-mt-24 border-t border-border py-20">
    <div class="mx-auto w-full max-w-5xl px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="pricing-heading" class="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p class="mt-3 text-muted-foreground">
          Start free. Upgrade when your team needs shared keys and oversight. You always bring your
          own LLM keys — no token markup.
        </p>
      </div>
      <div class="mt-12 grid items-start gap-6 md:grid-cols-3">
        {#each tiers as tier (tier.name)}
          <Card.Root class={tier.featured ? 'relative border-primary shadow-lg' : 'h-full'}>
            {#if tier.featured}
              <span class="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge class="bg-primary text-primary-foreground">Most popular</Badge>
              </span>
            {/if}
            <Card.Content class="flex h-full flex-col gap-5 p-6">
              <div>
                <p class="font-semibold">{tier.name}</p>
                <p class="text-sm text-muted-foreground">{tier.blurb}</p>
              </div>
              <p class="flex items-baseline gap-1">
                <span class="text-3xl font-bold">{tier.price}</span>
                {#if tier.cadence}<span class="text-sm text-muted-foreground">{tier.cadence}</span>{/if}
              </p>
              <Button href={tier.href} variant={tier.featured ? 'default' : 'outline'} class="w-full">
                {tier.cta}
              </Button>
              <ul class="flex flex-col gap-2 text-sm">
                {#each tier.features as feat (feat)}
                  <li class="flex items-start gap-2">{@render check()}<span class="text-muted-foreground">{feat}</span></li>
                {/each}
              </ul>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" aria-labelledby="faq-heading" class="scroll-mt-24 border-t border-border bg-muted/20 py-20">
    <div class="mx-auto w-full max-w-3xl px-6">
      <h2 id="faq-heading" class="text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Frequently asked questions
      </h2>
      <div class="mt-10 flex flex-col gap-3">
        {#each faqs as faq (faq.q)}
          <details class="group rounded-lg border border-border bg-card px-5 py-4">
            <summary
              class="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden"
            >
              {faq.q}
              <svg
                class="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m5 8 5 5 5-5" />
              </svg>
            </summary>
            <p class="mt-3 text-sm text-muted-foreground">{faq.a}</p>
          </details>
        {/each}
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section aria-labelledby="cta-heading" class="border-t border-border py-20">
    <div class="mx-auto w-full max-w-4xl px-6">
      <div
        class="rounded-2xl bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] px-8 py-14 text-center"
      >
        <h2 id="cta-heading" class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start masking your prompts today
        </h2>
        <p class="mx-auto mt-3 max-w-lg text-white/80">
          Connect your Claude or OpenAI key and send your first protected request in minutes.
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/sign-up" size="lg" class="bg-white text-primary hover:bg-white/90">
            Create your account
          </Button>
          <Button
            href="/sign-in"
            size="lg"
            variant="outline"
            class="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="border-t border-border py-12">
  <div class="mx-auto grid w-full max-w-6xl gap-8 px-6 sm:grid-cols-2 md:grid-cols-4">
    <div class="flex flex-col gap-3">
      <img src="/logo.svg" alt="Incognitify Cloud" class="h-7 w-auto" />
      <p class="max-w-xs text-sm text-muted-foreground">
        Mask sensitive data before it reaches your LLM. Bring your own keys.
      </p>
    </div>
    <nav aria-label="Product" class="flex flex-col gap-2 text-sm">
      <p class="font-semibold">Product</p>
      <a class="text-muted-foreground hover:text-foreground" href="#how-it-works">How it works</a>
      <a class="text-muted-foreground hover:text-foreground" href="#features">Features</a>
      <a class="text-muted-foreground hover:text-foreground" href="#pricing">Pricing</a>
    </nav>
    <nav aria-label="Account" class="flex flex-col gap-2 text-sm">
      <p class="font-semibold">Account</p>
      <a class="text-muted-foreground hover:text-foreground" href="/sign-in">Sign in</a>
      <a class="text-muted-foreground hover:text-foreground" href="/sign-up">Create account</a>
    </nav>
    <nav aria-label="Legal" class="flex flex-col gap-2 text-sm">
      <p class="font-semibold">Legal</p>
      <a class="text-muted-foreground hover:text-foreground" href="/terms">Terms</a>
      <a class="text-muted-foreground hover:text-foreground" href="/privacy">Privacy</a>
      <a class="text-muted-foreground hover:text-foreground" href="mailto:support@incognitify.com">Contact</a>
    </nav>
  </div>
  <div class="mx-auto mt-10 w-full max-w-6xl px-6">
    <p class="border-t border-border pt-6 text-xs text-muted-foreground">© Udooku LLC · All rights reserved.</p>
  </div>
</footer>
