<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    busy = true;
    error = '';
    const res = await authClient.signUp.email({ name, email, password });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Sign up failed';
      return;
    }
    await invalidateAll();
    const r = new URLSearchParams(location.search).get('redirect');
    await goto(r?.startsWith('/') ? r : '/');
  }
</script>

<main class="relative flex min-h-full w-full flex-col items-center justify-center gap-8 overflow-hidden p-6">
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-accent to-transparent"
  ></div>

  <div class="relative z-10 flex w-full flex-col items-center gap-8">
    <a href="/" aria-label="Incognitify Cloud home" class="inline-flex">
      <img src="/logo.svg" alt="Incognitify Cloud" class="h-9 w-auto" />
    </a>

    <Card.Root class="w-full max-w-sm shadow-lg">
      <Card.Header class="text-center">
        <Card.Title class="text-2xl">Create your account</Card.Title>
        <Card.Description>Mask sensitive data before it reaches your LLM.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form class="flex flex-col gap-4" onsubmit={submit}>
          <div class="flex flex-col gap-1.5">
            <Label for="name">Name</Label>
            <Input id="name" autocomplete="name" placeholder="Jane Doe" bind:value={name} required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" type="email" autocomplete="email" placeholder="you@company.com" bind:value={email} required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Password</Label>
            <Input id="password" type="password" autocomplete="new-password" bind:value={password} required />
          </div>
          {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
          <Button type="submit" class="mt-1 w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
        </form>
      </Card.Content>
    </Card.Root>

    <div class="flex flex-col items-center gap-2">
      <p class="text-center text-sm text-muted-foreground">
        Already have an account? <a class="font-medium text-primary hover:underline" href="/sign-in">Sign in</a>
      </p>
      <p class="max-w-sm text-center text-xs text-muted-foreground">
        By creating an account you agree to our
        <a class="hover:underline" href="/terms">Terms</a> and
        <a class="hover:underline" href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  </div>
</main>
