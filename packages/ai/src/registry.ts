import type { AIProvider, ProviderConfig } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { OpenRouterProvider } from './providers/openrouter';
import { OllamaProvider } from './providers/ollama';

const registry: Record<string, new () => AIProvider> = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  openrouter: OpenRouterProvider,
  ollama: OllamaProvider,
};

export function createProvider(name: string): AIProvider {
  const Provider = registry[name];
  if (!Provider) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return new Provider();
}

export type { AIProvider, ProviderConfig } from './types';
