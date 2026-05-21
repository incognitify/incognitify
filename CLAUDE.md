# CLAUDE.md — incognitify

> This file is read automatically by Claude Code at the start of every session
> in this repository. It is the persistent project context. Keep it current as
> decisions change.

## What this project is

**incognitify** is a developer tool that masks / obfuscates / scrambles sensitive
data inside a prompt or dataset *before* it is sent to an LLM, then rehydrates the
LLM's response so the developer gets a clean, usable answer with real data — while
the LLM provider never sees the sensitive values.

Design goal above all else: **extremely developer-friendly and simple to use.**

## The core feature: round-trip masking

```
raw input → detect → mask → [masked payload leaves the machine] → LLM
                                                                    │
clean output ← rehydrate ← [masked response] ←──────────────────────┘
```

- **Round-trip** = mask outbound, rehydrate inbound. This is the headline feature.
- **One-way redaction** = the round-trip minus the rehydrate step. Same pipeline,
  fewer steps. Used for logs / analytics / training data.
- A **vault** holds the `TOKEN → original value` mapping for one request cycle.

### Vault rules (these are the security posture — do not violate)

- The vault is **ephemeral, in-memory, and request-scoped.**
- It is **never written to disk by default.** Persisting it is a loud, explicit opt-in.
- Same input value → same token within one masking session (consistency).
- Use delimited tokens unlikely to occur naturally, e.g. `⟦NAME_1⟧`, and rehydrate
  with exact-token matching to avoid collisions with model-generated text.

## Architecture: pluggable layers

Three pluggable interfaces, same pattern throughout. Each is an open extension point.

1. **Detector** — finds sensitive spans. `(text) => Array<{start, end, type, value}>`.
   - Pattern detectors (regex): email, phone, credit card, SSN, IP, API keys, UUID.
   - NER detectors (later): names, addresses, orgs — needs an NLP pass.
   - Custom / schema detectors: user-supplied rules (e.g. "column `ssn` is sensitive").
2. **MaskingStrategy** — decides what to replace a detected value with.
   - Placeholder (`NAME_1`) — reversible. Default.
   - Realistic fake (`Maria Garcia`) — reversible. Better when output quality
     depends on natural-reading text.
   - Format-preserving — keeps structure (e.g. fake-but-valid card numbers).
   - Hash / redact (`[REDACTED]`) — one-way only.
3. **ProviderAdapter** — knows where text lives in a given LLM provider's request/
   response JSON, so the proxy can mask/unmask it. Pluggable. OpenAI-compatible
   adapter first (covers OpenAI + most local servers + many hosted providers),
   Anthropic adapter second.

Detectors find spans; strategies decide replacements; adapters locate the text in
a payload. Keep all three independent — adding one must not require touching another.

## Repository structure — ONE repo

This is **one** GitHub repo: `incognitify/incognitify` (org + flagship repo).
Set up as a monorepo (pnpm / npm workspaces). One `git clone`, one issue tracker,
one CI pipeline. Multiple npm packages and apps live *inside* this single repo.

```
incognitify/
├── packages/
│   ├── core/        # the engine + SDK — detect, mask, vault, rehydrate. No I/O.
│   ├── cli/          # `incognitify` CLI — thin wrapper over core
│   ├── proxy/        # local OpenAI/Anthropic-compatible proxy — wraps core (v0.3)
│   └── server/       # hosted HTTP API — wraps core (post-v1.0)
└── apps/
    ├── docs/         # Stripe-style documentation site (post-core)
    └── playground/   # interactive web app — try masking in the browser (post-core)
```

**Every package/app is a thin wrapper over `core`.** `core` contains all real
logic; everything else adds one delivery mechanism (stdin/stdout, local HTTP,
hosted HTTP, browser UI).

### Two hard constraints on `core` — set these from the first line of code

1. **`core` must be browser-safe.** No Node-only dependencies — no `fs`, no
   reliance on Node's `crypto` internals, nothing that won't run in a browser.
   This is what lets `apps/playground` run `core` entirely client-side (the
   user's text never leaves their machine, even in the demo).
2. **`core` does no I/O.** It does not read files, open sockets, or assume an
   environment. It is a pure transform library. I/O belongs to the wrappers.

## Language & stack

- **TypeScript** everywhere. (Chosen over Python: the proxy and SDK story is
  much stronger in the Node ecosystem; Python's only edge is NER, which is one
  later opt-in milestone with workable escape hatches.)
- For `apps/playground`: SvelteKit / Vue / React all fine — pick whichever is
  fastest to build in. The framework barely matters; it's a thin UI over `core`.
- For `apps/docs`: use an existing docs framework (Mintlify, Fumadocs, or
  Starlight). Do **not** hand-build a docs site. Auto-generate the API reference
  from `core`'s TypeScript types (e.g. TypeDoc); hand-write the guides.

## No database in v0.1 (and probably not in core ever)

- v0.1 (`core` + `cli`) needs **zero database.** In-memory state + flat config
  files (JSON/YAML) only.
- The vault is in-memory — never a database (see vault rules above).
- User config, custom detector rules, rule packs → flat files. Files are better
  here: diffable, git-trackable, reviewable in a PR.
- **SQLite belongs to the `server` tier** (multi-tenant: users, keys, usage,
  billing) if/when that is built. It must not touch `core`.

## "Connect to any LLM" — scoped honestly

The proxy runs a local HTTP server; the developer points their existing LLM SDK
at `http://localhost:PORT` (one-line `baseURL` change). Requests flow:
app → proxy → mask → real LLM → response → unmask → app.

"Any LLM" honestly means **any LLM reachable through a supported ProviderAdapter**,
and the adapter interface is open so coverage grows. Ship the OpenAI-compatible
adapter first (largest coverage per unit effort), Anthropic second. Avoid
claiming "works with literally any API, zero config."

Streaming note: rehydrating a streamed response is harder — a token like
`⟦NAME_1⟧` may arrive split across chunks. The proxy needs a small buffer that
holds partial tokens until they can be safely rehydrated. Scope this into v0.3.

## Licensing & SaaS — future decisions (NOT a v0.1 concern)

The business model: open-source tool + an optional hosted SaaS that is a
click-friendly visual layer over the same open tool.

Planned licensing split (decided when `server` is actually built — not now):

- `core`, `cli`, `proxy` → **permissive (MIT or Apache-2.0).** Freely usable,
  including commercially. This is the adoption funnel and the trust signal.
- `server`, `playground` → **source-available / non-compete license** (e.g.
  Business Source License or Functional Source License). Source stays public
  and auditable; people may self-host for themselves; they may **not** offer it
  as a competing commercial hosted service without contacting us.

Key principles, so future-you doesn't re-litigate this:

- Licensing is **per-folder / per-package**, set via separate `LICENSE` files.
  Mixed licensing in one public repo is fine and normal.
- **A license, not secrecy, is what protects the SaaS.** Hiding source only buys
  ~a week against a competitor; the legal terms work even on fully public code.
- **Stripe/PayPal integration is NOT a secrecy concern.** Billing code is not
  secret; the API *key* is — and keys live in deployment secrets / env vars,
  never in source, in any repo. This creates zero pressure to go private.
- The SaaS moat is **operation** (hosting, uptime, billing, brand, support),
  not source code.

Default plan: **one public repo, everything visible**, mixed licenses as above.
Only spin `server` + `playground` into a second *private* repo if, beyond legal
protection, you also specifically want the SaaS source unbrowsable — a weaker,
taste-based reason. Not needed for v0.1. Don't pre-split.

Caveat: BSL / FSL / Commons Clause are not OSI-approved "open source" in the
strict sense. Fine for these goals, but get the exact `server` license wording
reviewed carefully when the time comes.

## Roadmap

- **v0.1 — core + CLI, free text only.** Pattern detectors (email/phone/CC/SSN/
  IP/key), placeholder strategy, in-memory vault, `mask` / `unmask` / `run`
  commands, `--dry-run`. Shippable and useful on its own. One public repo, MIT.
- **v0.2 — structured data mode.** CSV/JSON masking by field/column; custom
  schema detectors.
- **v0.3 — proxy mode.** Local OpenAI/Anthropic-compatible server; ProviderAdapter
  interface; streaming-safe rehydration.
- **v0.4 — NER detectors + realistic-fake strategy.** Names, addresses, orgs.
  Heavier dependency, opt-in.
- **v1.0 — polish.** Config file, plugin docs for custom detectors, `core`
  published cleanly to npm as the SDK. Possibly `apps/docs` + `apps/playground`.
- **post-v1.0 — `server`.** Hosted HTTP API. Stateless: the vault round-trips
  through the *client* (opaque vault blob returned by `/mask`, passed back to
  `/unmask`), so the server never persists sensitive data. Auth, rate limiting,
  multi-tenancy, SQLite. The SaaS.

## CLI design principles (the "simple to use" requirement)

- **Zero-config first run.** `cat file | incognitify mask` works immediately with
  sensible defaults. Config is for overrides only — never required to start.
- **The pipe is the API.** `mask` reads stdin, writes stdout; composes with
  everything: `cat prompt | incognitify mask | llm | incognitify unmask`.
- **One round-trip command** for the common case: `incognitify run` does
  mask → call → unmask in one shot, vault never touching disk. Manual
  `mask` / `unmask` split is for power users building pipelines.
- **`--dry-run`** shows what *would* be masked, and as what, without sending
  anything. Builds trust.
- **`--strict`** exits non-zero on low-confidence detection or unmasked
  required fields.
- TypeScript-first, typed config, clear errors.

## Honest hard problems to keep in mind

- Detection is never 100%. Plan for false negatives (dangerous) and false
  positives (degrade output). incognitify is a *risk-reduction* tool, not a
  guarantee — say so in the docs; it also protects us legally.
- Masking degrades LLM output (`NAME_1` is harder to reason about than a name).
  The realistic-fake strategy mitigates but doesn't eliminate this.
- Do not market as "GDPR/HIPAA compliant." It is a tool that *helps*; compliance
  is the user's responsibility. Keep that line clean.
- Free-text masking (by detected span) and structured-data masking (by field)
  are two modes sharing the vault — not one universal code path.

## First Claude Code sessions (suggested, one per session)

1. Scaffold the monorepo: workspace config, `packages/core` + `packages/cli`
   skeletons. Use Plan Mode — review the proposed tree before writing files.
2. Define `core`'s interfaces: `Detector`, `MaskingStrategy`, `Vault`.
3. Implement the pattern detectors.
4. Wire the CLI `mask` command (stdin → detect → mask → stdout).
5. Add `unmask`, then `run`, then `--dry-run`.

Keep sessions short and focused. Review plans before letting Claude Code execute —
it has direct filesystem access.
