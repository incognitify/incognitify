<script lang="ts">
  import { onDestroy } from 'svelte';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let email = $state('');
  let busy = $state(false);
  let error = $state('');
  let submitted = $state(false);
  let cooldown = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  function startCooldown() {
    cooldown = 30;
    clearInterval(timer);
    timer = setInterval(() => {
      cooldown -= 1;
      if (cooldown <= 0) clearInterval(timer);
    }, 1000);
  }
  onDestroy(() => clearInterval(timer));

  async function send() {
    if (busy || cooldown > 0) return;
    busy = true;
    error = '';
    const res = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Could not send the reset email. Please try again.';
      return;
    }
    // Always show the same result whether or not the email exists (no enumeration).
    submitted = true;
    startCooldown();
  }

  function submit(e: Event) {
    e.preventDefault();
    send();
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

    {#if submitted}
      <Card.Root class="w-full max-w-sm shadow-lg">
        <Card.Header class="text-center">
          <Card.Title class="text-2xl">Check your email</Card.Title>
          <Card.Description>
            If an account exists for <span class="font-medium text-foreground">{email}</span>, we've
            sent a link to reset your password. It expires in 1 hour.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
          <Button href="/sign-in" class="w-full">Back to sign in</Button>
          <p class="text-center text-sm text-muted-foreground">
            Didn't get it?
            <button
              type="button"
              class="font-medium text-primary hover:underline disabled:opacity-50"
              onclick={send}
              disabled={busy || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : busy ? 'Sending…' : 'Resend email'}
            </button>
          </p>
          {#if error}<p class="text-center text-sm text-destructive">{error}</p>{/if}
        </Card.Content>
      </Card.Root>
    {:else}
      <Card.Root class="w-full max-w-sm shadow-lg">
        <Card.Header class="text-center">
          <Card.Title class="text-2xl">Forgot your password?</Card.Title>
          <Card.Description>Enter your email and we'll send you a reset link.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form class="flex flex-col gap-4" onsubmit={submit}>
            <div class="flex flex-col gap-1.5">
              <Label for="email">Email</Label>
              <Input id="email" type="email" autocomplete="email" placeholder="you@company.com" bind:value={email} required />
            </div>
            {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
            <Button type="submit" class="mt-1 w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
          </form>
        </Card.Content>
      </Card.Root>

      <p class="text-center text-sm text-muted-foreground">
        Remembered it? <a class="font-medium text-primary hover:underline" href="/sign-in">Sign in</a>
      </p>
    {/if}
  </div>
</main>
