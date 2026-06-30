# Roki — Execution Tasks

> Cross-platform AI desktop assistant. Windows-first, Tauri v2 + React + Bun monorepo.

---

## Phase 0 — Monorepo Setup

### 0.1 Root workspace + package scaffolding

- [x] `bun init` root workspace with `"workspaces": ["apps/*", "packages/*"]`
- [x] Create 9 package stubs (`packages/{ai,capture,core,prompts,sdk,shared,ui,automation,config}`) — each with `package.json`, `tsconfig.json`, `src/index.ts`
- [x] `tsconfig.base.json` at root with path aliases + DOM lib
- [x] `turbo.json` with build/dev/lint/typecheck pipelines
- [x] Prettier config at root (ESLint still needed for most packages)
- [x] `packages/shared/` — types: `ScreenCapture`, `AIMessage`, `AppSettings`, `VoiceState`, `EngineState`, `StreamChunk`, error enum
- [x] `packages/config/` — Zod schemas for settings, provider config
- [ ] GitHub Actions: `bun install`, `bun lint`, `bun typecheck`, `bun run build:desktop`

### 0.2 Tauri desktop shell

- [x] Tauri v2 app at `apps/desktop` with React + TypeScript + Vite + Tailwind v4
- [x] Configure `tauri.conf.json`: windowless on launch, tray icon, transparent overlay capabilities, permissions
- [x] `apps/desktop/src-tauri/src/shortcut.rs` — global shortcut `Ctrl+Shift+Space` via `tauri-plugin-global-shortcut`
- [x] `apps/desktop/src-tauri/src/capture.rs` — screen capture via `xcap` crate (multi-monitor, JPEG base64)
- [x] `apps/desktop/src-tauri/src/overlay.rs` — transparent overlay webview window manager
- [x] `apps/desktop/src-tauri/src/main.rs` — tray with quit/capture menu, command handlers
- [ ] `apps/desktop/src-tauri/src/microphone.rs` — mic capture via `cpal` crate
- [ ] Verify: `cargo check` passes (✅ 5 dead-code warnings only)
- [ ] Verify: `bun run typecheck` passes (✅ 10/10 packages green)

---

## Phase 1 — Core Pipeline (Shortcut → Capture → AI → Overlay)

### 1.1 Global shortcut + state

- [x] Rust `shortcut.rs` — listen-only global shortcut registration
- [x] Tray menu capture event → `menu-capture` event emission
- [x] `RokiEngine` state machine: `idle → capturing → processing → responding → idle`

### 1.2 Screen capture

- [x] Rust `capture_screens` command using `xcap` — returns JPEG base64 + display metadata
- [x] `packages/capture/src/process.ts` — resize max 1280px, JPEG compress, MIME detection
- [x] `packages/capture/src/label.ts` — screen labeling ("cursor is here")

### 1.3 AI provider layer

- [x] `packages/ai/src/types.ts` — `AIProvider` interface with streaming
- [x] `packages/ai/src/providers/anthropic.ts` — Anthropic Messages API + SSE streaming
- [x] `packages/ai/src/providers/openai.ts` — OpenAI GPT-4o vision + SSE
- [x] `packages/ai/src/providers/gemini.ts` — Gemini 2.0 Flash + SSE
- [x] `packages/ai/src/providers/openrouter.ts` — OpenRouter (OpenAI-compatible format)
- [x] `packages/ai/src/providers/ollama.ts` — Ollama local (Llama 3.2)
- [x] `packages/ai/src/registry.ts` — `createProvider()` factory
- [ ] `packages/ai/src/tls.ts` — TLS warmup optimization

### 1.4 Core orchestration engine

- [x] `packages/core/src/engine.ts` — `RokiEngine` with state machine, events, history, abort
- [x] `packages/prompts/` — system prompt, screen analysis prompt, action prompt

### 1.5 Panel UI (floating companion)

- [x] `apps/desktop/src/components/Panel.tsx` — dark-themed floating panel with status, response, controls
- [x] `apps/desktop/src/components/TauriBridge.ts` — IPC helpers (invoke, event listen, type conversion)
- [x] `apps/desktop/src/App.tsx` — engine integration, capture → AI → display pipeline
- [ ] `apps/desktop/src/components/OverlayRoot.tsx` — one per monitor
- [ ] `apps/desktop/src/components/BlueCursor.tsx` — blue glowing cursor with bezier arc animation
- [ ] `apps/desktop/src/components/ResponseBubble.tsx` — streaming text bubble near cursor
- [ ] `apps/desktop/src/components/Waveform.tsx` — audio level visualization
- [ ] `apps/desktop/src/components/Spinner.tsx` — loading indicator
- [ ] `apps/desktop/src/hooks/useMousePosition.ts` — cursor tracking
- [ ] `apps/desktop/src/hooks/useOverlayVisibility.ts` — fade in/out + transient mode

### 1.6 Settings panel

- [x] Panel includes: model selection (via engine constructor), quit button, clear button
- [ ] `apps/desktop/src/components/SettingsPanel.tsx` — full settings UI
- [ ] `apps/desktop/src/components/PermissionsCard.tsx` — permission status display
- [ ] Settings persistence via `tauri-plugin-store`

**Gate: M4 — full end-to-end pipeline: shortcut → capture → AI → overlay.**
(Partial: shortcut+capture+AI work, overlay windows + pointing UI remain)

---

## Phase 1b — Voice Pipeline

### 1.7 Push-to-talk + transcription

- [ ] `packages/core/src/voice/state.ts` — voice state machine
- [ ] `packages/core/src/voice/provider.ts` — provider factory (AssemblyAI / OpenAI Whisper / Apple Speech)
- [ ] Rust mic capture via `cpal` → PCM16 → Tauri events
- [ ] `packages/core/src/audio/convert.ts` — PCM16 → WAV conversion
- [ ] AssemblyAI streaming provider — WebSocket from Tauri frontend
- [ ] OpenAI Whisper provider — upload WAV on key release
- [ ] Apple Speech local fallback
- [ ] Wire push-to-talk: hold shortcut → mic → transcript → AI

**Gate: M5 — voice: push-to-talk → transcript → AI response.**

---

## Phase 1c — TTS + Pointing

### 1.8 Text-to-speech

- [ ] `packages/core/src/tts/client.ts` — ElevenLabs TTS via worker proxy
- [ ] `apps/desktop/src/hooks/useTTS.ts` — speak/stop/isPlaying hook
- [ ] Playback via HTMLAudioElement or Tauri plugin
- [ ] Auto-play on each completed AI response

### 1.9 Element pointing

- [ ] `packages/core/src/pointing/parse.ts` — `[POINT]` tag parsing
- [ ] Extend `BlueCursor.tsx` — bezier arc flight to target coordinates
- [ ] Multi-monitor coordinate mapping

**Gate: M7 — element pointing works.**

---

## Phase 2 — Polish

- [x] Markdown rendering (basic inline parser in Panel.tsx — bold, code, headings, lists, blockquotes)
- [x] Loading spinner animation
- [x] Error display with user-friendly messages
- [ ] Dark/light theme
- [ ] Error toasts (capture fail, API error, mic fail)
- [ ] Session history (last N conversations)
- [ ] Settings persistence (model, shortcut, TTS on/off)
- [ ] Transient cursor mode
- [ ] Onboarding

**Gate: M8 — polish pass complete.**

---

## Phase 3 — Open-Source Release

- [ ] Tauri bundler → NSIS installer (Windows)
- [ ] README with demo GIF + setup + worker deploy guide
- [ ] CONTRIBUTING.md
- [ ] GitHub issue/PR templates
- [ ] MIT license

**Gate: M9 — public release.**

---

## Dependencies

```json
{
  "root": ["bun", "typescript", "turbo", "prettier"],
  "apps/desktop": {
    "npm": ["react", "react-dom", "tailwindcss", "@tauri-apps/api", "@tauri-apps/cli", "@tauri-apps/plugin-global-shortcut", "@tauri-apps/plugin-store", "@tauri-apps/plugin-fs"],
    "cargo": ["tauri", "serde", "serde_json", "xcap", "base64", "image"]
  },
  "packages/ai": ["@anthropic-ai/sdk", "openai", "@google/generative-ai", "zod"],
  "packages/core": ["zod", "eventemitter3"],
  "worker": ["wrangler"]
}
```

## Milestones

```
M0 — Bare Tauri window       ✅
M1 — Tray + global shortcut  ✅
M2 — Screen capture working  ✅
M3 — Real AI streaming       ✅
M4 — End-to-end pipeline     🟡 (partial — panel UI done, overlay windows TBD)
M5 — Voice pipeline          ❌
M6 — TTS playing             ❌
M7 — Element pointing        ❌
M8 — Polished UX             🟡 (partial)
M9 — Public release          ❌
```
