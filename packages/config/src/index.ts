import { z } from 'zod';

export const AppSettingsSchema = z.object({
  model: z.string().default('claude-sonnet-4-6'),
  provider: z.enum(['anthropic', 'openai', 'gemini', 'openrouter', 'ollama']).default('anthropic'),
  shortcut: z.string().default('Ctrl+Shift+Space'),
  ttsEnabled: z.boolean().default(true),
  showCursor: z.boolean().default(true),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
