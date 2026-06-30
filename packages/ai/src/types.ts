import { z } from 'zod';
import type { ScreenCapture, StreamChunk } from '@roki/shared';

export const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string(),
  maxTokens: z.number().default(4096),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export interface AIProvider {
  readonly name: string;
  streamChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    screens: ScreenCapture[],
    config: ProviderConfig,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk>;
}
