# incognitify

Mask sensitive data before it reaches an LLM. Rehydrate the response so you get a
clean answer with real values — while the provider never sees the originals.

## Packages

- [`packages/core`](./packages/core) — `@incognitify/core`, the engine + SDK
  (detect, mask, vault, rehydrate). Browser-safe, no I/O.
- [`packages/cli`](./packages/cli) — `incognitify`, the command-line interface.

## Install

```bash
npm install -g incognitify
```

## Usage

The CLI is composed around stdin/stdout so it drops into any Unix pipeline.

```bash
# Mask sensitive values
$ echo 'Email bodhi@example.com about card 4111111111111111.' | incognitify mask
Email ⟦EMAIL_1⟧ about card ⟦CREDIT_CARD_1⟧.

# Preview what would be masked (no output text emitted)
$ echo 'Call 202-555-0100 at bodhi@example.com' | incognitify mask --dry-run
2 detections:

  PHONE  [5..17]   202-555-0100       →  ⟦PHONE_1⟧
  EMAIL  [21..38]  bodhi@example.com  →  ⟦EMAIL_1⟧

# Round-trip through any shell command (LLM stand-in here is `cat`)
$ echo 'Tell me about bodhi@example.com' | incognitify run -- cat
Tell me about bodhi@example.com

# Pipeline split: persist the vault to disk, then rehydrate later
$ echo 'Contact bodhi@example.com' | incognitify mask --vault /tmp/v.json > masked.txt
$ cat masked.txt | incognitify unmask --vault /tmp/v.json
Contact bodhi@example.com
```

`mask --vault` is the only command that writes the vault to disk; it requires
an explicit path. By default the vault is in-memory and dies with the process.

### Library

```ts
import { mask, unmask } from "@incognitify/core";

const { masked, vault } = mask("Email bodhi@example.com");
// masked === 'Email ⟦EMAIL_1⟧'
const original = unmask(masked, vault);
// original === 'Email bodhi@example.com'
```

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

## Licensing

Open-core monorepo — licensing is **per directory**, and each folder's own `LICENSE`
file is authoritative:

| Path | License | What you may do |
|---|---|---|
| [`packages/core`](./packages/core), [`packages/cli`](./packages/cli) | **Apache-2.0** | Use freely, including commercially. |
| [`apps/cloud`](./apps/cloud) — Incognitify Cloud (hosted SaaS) | **FSL-1.1-ALv2** (Functional Source License) | Source-available: read, modify, and self-host for your own use. You may **not** offer it as a competing commercial hosted service. Converts to Apache-2.0 two years after each release. |

© Udooku LLC. The hosted app's source is public for transparency and self-hosting — the
license, not secrecy, protects the service.
