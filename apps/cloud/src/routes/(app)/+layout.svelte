<script lang="ts">
  import AppHeader from '$lib/components/app-header.svelte';
  import { REPO_URL } from '$lib/config';

  let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
  <AppHeader />
  <div class="flex flex-1 flex-col">
    {@render children()}
  </div>
  <footer class="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
    © Udooku LLC ·
    <a class="hover:underline" href="/terms">Terms</a> ·
    <a class="hover:underline" href="/privacy">Privacy</a> ·
    <a class="hover:underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">Source</a>
  </footer>
</div>
