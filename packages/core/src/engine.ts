import EventEmitter from 'eventemitter3';
import type { ScreenCapture, StreamChunk, EngineState } from '@roki/shared';
import { RokiError, ErrorCode } from '@roki/shared';
import { createProvider, type AIProvider, type ProviderConfig } from '@roki/ai';
import { processScreenCapture, labelScreens } from '@roki/capture';
import { SYSTEM_PROMPT } from '@roki/prompts';

export interface EngineEvents {
  stateChange: (state: EngineState) => void;
  chunk: (chunk: StreamChunk) => void;
  error: (error: RokiError) => void;
  done: () => void;
}

export class RokiEngine {
  private events = new EventEmitter<EngineEvents>();
  private _state: EngineState = 'idle';
  private provider: AIProvider;
  private providerConfig: ProviderConfig;
  private abortController?: AbortController;
  private history: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(providerName = 'anthropic', config: Partial<ProviderConfig> = {}) {
    this.provider = createProvider(providerName);
    this.providerConfig = {
      model: config.model ?? 'claude-sonnet-4-6',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      maxTokens: config.maxTokens ?? 4096,
    };
  }

  get state(): EngineState {
    return this._state;
  }

  on<K extends keyof EngineEvents>(event: K, fn: EngineEvents[K]): () => void {
    this.events.on(event, fn as any);
    return () => this.events.off(event, fn as any);
  }

  private setState(state: EngineState) {
    this._state = state;
    this.events.emit('stateChange', state);
  }

  async run(screens: ScreenCapture[], userText?: string) {
    if (this._state !== 'idle') return;

    this.abortController = new AbortController();

    try {
      this.setState('capturing');

      const processed = screens.map((s) => processScreenCapture(s));
      const labeled = labelScreens(processed, processed.length > 1);

      this.setState('processing');

      const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...this.history.slice(-10),
        {
          role: 'user',
          content: userText ?? 'What am I looking at?',
        },
      ];

      this.setState('responding');

      let fullResponse = '';

      for await (const chunk of this.provider.streamChat(
        messages,
        labeled,
        this.providerConfig,
        this.abortController.signal,
      )) {
        this.events.emit('chunk', chunk);

        if (chunk.type === 'text' && chunk.content) {
          fullResponse += chunk.content;
        }

        if (chunk.type === 'error') {
          this.events.emit(
            'error',
            new RokiError(ErrorCode.AIProviderError, chunk.error ?? 'Unknown AI error'),
          );
          break;
        }

        if (chunk.type === 'done') {
          break;
        }
      }

      if (fullResponse) {
        this.history.push(
          { role: 'user', content: userText ?? 'What am I looking at?' },
          { role: 'assistant', content: fullResponse },
        );
      }

      this.events.emit('done');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.events.emit('done');
        return;
      }
      const error = err instanceof RokiError ? err : new RokiError(ErrorCode.AIProviderError, err.message ?? 'Unknown error', err);
      this.events.emit('error', error);
    } finally {
      this.setState('idle');
      this.abortController = undefined;
    }
  }

  cancel() {
    this.abortController?.abort();
  }

  setProvider(name: string, config?: Partial<ProviderConfig>) {
    this.provider = createProvider(name);
    if (config) {
      this.providerConfig = { ...this.providerConfig, ...config };
    }
  }

  clearHistory() {
    this.history = [];
  }
}
