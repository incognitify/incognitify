<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);
  let unverified = $state(false);
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
    unverified = false;
    const res = await authClient.signIn.email({ email, password });
    busy = false;
    if (res.error) {
      const code = res.error.code ?? '';
      const message = res.error.message ?? '';
      // Unverified email: Better Auth blocks the login and (sendOnSignIn) resends the link.
      if (code === 'EMAIL_NOT_VERIFIED' || /verif/i.test(message)) {
        unverified = true;
        startCooldown();
      } else {
        error = message || 'Sign in failed';
      }
      return;
    }
    await invalidateAll();
    const r = new URLSearchParams(location.search).get('redirect');
    await goto(r?.startsWith('/') ? r : '/');
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

    <Card.Root class="w-full max-w-sm shadow-lg">
      <Card.Header class="text-center">
        <Card.Title class="text-2xl">Welcome back</Card.Title>
        <Card.Description>Sign in to your Incognitify Cloud account.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if unverified}
          <div class="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
            <p class="font-medium text-foreground">Verify your email to continue</p>
            <p class="mt-1 text-muted-foreground">
              We sent a verification link to <span class="font-medium text-foreground">{email}</span>.
              <button
                type="button"
                class="font-medium text-primary hover:underline disabled:opacity-50"
                onclick={resend}
                disabled={resendBusy || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resendBusy ? 'Sending…' : 'Resend link'}
              </button>
            </p>
            {#if resendMsg}<p class="mt-1 text-muted-foreground">{resendMsg}</p>{/if}
          </div>
        {/if}
        <form class="flex flex-col gap-4" onsubmit={submit}>
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" type="email" autocomplete="email" placeholder="you@company.com" bind:value={email} required />
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <Label for="password">Password</Label>
              <a class="text-xs text-muted-foreground hover:text-primary hover:underline" href="/forgot-password">
                Forgot password?
              </a>
            </div>
            <Input id="password" type="password" autocomplete="current-password" bind:value={password} required />
          </div>
          {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
          <Button type="submit" class="mt-1 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </Card.Content>
    </Card.Root>

    <p class="text-center text-sm text-muted-foreground">
      Need an account? <a class="font-medium text-primary hover:underline" href="/sign-up">Create one</a>
    </p>
  </div>
</main>
