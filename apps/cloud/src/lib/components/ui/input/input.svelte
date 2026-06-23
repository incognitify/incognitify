<script lang="ts">
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    value = $bindable(),
    ref = $bindable(null),
    ...restProps
  }: WithElementRef<HTMLInputAttributes> = $props();
</script>

<input
  bind:this={ref}
  bind:value
  class={cn(
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
  {...restProps}
/>
