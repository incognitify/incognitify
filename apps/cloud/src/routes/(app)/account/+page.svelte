<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let { data } = $props();

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let revokeOther = $state(false);
  let busy = $state(false);
  let error = $state('');
  let success = $state('');

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    success = '';
    if (newPassword !== confirmPassword) {
      error = 'New passwords do not match.';
      return;
    }
    if (newPassword.length < 8) {
      error = 'New password must be at least 8 characters.';
      return;
    }
    busy = true;
    const res = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: revokeOther,
    });
    busy = false;
    if (res.error) {
      error = res.error.message ?? 'Could not change your password. Check your current password.';
      return;
    }
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    success = 'Your password has been updated.';
  }
</script>

<main class="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
  <div>
    <h1 class="text-xl font-semibold tracking-tight">Account</h1>
    <p class="text-sm text-muted-foreground">{data.user?.email}</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Change password</Card.Title>
      <Card.Description>Use at least 8 characters.</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="flex flex-col gap-4" onsubmit={submit}>
        <div class="flex flex-col gap-1.5">
          <Label for="current">Current password</Label>
          <Input id="current" type="password" autocomplete="current-password" bind:value={currentPassword} required />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="new">New password</Label>
          <Input id="new" type="password" autocomplete="new-password" bind:value={newPassword} required />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" autocomplete="new-password" bind:value={confirmPassword} required />
        </div>
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" bind:checked={revokeOther} class="h-4 w-4 rounded border-input" />
          Sign out of other devices
        </label>
        {#if error}<p class="text-sm text-destructive">{error}</p>{/if}
        {#if success}<p class="text-sm text-success">{success}</p>{/if}
        <Button type="submit" class="w-fit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button>
      </form>
    </Card.Content>
  </Card.Root>
</main>
