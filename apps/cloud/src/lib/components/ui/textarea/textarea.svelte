<script lang="ts">
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    value = $bindable(),
    ref = $bindable(null),
    ...restProps
  }: WithElementRef<HTMLTextareaAttributes> = $props();
</script>

<textarea
  bind:this={ref}
  bind:value
  class={cn(
    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
  {...restProps}
></textarea>
