import type { AIProvider, ProviderConfig } from '../types';
import type { ScreenCapture, StreamChunk } from '@roki/shared';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  async *streamChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    screens: ScreenCapture[],
    config: ProviderConfig,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const parts: any[] = [];
    for (const screen of screens) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(screen.imageData)));
      const mimeType = this.detectMime(screen.imageData);
      parts.push({
        inlineData: { mimeType, data: base64 },
      });
    }
    const userText = messages.find((m) => m.role === 'user')?.content ?? '';
    if (userText) {
      parts.push({ text: userText });
    }

    const systemPrompt = messages.find((m) => m.role === 'system')?.content;

    const body: any = {
      contents: [{ role: 'user', parts }],
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const apiKey = config.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', error: `Gemini API error ${response.status}: ${errorText}` };
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
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield { type: 'text', content: text };
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
