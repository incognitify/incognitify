# incognitify (CLI)

Command-line wrapper over [`@incognitify/core`](../core).

```bash
npm install -g @incognitify/cli
incognitify --help
```

## Commands

```
incognitify mask [--vault PATH] [--dry-run] [--strict] [--require TYPES]
incognitify unmask --vault PATH
incognitify run [--strict] [--require TYPES] -- COMMAND [args...]
```

### `mask`

Read text from stdin, mask sensitive values, write to stdout.

```bash
echo 'Email alice@example.com' | incognitify mask
# Email ⟦EMAIL_1⟧
```

- `--dry-run` prints a report of what *would* be masked, no masked text.
- `--vault PATH` writes the vault to disk as JSON. This is the only way to
  reuse the same vault from a later `unmask` invocation. Loud opt-in —
  without it, the vault stays in memory and is lost on exit.
- `--strict` makes masking **fail-closed**: if the masked output still contains
  anything a detector recognizes, the command writes nothing and exits non-zero,
  so questionable text never flows downstream. Use it in CI/automated pipelines.
- `--require TYPES` asserts that each comma-separated type was actually masked
  (e.g. `--require email,api_key`); if any is absent, it fails the same way.
  Implies `--strict`. Catches the case where detection silently found nothing.

```bash
# Fails (exit 1, no output) — an API key was expected but none was detected:
echo 'no secrets here' | incognitify mask --require api_key
```

### `unmask`

Read masked text from stdin, swap tokens back to original values using a
vault file produced by `mask --vault`.

```bash
incognitify unmask --vault /tmp/v.json < masked.txt
```

### `run`

Round-trip in a single process: stdin → mask → spawn `COMMAND` → unmask its
stdout. The vault never touches disk.

```bash
echo 'Summarize: alice@example.com' | incognitify run -- llm
```

Anything that reads stdin and writes stdout works as the inner command. With
`--strict` / `--require`, the check runs *before* `COMMAND` is spawned, so a
failed check aborts the round-trip and the command (the "LLM") is never called.

## Pipe philosophy

The CLI is designed for composition:

```bash
cat prompt.txt | incognitify mask --vault v.json | llm | incognitify unmask --vault v.json
```

In practice, prefer `incognitify run -- llm` when possible — it keeps the
vault entirely in memory.

Licensed under [Apache-2.0](./LICENSE).
