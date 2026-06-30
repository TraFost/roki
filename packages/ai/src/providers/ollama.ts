import type { AIProvider, ProviderConfig } from '../types';
import type { ScreenCapture, StreamChunk } from '@roki/shared';

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';

  async *streamChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    screens: ScreenCapture[],
    config: ProviderConfig,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const baseUrl = config.baseUrl ?? 'http://localhost:11434';

    const content: any[] = [];
    for (const screen of screens) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(screen.imageData)));
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${base64}` },
      });
    }
    const userText = messages.find((m) => m.role === 'user')?.content ?? '';
    if (userText) {
      content.push({ type: 'text', text: userText });
    }

    const systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';

    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(content) },
      ],
      stream: true,
    };

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', error: `Ollama API error ${response.status}: ${errorText}` };
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
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield { type: 'text', content: parsed.message.content };
          }
          if (parsed.done) {
            yield { type: 'done' };
          }
        } catch {
          // skip
        }
      }
    }
  }
}
