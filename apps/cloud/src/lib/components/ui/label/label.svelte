<script lang="ts">
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLLabelAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLLabelAttributes> = $props();
</script>

<label bind:this={ref} class={cn('text-sm font-medium text-muted-foreground', className)} {...restProps}>
  {@render children?.()}
</label>
