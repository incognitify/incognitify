# @incognitify/cloud — Incognitify Cloud

The paid, hosted BYOK SaaS. Users connect their own Claude/OpenAI keys; the app masks
sensitive data before it reaches the LLM and rehydrates the response. Thin layer over
`@incognitify/core`.

> Planning docs (decisions, data model, progress, pricing) live in `../../dev/cloud/`.

## Stack

SvelteKit (`adapter-node`) · Drizzle + Postgres · Better Auth (org plugin) · Stripe ·
Tailwind v4 + shadcn-svelte · Zod · Mailtrap. Hosted on Railway.

## Develop

```bash
pnpm install                                          # from the repo root
cp apps/cloud/.env.example apps/cloud/.env            # fill in KEK_BASE64 + BETTER_AUTH_SECRET
docker compose -f apps/cloud/docker-compose.yml up -d # local Postgres on :55432
pnpm --filter @incognitify/cloud db:migrate           # apply migrations
pnpm --filter @incognitify/cloud dev
```

## Scripts

| Script | What |
|---|---|
| `dev` | Vite dev server |
| `build` / `start` | production build / run (`node build`) |
| `typecheck` | `svelte-kit sync` + `svelte-check` |
| `db:generate` | generate Drizzle migrations from `schema.ts` |
| `db:migrate` | apply migrations |
| `db:studio` | Drizzle Studio |

## Security note

Provider keys are stored with **envelope encryption** (per-org DEK, AES-256-GCM; DEK
wrapped by the `KEK_BASE64` master key from secrets). Only `last4` + label are
plaintext. Keys are never logged. See `src/lib/server/crypto/envelope.ts` and
`../../dev/cloud/DECISIONS.md`.

## License

`@incognitify/cloud` is **source-available** under the
[Functional Source License v1.1, Apache 2.0 future (`FSL-1.1-ALv2`)](./LICENSE.md). You may
self-host and use it, but **not** offer it as a competing commercial service; it converts to
Apache-2.0 two years after each release. The OSS packages (`core`, `cli`) remain Apache-2.0.
