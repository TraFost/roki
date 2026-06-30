import type { AIProvider, ProviderConfig } from '../types';
import type { ScreenCapture, StreamChunk } from '@roki/shared';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  async *streamChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    screens: ScreenCapture[],
    config: ProviderConfig,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const content: any[] = [];
    for (const screen of screens) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(screen.imageData)));
      const mimeType = this.detectMime(screen.imageData);
      content.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
      });
    }
    const userText = messages.find((m) => m.role === 'user')?.content ?? '';
    if (userText) {
      content.push({ type: 'text', text: userText });
    }

    const apiMessages = [];
    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg) {
      apiMessages.push({ role: 'system', content: systemMsg.content });
    }
    apiMessages.push({ role: 'user', content });

    const body = {
      model: config.model,
      messages: apiMessages,
      max_tokens: config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${config.baseUrl ?? 'https://api.openai.com/v1/chat/completions'}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', error: `OpenAI API error ${response.status}: ${errorText}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;

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
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') {
            yield { type: 'done' };
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield { type: 'text', content: delta };
            }
          } catch {
            // skip
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
