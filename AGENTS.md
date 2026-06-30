# Roki — Agent Instructions

## Overview

AI desktop companion for Windows. Sits in the system tray — no dock icon, no main window. Hit `Ctrl+Shift+Space`, it screenshots your monitors, sends them to an AI model, and streams the answer back in a dark floating panel.

Named after the alien from *Project Hail Mary*.

## Project Status

| What | Status |
|------|--------|
| Monorepo scaffold (Bun + Turbo + Tauri v2) | Done |
| AI providers (5: Claude, GPT-4o, Gemini, OpenRouter, Ollama) | Done |
| State machine (RokiEngine w/ events) | Done |
| Screen capture (xcap, multi-monitor) | Done |
| Tray icon + dark panel | Done |
| Shortcut (Ctrl+Shift+Space) | Done |
| TTS sidecar (Piper, Python FastAPI) | Done |
| Rust sidecar process management | Done |
| `@roki/tts` TypeScript client | Done |
| TTS wired into response panel | Done |
| Landing page (`web/`) | Done |
| Voice input | Not started |
| Settings/preferences UI | Not started |
| Element pointing / overlay | Not started |

## Architecture

```
roki/
├── apps/
│   ├── desktop/          # Tauri v2 app
│   │   ├── src/          #   React frontend
│   │   └── src-tauri/    #   Rust backend
│   ├── tts-server/       # Python Piper TTS sidecar
│   └── web/              # Landing page
├── packages/
│   ├── ai/               # AI provider abstractions
│   ├── capture/          # Screen capture processing
│   ├── config/           # App configuration
│   ├── core/             # RokiEngine state machine
│   ├── prompts/          # System prompts
│   ├── sdk/              # Public SDK
│   ├── shared/           # Shared types & errors
│   ├── tts/              # TTS client (TypeScript)
│   └── ui/               # Shared UI components
```

**Flow**: Tray click / shortcut → capture screens via Rust → RokiEngine (AI provider) → stream text to panel → done → TTS sidecar speaks response.

## Key Files

| File | Purpose |
|------|---------|
| `apps/desktop/src/App.tsx` | Root component, wires capture → engine → panel → TTS |
| `apps/desktop/src/components/Panel.tsx` | Dark floating panel UI |
| `apps/desktop/src/components/TauriBridge.ts` | Rust ↔ JS bridge helpers |
| `apps/desktop/src-tauri/src/main.rs` | App entry, tray, shortcuts, sidecar lifecycle |
| `apps/desktop/src-tauri/src/capture.rs` | Screen capture (xcap) |
| `apps/desktop/src-tauri/src/shortcut.rs` | Global shortcut registration |
| `apps/desktop/src-tauri/src/tts.rs` | TTS sidecar spawn/kill + `/tts` proxy |
| `packages/core/src/engine.ts` | RokiEngine state machine |
| `packages/ai/src/` | Provider implementations (claude, openai, gemini, openrouter, ollama) |
| `packages/tts/src/index.ts` | TTSClient (speak, stop, isAvailable) |
| `packages/shared/src/index.ts` | Shared types (StreamChunk, EngineState, etc.) |
| `apps/tts-server/server.py` | Piper TTS Python server (FastAPI) |

## Build & Run

```bash
bun install
cd apps/desktop
cargo tauri dev
```

Bun workspaces + Turbo for monorepo orchestration. All 12 packages typechecked via `bun run typecheck`.

## Code Style & Conventions

- **Naming**: Clarity over concision. No single-letter vars.
- **Types**: Strict TypeScript throughout. Exhaustive type checks.
- **Rust**: `use std::sync::Mutex` for shared state. `tauri::command` for IPC.
- **React**: Functional components, hooks, `useCallback`/`useRef` for stable refs.
- **Packages**: Each `@roki/*` package has `package.json` + `tsconfig.json` extending base.
- **Tauri**: `RunEvent::Exit` for cleanup. `tauri::Manager` trait for state access.
- **TTS**: Python sidecar on localhost:8765. Rust spawns on startup, kills on exit.

## Do NOT

- Do not add features beyond what was asked
- Do not mess with overlay.rs (pre-existing, not wired yet)
- Do not run `xcodebuild` (this isn't macOS)

## Self-Update Instructions

Same as before: keep "Key Files", "Project Status", and architecture sections current as the codebase changes.
