import type { AIProvider, ProviderConfig } from '../types';
import type { ScreenCapture, StreamChunk } from '@roki/shared';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';

  async *streamChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    screens: ScreenCapture[],
    config: ProviderConfig,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';

    const content: any[] = [];
    for (const screen of screens) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(screen.imageData)));
      const mimeType = this.detectMime(screen.imageData);
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64 },
      });
    }
    const userText = messages.find((m) => m.role === 'user')?.content ?? '';
    if (userText) {
      content.push({ type: 'text', text: userText });
    }

    const body = {
      model: config.model,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
      max_tokens: config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${config.baseUrl ?? 'https://api.anthropic.com/v1/messages'}`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', error: `Anthropic API error ${response.status}: ${errorText}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'text', content: parsed.delta.text };
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    }
  }

  private detectMime(data: Uint8Array): string {
    if (data.length >= 4) {
      const pngSig = [0x89, 0x50, 0x4e, 0x47];
      const firstFour = Array.from(data.slice(0, 4));
      if (firstFour.every((b, i) => b === pngSig[i])) return 'image/png';
    }
    return 'image/jpeg';
  }
}
