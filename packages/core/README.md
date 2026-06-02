# @incognitify/core

The engine and SDK behind [incognitify](../../README.md): detect sensitive
spans, mask them for LLM calls, and rehydrate the response.

```bash
npm install @incognitify/core
```

## Quick start

```ts
import { mask, unmask } from '@incognitify/core';

const { masked, vault } = mask('Email alice@example.com about card 4111111111111111.');
// masked: 'Email ⟦EMAIL_1⟧ about card ⟦CREDIT_CARD_1⟧.'

const llmResponse = await callYourLLM(masked);
// LLM sees tokens, never the real values.

const final = unmask(llmResponse, vault);
// Tokens swapped back to alice@example.com and the card number.
```

## What's in the box

- **Detectors** — `emailDetector`, `phoneDetector`, `creditCardDetector` (with
  Luhn), `ssnDetector`, `ipDetector` (v4 + v6), `apiKeyDetector` (AWS / GitHub
  / OpenAI / Anthropic / Stripe / Slack / Google), `uuidDetector`. All shipped
  together as `ALL_PATTERN_DETECTORS`.
- **`mask(text, options?)`** — orchestrator that runs detectors, resolves
  overlaps (longest span wins), and replaces with vault-cached tokens.
- **`unmask(text, vault)`** — exact-token rehydration; safe against
  model-generated prose that includes a token (replaced) or a token-shaped
  string the vault doesn't recognize (left alone).
- **`InMemoryVault`** — the default `Vault`. Rejects token collisions so a
  bug can't silently corrupt rehydration.
- **`placeholderStrategy`** — produces `⟦TYPE_N⟧` tokens with Unicode corner
  brackets that don't occur naturally in prose.
- **`serializeVault` / `deserializeVault`** — versioned JSON for explicit,
  opt-in persistence.

## Constraints

- Browser-safe. No Node-only APIs.
- No I/O. Pure transform library.
- Ephemeral, in-memory vault — never written to disk by this package.

## Extending

`Detector`, `MaskingStrategy`, and `Vault` are all interfaces — bring your
own. Detectors compose freely; the orchestrator resolves overlaps for you.

```ts
import { mask, type Detector } from '@incognitify/core';

const myDetector: Detector = {
  name: 'invoice-id',
  detect: (text) => [...text.matchAll(/INV-\d{6}/g)].map((m) => ({
    start: m.index!,
    end: m.index! + m[0].length,
    type: 'INVOICE_ID',
    value: m[0],
  })),
};

mask('see INV-123456', { detectors: [myDetector] });
```

Licensed under [Apache-2.0](./LICENSE).
