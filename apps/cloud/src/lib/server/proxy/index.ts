import { getDb } from '../db';
import { usageEvent } from '../db/schema';
import { type OrgContext, getUsableKey } from '../keys';
import type { Provider } from '../providers';
import { type Usage, streamCompletion } from './llm';
import { type ChatMessage, maskRequest } from './mask';
import { StreamRehydrator } from './rehydrate';

/**
 * The product's core loop: resolve + decrypt the key → mask the prompt via core →
 * stream the provider with the user's key → rehydrate the stream → meter usage.
 * Returns an NDJSON stream of {meta} → {delta}* → ({error}) → {done}.
 */
export async function runChat(params: {
  ctx: OrgContext;
  keyId: string;
  model: string;
  messages: ChatMessage[];
  system?: string;
}): Promise<Response> {
  const { ctx, keyId, model, messages, system } = params;

  const key = await getUsableKey(ctx, keyId);
  if (!key.ok) return jsonError(key.error, 400);

  const masked = maskRequest(messages, system);
  const rehydrator = new StreamRehydrator(masked.vault);
  const usage: Usage = {};
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      // maskedCount is known before the provider call — surface it immediately.
      send({ type: 'meta', maskedCount: masked.maskedCount, detections: masked.detections });

      let status: 'success' | 'error' = 'success';
      let errorCode: string | undefined;
      try {
        for await (const delta of streamCompletion(
          key.provider,
          key.apiKey,
          model,
          masked.messages,
          masked.system,
          usage,
        )) {
          const text = rehydrator.push(delta);
          if (text) send({ type: 'delta', text });
        }
        const tail = rehydrator.flush();
        if (tail) send({ type: 'delta', text: tail });
      } catch (err) {
        status = 'error';
        errorCode = errorCodeOf(err);
        send({ type: 'error', message: 'The provider request failed.' });
      } finally {
        await recordUsage(
          ctx,
          keyId,
          key.provider,
          model,
          masked.maskedCount,
          usage,
          status,
          errorCode,
        );
        send({ type: 'done', usage, status });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function recordUsage(
  ctx: OrgContext,
  keyId: string,
  provider: Provider,
  model: string,
  maskedCount: number,
  usage: Usage,
  status: 'success' | 'error',
  errorCode: string | undefined,
): Promise<void> {
  try {
    // Counts + metadata only — never prompt/response content (vault rules).
    await getDb()
      .insert(usageEvent)
      .values({
        organizationId: ctx.orgId,
        userId: ctx.userId,
        providerKeyId: keyId,
        provider,
        model,
        promptTokens: usage.promptTokens ?? null,
        completionTokens: usage.completionTokens ?? null,
        maskedCount,
        status,
        errorCode: errorCode ?? null,
      });
  } catch {
    // Metering must never break the user's response.
  }
}

function errorCodeOf(err: unknown): string {
  if (err && typeof err === 'object' && 'status' in err) {
    return String((err as { status: unknown }).status);
  }
  return 'unknown';
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
