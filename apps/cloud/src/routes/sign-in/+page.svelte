<script lang="ts">
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

  async function submit(e: Event) {
    e.preventDefault();
    busy = true;
    error = '';
    const res = await authClient.signIn.email({ email, password });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Sign in failed';
      return;
    }
    await invalidateAll();
    const r = new URLSearchParams(location.search).get('redirect');
    await goto(r?.startsWith('/') ? r : '/');
  }
</script>

<main class="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
  <Card.Root>
    <Card.Header>
      <Card.Title>Sign in</Card.Title>
      <Card.Description>Welcome back to Incognitify Cloud.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="flex flex-col gap-3" onsubmit={submit}>
        <div class="flex flex-col gap-1.5">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} required />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="password">Password</Label>
          <Input id="password" type="password" bind:value={password} required />
        </div>
        {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
        <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </Card.Content>
  </Card.Root>
  <p class="text-center text-sm text-muted-foreground">
    Need an account? <a class="text-primary hover:underline" href="/sign-up">Create one</a>
  </p>
</main>
