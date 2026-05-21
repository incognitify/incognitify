# incognitify

Mask sensitive data before it reaches an LLM. Rehydrate the response so you get a
clean answer with real values — while the provider never sees the originals.

This repository is a monorepo. See [`CLAUDE.md`](./CLAUDE.md) for the full design.

## Packages

- [`packages/core`](./packages/core) — `@incognitify/core`, the engine + SDK
  (detect, mask, vault, rehydrate). Browser-safe, no I/O.
- [`packages/cli`](./packages/cli) — `incognitify`, the command-line interface.

## Development

Requires Node 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm build       # build every package
pnpm test        # run tests
pnpm typecheck   # tsc --noEmit across packages
pnpm lint        # biome check
pnpm format      # biome format --write
```
