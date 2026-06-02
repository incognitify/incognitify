# incognitify (CLI)

Command-line wrapper over [`@incognitify/core`](../core).

```bash
npm install -g @incognitify/cli
incognitify --help
```

## Commands

```
incognitify mask [--vault PATH] [--dry-run]
incognitify unmask --vault PATH
incognitify run -- COMMAND [args...]
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

Anything that reads stdin and writes stdout works as the inner command.

## Pipe philosophy

The CLI is designed for composition:

```bash
cat prompt.txt | incognitify mask --vault v.json | llm | incognitify unmask --vault v.json
```

In practice, prefer `incognitify run -- llm` when possible — it keeps the
vault entirely in memory.

Licensed under [Apache-2.0](./LICENSE).
