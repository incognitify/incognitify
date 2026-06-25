import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        // 'self' covers the app's bundled JS; SvelteKit auto-adds its hydration script's
        // hash. The sha256 below is mode-watcher's no-flash inline script (svelte:head),
        // which SvelteKit does NOT hash — stable for this mode-watcher version + default
        // config; regenerate if either changes (see dev/cloud/SECURITY.md).
        'script-src': ['self', 'sha256-Cr3r+iKjDTUxJaxM3r/Iq0ow6clOB9AqoT6j0wMFMIM='],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:'],
        'font-src': ['self', 'data:'],
        'connect-src': ['self'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'object-src': ['none'],
      },
    },
  },
};

export default config;
