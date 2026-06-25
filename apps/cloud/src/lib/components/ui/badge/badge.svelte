<script lang="ts" module>
  import { type VariantProps, tv } from 'tailwind-variants';

  export const badgeVariants = tv({
    base: 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border border-border',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let {
    class: className,
    variant = 'default',
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> & { variant?: BadgeVariant } = $props();
</script>

<span bind:this={ref} class={cn(badgeVariants({ variant }), className)} {...restProps}>
  {@render children?.()}
</span>
