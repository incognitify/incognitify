<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import ThemeToggle from '$lib/components/theme-toggle.svelte';

  let { children } = $props();
</script>

<ModeWatcher />

{@render children()}

<div class="fixed bottom-4 right-4 z-50">
  <ThemeToggle />
</div>
