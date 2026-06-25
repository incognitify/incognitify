<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  // Single source of truth for the in-app navigation. Every authenticated page
  // renders this same header so the menu never changes between routes.
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Chat' },
    { href: '/keys', label: 'Keys' },
    { href: '/members', label: 'Members' },
    { href: '/billing', label: 'Billing' },
    { href: '/usage', label: 'Usage' },
    { href: '/audit', label: 'Audit' },
  ];

  let signingOut = $state(false);

  async function signOut() {
    if (signingOut) return;
    signingOut = true;
    await authClient.signOut();
    await invalidateAll();
    await goto('/sign-in');
  }
</script>

<header class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
  <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
    <a href="/dashboard" aria-label="Incognitify Cloud dashboard" class="inline-flex shrink-0">
      <img src="/logo.svg" alt="Incognitify Cloud" class="h-8 w-auto" />
    </a>

    <nav
      aria-label="Main navigation"
      class="order-last flex w-full flex-wrap items-center gap-x-5 gap-y-1 text-sm md:order-none md:w-auto"
    >
      {#each links as link (link.href)}
        {@const active = page.url.pathname === link.href}
        <a
          href={link.href}
          aria-current={active ? 'page' : undefined}
          class={cn(
            'transition-colors hover:text-foreground',
            active ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="flex shrink-0 items-center gap-2">
      <Button href="/account" variant="outline" size="sm">Account</Button>
      <Button onclick={signOut} variant="ghost" size="sm" disabled={signingOut}>
        {signingOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  </div>
</header>
