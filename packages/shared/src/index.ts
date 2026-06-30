export interface ScreenCapture {
  imageData: Uint8Array;
  label: string;
  isCursorScreen: boolean;
  displayWidthInPoints: number;
  displayHeightInPoints: number;
  displayFrame: { x: number; y: number; width: number; height: number };
  screenshotWidthInPixels: number;
  screenshotHeightInPixels: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';

export type EngineState = 'idle' | 'capturing' | 'processing' | 'responding';

export interface AppSettings {
  model: string;
  provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter' | 'ollama';
  shortcut: string;
  ttsEnabled: boolean;
  showCursor: boolean;
}

export interface ShortcutConfig {
  key: string;
  modifiers: string[];
}

export interface StreamChunk {
  type: 'text' | 'point' | 'error' | 'done';
  content?: string;
  point?: {
    x: number;
    y: number;
    label: string;
    screenIndex: number;
  };
  error?: string;
}

export enum ErrorCode {
  CaptureFailed = 'CAPTURE_FAILED',
  AIProviderError = 'AI_PROVIDER_ERROR',
  MicrophoneError = 'MICROPHONE_ERROR',
  TTSFailed = 'TTS_FAILED',
  PermissionDenied = 'PERMISSION_DENIED',
  ShortcutConflict = 'SHORTCUT_CONFLICT',
}

export class RokiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'RokiError';
  }
}
