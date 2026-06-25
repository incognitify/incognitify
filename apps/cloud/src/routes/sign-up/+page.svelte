<script lang="ts">
  import { onDestroy } from 'svelte';
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
  let submitted = $state(false);
  let resendBusy = $state(false);
  let resendMsg = $state('');
  let cooldown = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  // Throttle resends so the verification endpoint can't be spammed (e.g. email bombing).
  function startCooldown() {
    cooldown = 30;
    clearInterval(timer);
    timer = setInterval(() => {
      cooldown -= 1;
      if (cooldown <= 0) clearInterval(timer);
    }, 1000);
  }
  onDestroy(() => clearInterval(timer));

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
    // Verification is required, so the user is not signed in yet. A verification
    // email was just sent — start the cooldown before any resend is allowed.
    submitted = true;
    startCooldown();
  }

  async function resend() {
    if (resendBusy || cooldown > 0) return;
    resendBusy = true;
    resendMsg = '';
    const res = await authClient.sendVerificationEmail({ email, callbackURL: '/dashboard' });
    resendBusy = false;
    if (res.error) {
      resendMsg = res.error.message ?? 'Could not resend. Please try again.';
    } else {
      resendMsg = 'Verification email sent.';
      startCooldown();
    }
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
            We sent a verification link to
            <span class="font-medium text-foreground">{email}</span>. Click it to activate your
            account, then sign in.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
          <Button href="/sign-in" class="w-full">Go to sign in</Button>
          <p class="text-center text-sm text-muted-foreground">
            Didn't get it?
            <button
              type="button"
              class="font-medium text-primary hover:underline disabled:opacity-50"
              onclick={resend}
              disabled={resendBusy || cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resendBusy ? 'Sending…' : 'Resend email'}
            </button>
          </p>
          {#if resendMsg}<p class="text-center text-sm text-muted-foreground">{resendMsg}</p>{/if}
        </Card.Content>
      </Card.Root>
    {:else}
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
    {/if}
  </div>
</main>
