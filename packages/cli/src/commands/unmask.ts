import { deserializeVault, unmask } from '@incognitify/core';

/** Pure function backing `incognitify unmask`. */
export function runUnmask(maskedInput: string, vaultJson: unknown): string {
  const vault = deserializeVault(vaultJson);
  return unmask(maskedInput, vault);
}
