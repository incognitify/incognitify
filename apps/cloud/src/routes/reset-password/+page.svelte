<script lang="ts">
  import { page } from '$app/state';
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  // Better Auth redirects the email link here with ?token=… (or ?error=… if invalid).
  const token = $derived(page.url.searchParams.get('token') ?? '');
  const linkError = $derived(page.url.searchParams.get('error') ?? '');

  let newPassword = $state('');
  let confirmPassword = $state('');
  let busy = $state(false);
  let error = $state('');
  let done = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }
    if (newPassword.length < 8) {
      error = 'Password must be at least 8 characters.';
      return;
    }
    busy = true;
    const res = await authClient.resetPassword({ newPassword, token });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Could not reset your password. The link may have expired.';
      return;
    }
    done = true;
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

    {#if done}
      <Card.Root class="w-full max-w-sm shadow-lg">
        <Card.Header class="text-center">
          <Card.Title class="text-2xl">Password updated</Card.Title>
          <Card.Description>Your password has been changed. You can now sign in with it.</Card.Description>
        </Card.Header>
        <Card.Content>
          <Button href="/sign-in" class="w-full">Go to sign in</Button>
        </Card.Content>
      </Card.Root>
    {:else if !token || linkError}
      <Card.Root class="w-full max-w-sm shadow-lg">
        <Card.Header class="text-center">
          <Card.Title class="text-2xl">Link invalid or expired</Card.Title>
          <Card.Description>
            This password reset link is no longer valid. Request a new one to try again.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <Button href="/forgot-password" class="w-full">Request a new link</Button>
        </Card.Content>
      </Card.Root>
    {:else}
      <Card.Root class="w-full max-w-sm shadow-lg">
        <Card.Header class="text-center">
          <Card.Title class="text-2xl">Set a new password</Card.Title>
          <Card.Description>Use at least 8 characters.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form class="flex flex-col gap-4" onsubmit={submit}>
            <div class="flex flex-col gap-1.5">
              <Label for="new">New password</Label>
              <Input id="new" type="password" autocomplete="new-password" bind:value={newPassword} required />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" autocomplete="new-password" bind:value={confirmPassword} required />
            </div>
            {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
            <Button type="submit" class="mt-1 w-full" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</Button>
          </form>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</main>
