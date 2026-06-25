import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Provider } from '../providers';
import type { ChatMessage } from './mask';

export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
}

const MAX_TOKENS = 8192;

/**
 * Stream a completion from the chosen provider with the user's own (decrypted) key.
 * Yields text deltas; fills `usage` once the stream ends. The input is already masked.
 */
export async function* streamCompletion(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  system: string | undefined,
  usage: Usage,
): AsyncGenerator<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model,
      max_tokens: MAX_TOKENS,
      ...(system ? { system } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    usage.promptTokens = final.usage.input_tokens;
    usage.completionTokens = final.usage.output_tokens;
    return;
  }

  const client = new OpenAI({ apiKey });
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      ...(system ? [{ role: 'system' as const, content: system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
    if (chunk.usage) {
      usage.promptTokens = chunk.usage.prompt_tokens;
      usage.completionTokens = chunk.usage.completion_tokens;
    }
  }
}
