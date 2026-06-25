<script lang="ts">
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { class: className, ref = $bindable(null), children, ...restProps }: WithElementRef<HTMLAttributes<HTMLDivElement>> =
    $props();
</script>

<div bind:this={ref} class={cn('flex flex-col gap-1.5 p-5', className)} {...restProps}>
  {@render children?.()}
</div>
