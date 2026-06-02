import {
  type Detection,
  type Vault,
  type VaultJson,
  mask,
  serializeVault,
} from '@incognitify/core';
import { assertStrict } from '../strict.js';

export interface MaskOptions {
  /** Print a detection report instead of the masked text. */
  dryRun?: boolean;
  /** Caller wants the vault serialized; we return JSON so they can persist it. */
  emitVault?: boolean;
  /** Fail-closed: run `--strict` checks and throw on violation. */
  strict?: boolean;
  /** Types that must have been masked (implies `strict`). */
  require?: readonly string[] | undefined;
}

export interface MaskOutput {
  stdout: string;
  vaultJson?: VaultJson;
}

/** Pure function backing `incognitify mask`. */
export function runMask(input: string, options: MaskOptions = {}): MaskOutput {
  const { masked, vault, detections } = mask(input);
  if (options.dryRun) {
    return { stdout: formatDryRun(detections, vault) };
  }
  if (options.strict || (options.require?.length ?? 0) > 0) {
    assertStrict(masked, detections, { require: options.require });
  }
  const out: MaskOutput = { stdout: masked };
  if (options.emitVault) out.vaultJson = serializeVault(vault);
  return out;
}

function formatDryRun(detections: readonly Detection[], vault: Vault): string {
  if (detections.length === 0) return 'No sensitive values detected.\n';

  const rows = detections.map((d) => ({
    type: d.type,
    span: `[${d.start}..${d.end}]`,
    value: d.value,
    token: vault.lookup(d.value, d.type) ?? '?',
  }));
  const typeW = Math.max(...rows.map((r) => r.type.length));
  const spanW = Math.max(...rows.map((r) => r.span.length));
  const valueW = Math.max(...rows.map((r) => r.value.length));

  const header = `${detections.length} detection${detections.length === 1 ? '' : 's'}:\n`;
  const body = rows
    .map(
      (r) =>
        `  ${r.type.padEnd(typeW)}  ${r.span.padEnd(spanW)}  ${r.value.padEnd(valueW)}  →  ${r.token}`,
    )
    .join('\n');
  return `${header}\n${body}\n`;
}
