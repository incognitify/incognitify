<script lang="ts">
  import { cn } from '$lib/utils';

  // Temporary scaffolding: drop one of these wherever a generated image should go.
  // The `prompt` is shown verbatim and is click-to-select so it can be pasted into
  // an image generator, then this whole block replaced with the resulting <img>.
  let {
    prompt,
    caption = '',
    ratio = 'aspect-video',
    class: className = '',
  }: {
    prompt: string;
    caption?: string;
    ratio?: string;
    class?: string;
  } = $props();
</script>

<figure
  class={cn(
    'flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 text-center',
    ratio,
    className,
  )}
>
  <svg
    class="h-8 w-8 text-muted-foreground"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-4.5-4.5L7 20" />
  </svg>
  <figcaption class="flex max-w-md flex-col items-center gap-2">
    <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Image placeholder{caption ? ` · ${caption}` : ''}
    </span>
    <p class="text-xs text-muted-foreground">
      Generate this image elsewhere, then replace this block. Click the prompt to select it.
    </p>
    <code
      class="block w-full select-all whitespace-pre-wrap rounded-md border border-border bg-background px-3 py-2 text-left font-mono text-[11px] leading-relaxed text-foreground"
    >{prompt}</code>
  </figcaption>
</figure>
